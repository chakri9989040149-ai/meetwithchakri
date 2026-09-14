import React, { useState, useEffect } from 'react';
import { FileText, Copy, Check, Download, X, Sparkles } from 'lucide-react';
import { getSocket } from '../../services/socket';

export default function CollabNotes({ roomId, onClose }) {
  const [content, setContent] = useState('');
  const [copied, setCopied] = useState(false);
  const socket = getSocket();

  useEffect(() => {
    const handleNotesHistory = (savedNotes) => {
      if (savedNotes) setContent(savedNotes);
    };

    const handleNotesUpdated = ({ content: updatedContent }) => {
      setContent(updatedContent);
    };

    socket.on('notes-history', handleNotesHistory);
    socket.on('notes-updated', handleNotesUpdated);

    return () => {
      socket.off('notes-history', handleNotesHistory);
      socket.off('notes-updated', handleNotesUpdated);
    };
  }, [socket]);

  const handleChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    socket.emit('update-notes', { roomId, content: newContent });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chakri-meeting-notes-${roomId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full sm:w-80 md:w-96 h-full flex flex-col bg-white border-l border-slate-200/80 shadow-2xl z-20 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Collaborative Notes</h3>
            <p className="text-[11px] text-slate-500">Live synced meeting minutes & action items</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Toolbar */}
      <div className="px-4 py-2 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between text-xs">
        <span className="text-[10px] text-slate-400 font-medium">Auto-saves to room</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-slate-600 hover:text-brand-600"
            title="Copy Notes to Clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1 text-slate-600 hover:text-brand-600"
            title="Download Notes"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="text-[11px]">Save</span>
          </button>
        </div>
      </div>

      {/* Editor Textarea */}
      <div className="flex-1 p-4 flex flex-col">
        <textarea
          value={content}
          onChange={handleChange}
          placeholder="Type shared meeting notes, decisions, next steps, or key ideas here... All participants can see changes instantly."
          className="w-full flex-1 p-3 text-xs leading-relaxed text-slate-800 placeholder-slate-400 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none font-sans bg-slate-50/30"
        />
      </div>
    </div>
  );
}
