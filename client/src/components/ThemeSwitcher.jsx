import React, { useState } from 'react';
import { Palette, Check, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const THEMES = [
  {
    id: 'theme-midnight',
    name: 'Midnight Purple',
    description: 'Obsidian Black & Electric Purple',
    colors: ['#070913', '#7C3AED', '#3B82F6']
  },
  {
    id: 'theme-cyberpunk',
    name: 'Cyberpunk Navy',
    description: 'Deep Navy & Neon Cyan',
    colors: ['#040817', '#06B6D4', '#38BDF8']
  },
  {
    id: 'theme-violet',
    name: 'Violet Glass',
    description: 'Deep Violet & Radiant Lavender',
    colors: ['#0E0720', '#A855F7', '#EC4899']
  },
  {
    id: 'theme-light',
    name: 'Light Elegance',
    description: 'Pure White & Soft Indigo',
    colors: ['#FFFFFF', '#7C3AED', '#0EA5E9']
  },
  {
    id: 'theme-aurora',
    name: 'Aurora Borealis',
    description: 'Deep Emerald & Cosmic Glow',
    colors: ['#04131A', '#10B981', '#6366F1']
  }
];

export default function ThemeSwitcher({ currentTheme: propCurrentTheme, onThemeChange, onSelectTheme, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const themeContext = useTheme();

  // Determine active theme (prop takes precedence if supplied, fallback to Context, fallback to 'theme-midnight')
  const activeTheme = propCurrentTheme || themeContext?.theme || 'theme-midnight';

  const handleSelect = (themeId) => {
    if (typeof onSelectTheme === 'function') {
      onSelectTheme(themeId);
    }
    if (typeof onThemeChange === 'function') {
      onThemeChange(themeId);
    }
    if (themeContext?.setTheme) {
      themeContext.setTheme(themeId);
    }
    setIsOpen(false);
  };

  const currentThemeObj = THEMES.find((t) => t.id === activeTheme) || THEMES[0];

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 text-slate-200 transition-all shadow-sm hover:scale-105 active:scale-95"
        title={`Theme: ${currentThemeObj.name} — Click to switch`}
      >
        <Palette className="w-3.5 h-3.5 text-brand-400" />
        <span className="hidden sm:inline">{currentThemeObj.name}</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop click outside */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="absolute right-0 mt-2 w-64 p-2 bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-brand-400" />
              <span>Select Theme (5 Themes)</span>
            </div>

            {THEMES.map((theme) => {
              const isActive = activeTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => handleSelect(theme.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                    isActive
                      ? 'bg-brand-600/30 text-white border border-brand-500/50 font-semibold shadow-sm'
                      : 'hover:bg-slate-800/80 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Color dots preview */}
                    <div className="flex -space-x-1">
                      {theme.colors.map((c, i) => (
                        <span
                          key={i}
                          className="w-3.5 h-3.5 rounded-full border border-slate-800 shadow-sm"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <div className="text-left">
                      <div className="font-medium leading-tight">{theme.name}</div>
                      <div className="text-[10px] text-slate-400">{theme.description}</div>
                    </div>
                  </div>

                  {isActive && <Check className="w-4 h-4 text-brand-400 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
