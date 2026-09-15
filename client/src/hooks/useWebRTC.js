import { useState, useEffect, useRef, useCallback } from 'react';
import { getSocket, getSocketUrl } from '../services/socket';

// Default public Google STUN servers for NAT traversal
const DEFAULT_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' }
];

export function useWebRTC(roomId, currentUser, initialMediaSettings = { audio: true, video: true }) {
  const [localStream, setLocalStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [remotePeers, setRemotePeers] = useState([]); // Array of { socketId, user, stream, isMuted, isVideoOff }
  const [isAudioMuted, setIsAudioMuted] = useState(!initialMediaSettings.audio);
  const [isVideoOff, setIsVideoOff] = useState(!initialMediaSettings.video);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionState, setConnectionState] = useState('connecting'); // 'connecting', 'connected', 'disconnected'
  const [errorMessage, setErrorMessage] = useState(null);

  const socket = getSocket();
  const peersRef = useRef({}); // socketId -> { peerConnection, pendingCandidates: [], remoteStream: MediaStream, user }
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const cameraVideoTrackRef = useRef(null);
  const iceServersRef = useRef(DEFAULT_ICE_SERVERS);

  // Fetch optional TURN servers from backend / environment
  useEffect(() => {
    // 1. Check frontend env variables
    if (import.meta.env.VITE_TURN_SERVER_URL) {
      iceServersRef.current = [
        ...DEFAULT_ICE_SERVERS,
        {
          urls: import.meta.env.VITE_TURN_SERVER_URL,
          username: import.meta.env.VITE_TURN_USERNAME || '',
          credential: import.meta.env.VITE_TURN_CREDENTIAL || ''
        }
      ];
    }

    // 2. Fetch backend dynamic ICE servers if available
    const backendBase = getSocketUrl();
    const apiUrl = backendBase
      ? `${backendBase.replace(/\/+$/, '').replace(/\/api\/?$/, '')}/api`
      : '/api';

    fetch(`${apiUrl}/ice-servers`)
      .then((res) => res.json())
      .then((data) => {
        if (data.iceServers && Array.isArray(data.iceServers)) {
          iceServersRef.current = data.iceServers;
        }
      })
      .catch(() => {
        // Fallback to default STUN
      });
  }, []);

  // Helper: Create RTCPeerConnection for a remote peer
  const createPeerConnection = useCallback((peerSocketId, peerUser) => {
    if (peersRef.current[peerSocketId]?.peerConnection) {
      return peersRef.current[peerSocketId].peerConnection;
    }

    const pc = new RTCPeerConnection({
      iceServers: iceServersRef.current
    });

    const remoteStream = new MediaStream();

    peersRef.current[peerSocketId] = {
      peerConnection: pc,
      pendingCandidates: [],
      remoteStream,
      user: peerUser
    };

    // Add local tracks to peer connection
    const currentStream = screenStreamRef.current || localStreamRef.current;
    if (currentStream) {
      currentStream.getTracks().forEach((track) => {
        pc.addTrack(track, currentStream);
      });
    }

    // ICE Candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          target: peerSocketId,
          candidate: event.candidate,
          roomId
        });
      }
    };

    // Remote track arrived - aggregate cleanly into fresh MediaStream reference
    pc.ontrack = (event) => {
      console.log(`🎥 Received remote track from ${peerSocketId}:`, event.track.kind, event.track.id);
      const track = event.track;
      const peerRecord = peersRef.current[peerSocketId];
      if (!peerRecord) return;

      // Handle event.streams[0] if provided by browser, or aggregate track
      if (event.streams && event.streams[0]) {
        event.streams[0].getTracks().forEach((t) => {
          if (!peerRecord.remoteStream.getTracks().some((existing) => existing.id === t.id)) {
            peerRecord.remoteStream.addTrack(t);
          }
        });
      } else {
        if (!peerRecord.remoteStream.getTracks().some((t) => t.id === track.id)) {
          peerRecord.remoteStream.addTrack(track);
        }
      }

      // Create a fresh MediaStream wrapper so React state detection triggers re-render of VideoTile
      const updatedStream = new MediaStream(peerRecord.remoteStream.getTracks());
      peerRecord.remoteStream = updatedStream;

      track.onunmute = () => {
        setRemotePeers((prev) => [...prev]);
      };

      setRemotePeers((prev) => {
        const index = prev.findIndex((p) => p.socketId === peerSocketId);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            stream: updatedStream
          };
          return updated;
        } else {
          return [
            ...prev,
            {
              socketId: peerSocketId,
              user: peerUser,
              stream: updatedStream,
              isMuted: !peerUser?.audioEnabled,
              isVideoOff: !peerUser?.videoEnabled
            }
          ];
        }
      });
    };

    // Track connection state
    pc.onconnectionstatechange = () => {
      console.log(`📡 Peer ${peerSocketId} connection state:`, pc.connectionState);
      if (pc.connectionState === 'connected') {
        setConnectionState('connected');
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        // Peer disconnected
      }
    };

    return pc;
  }, [socket, roomId]);

  // ========================================================
  // INITIALIZE LOCAL USER MEDIA
  // ========================================================
  useEffect(() => {
    if (!roomId) return;
    let mounted = true;

    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 2560, min: 1280 },
            height: { ideal: 1440, min: 720 },
            frameRate: { ideal: 30, max: 60 },
            facingMode: 'user'
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);

        // Track initial media states
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          cameraVideoTrackRef.current = videoTrack;
          videoTrack.enabled = initialMediaSettings.video;
        }

        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = initialMediaSettings.audio;
        }

        setIsAudioMuted(!initialMediaSettings.audio);
        setIsVideoOff(!initialMediaSettings.video);

        // Join room once local stream is prepared
        socket.emit('join-room', {
          roomId,
          user: {
            ...currentUser,
            audioEnabled: initialMediaSettings.audio,
            videoEnabled: initialMediaSettings.video
          }
        });
      } catch (err) {
        console.warn('⚠️ Camera/Microphone access error:', err);

        // If camera failed or denied, try audio-only fallback
        try {
          const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          if (mounted) {
            localStreamRef.current = audioOnlyStream;
            setLocalStream(audioOnlyStream);
            setIsVideoOff(true);
            socket.emit('join-room', {
              roomId,
              user: { ...currentUser, audioEnabled: true, videoEnabled: false }
            });
          }
        } catch (audioErr) {
          console.error('Microphone also unavailable:', audioErr);
          if (mounted) {
            setErrorMessage('Unable to access camera or microphone. You can continue in listen/view-only mode.');
            socket.emit('join-room', {
              roomId,
              user: { ...currentUser, audioEnabled: false, videoEnabled: false }
            });
          }
        }
      }
    }

    initMedia();

    return () => {
      mounted = false;
    };
  }, [roomId, socket]);

  // ========================================================
  // SIGNALING EVENT LISTENERS
  // ========================================================
  useEffect(() => {
    if (!roomId) return;

    // 1. Existing users in the room sent to newcomer
    const handleAllUsers = ({ users }) => {
      console.log('👥 Discovered existing room participants:', users);
      for (const peer of users) {
        // Pre-initialize peer connection for incoming offers
        createPeerConnection(peer.id, peer);
        setRemotePeers((prev) => {
          if (prev.some((p) => p.socketId === peer.id)) return prev;
          return [
            ...prev,
            {
              socketId: peer.id,
              user: peer,
              stream: peersRef.current[peer.id]?.remoteStream || null,
              isMuted: !peer.audioEnabled,
              isVideoOff: !peer.videoEnabled
            }
          ];
        });
      }
    };

    // 2. An incoming peer joined - Existing participants initiate createOffer
    const handleUserConnected = async ({ user, socketId }) => {
      const peerId = user?.id || socketId;
      if (!peerId || peerId === socket.id) return;
      console.log('👋 Peer joined room:', user?.name || peerId, peerId);

      setRemotePeers((prev) => {
        if (prev.some((p) => p.socketId === peerId)) return prev;
        return [
          ...prev,
          {
            socketId: peerId,
            user,
            stream: peersRef.current[peerId]?.remoteStream || null,
            isMuted: !user?.audioEnabled,
            isVideoOff: !user?.videoEnabled
          }
        ];
      });

      const pc = createPeerConnection(peerId, user);
      // Avoid duplicate offers if already negotiating
      if (pc.signalingState !== 'stable') {
        console.log(`⚠️ Peer ${peerId} already in signaling state: ${pc.signalingState}`);
        return;
      }

      try {
        console.log(`📤 Existing participant initiating offer to newcomer ${peerId}`);
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        });
        await pc.setLocalDescription(offer);

        socket.emit('offer', {
          target: peerId,
          caller: socket.id,
          callerInfo: currentUser,
          sdp: pc.localDescription,
          roomId
        });
      } catch (err) {
        console.error('Error creating offer for peer:', peerId, err);
      }
    };

    // 3. Received WebRTC Offer (Incoming participant receives and replies with createAnswer)
    const handleOffer = async ({ caller, callerInfo, sdp }) => {
      console.log('📥 Received offer from:', caller);
      const pc = createPeerConnection(caller, callerInfo);

      setRemotePeers((prev) => {
        if (prev.some((p) => p.socketId === caller)) return prev;
        return [
          ...prev,
          {
            socketId: caller,
            user: callerInfo,
            stream: peersRef.current[caller]?.remoteStream || null,
            isMuted: !callerInfo?.audioEnabled,
            isVideoOff: !callerInfo?.videoEnabled
          }
        ];
      });

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));

        // Process any queued ICE candidates
        const peerRecord = peersRef.current[caller];
        if (peerRecord?.pendingCandidates.length > 0) {
          for (const cand of peerRecord.pendingCandidates) {
            try {
              await pc.addIceCandidate(cand);
            } catch (candErr) {
              console.warn('Error applying queued ICE candidate:', candErr);
            }
          }
          peerRecord.pendingCandidates = [];
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('answer', {
          target: caller,
          caller: socket.id,
          sdp: pc.localDescription,
          roomId
        });
      } catch (err) {
        console.error('Error handling offer from peer:', caller, err);
      }
    };

    // 4. Received WebRTC Answer (Existing participant completes negotiation)
    const handleAnswer = async ({ caller, sdp }) => {
      console.log('📥 Received answer from:', caller);
      const peerRecord = peersRef.current[caller];
      if (peerRecord?.peerConnection) {
        try {
          await peerRecord.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));

          // Process queued candidates
          if (peerRecord.pendingCandidates.length > 0) {
            for (const cand of peerRecord.pendingCandidates) {
              try {
                await peerRecord.peerConnection.addIceCandidate(cand);
              } catch (candErr) {
                console.warn('Error applying queued candidate on answer:', candErr);
              }
            }
            peerRecord.pendingCandidates = [];
          }
        } catch (err) {
          console.error('Error setting remote description from answer:', err);
        }
      }
    };

    // 5. Received ICE Candidate
    const handleIceCandidate = async ({ sender, candidate }) => {
      const peerRecord = peersRef.current[sender];
      if (peerRecord?.peerConnection) {
        try {
          if (peerRecord.peerConnection.remoteDescription) {
            await peerRecord.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          } else {
            peerRecord.pendingCandidates.push(new RTCIceCandidate(candidate));
          }
        } catch (err) {
          console.warn('Error adding ICE candidate:', err);
        }
      }
    };

    // 6. User media toggled
    const handleUserToggleAudio = ({ socketId, isMuted }) => {
      setRemotePeers((prev) =>
        prev.map((p) => (p.socketId === socketId ? { ...p, isMuted } : p))
      );
    };

    const handleUserToggleVideo = ({ socketId, isVideoOff }) => {
      setRemotePeers((prev) =>
        prev.map((p) => (p.socketId === socketId ? { ...p, isVideoOff } : p))
      );
    };

    // 7. User left
    const handleUserLeft = ({ socketId }) => {
      console.log('👋 Peer disconnected:', socketId);
      if (peersRef.current[socketId]) {
        peersRef.current[socketId].peerConnection.close();
        delete peersRef.current[socketId];
      }
      setRemotePeers((prev) => prev.filter((p) => p.socketId !== socketId));
    };

    // 8. Room errors & Room Full
    const handleRoomError = ({ message }) => {
      setErrorMessage(message);
    };

    const handleRoomFull = ({ message }) => {
      setErrorMessage(message || 'This room has reached its maximum participant limit.');
    };

    // Re-join room on socket connect/reconnect
    const handleSocketConnect = () => {
      console.log('⚡ Socket connected/reconnected, ensuring room membership:', roomId);
      if (localStreamRef.current) {
        socket.emit('join-room', {
          roomId,
          user: {
            ...currentUser,
            audioEnabled: !isAudioMuted,
            videoEnabled: !isVideoOff
          }
        });
      }
    };

    socket.on('connect', handleSocketConnect);
    socket.on('all-users', handleAllUsers);
    socket.on('user-connected', handleUserConnected);
    socket.on('user-joined', handleUserConnected);
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('user-toggle-audio', handleUserToggleAudio);
    socket.on('user-toggle-video', handleUserToggleVideo);
    socket.on('user-left', handleUserLeft);
    socket.on('room-error', handleRoomError);
    socket.on('room-full', handleRoomFull);
    socket.on('join-error', handleRoomError);

    return () => {
      socket.off('connect', handleSocketConnect);
      socket.off('all-users', handleAllUsers);
      socket.off('user-connected', handleUserConnected);
      socket.off('user-joined', handleUserConnected);
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('user-toggle-audio', handleUserToggleAudio);
      socket.off('user-toggle-video', handleUserToggleVideo);
      socket.off('user-left', handleUserLeft);
      socket.off('room-error', handleRoomError);
      socket.off('room-full', handleRoomFull);
      socket.off('join-error', handleRoomError);
    };
  }, [roomId, socket, createPeerConnection, currentUser, isAudioMuted, isVideoOff]);

  // ========================================================
  // MEDIA CONTROL ACTIONS
  // ========================================================
  const toggleAudio = useCallback((forceValue) => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      const nextState = forceValue !== undefined ? forceValue : !audioTrack.enabled;
      audioTrack.enabled = nextState;
      const muted = !nextState;
      setIsAudioMuted(muted);
      socket.emit('toggle-audio', { roomId, isMuted: muted });
    }
  }, [roomId, socket]);

  const toggleVideo = useCallback((forceValue) => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      const nextState = forceValue !== undefined ? forceValue : !videoTrack.enabled;
      videoTrack.enabled = nextState;
      const videoOff = !nextState;
      setIsVideoOff(videoOff);
      socket.emit('toggle-video', { roomId, isVideoOff: videoOff });
    }
  }, [roomId, socket]);

  const startScreenShare = useCallback(async () => {
    if (isScreenSharing) return;

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: true
      });

      const screenVideoTrack = displayStream.getVideoTracks()[0];
      screenStreamRef.current = displayStream;
      setScreenStream(displayStream);
      setIsScreenSharing(true);

      socket.emit('screen-share-status', { roomId, isSharing: true });

      // Replace video track on all peer connections
      Object.values(peersRef.current).forEach(({ peerConnection }) => {
        const senders = peerConnection.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(screenVideoTrack);
        }
      });

      screenVideoTrack.onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.warn('Screen sharing cancelled or failed:', err);
    }
  }, [isScreenSharing, roomId, socket]);

  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    setScreenStream(null);
    setIsScreenSharing(false);

    socket.emit('screen-share-status', { roomId, isSharing: false });

    // Switch back to camera video track
    const cameraTrack = cameraVideoTrackRef.current;
    if (cameraTrack) {
      Object.values(peersRef.current).forEach(({ peerConnection }) => {
        const senders = peerConnection.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(cameraTrack);
        }
      });
    }
  }, [roomId, socket]);

  const leaveMeeting = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }

    Object.values(peersRef.current).forEach(({ peerConnection }) => {
      try { peerConnection.close(); } catch (e) {}
    });
    peersRef.current = {};

    socket.emit('leave-room');
  }, [socket]);

  useEffect(() => {
    return () => {
      leaveMeeting();
    };
  }, [leaveMeeting]);

  return {
    localStream,
    screenStream,
    remotePeers,
    isAudioMuted,
    isVideoOff,
    isScreenSharing,
    connectionState,
    errorMessage,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    leaveMeeting
  };
}
