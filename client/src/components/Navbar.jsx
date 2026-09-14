import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import ThemeSwitcher from './ThemeSwitcher';
import { Video, Plus, Menu, X, Sparkles } from 'lucide-react';

export default function Navbar({ onInstantMeetingClick, currentTheme, onSelectTheme }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/80 border-b border-white/10 shadow-sm transition-all text-white">
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
              onClick={() => navigate('/join')}
              className="px-4 py-2 text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-white/10"
            >
              Join Meeting
            </button>
            <button
              onClick={onInstantMeetingClick || (() => navigate('/create'))}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Start a Meeting</span>
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
            <button
              onClick={() => { setMobileMenuOpen(false); navigate('/join'); }}
              className="w-full text-center py-2.5 text-sm font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl"
            >
              Join a Meeting
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); if (onInstantMeetingClick) onInstantMeetingClick(); else navigate('/create'); }}
              className="w-full text-center py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-md"
            >
              Start a Meeting
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
