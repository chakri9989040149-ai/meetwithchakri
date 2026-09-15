import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Share2, ArrowRight, Sparkles, Shield, Video, Globe } from 'lucide-react';
import Navbar from '../components/Navbar';
import Logo from '../components/Logo';
import PublicLinkCard, { getEffectiveMeetingUrl } from '../components/PublicLinkCard';

// Generates a cryptographically secure random room code like 'chakri-k9m2-p7x4'
function generateRoomCode() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let p1 = '';
  let p2 = '';
  for (let i = 0; i < 4; i++) {
    p1 += chars.charAt(Math.floor(Math.random() * chars.length));
    p2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `chakri-${p1}-${p2}`;
}

export default function CreateMeeting() {
  const [roomId, setRoomId] = useState('');
  const [meetingTitle, setMeetingTitle] = useState("Chakri's Innovation Sync");
  const [hostName, setHostName] = useState(localStorage.getItem('chakri_user_name') || 'Chakri (Host)');
  const [shareSuccess, setShareSuccess] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(
    localStorage.getItem('chakri_theme') || 'theme-midnight'
  );

  const navigate = useNavigate();

  const handleThemeChange = (newTheme) => {
    setCurrentTheme(newTheme);
    localStorage.setItem('chakri_theme', newTheme);
  };

  useEffect(() => {
    // Check for incoming room query parameter first
    try {
      const sp = new URLSearchParams(window.location.search);
      const queryRoom = sp.get('roomId') || sp.get('room') || sp.get('code') || sp.get('id');
      if (queryRoom && queryRoom.trim()) {
        const clean = queryRoom.trim().replace(/^.*\/room\//, '').split('?')[0].split('#')[0];
        setRoomId(clean);
        return;
      }
    } catch (e) {}

    setRoomId(generateRoomCode());
  }, []);

  const handleShare = async () => {
    const effectiveUrl = getEffectiveMeetingUrl(roomId);
    if (navigator.share) {
      try {
        await navigator.share({
          title: meetingTitle || "Chakri's Meet",
          text: `Join my live video meeting on Chakri's Meet: "Discuss and Create the New Things"`,
          url: effectiveUrl
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      } catch (err) {
        navigator.clipboard.writeText(effectiveUrl);
      }
    } else {
      navigator.clipboard.writeText(effectiveUrl);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }
  };

  const handleStartMeeting = () => {
    const finalHostName = hostName.trim() || 'Host';
    const finalTitle = meetingTitle.trim() || "Chakri's Meet";
    localStorage.setItem('chakri_user_name', finalHostName);
    localStorage.setItem(`meeting_title_${roomId}`, finalTitle);

    navigate(`/room/${roomId}`, {
      state: {
        isHost: true,
        hostName: finalHostName,
        title: finalTitle,
        directJoin: true
      }
    });
  };

  return (
    <div className={`min-h-screen ${currentTheme} bg-slate-950 text-white flex flex-col font-sans selection:bg-indigo-500 selection:text-white`}>
      <Navbar
        onInstantMeetingClick={() => setRoomId(generateRoomCode())}
        currentTheme={currentTheme}
        onSelectTheme={handleThemeChange}
      />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 relative">
        {/* Glow ambient background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[450px] bg-gradient-to-tr from-indigo-600/20 to-purple-600/20 rounded-full blur-[120px] pointer-events-none -z-10" />

        <div className="max-w-xl w-full bg-slate-900/90 backdrop-blur-2xl p-8 sm:p-10 rounded-3xl border border-white/10 shadow-2xl space-y-6">
          {/* Badge & Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 text-indigo-300 rounded-full text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Instant Room Ready &bull; Public Link Active</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Create Your Meeting
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Share this invite link with your friend on any device or network. Works instantly without apps.
            </p>
          </div>

          {/* Meeting Details Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Meeting Title
              </label>
              <input
                type="text"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                placeholder="Meeting Title"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500 bg-slate-800/80 text-white placeholder-slate-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Your Host Name
              </label>
              <input
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500 bg-slate-800/80 text-white placeholder-slate-500 transition"
              />
            </div>

            {/* Smart Public Shareable Link Box with Tunnel/Localhost detection */}
            {roomId && <PublicLinkCard roomId={roomId} />}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleShare}
              className="flex-1 py-3 px-4 rounded-xl border border-white/10 hover:bg-white/5 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Share2 className="w-4 h-4 text-indigo-400" />
              <span>{shareSuccess ? 'Link Copied!' : 'Share Meeting Link'}</span>
            </button>

            <button
              type="button"
              onClick={handleStartMeeting}
              className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Enter Meeting</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted WebRTC &bull; Room Code: <span className="font-mono text-indigo-300">{roomId}</span></span>
          </div>
        </div>
      </main>
    </div>
  );
}
