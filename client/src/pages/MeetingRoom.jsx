import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import IntroSequence from '../components/IntroSequence';
import JoinPreview from '../components/JoinPreview';
import VideoTile from '../components/VideoTile';
import MeetingControls from '../components/MeetingControls';
import ChatPanel from '../components/ChatPanel';
import ParticipantsPanel from '../components/ParticipantsPanel';
import CameraFilters from '../components/CameraFilters';
import ThemeSwitcher from '../components/ThemeSwitcher';
import ChakriAI from '../components/ai/ChakriAI';
import ChakriNotes from '../components/ai/ChakriNotes';
import AIAgentHub from '../components/ai/AIAgentHub';
import SmartBoard from '../components/create-together/SmartBoard';
import LivePolls from '../components/create-together/LivePolls';
import CollabNotes from '../components/create-together/CollabNotes';
import MeetingAgenda from '../components/create-together/MeetingAgenda';
import Logo from '../components/Logo';
import { useWebRTC } from '../hooks/useWebRTC';
import { useMeetingRecording } from '../hooks/useMeetingRecording';
import { getSocket } from '../services/socket';
import { getEffectiveMeetingUrl } from '../components/PublicLinkCard';
import { Copy, Check, Clock, ShieldAlert, Sparkles, AlertCircle, Home, RefreshCw, CircleDot } from 'lucide-react';

