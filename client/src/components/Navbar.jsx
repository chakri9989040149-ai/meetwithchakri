import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import ThemeSwitcher from './ThemeSwitcher';
import AuthModal from './AuthModal';
import { Video, Plus, Menu, X, Sparkles, User, LogOut, ShieldCheck, Mail } from 'lucide-react';

export default function Navbar({ onInstantMeetingClick, currentTheme, onSelectTheme }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('chakri_auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  const navigate = useNavigate();

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const stored = localStorage.getItem('chakri_auth_user');
        setCurrentUser(stored ? JSON.parse(stored) : null);
      } catch (e) {}
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('chakri_auth_user');
    setCurrentUser(null);
    setUserDropdownOpen(false);
  };

  const handleAuthSuccess = (userData) => {
    setCurrentUser(userData);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/85 border-b border-white/10 shadow-sm transition-all text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Brand Logo */}
            <Link to="/" className="flex items-center group">
              <Logo size="md" showTagline={false} />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-slate-300 hover:text-indigo-400 transition-colors">
                Why Chakri's Meet?
              </a>
              <a href="#collaboration" className="text-sm font-medium text-slate-300 hover:text-indigo-400 transition-colors">
                Collaboration Tools
              </a>
              <a href="#ai-suite" className="text-sm font-medium text-slate-300 hover:text-indigo-400 transition-colors">
                Chakri AI Suite
              </a>
              <a href="#security" className="text-sm font-medium text-slate-300 hover:text-indigo-400 transition-colors">
                Security
              </a>
            </nav>

            {/* Action CTAs */}
            <div className="hidden sm:flex items-center gap-3">
              {/* Theme Switcher */}
              {onSelectTheme && (
                <ThemeSwitcher currentTheme={currentTheme} onSelectTheme={onSelectTheme} />
              )}

              <button
                type="button"
                onClick={() => navigate('/join')}
                className="px-4 py-2 text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-white/10"
              >
                Join Meeting
              </button>

              {/* Authentication: Logged in vs Log In button */}
              {currentUser ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-500/15 border border-indigo-500/40 text-indigo-200 hover:bg-indigo-500/25 transition-all text-xs font-semibold shadow-md shadow-indigo-500/10"
                    title={currentUser.email}
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[11px] font-bold shadow">
                      {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="max-w-[110px] truncate">{currentUser.name || currentUser.email}</span>
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-slate-900/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl p-3 z-50 space-y-2 animate-in fade-in zoom-in-95">
                      <div className="px-3 py-2 border-b border-white/10">
                        <div className="text-xs font-bold text-white truncate">{currentUser.name || 'Logged In User'}</div>
                        <div className="text-[11px] text-indigo-400 font-mono truncate flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                          <span>{currentUser.email}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/15 rounded-xl transition"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-indigo-500/40 bg-indigo-500/10 text-indigo-200 hover:bg-indigo-500/20 hover:border-indigo-400 hover:text-white transition-all"
                >
                  Log In
                </button>
              )}

              {/* Action: Instant Meeting Button with Original Gradient Theme */}
              <button
                type="button"
                onClick={onInstantMeetingClick || (() => navigate('/create'))}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 rounded-xl shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>Instant Meeting</span>
              </button>
            </div>

            {/* Mobile hamburger button */}
            <div className="flex sm:hidden items-center gap-2">
              {onSelectTheme && (
                <ThemeSwitcher currentTheme={currentTheme} onSelectTheme={onSelectTheme} />
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-b border-white/10 bg-slate-900/95 backdrop-blur-2xl px-4 pt-3 pb-5 space-y-3">
            <div className="flex flex-col space-y-2">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-base font-medium text-slate-200 hover:bg-white/10 rounded-lg"
              >
                Why Chakri's Meet?
              </a>
              <a
                href="#collaboration"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-base font-medium text-slate-200 hover:bg-white/10 rounded-lg"
              >
                Collaboration Tools
              </a>
              <a
                href="#ai-suite"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-base font-medium text-slate-200 hover:bg-white/10 rounded-lg"
              >
                Chakri AI Suite
              </a>
            </div>
            <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
              {currentUser ? (
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between text-xs text-indigo-200">
                  <span className="truncate">{currentUser.email}</span>
                  <button onClick={handleLogout} className="text-rose-400 font-bold hover:underline">
                    Log out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setMobileMenuOpen(false); setAuthModalOpen(true); }}
                  className="w-full text-center py-2.5 text-sm font-semibold rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-200"
                >
                  Log In
                </button>
              )}
              <button
                onClick={() => { setMobileMenuOpen(false); navigate('/join'); }}
                className="w-full text-center py-2.5 text-sm font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl"
              >
                Join a Meeting
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); if (onInstantMeetingClick) onInstantMeetingClick(); else navigate('/create'); }}
                className="w-full text-center py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 rounded-xl shadow-md"
              >
                Instant Meeting
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </>
  );
}

