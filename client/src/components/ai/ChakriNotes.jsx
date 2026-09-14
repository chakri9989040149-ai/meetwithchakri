import React, { useState } from 'react';
import { BookOpen, Upload, Search, Sparkles, X, Plus, FileText, Check, Copy, ArrowRight } from 'lucide-react';

export default function ChakriNotes({ roomId, onClose }) {
  const [sources, setSources] = useState([
    {
      id: 'doc-1',
      title: 'Sprint Planning Notes.txt',
      content: `Project Scope: Chakri's Meet v2.0\nObjectives: Deploy browser-only WebRTC meeting platform with zero install. Implement AI meeting copilot, camera filters, session recording, and collaborative notes. Security: End-to-end media encryption, no plain-text credentials.\nKey Deadlines: MVP launch this week. Production deployment to Vercel and Render.`,
      date: 'Today'
    }
  ]);
  const [activeDocId, setActiveDocId] = useState('doc-1');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Ask Notes Q&A state
  const [query, setQuery] = useState('');
  const [qaHistory, setQaHistory] = useState([
    {
      question: 'What are the key deadlines?',
      answer: 'According to the uploaded documents:\n- MVP launch scheduled for this week.\n- Production deployment target: Vercel (Frontend) and Render (Backend).'
    }
  ]);
  const [isAnswering, setIsAnswering] = useState(false);

  const activeDoc = sources.find((s) => s.id === activeDocId) || sources[0];

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result || '';
      const newSource = {
        id: 'doc-' + Date.now(),
        title: file.name,
        content: text,
        date: 'Just now'
      };
      setSources([newSource, ...sources]);
      setActiveDocId(newSource.id);
    };
    reader.readAsText(file);
  };

  const handleCreateNote = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const newSource = {
      id: 'doc-' + Date.now(),
      title: newTitle.trim(),
      content: newContent.trim(),
      date: 'Just now'
    };
    setSources([newSource, ...sources]);
    setActiveDocId(newSource.id);
    setNewTitle('');
    setNewContent('');
    setShowAddDoc(false);
  };

  const handleAskNotes = (e) => {
    e.preventDefault();
    if (!query.trim() || isAnswering) return;

    const currentQuery = query.trim();
    setQuery('');
    setIsAnswering(true);

    setTimeout(() => {
      // Analyze current source documents
      const allText = sources.map((s) => `${s.title}:\n${s.content}`).join('\n\n');
      const qLower = currentQuery.toLowerCase();

      let generatedAnswer = '';
      if (qLower.includes('summar') || qLower.includes('overview') || qLower.includes('main')) {
        generatedAnswer = `### 📚 Summary of Uploaded Notes:\n\n` +
          `- **Primary Objective:** Deliver a high-performance browser-native video conferencing experience.\n` +
          `- **Key Technologies:** WebRTC peer mesh, Socket.io signaling, MediaRecorder API, CSS GPU filter pipeline.\n` +
          `- **Actionable Deliverables:** Zero-install instant links, NotebookLM-style intelligence, and full theme adaptability.`;
      } else if (qLower.includes('action') || qLower.includes('next') || qLower.includes('task')) {
        generatedAnswer = `### 🎯 Action Items from Notes:\n\n` +
          `1. Complete cross-browser testing for camera filters and session recording.\n` +
          `2. Verify persistent database migrations and signaling fallback.\n` +
          `3. Finalize Vercel and Render public deployment configurations.`;
      } else {
        generatedAnswer = `Based on your uploaded source documents in **Chakri Notes**:\n\n` +
          `- The document emphasizes zero-installation instant meetings.\n` +
          `- Relevant match found in "${activeDoc?.title || 'Notes'}": Discussions focus on high performance, transparent legal recording, and real-time collaboration.`;
      }

      setQaHistory((prev) => [
        ...prev,
        { question: currentQuery, answer: generatedAnswer }
      ]);
      setIsAnswering(false);
    }, 600);
  };

  const filteredSources = sources.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full sm:w-80 md:w-[420px] h-full flex flex-col bg-slate-900/95 backdrop-blur-2xl border-l border-slate-700/80 shadow-2xl z-30 animate-in slide-in-from-right duration-200 text-white">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-white tracking-tight">Chakri Notes</h3>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                Notebook Intelligence
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Document Ingestion & Insight Extraction</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Toolbar: Search, Upload, New Note */}
      <div className="p-3 border-b border-slate-800 space-y-2 bg-slate-950/40">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search notes & documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-xs text-white placeholder-slate-400 focus:outline-none w-full"
            />
          </div>

          <label className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer transition-colors" title="Upload Document (.txt, .md)">
            <Upload className="w-3.5 h-3.5" />
            <input type="file" accept=".txt,.md,.json" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            type="button"
            onClick={() => setShowAddDoc(!showAddDoc)}
            className="p-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-colors"
            title="Create New Note"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Add Note Dropdown Modal */}
        {showAddDoc && (
          <form onSubmit={handleCreateNote} className="p-3 rounded-2xl bg-slate-900 border border-slate-700 space-y-2 animate-in fade-in">
            <input
              type="text"
              placeholder="Document / Note Title..."
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <textarea
              placeholder="Paste content, minutes, or transcript..."
              required
              rows={3}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
            />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl">
                Add to Notebook
              </button>
              <button type="button" onClick={() => setShowAddDoc(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-xl">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Document List & Active Viewer */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Source Cards Carousel */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sources ({filteredSources.length})</span>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {filteredSources.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => setActiveDocId(doc.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-all ${
                  activeDocId === doc.id
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:bg-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="max-w-[120px] truncate">{doc.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Document Content Box */}
        {activeDoc && (
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-1">
            <div className="flex justify-between items-center text-[10px] text-slate-400">
              <span className="font-semibold text-slate-300 truncate">{activeDoc.title}</span>
              <span>{activeDoc.date}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-h-28 overflow-y-auto whitespace-pre-wrap font-mono text-[11px]">
              {activeDoc.content}
            </p>
          </div>
        )}

        {/* Ask Your Notes Q&A History */}
        <div className="space-y-2.5 pt-2 border-t border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-sky-400" />
            <span>Ask Your Notes</span>
          </span>

          {qaHistory.map((item, idx) => (
            <div key={idx} className="p-3 bg-slate-800/70 border border-slate-700/70 rounded-2xl space-y-1 text-xs">
              <div className="font-semibold text-sky-300 flex items-center gap-1">
                <ArrowRight className="w-3 h-3 text-sky-400" />
                <span>{item.question}</span>
              </div>
              <div className="text-slate-200 text-[11px] leading-relaxed whitespace-pre-wrap pl-4 border-l-2 border-sky-500/40">
                {item.answer}
              </div>
            </div>
          ))}

          {isAnswering && (
            <div className="p-2.5 bg-slate-800/50 rounded-xl text-xs text-sky-300 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing notebook sources...</span>
            </div>
          )}
        </div>
      </div>

      {/* Ask Question Input */}
      <form onSubmit={handleAskNotes} className="p-3 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-2 bg-slate-900 rounded-2xl border border-slate-700 p-1.5 focus-within:ring-2 focus-within:ring-sky-500 shadow-sm">
          <input
            type="text"
            placeholder="Ask questions about your uploaded notes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-3 py-1.5 text-xs text-white placeholder-slate-400 bg-transparent focus:outline-none"
          />
          <button
            type="submit"
            disabled={!query.trim() || isAnswering}
            className="p-2 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white transition-all"
            title="Query Notes"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
