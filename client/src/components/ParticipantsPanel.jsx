import React from 'react';
import { Users, X, Mic, MicOff, Video, VideoOff, Hand, Lock, Unlock, UserX, VolumeX, Shield } from 'lucide-react';

export default function ParticipantsPanel({
  localUser,
  remotePeers = [],
  isLocalMuted,
  isLocalVideoOff,
  isLocalHandRaised,
  isHost = false,
  isMeetingLocked = false,
  onMuteParticipant,
  onMuteAll,
  onKickParticipant,
  onToggleLockMeeting,
  onClose
}) {
  const totalCount = 1 + remotePeers.length;

  return (
    <div className="w-full sm:w-80 md:w-96 h-full flex flex-col bg-white border-l border-slate-200/80 shadow-2xl z-20 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">People</h3>
            <p className="text-[11px] text-slate-500">{totalCount} in meeting</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Host Controls Bar (if local user is host) */}
      {isHost && (
        <div className="p-3 bg-slate-50 border-b border-slate-200/70 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-brand-600" />
              <span>Host Controls</span>
            </span>

            <button
              type="button"
              onClick={onToggleLockMeeting}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                isMeetingLocked
                  ? 'bg-amber-50 text-amber-700 border-amber-300'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
              }`}
            >
              {isMeetingLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              <span>{isMeetingLocked ? 'Meeting Locked' : 'Lock Meeting'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onMuteAll}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <VolumeX className="w-3.5 h-3.5" />
            <span>Mute All Participants</span>
          </button>
        </div>
      )}

      {/* Participant List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {/* Local User Tile */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-brand-50/60 border border-brand-100/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-600 to-sky-400 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {localUser?.name ? localUser.name.charAt(0).toUpperCase() : 'Y'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900">
                  {localUser?.name || 'You'} (You)
                </span>
                {isHost && (
                  <span className="px-1.5 py-0.5 bg-brand-600 text-white rounded text-[9px] font-bold uppercase">
                    Host
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400">Meeting Participant</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isLocalHandRaised && <Hand className="w-4 h-4 text-amber-500 animate-bounce" />}
            <span className="p-1 rounded-lg text-slate-500">
              {isLocalMuted ? <MicOff className="w-4 h-4 text-rose-500" /> : <Mic className="w-4 h-4 text-slate-700" />}
            </span>
            <span className="p-1 rounded-lg text-slate-500">
              {isLocalVideoOff ? <VideoOff className="w-4 h-4 text-rose-500" /> : <Video className="w-4 h-4 text-slate-700" />}
            </span>
          </div>
        </div>

        {/* Remote Peers */}
        {remotePeers.map((peer) => {
          const peerName = peer.user?.name || 'Guest Participant';
          const isPeerHost = peer.user?.isHost;

          return (
            <div
              key={peer.socketId}
              className="flex items-center justify-between p-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-100 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shadow-sm">
                  {peerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">{peerName}</span>
                    {isPeerHost && (
                      <span className="px-1.5 py-0.5 bg-brand-600 text-white rounded text-[9px] font-bold uppercase">
                        Host
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">Connected</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="p-1 rounded-lg text-slate-500">
                  {peer.isMuted ? <MicOff className="w-4 h-4 text-rose-500" /> : <Mic className="w-4 h-4 text-slate-700" />}
                </span>
                <span className="p-1 rounded-lg text-slate-500">
                  {peer.isVideoOff ? <VideoOff className="w-4 h-4 text-rose-500" /> : <Video className="w-4 h-4 text-slate-700" />}
                </span>

                {/* Host actions on this participant */}
                {isHost && (
                  <div className="flex items-center gap-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => onMuteParticipant(peer.socketId)}
                      className="p-1 rounded hover:bg-slate-200 text-slate-600"
                      title="Mute participant"
                    >
                      <MicOff className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onKickParticipant(peer.socketId)}
                      className="p-1 rounded hover:bg-rose-100 text-rose-600"
                      title="Remove participant from call"
                    >
                      <UserX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
