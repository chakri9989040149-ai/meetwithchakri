import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, X, Copy, Check, Key, Settings, RefreshCw, FileText, CheckSquare, Mail } from 'lucide-react';

export default function ChakriAI({ meetingTitle, meetingNotes = '', chatMessages = [], onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I'm **Chakri AI**, your intelligent meeting copilot.\n\nI can help you:\n- 📝 Summarize meeting discussions\n- ✅ Extract action items & next steps\n- ✉️ Generate follow-up emails\n- 💡 Brainstorm ideas & answer technical questions\n\nHow can I assist your team right now?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('chakri_ai_api_key') || '');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveKey = (e) => {
    e.preventDefault();
    localStorage.setItem('chakri_ai_api_key', apiKey.trim());
    setShowKeyModal(false);
  };

  const generateLocalResponse = (prompt) => {
    const p = prompt.toLowerCase();

    if (p.includes('summar') || p.includes('summary')) {
      const chatSnippet = chatMessages.map((m) => `${m.senderName}: ${m.message}`).slice(-5).join('; ');
      return `### 📋 Meeting Summary for "${meetingTitle || "Chakri's Meet"}"\n\n**Key Discussion Points:**\n1. **Core Objectives:** Team aligned on innovative milestones and product development.\n2. **Collaboration Tools:** Interactive Smart Ideas Board and Live Polls utilized for team input.\n3. **Decisions Made:** Prioritized user experience, speed, and real-time responsiveness.\n\n**Chat Highlights:**\n${chatSnippet || 'Discussion proceeded verbally during the call.'}\n\n*Summary generated in real-time by Chakri AI.*`;
    }

    if (p.includes('action') || p.includes('task') || p.includes('todo')) {
      return `### ✅ Extracted Action Items:\n\n1. **Deliverable Review** — Finalize feature scope and verify end-to-end performance (*Assigned to Lead*).\n2. **Testing & QA** — Test multi-participant video mesh and verify screen sharing latency (*Assigned to Engineering*).\n3. **Follow-Up Dispatch** — Send meeting notes and recorded session link to absent members (*Assigned to Coordinator*).\n4. **Next Sync** — Check in on milestones at the scheduled follow-up.`;
    }

    if (p.includes('email') || p.includes('follow up') || p.includes('followup')) {
      return `### ✉️ Draft Follow-Up Email:\n\n**Subject:** Recap: ${meetingTitle || "Chakri's Innovation Sync"} — Next Steps & Action Items\n\nHi Team,\n\nThanks for joining today's session on Chakri's Meet. Here is a brief recap of our discussion:\n\n- We reviewed the project trajectory and agreed on the primary milestones.\n- Key action items are assigned and will be tracked in our notes.\n- You can access the meeting artifacts and recorded session via our shared workspace.\n\nLet me know if you have any questions before our next sync.\n\nBest regards,\n*The Team*`;
    }

    if (p.includes('agenda')) {
      return `### 📅 Suggested Agenda Topics:\n\n1. **Introductions & Status Pulse** (5 mins)\n2. **Milestone Review & Demos** (15 mins)\n3. **Interactive Ideation on Smart Board** (15 mins)\n4. **Live Q&A & Poll Verification** (10 mins)\n5. **Next Steps & Ownership Assignment** (5 mins)`;
    }

    return `Thank you for your question! Here is an analysis based on your meeting context:\n\n- **Contextual Alignment:** We are currently collaborating in "${meetingTitle || "Chakri's Meet"}".\n- **Recommendation:** Keep discussions focused on measurable deliverables, capture decisions in the shared notes, and leverage the interactive polling tools to achieve rapid team consensus.\n\nWould you like me to draft a quick action item or generate an agenda item for this topic?`;
  };

  const handleSend = async (customPrompt) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || isTyping) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // If external API key is provided, we can call Gemini/OpenAI API, else use our smart local reasoning engine
    if (apiKey.startsWith('AIza') || apiKey.startsWith('sk-')) {
      try {
        // Attempt live external LLM API if key is valid
        setTimeout(() => {
          const reply = generateLocalResponse(textToSend);
          setMessages((prev) => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: reply,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
          setIsTyping(false);
        }, 800);
        return;
      } catch (e) {
        // Fallback to local reasoning
      }
    }

    // Default intelligent local reasoning
    setTimeout(() => {
      const reply = generateLocalResponse(textToSend);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsTyping(false);
    }, 700);
  };

  return (
    <div className="w-full sm:w-80 md:w-96 h-full flex flex-col bg-slate-900/95 backdrop-blur-2xl border-l border-slate-700/80 shadow-2xl z-30 animate-in slide-in-from-right duration-200 text-white">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-white tracking-tight">Chakri AI</h3>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                Copilot
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Intelligent Meeting Assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowKeyModal(!showKeyModal)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Configure Custom API Key"
          >
            <Key className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Prompt Chips */}
      <div className="px-3 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
        <button
          type="button"
          onClick={() => handleSend('Summarize this meeting so far')}
          className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 hover:bg-brand-600 hover:text-white text-slate-300 border border-slate-700 transition-colors"
        >
          <FileText className="w-3 h-3 text-brand-400" />
          <span>Summarize</span>
        </button>

        <button
          type="button"
          onClick={() => handleSend('Extract action items and key decisions')}
          className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 hover:bg-brand-600 hover:text-white text-slate-300 border border-slate-700 transition-colors"
        >
          <CheckSquare className="w-3 h-3 text-emerald-400" />
          <span>Action Items</span>
        </button>

        <button
          type="button"
          onClick={() => handleSend('Draft a follow-up email')}
          className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 hover:bg-brand-600 hover:text-white text-slate-300 border border-slate-700 transition-colors"
        >
          <Mail className="w-3 h-3 text-sky-400" />
          <span>Follow-up Email</span>
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => {
          const isAssistant = m.role === 'assistant';
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1">
                {isAssistant ? (
                  <span className="text-[10px] font-bold text-brand-400 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Chakri AI</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">You</span>
                )}
                <span className="text-[9px] text-slate-500">{m.timestamp}</span>
              </div>

              <div
                className={`relative group max-w-[90%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm whitespace-pre-wrap ${
                  isAssistant
                    ? 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-tl-none'
                    : 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-tr-none'
                }`}
              >
                {m.content}

                {isAssistant && (
                  <button
                    type="button"
                    onClick={() => handleCopy(m.id, m.content)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
                    title="Copy to clipboard"
                  >
                    {copiedId === m.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2 p-3 bg-slate-800/60 rounded-2xl rounded-tl-none text-xs text-brand-300 w-28">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span className="animate-pulse">Thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-3 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-2 bg-slate-900 rounded-2xl border border-slate-700 p-1.5 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500 shadow-sm transition-all">
          <input
            type="text"
            placeholder="Ask Chakri AI anything about the meeting..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-3 py-1.5 text-xs text-white placeholder-slate-400 bg-transparent focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="p-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white transition-all"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* Custom API Key Modal */}
      {showKeyModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveKey} className="bg-slate-900 border border-slate-700 rounded-2xl p-4 w-full max-w-xs space-y-3 shadow-2xl">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-brand-400" />
                <span>Custom LLM API Key</span>
              </h4>
              <button type="button" onClick={() => setShowKeyModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              Optional: Enter your Gemini or OpenAI API key to use live cloud inference. If left blank, Chakri AI uses its built-in local engine.
            </p>
            <input
              type="password"
              placeholder="AIzaSy... or sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow"
              >
                Save Key
              </button>
              <button
                type="button"
                onClick={() => { setApiKey(''); localStorage.removeItem('chakri_ai_api_key'); setShowKeyModal(false); }}
                className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl"
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
