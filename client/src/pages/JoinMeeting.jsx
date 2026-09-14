import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, ArrowRight, Sparkles, Shield } from 'lucide-react';
import Navbar from '../components/Navbar';
import Logo from '../components/Logo';

export default function JoinMeeting() {
  const [inputVal, setInputVal] = useState('');
  const [error, setError] = useState('');
  const [currentTheme, setCurrentTheme] = useState(
    localStorage.getItem('chakri_theme') || 'theme-midnight'
  );
  const navigate = useNavigate();

  const handleThemeChange = (newTheme) => {
    setCurrentTheme(newTheme);
    localStorage.setItem('chakri_theme', newTheme);
  };

  const handleJoin = (e) => {
    e.preventDefault();
    setError('');

    if (!inputVal.trim()) {
      setError('Please enter a valid meeting link or room code.');
      return;
    }

    // Extract room ID if user pasted full URL
    let code = inputVal.trim();
    if (code.includes('/room/')) {
      code = code.split('/room/')[1].split('?')[0].split('#')[0];
    }

    if (!code) {
      setError('Unable to parse room code from input.');
      return;
    }

    navigate(`/room/${code}`);
  };

  return (
    <div className={`min-h-screen ${currentTheme} bg-slate-950 text-white flex flex-col font-sans selection:bg-indigo-500 selection:text-white`}>
      <Navbar
        currentTheme={currentTheme}
        onSelectTheme={handleThemeChange}
      />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-gradient-to-tr from-indigo-600/20 to-purple-600/20 rounded-full blur-[120px] pointer-events-none -z-10" />

        <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-2xl p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 mx-auto flex items-center justify-center shadow-inner mb-3">
              <Video className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-extrabold text-white">
              Join a Meeting
            </h2>
            <p className="text-xs text-slate-400">
              Enter the room code or invite link shared with you by the host.
            </p>
          </div>

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label htmlFor="room-input" className="block text-xs font-semibold text-slate-300 mb-1">
                Meeting Code or Invite URL
              </label>
              <input
                id="room-input"
                type="text"
                placeholder="e.g. chakri-xyz-123 or paste link"
                value={inputVal}
                onChange={(e) => {
                  setInputVal(e.target.value);
                  setError('');
                }}
                className="w-full px-4 py-3 text-sm rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500 bg-slate-800/80 text-white placeholder-slate-500 shadow-sm font-mono transition"
                autoFocus
              />
              {error && <p className="mt-1.5 text-xs text-rose-400 font-medium">{error}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Continue to Pre-Join Preview</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-white/10 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Secure browser-to-browser WebRTC connection</span>
          </div>
        </div>
      </main>
    </div>
  );
}