export default function MeetingRoom() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Meeting Stages: 'intro' -> 'lobby' -> 'active'
  const [stage, setStage] = useState('intro');

  // Theme State
  const [currentTheme, setCurrentTheme] = useState(
    localStorage.getItem('chakri_theme') || 'theme-midnight'
  );

  const handleThemeChange = (newTheme) => {
    setCurrentTheme(newTheme);
    localStorage.setItem('chakri_theme', newTheme);
  };

  // Camera Filter State
  const [selectedFilter, setSelectedFilter] = useState('normal');

  // User State
  const [userProfile, setUserProfile] = useState({
    name: location.state?.hostName || localStorage.getItem('chakri_user_name') || '',
    isHost: Boolean(location.state?.isHost)
  });

  const [mediaSettings, setMediaSettings] = useState({
    audio: true,
    video: true
  });

  const [meetingTitle, setMeetingTitle] = useState(
    location.state?.title || localStorage.getItem(`meeting_title_${roomId}`) || "Chakri's Meet Room"
  );

  // Active side panel: 'chat', 'participants', 'whiteboard', 'polls', 'notes', 'agenda', 'chakri-ai', 'chakri-notes', 'agent-hub', 'filters', or null
  const [activePanel, setActivePanel] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Live Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Chat & Interactions
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [floatingReactions, setFloatingReactions] = useState([]);
  const [handRaisedUsers, setHandRaisedUsers] = useState(new Set());
  const [pinnedSocketId, setPinnedSocketId] = useState(null);
  const [isMeetingLocked, setIsMeetingLocked] = useState(false);
  const [notification, setNotification] = useState(null);

  const socket = getSocket();

  // WebRTC Media Hook
  const {
    localStream,
    screenStream,
    remotePeers,
    isAudioMuted,
    isVideoOff,
    isScreenSharing,
    errorMessage,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    leaveMeeting
  } = useWebRTC(
    stage === 'active' ? roomId : null,
    userProfile,
    mediaSettings
  );

  // Meeting Recording Hook
  const recording = useMeetingRecording({
    stream: isScreenSharing && screenStream ? screenStream : localStream,
    roomId
  });

  // Stopwatch timer for active meeting
  useEffect(() => {
    if (stage !== 'active') return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [stage]);

  const formatTimer = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Socket event listeners for in-meeting actions
  useEffect(() => {
    if (stage !== 'active') return;

    // Chat
    const handleReceiveMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (activePanel !== 'chat') {
        setUnreadCount((c) => c + 1);
      }
    };

    const handleChatHistory = (history) => {
      setMessages(history);
    };

    // Reactions
    const handleUserReaction = ({ socketId, reaction }) => {
      const id = Date.now() + Math.random();
      setFloatingReactions((prev) => [...prev, { id, socketId, reaction }]);
      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
      }, 2500);
    };

    // Hand Raise
    const handleUserRaiseHand = ({ socketId, userName, isHandRaised }) => {
      setHandRaisedUsers((prev) => {
        const next = new Set(prev);
        if (isHandRaised) {
          next.add(socketId);
        } else {
          next.delete(socketId);
        }
        return next;
      });

      if (isHandRaised) {
        showToast(`${userName || 'A participant'} raised their hand ✋`);
      }
    };

    // Host Moderation Events
    const handleForceMute = () => {
      toggleAudio(false);
      showToast('The host has muted your microphone.');
    };

    const handleKicked = () => {
      alert('You have been removed from this meeting by the host.');
      leaveMeeting();
      navigate('/');
    };

    const handleMeetingEnded = () => {
      alert('The host has ended this meeting for everyone.');
      leaveMeeting();
      navigate('/');
    };

    const handleMeetingLocked = ({ isLocked }) => {
      setIsMeetingLocked(isLocked);
      showToast(isLocked ? 'This meeting is now locked.' : 'Meeting unlocked.');
    };

    socket.on('receive-message', handleReceiveMessage);
    socket.on('chat-history', handleChatHistory);
    socket.on('user-reaction', handleUserReaction);
    socket.on('user-raise-hand', handleUserRaiseHand);
    socket.on('force-mute', handleForceMute);
    socket.on('kicked-from-meeting', handleKicked);
    socket.on('meeting-ended', handleMeetingEnded);
    socket.on('meeting-locked-status', handleMeetingLocked);

    return () => {
      socket.off('receive-message', handleReceiveMessage);
      socket.off('chat-history', handleChatHistory);
      socket.off('user-reaction', handleUserReaction);
      socket.off('user-raise-hand', handleUserRaiseHand);
      socket.off('force-mute', handleForceMute);
      socket.off('kicked-from-meeting', handleKicked);
      socket.off('meeting-ended', handleMeetingEnded);
      socket.off('meeting-locked-status', handleMeetingLocked);
    };
  }, [stage, activePanel, socket, toggleAudio, leaveMeeting, navigate]);

  useEffect(() => {
    if (!roomId || !roomId.trim()) {
      navigate('/error', { state: { message: 'Missing or invalid meeting room identifier.' } });
    }
  }, [roomId, navigate]);

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleCopyLink = () => {
    const effectiveUrl = getEffectiveMeetingUrl(roomId);
    navigator.clipboard.writeText(effectiveUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Panel toggle
  const togglePanel = (panelName) => {
    if (activePanel === panelName) {
      setActivePanel(null);
    } else {
      setActivePanel(panelName);
      if (panelName === 'chat') {
        setUnreadCount(0);
      }
    }
  };

  // Hand raise toggle
  const isLocalHandRaised = handRaisedUsers.has(socket.id);
  const handleToggleHandRaise = () => {
    const nextState = !isLocalHandRaised;
    socket.emit('raise-hand', { roomId, isHandRaised: nextState });
  };

  // Reactions
  const handleSendReaction = (reaction) => {
    socket.emit('send-reaction', { roomId, reaction });
  };

  // Chat message send
  const handleSendMessage = (messageText) => {
    socket.emit('send-message', { roomId, message: messageText });
  };

  // Host Controls
  const handleMuteParticipant = (targetSocketId) => {
    socket.emit('mute-participant', { roomId, targetSocketId });
  };

  const handleMuteAll = () => {
    socket.emit('mute-all', { roomId });
  };

  const handleKickParticipant = (targetSocketId) => {
    if (window.confirm('Remove this participant from the meeting?')) {
      socket.emit('kick-participant', { roomId, targetSocketId });
    }
  };

  const handleToggleLockMeeting = () => {
    const next = !isMeetingLocked;
    socket.emit('lock-meeting', { roomId, isLocked: next });
  };

  const handleLeaveOrEnd = (endForEveryone) => {
    if (endForEveryone) {
      socket.emit('end-meeting', { roomId });
    }
    if (recording.isRecording) {
      recording.stopRecording();
    }
    leaveMeeting();
    navigate('/');
  };

  // ========================================================
  // ERROR STATE: ROOM FULL, LOCKED, OR ENDED
  // ========================================================
  if (errorMessage) {
    return (
      <div className={`min-h-screen ${currentTheme} bg-slate-950 text-white flex items-center justify-center p-4`}>
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center space-y-5 shadow-2xl animate-in zoom-in-95">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold font-display">Unable to Join Meeting</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{errorMessage}</p>
          <div className="flex gap-2.5 pt-2">
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Return Home</span>
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // RENDER STAGE 1: INTRO SEQUENCE
  // ========================================================
  if (stage === 'intro') {
    return (
      <IntroSequence
        onComplete={() => setStage('lobby')}
        autoAdvance={true}
      />
    );
  }

  // ========================================================
  // RENDER STAGE 2: PRE-JOIN LOBBY
  // ========================================================
  if (stage === 'lobby') {
    return (
      <JoinPreview
        roomId={roomId}
        meetingTitle={meetingTitle}
        initialName={userProfile.name}
        isHost={userProfile.isHost}
        onJoin={({ name, audioEnabled, videoEnabled }) => {
          setUserProfile((prev) => ({ ...prev, name }));
          setMediaSettings({ audio: audioEnabled, video: videoEnabled });
          setStage('active');
        }}
      />
    );
  }

  // ========================================================
  // RENDER STAGE 3: ACTIVE VIDEO MEETING ROOM
  // ========================================================
  const totalParticipants = 1 + remotePeers.length;

  const getGridColsClass = () => {
    if (pinnedSocketId || isScreenSharing) return 'grid-cols-1';
    if (totalParticipants === 1) return 'grid-cols-1 max-w-3xl mx-auto';
    if (totalParticipants === 2) return 'grid-cols-1 sm:grid-cols-2';
    if (totalParticipants <= 4) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2';
    return 'grid-cols-2 lg:grid-cols-3';
  };

  return (
    <div className={`h-screen w-screen flex flex-col ${currentTheme} bg-slate-950 text-white overflow-hidden select-none font-sans`}>
      {/* Top Header Bar */}
      <header className="h-16 px-4 sm:px-6 bg-slate-900/90 backdrop-blur-xl border-b border-white/10 flex items-center justify-between z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Logo size="sm" className="drop-shadow" />
          <div className="h-5 w-px bg-white/10 hidden sm:block" />
          <div className="hidden sm:block">
            <h2 className="text-xs font-bold text-white truncate max-w-xs">{meetingTitle}</h2>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
              <span>ID: {roomId}</span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="hover:text-indigo-400 flex items-center gap-0.5 transition"
                title="Copy Room Link"
              >
                {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        {/* Center: Meeting Timer, Status & Recording Badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Recording Badge */}
          {recording.isRecording && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 border border-rose-500/50 rounded-full text-rose-400 text-xs font-bold font-mono animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>REC {recording.formattedTime}</span>
            </div>
          )}

          <div className="flex items-center gap-2 sm:gap-3 bg-white/5 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-mono font-bold text-white">{formatTimer(elapsedSeconds)}</span>
            <span className="h-3 w-px bg-white/10" />
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden sm:inline">Encrypted WebRTC</span>
            </div>
          </div>
        </div>

        {/* Right: Theme Switcher & Share */}
        <div className="flex items-center gap-2">
          {/* Theme Switcher */}
          <ThemeSwitcher
            currentTheme={currentTheme}
            onSelectTheme={handleThemeChange}
          />

          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl text-xs font-semibold text-white shadow-md shadow-indigo-500/20 transition-all active:scale-95"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedLink ? 'Copied!' : 'Share Link'}</span>
          </button>
        </div>
      </header>

      {/* Recording Legal Notice Banner */}
      {recording.showNotice && (
        <div className="bg-gradient-to-r from-amber-500/90 to-rose-500/90 text-white px-4 py-1.5 text-xs font-semibold text-center flex items-center justify-center gap-2 shadow-md z-30 animate-in slide-in-from-top duration-300">
          <CircleDot className="w-3.5 h-3.5 animate-pulse" />
          <span>Recording in progress. All audio and screen activity are being saved transparently.</span>
          <button
            onClick={() => recording.setShowNotice(false)}
            className="underline ml-2 text-[11px] opacity-80 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Video Stage & Side Panels */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Video Grid */}
        <main className="flex-1 p-3 sm:p-4 overflow-y-auto flex items-center justify-center">
          <div className={`w-full h-full grid gap-3 sm:gap-4 items-center justify-center ${getGridColsClass()}`}>
            {/* Screen Share Tile */}
            {isScreenSharing && screenStream && (
              <div className="col-span-full h-[60vh] sm:h-[70vh]">
                <VideoTile
                  stream={screenStream}
                  user={{ name: `${userProfile.name} (Screen Presentation)` }}
                  isLocal={false}
                  isScreenShare={true}
                  reactions={[]}
                />
              </div>
            )}

            {/* Local Video Tile with Camera Filter */}
            <VideoTile
              stream={localStream}
              user={{ name: userProfile.name, isHost: userProfile.isHost }}
              isLocal={true}
              isMuted={isAudioMuted}
              isVideoOff={isVideoOff}
              filterClass={selectedFilter}
              isHandRaised={isLocalHandRaised}
              reactions={floatingReactions.filter((r) => r.socketId === socket.id)}
              onPin={() => setPinnedSocketId(pinnedSocketId === 'local' ? null : 'local')}
              isPinned={pinnedSocketId === 'local'}
            />

            {/* Remote Video Tiles */}
            {remotePeers.map((peer) => (
              <VideoTile
                key={peer.socketId}
                stream={peer.stream}
                user={peer.user}
                isLocal={false}
                isMuted={peer.isMuted}
                isVideoOff={peer.isVideoOff}
                isHandRaised={handRaisedUsers.has(peer.socketId)}
                reactions={floatingReactions.filter((r) => r.socketId === peer.socketId)}
                onPin={() => setPinnedSocketId(pinnedSocketId === peer.socketId ? null : peer.socketId)}
                isPinned={pinnedSocketId === peer.socketId}
              />
            ))}
          </div>
        </main>

        {/* Camera Filters Popover Panel */}
        {activePanel === 'filters' && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 animate-in fade-in zoom-in-95">
            <CameraFilters
              activeFilter={selectedFilter}
              onSelectFilter={setSelectedFilter}
              onClose={() => setActivePanel(null)}
            />
          </div>
        )}

        {/* Chakri AI Copilot Panel */}
        <ChakriAI
          isOpen={activePanel === 'chakri-ai'}
          onClose={() => setActivePanel(null)}
          meetingTitle={meetingTitle}
          roomId={roomId}
        />

        {/* Chakri Notes (NotebookLM Style) Panel */}
        <ChakriNotes
          isOpen={activePanel === 'chakri-notes'}
          onClose={() => setActivePanel(null)}
          meetingTitle={meetingTitle}
        />

        {/* AI Agent Hub Panel (8 Agents) */}
        <AIAgentHub
          isOpen={activePanel === 'agent-hub'}
          onClose={() => setActivePanel(null)}
        />

        {/* Chat Panel */}
        {activePanel === 'chat' && (
          <ChatPanel
            messages={messages}
            currentUserId={socket.id}
            onSendMessage={handleSendMessage}
            onClose={() => setActivePanel(null)}
          />
        )}

        {/* Participants Panel */}
        {activePanel === 'participants' && (
          <ParticipantsPanel
            localUser={userProfile}
            remotePeers={remotePeers}
            isLocalMuted={isAudioMuted}
            isLocalVideoOff={isVideoOff}
            isLocalHandRaised={isLocalHandRaised}
            isHost={userProfile.isHost}
            isMeetingLocked={isMeetingLocked}
            onMuteParticipant={handleMuteParticipant}
            onMuteAll={handleMuteAll}
            onKickParticipant={handleKickParticipant}
            onToggleLockMeeting={handleToggleLockMeeting}
            onClose={() => setActivePanel(null)}
          />
        )}

        {/* Create Together Tools */}
        {activePanel === 'whiteboard' && (
          <SmartBoard roomId={roomId} onClose={() => setActivePanel(null)} />
        )}

        {activePanel === 'polls' && (
          <LivePolls
            roomId={roomId}
            isHost={userProfile.isHost}
            onClose={() => setActivePanel(null)}
          />
        )}

        {activePanel === 'notes' && (
          <CollabNotes roomId={roomId} onClose={() => setActivePanel(null)} />
        )}

        {activePanel === 'agenda' && (
          <MeetingAgenda onClose={() => setActivePanel(null)} />
        )}
      </div>

      {/* Floating Notification Toast */}
      {notification && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900/95 backdrop-blur-md border border-white/20 text-white text-xs font-semibold rounded-full shadow-2xl animate-in fade-in zoom-in-95 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Bottom Meeting Controls Bar */}
      <MeetingControls
        isAudioMuted={isAudioMuted}
        isVideoOff={isVideoOff}
        isScreenSharing={isScreenSharing}
        isHandRaised={isLocalHandRaised}
        unreadCount={unreadCount}
        participantCount={totalParticipants}
        activePanel={activePanel}
        isHost={userProfile.isHost}
        recording={recording}
        onToggleAudio={() => toggleAudio()}
        onToggleVideo={() => toggleVideo()}
        onToggleScreenShare={isScreenSharing ? stopScreenShare : startScreenShare}
        onToggleHandRaise={handleToggleHandRaise}
        onSendReaction={handleSendReaction}
        onTogglePanel={togglePanel}
        onLeaveMeeting={handleLeaveOrEnd}
      />
    </div>
  );
}
