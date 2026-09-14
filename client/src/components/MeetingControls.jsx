import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Share2,
  Hand,
  Smile,
  MessageSquare,
  Users,
  PhoneOff,
  Palette,
  CheckSquare,
  BarChart2,
  FileText,
  Sparkles,
  BookOpen,
  Bot,
  SlidersHorizontal,
  CircleDot,
  Square,
  ChevronUp
} from 'lucide-react';

const REACTION_LIST = ['👍', '👏', '😂', '❤️', '🔥', '🎉', '😮', '😢', '🤔', '🚀'];

export default function MeetingControls({
  isAudioMuted,
  isVideoOff,
  isScreenSharing,
  isHandRaised,
  unreadCount = 0,
  participantCount = 1,
  activePanel, // 'chat', 'participants', 'whiteboard', 'polls', 'notes', 'agenda', 'chakri-ai', 'chakri-notes', 'agent-hub', 'filters', null
  isHost = false,
  recording = {}, // { isRecording, formattedTime, startRecording, stopRecording, isSupported }
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleHandRaise,
  onSendReaction,
  onTogglePanel,
  onLeaveMeeting
}) {
  const [showReactionsMenu, setShowReactionsMenu] = useState(false);
  const [showCreateTogetherMenu, setShowCreateTogetherMenu] = useState(false);
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const { isRecording = false, formattedTime = '00:00', startRecording, stopRecording } = recording;

  const handleReactionClick = (emoji) => {
    onSendReaction(emoji);
    setShowReactionsMenu(false);
  };

  const handleToggleRecord = () => {
    if (isRecording) {
      if (stopRecording) stopRecording();
    } else {
      if (startRecording) startRecording();
    }
  };

  return (
    <>
      <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 bg-slate-900/90 backdrop-blur-xl border-t border-white/10 shadow-2xl z-30 transition-all text-white">
        {/* Left Side: Creative & AI Suites */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* AI Suite Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowAIMenu(!showAIMenu);
                setShowCreateTogetherMenu(false);
                setShowReactionsMenu(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                activePanel === 'chakri-ai' || activePanel === 'chakri-notes' || activePanel === 'agent-hub'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-500 shadow-md shadow-purple-500/25'
                  : 'bg-white/5 text-purple-300 hover:bg-white/10 border-white/10 hover:border-purple-500/40'
              }`}
              title="Chakri AI Suite: Copilot, Notes, Agents"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="hidden sm:inline">Chakri AI</span>
              <ChevronUp className={`w-3 h-3 transition-transform ${showAIMenu ? 'rotate-180' : ''}`} />
            </button>

            {showAIMenu && (
              <div className="absolute bottom-13 left-0 w-60 bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-2 z-50 space-y-1 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Chakri AI Intelligence
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onTogglePanel('chakri-ai');
                    setShowAIMenu(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                    activePanel === 'chakri-ai'
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <div className="text-left">
                    <div>Chakri AI Copilot</div>
                    <div className="text-[10px] text-slate-400 font-normal">Live summaries & agenda</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onTogglePanel('chakri-notes');
                    setShowAIMenu(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                    activePanel === 'chakri-notes'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <div className="text-left">
                    <div>Chakri Notes</div>
                    <div className="text-[10px] text-slate-400 font-normal">NotebookLM-style Q&A</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onTogglePanel('agent-hub');
                    setShowAIMenu(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                    activePanel === 'agent-hub'
                      ? 'bg-violet-600 text-white'
                      : 'text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <Bot className="w-4 h-4 text-pink-400" />
                  <div className="text-left">
                    <div>AI Agent Hub</div>
                    <div className="text-[10px] text-slate-400 font-normal">8 specialized assistants</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Create Together Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowCreateTogetherMenu(!showCreateTogetherMenu);
                setShowAIMenu(false);
                setShowReactionsMenu(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                activePanel === 'whiteboard' || activePanel === 'polls' || activePanel === 'notes' || activePanel === 'agenda'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/25'
                  : 'bg-white/5 text-indigo-300 hover:bg-white/10 border-white/10 hover:border-indigo-500/40'
              }`}
              title="Create Together: Smart Board, Polls, Notes"
            >
              <Palette className="w-4 h-4 text-indigo-400" />
              <span className="hidden md:inline">Create</span>
              <ChevronUp className={`w-3 h-3 transition-transform ${showCreateTogetherMenu ? 'rotate-180' : ''}`} />
            </button>

            {showCreateTogetherMenu && (
              <div className="absolute bottom-13 left-0 w-56 bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-2 z-50 space-y-1 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Create Together
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onTogglePanel('whiteboard');
                    setShowCreateTogetherMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 rounded-xl transition-all"
                >
                  <Palette className="w-4 h-4 text-pink-400" />
                  <span>Smart Ideas Board</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onTogglePanel('polls');
                    setShowCreateTogetherMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 rounded-xl transition-all"
                >
                  <BarChart2 className="w-4 h-4 text-sky-400" />
                  <span>Live Polls</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onTogglePanel('notes');
                    setShowCreateTogetherMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 rounded-xl transition-all"
                >
                  <FileText className="w-4 h-4 text-violet-400" />
                  <span>Collaborative Notes</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onTogglePanel('agenda');
                    setShowCreateTogetherMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 rounded-xl transition-all"
                >
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                  <span>Meeting Agenda</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center: Core Audio, Video, Filters, Screen Share & Reactions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Microphone */}
          <button
            type="button"
            onClick={onToggleAudio}
            className={`p-2.5 sm:p-3 rounded-2xl shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 ${
              isAudioMuted
                ? 'bg-rose-500/90 hover:bg-rose-600 text-white ring-2 ring-rose-400/40 shadow-rose-500/20'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
            title={isAudioMuted ? 'Unmute Mic (M)' : 'Mute Mic (M)'}
          >
            {isAudioMuted ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Camera */}
          <button
            type="button"
            onClick={onToggleVideo}
            className={`p-2.5 sm:p-3 rounded-2xl shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 ${
              isVideoOff
                ? 'bg-rose-500/90 hover:bg-rose-600 text-white ring-2 ring-rose-400/40 shadow-rose-500/20'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
            title={isVideoOff ? 'Turn On Camera (V)' : 'Turn Off Camera (V)'}
          >
            {isVideoOff ? <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Video className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Camera Filters Popover Button */}
          <button
            type="button"
            onClick={() => onTogglePanel('filters')}
            className={`p-2.5 sm:p-3 rounded-2xl shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 ${
              activePanel === 'filters'
                ? 'bg-indigo-600 text-white ring-2 ring-indigo-400/50'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
            title="Camera Filters (10 Styles)"
          >
            <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Screen Share */}
          <button
            type="button"
            onClick={onToggleScreenShare}
            className={`hidden sm:flex p-2.5 sm:p-3 rounded-2xl shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 ${
              isScreenSharing
                ? 'bg-indigo-600 text-white ring-2 ring-indigo-400/50'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
            title={isScreenSharing ? 'Stop Presenting' : 'Share Screen'}
          >
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Record Button with Timer */}
          <button
            type="button"
            onClick={handleToggleRecord}
            className={`flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl text-xs font-semibold shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 border ${
              isRecording
                ? 'bg-rose-600 text-white border-rose-500 animate-pulse shadow-rose-500/40 shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-slate-200 border-white/10'
            }`}
            title={isRecording ? 'Stop Recording & Save Video' : 'Start Meeting Recording'}
          >
            {isRecording ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current text-white" />
                <span className="font-mono text-xs font-bold text-white">{formattedTime}</span>
              </>
            ) : (
              <>
                <CircleDot className="w-4 h-4 text-rose-400" />
                <span className="hidden md:inline">Record</span>
              </>
            )}
          </button>

          {/* Raise Hand */}
          <button
            type="button"
            onClick={onToggleHandRaise}
            className={`p-2.5 sm:p-3 rounded-2xl shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 ${
              isHandRaised
                ? 'bg-amber-500 text-white ring-2 ring-amber-300'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
            title={isHandRaised ? 'Lower Hand' : 'Raise Hand'}
          >
            <Hand className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Reactions Popover Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowReactionsMenu(!showReactionsMenu);
                setShowCreateTogetherMenu(false);
                setShowAIMenu(false);
              }}
              className="p-2.5 sm:p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/10 shadow-sm transition-all duration-200 hover:scale-105 active:scale-95"
              title="Send Reaction"
            >
              <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Reaction Emojis Popover (10 Emojis) */}
            {showReactionsMenu && (
              <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-1 p-2 bg-slate-900/95 backdrop-blur-xl rounded-full shadow-2xl border border-white/20 z-50 animate-in fade-in zoom-in-95">
                {REACTION_LIST.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleReactionClick(emoji)}
                    className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-lg sm:text-xl hover:scale-125 hover:bg-white/10 rounded-full transition-transform active:scale-95"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Leave Meeting */}
          <button
            type="button"
            onClick={() => setShowLeaveModal(true)}
            className="p-2.5 sm:px-4 sm:py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-md shadow-rose-600/25 transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2"
            title="Leave Meeting"
          >
            <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden md:inline text-xs">Leave</span>
          </button>
        </div>

        {/* Right Side: Chat & Participants Sidebars */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Participants */}
          <button
            type="button"
            onClick={() => onTogglePanel('participants')}
            className={`relative p-2.5 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              activePanel === 'participants'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20'
                : 'bg-white/10 hover:bg-white/20 text-slate-200 border-white/10'
            }`}
            title="Participants"
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline font-mono">{participantCount}</span>
          </button>

          {/* Live Chat */}
          <button
            type="button"
            onClick={() => onTogglePanel('chat')}
            className={`relative p-2.5 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              activePanel === 'chat'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20'
                : 'bg-white/10 hover:bg-white/20 text-slate-200 border-white/10'
            }`}
            title="Live Chat"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Chat</span>
            {unreadCount > 0 && activePanel !== 'chat' && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-md animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Leave Meeting Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-white/10 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/30">
              <PhoneOff className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Leave Chakri's Meet?</h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to disconnect? You can rejoin at any time with the same room link.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowLeaveModal(false);
                  onLeaveMeeting(false);
                }}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow transition-colors"
              >
                Leave Meeting
              </button>

              {isHost && (
                <button
                  type="button"
                  onClick={() => {
                    setShowLeaveModal(false);
                    onLeaveMeeting(true);
                  }}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-white/10 transition-colors"
                >
                  End Meeting for Everyone
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowLeaveModal(false)}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-xl border border-white/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
