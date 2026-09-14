import React from 'react';
import { Sparkles, Check, X } from 'lucide-react';

export const CAMERA_FILTERS = [
  { id: 'filter-normal', name: 'Normal', preview: 'Natural Video' },
  { id: 'filter-bw', name: 'B & W', preview: 'Classic Monochrome' },
  { id: 'filter-vintage', name: 'Vintage', preview: 'Warm Retro Sepia' },
  { id: 'filter-warm', name: 'Warm Sun', preview: 'Golden Hour Glow' },
  { id: 'filter-cool', name: 'Cool Ice', preview: 'Crisp Oceanic Hue' },
  { id: 'filter-cinematic', name: 'Cinematic', preview: 'Movie High Contrast' },
  { id: 'filter-bright', name: 'Bright Studio', preview: 'Radiant Lighting' },
  { id: 'filter-glow', name: 'Soft Glow', preview: 'Dreamy Beauty Blur' },
  { id: 'filter-neon', name: 'Neon Pop', preview: 'Vibrant Magenta Glow' },
  { id: 'filter-cyber', name: 'Cyberpunk', preview: 'Futuristic Sci-Fi' },
];

export default function CameraFilters({ currentFilter, onSelectFilter, onClose }) {
  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-3xl p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-brand-500/20 text-brand-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Camera Video Filters</h4>
            <p className="text-[10px] text-slate-400">10 Live Zero-Lag Video Enhancements</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Grid of 10 Filters */}
      <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
        {CAMERA_FILTERS.map((f) => {
          const isSelected = currentFilter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => onSelectFilter(f.id)}
              className={`flex items-center justify-between p-2.5 rounded-2xl border text-left transition-all ${
                isSelected
                  ? 'border-brand-500 bg-brand-600/25 text-white ring-1 ring-brand-400'
                  : 'border-slate-800 bg-slate-800/60 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <div>
                <div className="text-xs font-semibold">{f.name}</div>
                <div className="text-[10px] text-slate-400">{f.preview}</div>
              </div>
              {isSelected && <Check className="w-4 h-4 text-brand-400 flex-shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
