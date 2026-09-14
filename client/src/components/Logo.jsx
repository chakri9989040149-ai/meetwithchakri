import React from 'react';

export default function Logo({ size = 'md', showTagline = false, className = '' }) {
  const sizeClasses = {
    sm: { icon: 'w-7 h-7', text: 'text-lg', sub: 'text-[10px]' },
    md: { icon: 'w-9 h-9', text: 'text-xl', sub: 'text-xs' },
    lg: { icon: 'w-12 h-12', text: 'text-2xl', sub: 'text-sm' },
    xl: { icon: 'w-16 h-16', text: 'text-3xl', sub: 'text-base' }
  }[size] || { icon: 'w-9 h-9', text: 'text-xl', sub: 'text-xs' };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Brand Icon SVG */}
      <div className={`relative ${sizeClasses.icon} flex-shrink-0 transition-transform duration-300 hover:scale-105`}>
        <svg viewBox="0 0 64 64" fill="none" className="w-full h-full drop-shadow-md">
          <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="60%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#38BDF8" />
            </linearGradient>
            <linearGradient id="accentGradInner" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#A855F7" />
            </linearGradient>
          </defs>
          <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#logoGrad)" />
          <path d="M20 23C20 20.7909 21.7909 19 24 19H36C38.2091 19 40 20.7909 40 23V41C40 43.2091 38.2091 45 36 45H24C21.7909 45 20 43.2091 20 41V23Z" fill="white" fillOpacity="0.95" />
          <path d="M40 28L47.5 22.875C48.5 22.1875 49.5 22.875 49.5 24V40C49.5 41.125 48.5 41.8125 47.5 41.125L40 36V28Z" fill="white" fillOpacity="0.95" />
          <circle cx="30" cy="32" r="4.5" fill="url(#accentGradInner)" />
          <circle cx="30" cy="32" r="2" fill="white" />
        </svg>
      </div>

      {/* Typography */}
      <div className="flex flex-col leading-tight">
        <span className={`font-display font-bold tracking-tight text-slate-900 ${sizeClasses.text}`}>
          Chakri's <span className="bg-gradient-to-r from-brand-600 to-sky-500 bg-clip-text text-transparent">Meet</span>
        </span>
        {showTagline && (
          <span className={`font-sans font-medium text-slate-500 tracking-wide ${sizeClasses.sub}`}>
            Discuss and Create the New Things
          </span>
        )}
      </div>
    </div>
  );
}
