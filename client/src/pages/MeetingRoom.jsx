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
import { useTheme } from '../context/ThemeContext';
import { useWebRTC } from '../hooks/useWebRTC';
import { useMeetingRecording } from '../hooks/useMeetingRecording';
import { getSocket } from '../services/socket';
import { getEffectiveMeetingUrl } from '../components/PublicLinkCard';
import {
  Copy,
  Check,
  Clock,
  ShieldAlert,
  Sparkles,
  AlertCircle,
  Home,
  RefreshCw,
  CircleDot,
  BookOpen,
  MessageSquare,
  Users,
  X,
  ShieldCheck,
  HardDrive
} from 'lucide-react';

export default function MeetingRoom() {
  const { roomId: rawParamRoomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Robust multi-tier dynamic roomId extraction:
  // 1. useParams() route param (/room/:roomId)
  // 2. Query parameters (?roomId=, ?room=, ?code=, ?id=)
  // 3. window.location.pathname regex fallback
  const roomId = React.useMemo(() => {
    // 1. Route param
    if (rawParamRoomId && rawParamRoomId !== ':roomId' && rawParamRoomId.trim()) {
      return rawParamRoomId.trim().replace(/^.*\/room\//, '').split('?')[0].split('#')[0];
    }
    // 2. Query search params
    const search = location.search || (typeof window !== 'undefined' ? window.location.search : '');
    if (search) {
      try {
        const sp = new URLSearchParams(search);
        const queryId = sp.get('roomId') || sp.get('room') || sp.get('code') || sp.get('id');
        if (queryId && queryId.trim()) {
          return queryId.trim().replace(/^.*\/room\//, '').split('?')[0].split('#')[0];
        }
      } catch (e) {}
    }
    // 3. Pathname regex fallback
    if (typeof window !== 'undefined') {
      const match = window.location.pathname.match(/\/room\/([^/?#]+)/i);
      if (match && match[1] && match[1] !== ':roomId') {
        return match[1].trim();
      }
    }
    return '';
  }, [rawParamRoomId, location.search]);

  // Meeting Stages: 'intro' -> 'lobby' -> 'active'
  // Skip 7s intro screen by default for direct links, pre-join lobby, or instant launches
  const [stage, setStage] = useState(() => {
    const search = location.search || (typeof window !== 'undefined' ? window.location.search : '');
    if (location.state?.directJoin || search.includes('direct=true')) {
      return 'active';
    }
    if (search.includes('intro=true')) {
      return 'intro';
    }
    // Default directly to pre-join lobby for instant device check & join button
    return 'lobby';
  });

  // Theme State from Context
  const { theme: currentTheme, setTheme: handleThemeChange } = useTheme();

  // Camera Filter State
  const [selectedFilter, setSelectedFilter] = useState('filter-normal');

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

  // Meeting Recording Hook (Stores directly to personal device storage with explicit permission)
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

    // Reactions with screen trajectory
    const handleUserReaction = ({ socketId, reaction, userName }) => {
      const id = Date.now() + Math.random();
      const xPercent = 15 + Math.random() * 70; // 15% to 85%
      setFloatingReactions((prev) => [...prev, { id, socketId, reaction, xPercent, userName }]);
      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
      }, 2800);
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

  // Reactions: Emits to peers and immediately renders locally
  const handleSendReaction = (reaction) => {
    socket.emit('send-reaction', { roomId, reaction });
    const id = Date.now() + Math.random();
    const xPercent = 30 + Math.random() * 40;
    setFloatingReactions((prev) => [
      ...prev,
      { id, socketId: socket.id, reaction, xPercent, userName: userProfile.name || 'You' }
    ]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2800);
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
      <div
        data-theme={currentTheme}
        className={`min-h-screen ${currentTheme} bg-slate-950 text-white flex items-center justify-center p-4`}
      >
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
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md transition-colors flex items-center justify-center gap-1.5"
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
    <div
      data-theme={currentTheme}
      className={`h-screen w-screen flex flex-col ${currentTheme} bg-slate-950 text-white overflow-hidden select-none font-sans relative`}
    >
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
                className="hover:text-amber-400 flex items-center gap-0.5 transition"
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
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-mono font-bold text-white">{formatTimer(elapsedSeconds)}</span>
            <span className="h-3 w-px bg-white/10" />
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden sm:inline">1440p HD WebRTC</span>
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
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-purple-600/20 transition-all active:scale-95"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedLink ? 'Copied!' : 'Share Link'}</span>
          </button>
        </div>
      </header>

      {/* Recording Legal Notice Banner */}
      {recording.showNotice && (
        <div className="bg-gradient-to-r from-amber-600/90 to-rose-600/90 text-white px-4 py-1.5 text-xs font-semibold text-center flex items-center justify-center gap-2 shadow-md z-30 animate-in slide-in-from-top duration-300">
          <CircleDot className="w-3.5 h-3.5 animate-pulse" />
          <span>Recording in progress. High-definition 1440p stream is saving directly to your personal device.</span>
          <button
            onClick={() => recording.setShowNotice(false)}
            className="underline ml-2 text-[11px] opacity-80 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Video Stage & Dedicated Right-Side Vertical Tabs Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Video Grid */}
        <main className="flex-1 p-3 sm:p-4 overflow-y-auto flex items-center justify-center min-w-0 transition-all">
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

        {/* Active Side Panel Docked on the Right */}
        {activePanel && (
          <aside className="w-80 sm:w-96 border-l border-white/10 bg-slate-900/95 backdrop-blur-2xl flex flex-col z-30 shadow-2xl animate-in slide-in-from-right duration-200 relative flex-shrink-0">
            {/* Active Panel Header with Collapse button */}
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-slate-950/70">
              <div className="flex items-center gap-2">
                {activePanel === 'chakri-ai' && <Sparkles className="w-4 h-4 text-amber-400" />}
                {(activePanel === 'notes' || activePanel === 'chakri-notes') && <BookOpen className="w-4 h-4 text-amber-400" />}
                {activePanel === 'chat' && <MessageSquare className="w-4 h-4 text-amber-400" />}
                {activePanel === 'participants' && <Users className="w-4 h-4 text-amber-400" />}
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  {activePanel === 'chakri-ai' ? 'Chakri AI Assistant' :
                   activePanel === 'chakri-notes' ? 'Chakri Notes (NotebookLM)' :
                   activePanel === 'notes' ? 'Meeting Notes' :
                   activePanel === 'chat' ? 'Live Chat' :
                   activePanel === 'participants' ? 'Participants' :
                   activePanel}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActivePanel(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Collapse Panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Side Panel Content */}
            <div className="flex-1 overflow-y-auto">
              {activePanel === 'chakri-ai' && (
                <ChakriAI
                  isOpen={true}
                  onClose={() => setActivePanel(null)}
                  meetingTitle={meetingTitle}
                  roomId={roomId}
                />
              )}

              {activePanel === 'notes' && (
                <CollabNotes roomId={roomId} onClose={() => setActivePanel(null)} />
              )}

              {activePanel === 'chakri-notes' && (
                <ChakriNotes
                  isOpen={true}
                  onClose={() => setActivePanel(null)}
                  meetingTitle={meetingTitle}
                />
              )}

              {activePanel === 'agent-hub' && (
                <AIAgentHub
                  isOpen={true}
                  onClose={() => setActivePanel(null)}
                />
              )}

              {activePanel === 'chat' && (
                <ChatPanel
                  messages={messages}
                  currentUserId={socket.id}
                  onSendMessage={handleSendMessage}
                  onClose={() => setActivePanel(null)}
                />
              )}

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

              {activePanel === 'agenda' && (
                <MeetingAgenda onClose={() => setActivePanel(null)} />
              )}
            </div>
          </aside>
        )}

        {/* Dedicated Separate Vertical Tabs on the Right Side of the Screen */}
        <nav
          aria-label="Meeting Right Vertical Tabs"
          className="w-14 sm:w-16 vertical-tab-strip flex flex-col items-center py-4 gap-2.5 border-l border-white/10 flex-shrink-0 select-none z-30"
        >
          {/* Vertical Tab 1: Chakri AI */}
          <button
            type="button"
            onClick={() => togglePanel('chakri-ai')}
            className={`relative w-11 h-12 rounded-2xl flex flex-col items-center justify-center transition-all ${
              activePanel === 'chakri-ai'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/40 ring-2 ring-amber-300 scale-105'
                : 'text-amber-300 hover:text-white hover:bg-amber-500/20 bg-amber-500/10 border border-amber-500/30'
            }`}
            title="Chakri AI Assistant"
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[9px] font-extrabold tracking-tight mt-0.5">AI</span>
          </button>

          {/* Vertical Tab 2: Notes */}
          <button
            type="button"
            onClick={() => togglePanel('notes')}
            className={`relative w-11 h-12 rounded-2xl flex flex-col items-center justify-center transition-all ${
              activePanel === 'notes' || activePanel === 'chakri-notes'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/40 ring-2 ring-amber-300 scale-105'
                : 'text-slate-300 hover:text-white hover:bg-white/10 bg-white/5 border border-white/10'
            }`}
            title="Meeting Notes"
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[9px] font-bold mt-0.5">Notes</span>
          </button>

          {/* Vertical Tab 3: Chat */}
          <button
            type="button"
            onClick={() => togglePanel('chat')}
            className={`relative w-11 h-12 rounded-2xl flex flex-col items-center justify-center transition-all ${
              activePanel === 'chat'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/40 ring-2 ring-amber-300 scale-105'
                : 'text-slate-300 hover:text-white hover:bg-white/10 bg-white/5 border border-white/10'
            }`}
            title="Live Chat"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[9px] font-bold mt-0.5">Chat</span>
            {unreadCount > 0 && activePanel !== 'chat' && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center shadow animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Vertical Tab 4: Participants */}
          <button
            type="button"
            onClick={() => togglePanel('participants')}
            className={`relative w-11 h-12 rounded-2xl flex flex-col items-center justify-center transition-all ${
              activePanel === 'participants'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/40 ring-2 ring-amber-300 scale-105'
                : 'text-slate-300 hover:text-white hover:bg-white/10 bg-white/5 border border-white/10'
            }`}
            title="Participants"
          >
            <Users className="w-5 h-5" />
            <span className="text-[9px] font-bold font-mono mt-0.5">{totalParticipants}</span>
          </button>
        </nav>

        {/* Camera Filters Popover Panel */}
        {activePanel === 'filters' && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 animate-in fade-in zoom-in-95">
            <CameraFilters
              activeFilter={selectedFilter}
              currentFilter={selectedFilter}
              onSelectFilter={setSelectedFilter}
              onClose={() => setActivePanel(null)}
            />
          </div>
        )}
      </div>

      {/* Global Full-Screen Reaction Emojis Burst */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {floatingReactions.map((r) => (
          <div
            key={r.id}
            className="absolute bottom-16 animate-fullscreen-reaction flex flex-col items-center"
            style={{ left: `${r.xPercent || 50}%` }}
          >
            <span className="text-5xl sm:text-6xl drop-shadow-2xl">{r.reaction}</span>
            {r.userName && (
              <span className="px-2 py-0.5 bg-black/75 backdrop-blur-md rounded-full text-[10px] text-amber-200 font-bold mt-1 shadow-md">
                {r.userName}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Explicit Permission Modal for Local Device Meeting Recording */}
      {recording.showPermissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-slate-900/95 border border-white/20 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/40 shadow-lg shadow-amber-500/20">
              <HardDrive className="w-7 h-7 animate-pulse" />
            </div>
            <h3 className="text-xl font-extrabold text-white">Save Recording to Personal Device</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Chakri's Meet will record this session in studio-grade 1440p and save the file <strong>strictly onto your personal device storage</strong>. No audio or video data is ever stored on external cloud servers.
            </p>
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-200 flex items-center gap-2 text-left">
              <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>Requires explicit user consent &bull; Direct local download to your machine</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => recording.setShowPermissionModal(false)}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => recording.grantPermissionAndStart()}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/30 transition"
              >
                Authorize & Save to Device
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Saved Locally Status Toast */}
      {recording.savedLocallyStatus && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-emerald-950/95 backdrop-blur-md border border-emerald-500/40 text-emerald-200 text-xs font-bold rounded-full shadow-2xl animate-in fade-in zoom-in-95 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-emerald-400" />
          <span>{recording.savedLocallyStatus}</span>
        </div>
      )}

      {/* Floating Notification Toast */}
      {notification && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900/95 backdrop-blur-md border border-white/20 text-white text-xs font-semibold rounded-full shadow-2xl animate-in fade-in zoom-in-95 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
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

