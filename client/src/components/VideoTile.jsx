import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Hand, Maximize2, Minimize2, Pin, PictureInPicture } from 'lucide-react';
import { useAudioMeter } from '../hooks/useAudioMeter';

export default function VideoTile({
  stream,
  user,
  isLocal = false,
  isMuted = false,
  isVideoOff = false,
  isHandRaised = false,
  isScreenShare = false,
  reactions = [],
  onPin,
  isPinned = false,
  filterClass = ''
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Monitor speaking status with high-performance throttled AudioMeter
  const { isSpeaking } = useAudioMeter(stream, !isMuted);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => console.warn(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(err => console.warn(err));
      setIsFullscreen(false);
    }
  };

  const togglePiP = async () => {
    if (videoRef.current && document.pictureInPictureEnabled) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await videoRef.current.requestPictureInPicture();
        }
      } catch (err) {
        console.warn('PiP error:', err);
      }
    }
  };

  const displayName = user?.name || (isLocal ? 'You' : 'Participant');
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[220px] rounded-2xl overflow-hidden bg-slate-900 border-2 transition-all duration-200 group flex items-center justify-center ${
        isSpeaking ? 'border-brand-500 shadow-lg shadow-brand-500/30 ring-2 ring-brand-400/50' : 'border-slate-800/80 shadow-md'
      } ${isPinned ? 'ring-2 ring-brand-400' : ''}`}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal} // Never play local audio back to prevent acoustic feedback
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLocal && !isScreenShare ? 'video-mirrored' : ''
        } ${isLocal && filterClass ? filterClass : ''} ${isVideoOff ? 'opacity-0' : 'opacity-100'}`}
      />

      {/* Video Off Avatar Placeholder */}
      {isVideoOff && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 select-none">
          <div
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white text-2xl sm:text-3xl font-display font-bold shadow-xl transition-transform ${
              isSpeaking ? 'scale-110 shadow-brand-500/50' : ''
            }`}
          >
            {initials}
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-200">{displayName}</p>
        </div>
      )}

      {/* Floating Reaction Emojis overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-end justify-center pb-12">
        {reactions.map((r, i) => (
          <span
            key={`${r.id || i}-${r.reaction}`}
            className="absolute text-4xl sm:text-5xl animate-floating-reaction"
            style={{ left: `${40 + (i % 3) * 15}%` }}
          >
            {r.reaction}
          </span>
        ))}
      </div>

      {/* Top Left: Hand Raised Badge */}
      {isHandRaised && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-white rounded-full text-xs font-bold shadow-lg animate-bounce">
          <Hand className="w-3.5 h-3.5" />
          <span>Hand Raised</span>
        </div>
      )}

      {/* Top Right: Quick Action Overlay (Hover Only) */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-black/60 backdrop-blur-md p-1 rounded-xl">
        {onPin && (
          <button
            onClick={onPin}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
            title={isPinned ? 'Unpin' : 'Pin to main view'}
          >
            <Pin className={`w-3.5 h-3.5 ${isPinned ? 'text-brand-400 fill-brand-400' : ''}`} />
          </button>
        )}
        <button
          onClick={togglePiP}
          className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          title="Picture-in-Picture"
        >
          <PictureInPicture className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          title="Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Bottom Bar: Name & Mic status */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-black/65 backdrop-blur-md rounded-xl text-white text-xs font-medium max-w-[80%] truncate shadow-md">
          <span className="truncate">
            {displayName} {isLocal && '(You)'} {user?.isHost && '👑'}
          </span>
          {isScreenShare && (
            <span className="px-1.5 py-0.5 bg-brand-600 rounded text-[10px] font-bold uppercase">
              Screen
            </span>
          )}
        </div>

        <div
          className={`p-1.5 rounded-xl backdrop-blur-md shadow-md ${
            isMuted ? 'bg-rose-500/90 text-white' : 'bg-black/65 text-emerald-400'
          }`}
        >
          {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
        </div>
      </div>
    </div>
  );
}
