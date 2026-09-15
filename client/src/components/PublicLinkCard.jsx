import React, { useState, useEffect } from 'react';
import { Copy, Check, Globe, AlertTriangle, ExternalLink, HelpCircle, ChevronDown, ChevronUp, Terminal } from 'lucide-react';

export function getEffectiveMeetingUrl(roomId) {
  if (typeof window === 'undefined') return `/room/${roomId}`;

  // 1. Environment variable if set
  if (import.meta.env.VITE_PUBLIC_URL) {
    const base = import.meta.env.VITE_PUBLIC_URL.replace(/\/+$/, '');
    return `${base}/room/${roomId}`;
  }

  // 2. Custom public URL saved in localStorage
  const savedPublicUrl = localStorage.getItem('chakri_custom_public_url');
  if (savedPublicUrl && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    const base = savedPublicUrl.replace(/\/+$/, '');
    return `${base}/room/${roomId}`;
  }

  // 3. Current window origin with base path (e.g. /meetwithchakri)
  const basePath = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
  let fullUrl = `${window.location.origin}${basePath}/room/${roomId}`;

  // If a custom or tunnel backend is configured, preserve it in the link so friends connect to the exact same signaling server
  const activeBackend = localStorage.getItem('chakri_backend_url');
  if (activeBackend && !activeBackend.includes('localhost') && !activeBackend.includes('127.0.0.1')) {
    fullUrl += `?backend=${encodeURIComponent(activeBackend)}`;
  }
  return fullUrl;
}

export default function PublicLinkCard({ roomId, className = '' }) {
  const [copied, setCopied] = useState(false);
  const [showTunnelHelp, setShowTunnelHelp] = useState(false);
  const [customPublicBase, setCustomPublicBase] = useState(
    localStorage.getItem('chakri_custom_public_url') || ''
  );
  const [copiedTunnelCmd, setCopiedTunnelCmd] = useState(false);

  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const effectiveUrl = getEffectiveMeetingUrl(roomId);

  const handleCopy = () => {
    navigator.clipboard.writeText(effectiveUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleCustomBaseChange = (val) => {
    setCustomPublicBase(val);
    if (val.trim()) {
      localStorage.setItem('chakri_custom_public_url', val.trim());
    } else {
      localStorage.removeItem('chakri_custom_public_url');
    }
  };

  const copyTunnelCmd = () => {
    navigator.clipboard.writeText('npx cloudflared tunnel --url http://localhost:5173');
    setCopiedTunnelCmd(true);
    setTimeout(() => setCopiedTunnelCmd(false), 2000);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-brand-600" />
          <span>Shareable Meeting Link</span>
        </label>
        {isLocalhost && !customPublicBase && !import.meta.env.VITE_PUBLIC_URL && (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Localhost Only</span>
          </span>
        )}
      </div>

      {/* Main Copyable Link Box */}
      <div className="flex items-center gap-2 p-2 bg-slate-900/90 rounded-2xl border border-white/15 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all">
        <input
          type="text"
          readOnly
          value={effectiveUrl}
          className="flex-1 bg-transparent px-2 text-xs font-mono text-white focus:outline-none select-all truncate"
        />
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all hover:scale-105 active:scale-95 flex-shrink-0"
          title="Copy Meeting Link"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied Link!' : 'Copy Link'}</span>
        </button>
      </div>

      {/* GitHub Pages Public Deployment Link Card */}
      <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-xs space-y-1.5 text-indigo-200">
        <div className="flex items-center justify-between">
          <span className="font-bold flex items-center gap-1 text-white">
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span>Public GitHub Pages URL:</span>
          </span>
          <button
            type="button"
            onClick={() => {
              const ghUrl = `https://chakri9989040149-ai.github.io/meetwithchakri/room/${roomId}`;
              navigator.clipboard.writeText(ghUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="text-[11px] font-bold text-indigo-300 hover:text-white underline"
          >
            Copy Public GitHub Link
          </button>
        </div>
        <div className="font-mono text-[11px] text-slate-300 truncate select-all">
          https://chakri9989040149-ai.github.io/meetwithchakri/room/{roomId}
        </div>
      </div>

      {/* Localhost Public Warning & Helpers (only shown when running on localhost) */}
      {isLocalhost && (
        <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-xs space-y-2.5">
          <div className="flex items-start gap-2 text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-xs">
                Notice: Links with <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">localhost</code> only work on this machine.
              </p>
              <p className="text-[11px] text-amber-800">
                To let friends join from another laptop or phone, use a free public HTTPS tunnel or enter your deployed domain below:
              </p>
            </div>
          </div>

          {/* Custom Public URL / Tunnel Input */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="url"
              placeholder="e.g. https://your-domain.com or tunnel URL"
              value={customPublicBase}
              onChange={(e) => handleCustomBaseChange(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs bg-white border border-amber-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono text-slate-800"
            />
            {customPublicBase && (
              <button
                type="button"
                onClick={() => handleCustomBaseChange('')}
                className="text-[10px] text-amber-700 hover:text-amber-900 underline"
              >
                Reset
              </button>
            )}
          </div>

          {/* Toggle instructions for Instant Public Tunnel */}
          <div>
            <button
              type="button"
              onClick={() => setShowTunnelHelp(!showTunnelHelp)}
              className="text-[11px] font-semibold text-brand-700 hover:text-brand-900 flex items-center gap-1"
            >
              <span>How to get an instant free public link in 10 seconds</span>
              {showTunnelHelp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showTunnelHelp && (
              <div className="mt-2 p-3 bg-white rounded-xl border border-amber-200/60 space-y-2 text-[11px] text-slate-700">
                <p>Run this command in any terminal to create an instant public HTTPS link (100% free, no signup):</p>
                <div className="flex items-center justify-between p-2 bg-slate-900 text-emerald-400 font-mono rounded-lg">
                  <span className="truncate mr-2">npx cloudflared tunnel --url http://localhost:5173</span>
                  <button
                    type="button"
                    onClick={copyTunnelCmd}
                    className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
                    title="Copy command"
                  >
                    {copiedTunnelCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  Cloudflare will output a public URL like <code className="font-mono text-slate-700">https://xyz.trycloudflare.com</code>. Paste that URL in the box above!
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
