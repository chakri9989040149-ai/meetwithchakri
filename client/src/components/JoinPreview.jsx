import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, Settings, Shield, Sparkles, Copy, Check } from 'lucide-react';
import Logo from './Logo';
import { useAudioMeter } from '../hooks/useAudioMeter';
import { getEffectiveMeetingUrl } from './PublicLinkCard';

export default function JoinPreview({
  roomId,
  meetingTitle,
  initialName = '',
  onJoin,
  isHost = false
}) {
  const [name, setName] = useState(initialName || localStorage.getItem('chakri_user_name') || '');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [stream, setStream] = useState(null);
  const [permissionError, setPermissionError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [devices, setDevices] = useState({ audioInputs: [], videoInputs: [] });
  const [selectedAudioDevice, setSelectedAudioDevice] = useState('');
  const [selectedVideoDevice, setSelectedVideoDevice] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const videoRef = useRef(null);
  const { volume: audioVolume } = useAudioMeter(stream, audioEnabled);

  // Initialize camera and microphone preview
  useEffect(() => {
    let localStream = null;

    async function setupPreview() {
      try {
        const constraints = {
          video: {
            deviceId: selectedVideoDevice ? { exact: selectedVideoDevice } : undefined,
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: {
            deviceId: selectedAudioDevice ? { exact: selectedAudioDevice } : undefined,
            echoCancellation: true
          }
        };

        const media = await navigator.mediaDevices.getUserMedia(constraints);
        localStream = media;
        setStream(media);
        setPermissionError(null);

        if (videoRef.current) {
          videoRef.current.srcObject = media;
        }

        // Enumerate devices for dropdown
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = deviceList.filter((d) => d.kind === 'audioinput');
        const videoInputs = deviceList.filter((d) => d.kind === 'videoinput');
        setDevices({ audioInputs, videoInputs });
      } catch (err) {
        console.warn('Lobby media setup warning:', err);
        setPermissionError('Camera or microphone permission was denied. You can still join in listen/view-only mode.');
      }
    }

    setupPreview();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [selectedAudioDevice, selectedVideoDevice]);

  // Toggle video track
  const toggleVideo = () => {
    if (stream) {
      const vTrack = stream.getVideoTracks()[0];
      if (vTrack) {
        vTrack.enabled = !vTrack.enabled;
        setVideoEnabled(vTrack.enabled);
      }
    } else {
      setVideoEnabled(!videoEnabled);
    }
  };

  // Toggle audio track
  const toggleAudio = () => {
    if (stream) {
      const aTrack = stream.getAudioTracks()[0];
      if (aTrack) {
        aTrack.enabled = !aTrack.enabled;
        setAudioEnabled(aTrack.enabled);
      }
    } else {
      setAudioEnabled(!audioEnabled);
    }
  };

  const handleCopyLink = () => {
    const inviteUrl = getEffectiveMeetingUrl(roomId);
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    const finalName = name.trim() || (isHost ? 'Host' : 'Guest Participant');
    localStorage.setItem('chakri_user_name', finalName);

    // Stop the preview stream so useWebRTC can initialize the active session cleanly
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }

    onJoin({
      name: finalName,
      audioEnabled,
      videoEnabled
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#FAF8FF] via-white to-brand-50/50 text-slate-900">
      {/* Header */}
      <header className="p-4 sm:p-6 border-b border-slate-200/60 bg-white/70 backdrop-blur-md flex items-center justify-between">
        <Logo size="md" showTagline={true} />
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-all"
            title="Copy Meeting Invite Link"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Link Copied!' : 'Copy Invite Link'}</span>
          </button>
        </div>
      </header>

      {/* Main Pre-Join Section */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Live Camera Preview Tile */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-slate-900 shadow-2xl border-2 border-white/80 flex items-center justify-center">
              {/* Live Video Feed */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover video-mirrored transition-opacity duration-300 ${
                  videoEnabled && !permissionError ? 'opacity-100' : 'opacity-0'
                }`}
              />

              {/* Avatar placeholder when video is off or permission denied */}
              {(!videoEnabled || permissionError) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 text-white">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center shadow-xl mb-3 text-3xl font-display font-bold">
                    {name ? name.charAt(0).toUpperCase() : 'C'}
                  </div>
                  <span className="text-sm font-medium text-slate-300">Camera is turned off</span>
                </div>
              )}

              {/* Real-time Audio Level Bar Indicator */}
              {audioEnabled && !permissionError && (
                <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-white text-xs font-medium">
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 transition-all duration-75 ease-out rounded-full"
                      style={{ width: `${Math.min(100, audioVolume * 1.5)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Video and Audio Lobby Control Pills */}
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleAudio}
                  className={`p-3 rounded-full shadow-lg transition-all ${
                    audioEnabled
                      ? 'bg-white/90 hover:bg-white text-slate-800'
                      : 'bg-rose-500 hover:bg-rose-600 text-white'
                  }`}
                  title={audioEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
                >
                  {audioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={toggleVideo}
                  className={`p-3 rounded-full shadow-lg transition-all ${
                    videoEnabled
                      ? 'bg-white/90 hover:bg-white text-slate-800'
                      : 'bg-rose-500 hover:bg-rose-600 text-white'
                  }`}
                  title={videoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
                >
                  {videoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-3 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-lg transition-all"
                  title="Device Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Permission Warning if applicable */}
            {permissionError && (
              <div className="mt-3 w-full p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                ⚠️ {permissionError}
              </div>
            )}

            {/* Settings dropdown */}
            {showSettings && (
              <div className="mt-4 w-full p-4 bg-white rounded-2xl border border-slate-200 shadow-lg space-y-3">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Device Settings</h4>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Microphone</label>
                  <select
                    value={selectedAudioDevice}
                    onChange={(e) => setSelectedAudioDevice(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-slate-50"
                  >
                    {devices.audioInputs.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Microphone ${d.deviceId.slice(0, 5)}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Camera</label>
                  <select
                    value={selectedVideoDevice}
                    onChange={(e) => setSelectedVideoDevice(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-slate-50"
                  >
                    {devices.videoInputs.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Camera ${d.deviceId.slice(0, 5)}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Pre-Join Form & Details */}
          <div className="lg:col-span-5 bg-white/90 backdrop-blur-xl p-8 rounded-3xl border border-slate-200/80 shadow-xl">
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                <span>Ready to Join</span>
              </div>
              <h2 className="text-2xl font-display font-bold text-slate-900 tracking-tight">
                {meetingTitle || "Chakri's Meet Room"}
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-mono">Room Code: {roomId}</p>
            </div>

            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div>
                <label htmlFor="name-input" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Enter your name
                </label>
                <input
                  id="name-input"
                  type="text"
                  required
                  placeholder="e.g. Alex Mercer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white transition-all shadow-sm"
                  autoFocus
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 px-6 text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 rounded-xl shadow-lg shadow-brand-500/25 hover:shadow-brand-500/35 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <span>Join Meeting</span>
                </button>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
              <Shield className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>Peer-to-peer encrypted WebRTC media session</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
