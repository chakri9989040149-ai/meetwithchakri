import { dbService, inMemoryStore } from '../db/index.js';
import roomManager from '../rooms/roomManager.js';

// Room states for active collaboration
const roomWhiteboards = new Map(); // roomId -> array of strokes
const roomPolls = new Map(); // roomId -> array of poll objects { id, question, options, votes: Map(voterId -> optionIndex), createdBy }

export const setupMeetingSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Track user metadata on socket
    let currentRoomId = null;
    let currentUser = null;

    // ========================================================
    // 0. CREATE ROOM EVENT
    // ========================================================
    socket.on('create-room', async ({ roomId, title, hostName }) => {
      try {
        if (!roomId) {
          return socket.emit('room-error', { message: 'Invalid room identifier provided.' });
        }

        const meeting = await roomManager.createRoom(
          roomId,
          title || "Chakri's Meet",
          hostName || 'Host',
          socket.id
        );

        socket.emit('room-created', {
          roomId: meeting.roomId,
          title: meeting.title,
          hostName: meeting.hostName
        });
      } catch (err) {
        console.error('Error in create-room:', err);
        socket.emit('room-error', { message: 'Failed to create room.' });
      }
    });

    // ========================================================
    // 1. ROOM ENTRY & PEER DISCOVERY (JOIN ROOM)
    // ========================================================
    socket.on('join-room', async ({ roomId, user }) => {
      try {
        if (!roomId) {
          socket.emit('room-error', { message: 'Room ID is required.' });
          return socket.emit('join-error', { message: 'Invalid room identifier.' });
        }

        // Check current occupancy in this room
        const roomSockets = io.sockets.adapter.rooms.get(`room:${roomId}`);
        const currentOccupancy = roomSockets ? roomSockets.size : 0;
        const isHostAttempt = Boolean(user?.isHost);

        // Validate via RoomManager
        const validation = await roomManager.validateJoin(roomId, isHostAttempt, currentOccupancy);
        if (!validation.allowed) {
          if (validation.reason.includes('full')) {
            socket.emit('room-full', { message: validation.reason });
          }
          socket.emit('room-error', { message: validation.reason });
          return socket.emit('join-error', { message: validation.reason });
        }

        let meeting = validation.room;

        // Auto-create room record if joining as first user or host
        if (!meeting) {
          meeting = await roomManager.createRoom(
            roomId,
            user?.meetingTitle || "Chakri's Meet",
            user?.name || 'Host',
            socket.id
          );
        }

        currentRoomId = roomId;
        currentUser = {
          id: socket.id,
          name: user?.name || 'Guest Participant',
          isHost: isHostAttempt || (!meeting.hostSocketId && currentOccupancy === 0),
          audioEnabled: user?.audioEnabled ?? true,
          videoEnabled: user?.videoEnabled ?? true,
          joinedAt: new Date().toISOString()
        };

        // If this user is now host, update record
        if (currentUser.isHost && !meeting.hostSocketId) {
          meeting.hostSocketId = socket.id;
          meeting.hostName = currentUser.name;
        }

        // Add socket to Socket.io room channel
        socket.join(`room:${roomId}`);
        inMemoryStore.participants.set(socket.id, { ...currentUser, roomId });

        // Collect all active peers currently in this room
        const otherUsers = [];
        const currentRoomSockets = io.sockets.adapter.rooms.get(`room:${roomId}`);

        if (currentRoomSockets) {
          for (const sId of currentRoomSockets) {
            if (sId !== socket.id) {
              const peerInfo = inMemoryStore.participants.get(sId);
              if (peerInfo) {
                otherUsers.push(peerInfo);
              }
            }
          }
        }

        // Send existing participants list to newcomer
        socket.emit('all-users', {
          users: otherUsers,
          isHost: currentUser.isHost,
          meetingTitle: meeting.title,
          isLocked: meeting.isLocked
        });

        // Broadcast to existing room peers that a new user joined
        socket.to(`room:${roomId}`).emit('user-joined', {
          user: currentUser
        });

        // Send existing chat history
        const messages = await dbService.getMessages(roomId);
        socket.emit('chat-history', messages);

        // Send existing notes
        const notes = await dbService.getNotes(roomId);
        socket.emit('notes-history', notes);

        // Send whiteboard state
        const strokes = roomWhiteboards.get(roomId) || [];
        socket.emit('whiteboard-history', strokes);

        // Send active polls
        const polls = roomPolls.get(roomId) || [];
        const sanitizedPolls = polls.map(p => ({
          id: p.id,
          question: p.question,
          options: p.options,
          createdBy: p.createdBy,
          votesCount: p.options.map((_, idx) => {
            let count = 0;
            for (const [, votedIdx] of p.votes) {
              if (votedIdx === idx) count++;
            }
            return count;
          }),
          totalVotes: p.votes.size
        }));
        socket.emit('polls-history', sanitizedPolls);

        console.log(`👤 User "${currentUser.name}" joined room "${roomId}" (Peers: ${otherUsers.length})`);
      } catch (err) {
        console.error('Error in join-room handler:', err);
        socket.emit('room-error', { message: 'Failed to join room.' });
        socket.emit('join-error', { message: 'Failed to join room.' });
      }
    });

    // ========================================================
    // 2. WEBRTC SIGNALING (OFFER / ANSWER / ICE CANDIDATE)
    // ========================================================
    socket.on('offer', ({ target, caller, sdp }) => {
      io.to(target).emit('offer', {
        caller: socket.id,
        callerInfo: currentUser,
        sdp
      });
    });

    socket.on('answer', ({ target, caller, sdp }) => {
      io.to(target).emit('answer', {
        caller: socket.id,
        sdp
      });
    });

    socket.on('ice-candidate', ({ target, candidate }) => {
      io.to(target).emit('ice-candidate', {
        sender: socket.id,
        candidate
      });
    });

    // ========================================================
    // 3. MEDIA STATUS BROADCASTS
    // ========================================================
    socket.on('toggle-audio', ({ roomId, isMuted }) => {
      if (currentUser) currentUser.audioEnabled = !isMuted;
      socket.to(`room:${roomId}`).emit('user-toggle-audio', {
        socketId: socket.id,
        isMuted
      });
    });

    socket.on('toggle-video', ({ roomId, isVideoOff }) => {
      if (currentUser) currentUser.videoEnabled = !isVideoOff;
      socket.to(`room:${roomId}`).emit('user-toggle-video', {
        socketId: socket.id,
        isVideoOff
      });
    });

    socket.on('screen-share-status', ({ roomId, isSharing }) => {
      socket.to(`room:${roomId}`).emit('user-screen-share-status', {
        socketId: socket.id,
        isSharing,
        userName: currentUser?.name
      });
    });

    socket.on('raise-hand', ({ roomId, isHandRaised }) => {
      io.to(`room:${roomId}`).emit('user-raise-hand', {
        socketId: socket.id,
        userName: currentUser?.name,
        isHandRaised
      });
    });

    socket.on('send-reaction', ({ roomId, reaction }) => {
      io.to(`room:${roomId}`).emit('user-reaction', {
        socketId: socket.id,
        userName: currentUser?.name,
        reaction
      });
    });

    // ========================================================
    // 4. LIVE CHAT
    // ========================================================
    socket.on('send-message', async ({ roomId, message }) => {
      if (!message || !message.trim()) return;

      const trimmed = message.trim().slice(0, 1000);
      const senderName = currentUser?.name || 'Anonymous';
      const msgObj = await dbService.saveMessage(roomId, senderName, socket.id, trimmed);

      io.to(`room:${roomId}`).emit('receive-message', msgObj);
    });

    // ========================================================
    // 5. "CREATE TOGETHER" COLLABORATIVE FEATURES
    // ========================================================
    // A. Whiteboard Strokes & Sticky Notes
    socket.on('draw-stroke', ({ roomId, stroke }) => {
      if (!roomWhiteboards.has(roomId)) {
        roomWhiteboards.set(roomId, []);
      }
      roomWhiteboards.get(roomId).push(stroke);
      socket.to(`room:${roomId}`).emit('draw-stroke', stroke);
    });

    socket.on('clear-whiteboard', ({ roomId }) => {
      roomWhiteboards.set(roomId, []);
      io.to(`room:${roomId}`).emit('whiteboard-cleared');
    });

    // B. Live Polls
    socket.on('create-poll', ({ roomId, question, options }) => {
      if (!question || !options || !Array.isArray(options) || options.length < 2) return;

      const pollId = Math.random().toString(36).substring(2, 9);
      const newPoll = {
        id: pollId,
        question: question.trim(),
        options: options.map(o => o.trim()),
        votes: new Map(),
        createdBy: currentUser?.name || 'Host'
      };

      if (!roomPolls.has(roomId)) {
        roomPolls.set(roomId, []);
      }
      roomPolls.get(roomId).push(newPoll);

      const payload = {
        id: newPoll.id,
        question: newPoll.question,
        options: newPoll.options,
        createdBy: newPoll.createdBy,
        votesCount: newPoll.options.map(() => 0),
        totalVotes: 0
      };

      io.to(`room:${roomId}`).emit('new-poll', payload);
    });

    socket.on('vote-poll', ({ roomId, pollId, optionIndex }) => {
      const polls = roomPolls.get(roomId);
      if (!polls) return;
      const poll = polls.find(p => p.id === pollId);
      if (!poll) return;

      poll.votes.set(socket.id, optionIndex);

      const votesCount = poll.options.map((_, idx) => {
        let count = 0;
        for (const [, vIdx] of poll.votes) {
          if (vIdx === idx) count++;
        }
        return count;
      });

      io.to(`room:${roomId}`).emit('poll-updated', {
        pollId,
        votesCount,
        totalVotes: poll.votes.size
      });
    });

    // C. Collaborative Notes
    socket.on('update-notes', async ({ roomId, content }) => {
      await dbService.updateNotes(roomId, content);
      socket.to(`room:${roomId}`).emit('notes-updated', { content });
    });

    // ========================================================
    // 6. HOST CONTROLS & MODERATION
    // ========================================================
    socket.on('mute-participant', ({ roomId, targetSocketId }) => {
      if (!currentUser?.isHost) return;
      io.to(targetSocketId).emit('force-mute');
    });

    socket.on('mute-all', ({ roomId }) => {
      if (!currentUser?.isHost) return;
      socket.to(`room:${roomId}`).emit('force-mute');
    });

    socket.on('kick-participant', ({ roomId, targetSocketId }) => {
      if (!currentUser?.isHost) return;
      io.to(targetSocketId).emit('kicked-from-meeting');
    });

    socket.on('lock-meeting', async ({ roomId, isLocked }) => {
      if (!currentUser?.isHost) return;
      await roomManager.setRoomLock(roomId, isLocked);
      io.to(`room:${roomId}`).emit('meeting-locked-status', { isLocked });
    });

    socket.on('end-meeting', async ({ roomId }) => {
      if (!currentUser?.isHost) return;
      await roomManager.endRoom(roomId);
      io.to(`room:${roomId}`).emit('meeting-ended');
    });

    // ========================================================
    // 7. DISCONNECT & LEAVE CLEANUP
    // ========================================================
    const handleLeave = () => {
      if (!currentRoomId) return;

      inMemoryStore.participants.delete(socket.id);
      socket.leave(`room:${currentRoomId}`);

      socket.to(`room:${currentRoomId}`).emit('user-left', {
        socketId: socket.id,
        userName: currentUser?.name
      });

      console.log(`👋 User "${currentUser?.name || socket.id}" left room ${currentRoomId}`);
      currentRoomId = null;
      currentUser = null;
    };

    socket.on('leave-room', handleLeave);
    socket.on('disconnect', handleLeave);
  });
};
