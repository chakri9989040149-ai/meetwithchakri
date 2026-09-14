import React, { useState } from 'react';
import { 
  Bot, X, ArrowLeft, Send, Sparkles, Code, BookOpen, Mic, 
  Lightbulb, FileText, CheckSquare, Briefcase, Copy, Check, RefreshCw
} from 'lucide-react';

const AGENTS = [
  {
    id: 'meeting',
    name: 'Meeting Assistant',
    badge: 'Real-time',
    icon: Bot,
    color: 'from-blue-500 to-indigo-600',
    borderColor: 'border-blue-500/40',
    description: 'Summarizes key decisions, records action items, and generates live meeting agendas.',
    starterPrompts: [
      'Create an action item checklist from our discussion',
      'Generate a 5-bullet summary for absent team members',
      'Draft a professional follow-up email with next steps'
    ],
    systemRole: 'You are an executive meeting assistant. You synthesize meeting context into concise, actionable summaries, bullet points, and owner-assigned tasks.'
  },
  {
    id: 'study',
    name: 'Study Assistant',
    badge: 'Education',
    icon: BookOpen,
    color: 'from-emerald-500 to-teal-600',
    borderColor: 'border-emerald-500/40',
    description: 'Explains complex topics in simple terms, creates study quizzes, and simplifies academic papers.',
    starterPrompts: [
      'Explain this topic in simple words like I am 12',
      'Create 3 quick practice questions to test our team',
      'Give me an intuitive analogy for this concept'
    ],
    systemRole: 'You are an empathetic, top-tier educator. You break down complex ideas into crisp, memorable, first-principles explanations.'
  },
  {
    id: 'coding',
    name: 'Coding Assistant',
    badge: 'Engineering',
    icon: Code,
    color: 'from-violet-500 to-purple-600',
    borderColor: 'border-violet-500/40',
    description: 'Debugs WebRTC, JavaScript, Python code, optimizes algorithms, and reviews architecture.',
    starterPrompts: [
      'Help me understand Python async/await from beginner level',
      'How do WebRTC ICE candidates work between NAT networks?',
      'Review and optimize this JavaScript snippet for speed'
    ],
    systemRole: 'You are a Senior Principal Software Architect. You provide clean, modern, production-grade code with clear step-by-step explanations.'
  },
  {
    id: 'presentation',
    name: 'Presentation Assistant',
    badge: 'Communication',
    icon: Mic,
    color: 'from-amber-500 to-orange-600',
    borderColor: 'border-amber-500/40',
    description: 'Refines speech scripts, structures slide decks, and rehearses tough Q&A responses.',
    starterPrompts: [
      'How can I start my presentation with a compelling hook?',
      'What are 3 hard questions stakeholders might ask about this?',
      'Refine this 60-second elevator pitch for maximum impact'
    ],
    systemRole: 'You are a TED-level speech coach and presentation designer. You help speakers captivate audiences with strong structure and concise delivery.'
  },
  {
    id: 'brainstorming',
    name: 'Brainstorming Assistant',
    badge: 'Ideation',
    icon: Lightbulb,
    color: 'from-yellow-400 to-amber-500',
    borderColor: 'border-yellow-500/40',
    description: 'Generates creative ideas using SCAMPER, lateral thinking, and modern product brainstorming.',
    starterPrompts: [
      'Give me 5 viral launch ideas for Chakri\'s Meet',
      'What unique features would set this product apart from Zoom?',
      'Apply lateral thinking to solve our team engagement challenge'
    ],
    systemRole: 'You are a creative director and innovation strategist. You offer non-obvious, visionary, yet feasible product and marketing ideas.'
  },
  {
    id: 'notes',
    name: 'Notes Assistant',
    badge: 'Documentation',
    icon: FileText,
    color: 'from-pink-500 to-rose-600',
    borderColor: 'border-pink-500/40',
    description: 'Formats messy brainstorm scribbles into structured documentation, specs, and briefs.',
    starterPrompts: [
      'Turn my scattered notes into a clean project brief',
      'Extract key deliverables and due dates from this text',
      'Format this into an RFC / technical proposal outline'
    ],
    systemRole: 'You are a meticulous technical writer and documentation specialist. You transform unstructured notes into polished, scannable documentation.'
  },
  {
    id: 'planner',
    name: 'Task Planner',
    badge: 'Productivity',
    icon: CheckSquare,
    color: 'from-cyan-500 to-blue-600',
    borderColor: 'border-cyan-500/40',
    description: 'Breaks goals into SMART milestones, sprint backlogs, and assigns realistic timelines.',
    starterPrompts: [
      'Create a 2-week sprint backlog with priority tags',
      'Break this feature launch into 5 sequential phases',
      'Estimate risks and contingency steps for our deadline'
    ],
    systemRole: 'You are an agile project manager and operations master. You translate big goals into realistic, prioritizeable, milestone-based execution tracks.'
  },
  {
    id: 'interview',
    name: 'Interview Assistant',
    badge: 'Career',
    icon: Briefcase,
    color: 'from-teal-400 to-emerald-600',
    borderColor: 'border-teal-500/40',
    description: 'Conducts mock technical and behavioral interviews with real-time feedback and rubric scoring.',
    starterPrompts: [
      'Ask me a senior engineer behavioral question using STAR',
      'Conduct a mock system design interview on video streaming',
      'Evaluate my answer and suggest a stronger way to frame it'
    ],
    systemRole: 'You are an executive interviewer and hiring committee lead. You ask realistic questions, evaluate candidates objectively, and suggest impactful responses.'
  }
];

export default function AIAgentHub({ isOpen, onClose }) {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [messages, setMessages] = useState({});
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  if (!isOpen) return null;

  const currentAgent = AGENTS.find(a => a.id === selectedAgent);
  const activeMessages = selectedAgent ? (messages[selectedAgent] || []) : [];

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || !selectedAgent) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updated = [...activeMessages, userMsg];
    setMessages(prev => ({ ...prev, [selectedAgent]: updated }));
    setInputMessage('');
    setIsTyping(true);

    // Simulate intelligent domain-specific agent response
    setTimeout(() => {
      let botResponse = generateAgentResponse(currentAgent, text);
      const agentMsg = {
        id: Date.now() + 1,
        sender: 'agent',
        text: botResponse,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => ({
        ...prev,
        [selectedAgent]: [...(prev[selectedAgent] || updated), agentMsg]
      }));
      setIsTyping(false);
    }, 650);
  };

  const generateAgentResponse = (agent, query) => {
    const qLower = query.toLowerCase();

    if (agent.id === 'coding') {
      if (qLower.includes('python') || qLower.includes('async')) {
        return `### 🐍 Python Async/Await Explained Simply\n\nIn Python, **synchronous** code pauses the entire thread while waiting for I/O (like a network request or database query).\n\n\`\`\`python\nimport asyncio\n\nasync def fetch_meeting_data(room_id):\n    print(f"Connecting to room {room_id}...")\n    await asyncio.sleep(1) # Non-blocking delay\n    return {"room": room_id, "status": "active"}\n\nasync def main():\n    # Runs concurrently without blocking other operations\n    data = await fetch_meeting_data("chakri-101")\n    print(data)\n\nasyncio.run(main())\n\`\`\`\n\n**Key takeaways:**\n- \`async def\` defines a coroutine function.\n- \`await\` yields execution back to the event loop until the task finishes.\n- Essential for high-concurrency servers and WebRTC signaling gateways!`;
      }
      if (qLower.includes('webrtc') || qLower.includes('ice')) {
        return `### 🌐 WebRTC ICE & NAT Traversal Breakdown\n\nWhen peers are behind different NATs/firewalls, they cannot connect directly by IP:\n\n1. **STUN (Session Traversal Utilities for NAT)**: Discovers your public IP:port reflexively.\n2. **TURN (Traversal Using Relays around NAT)**: Acts as a media relay when symmetric NATs block direct P2P connections.\n3. **ICE (Interactive Connectivity Establishment)**: Evaluates candidate pairs (\`host\`, \`srflx\`, \`relay\`) in order of lowest latency to establish the optimal DTLS/SRTP channel.\n\nChakri's Meet auto-negotiates free Google STUN servers with seamless TURN fallback!`;
      }
      return `### 💻 Code Analysis & Recommendation\n\nHere is an optimized architectural approach for: **"${query}"**\n\n\`\`\`javascript\n// Production-grade implementation\nexport async function handleOptimizedTask(payload) {\n  const startTime = performance.now();\n  try {\n    const response = await processPipeline(payload);\n    console.log(\`Done in \${Math.round(performance.now() - startTime)}ms\`);\n    return { success: true, data: response };\n  } catch (err) {\n    console.error('Task failed:', err);\n    return { success: false, error: err.message };\n  }\n}\n\`\`\`\n\nWould you like me to tailor this for your specific backend or client framework?`;
    }

    if (agent.id === 'meeting') {
      return `### 📋 Meeting Brief & Action Plan\n\nBased on: **"${query}"**\n\n**Key Takeaways:**\n- Core objective verified and aligned across participants.\n- Real-time signaling & low-latency peer connectivity prioritized.\n\n**Action Items:**\n- [ ] **Chakri**: Finalize public meeting link distribution and tunnel verification.\n- [ ] **Engineering**: Confirm WebRTC STUN candidate exchange across different WiFi networks.\n- [ ] **Design**: Review 5 custom color themes and camera filters.\n\n**Next Milestone**: Public cross-device test in 24 hours.`;
    }

    if (agent.id === 'study') {
      return `### 🎓 Concept Breakdown\n\nLet's unpack **"${query}"** using a simple real-world analogy:\n\n**The Big Idea:**\nThink of this like sending a voice message on a walkie-talkie versus sending a letter through the post office. Instead of waiting for the envelope to travel across town, the radio wave transmits your voice instantly through the air.\n\n**3 Quick Facts to Remember:**\n1. **Foundation**: Build the basics first before adding complexity.\n2. **Mechanism**: Each part has a clear input and predictable output.\n3. **Application**: Used everywhere in modern high-performance systems.\n\n*Would you like a 3-question quiz to test your understanding?*`;
    }

    if (agent.id === 'planner') {
      return `### 🗓️ Sprint Execution Plan\n\nGoal: **"${query}"**\n\n| Phase | Deliverable | Priority | ETA |\n| :--- | :--- | :--- | :--- |\n| Phase 1 | Setup Signaling & WebRTC Traversal | P0 (Critical) | Day 1-2 |\n| Phase 2 | Camera Filters & Recording Engine | P1 (High) | Day 3-4 |\n| Phase 3 | Cross-Network Device Testing | P0 (Critical) | Day 5 |\n\n**Potential Blockers:** Network symmetric NATs blocking P2P (resolved by STUN/TURN fallback).`;
    }

    // Default rich response
    return `### ✨ ${agent.name} Insights\n\nI have processed your request: **"${query}"**\n\n**Recommendations:**\n1. **Focus on High-Impact Outcomes**: Prioritize the core path that delivers instant value to your users.\n2. **Keep Feedback Loops Tight**: Test iteratively across varied devices and real network conditions.\n3. **Polish the User Experience**: Micro-interactions, smooth transitions, and clear error states elevate product perception from good to exceptional.\n\nLet me know how you'd like to proceed or what specific detail you'd like to explore next!`;
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-slate-900/95 backdrop-blur-xl border-l border-white/10 shadow-2xl flex flex-col transition-all duration-300 animate-slide-left">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2.5">
          {selectedAgent ? (
            <button
              onClick={() => setSelectedAgent(null)}
              className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition"
              title="Back to Agent Hub"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          )}

          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              {selectedAgent ? currentAgent.name : 'AI Agent Hub'}
              {selectedAgent && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {currentAgent.badge}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              {selectedAgent ? currentAgent.description : '8 Specialized Intelligence Agents'}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Area */}
      {!selectedAgent ? (
        /* Agent Grid View */
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 text-xs text-indigo-200">
            <span className="font-semibold text-white">Chakri AI Ecosystem:</span> Select an agent below to launch a specialized session for meeting assistance, coding, study, or strategy.
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {AGENTS.map((agent) => {
              const Icon = agent.icon;
              return (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent.id)}
                  className={`group p-3.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border ${agent.borderColor} hover:border-white/30 transition-all duration-200 cursor-pointer flex items-start gap-3 hover:translate-x-1 shadow-sm`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center flex-shrink-0 shadow-md text-white group-hover:scale-105 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition">
                        {agent.name}
                      </h3>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10">
                        {agent.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {agent.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Selected Agent Chat View */
        <div className="flex-1 flex flex-col min-h-0 bg-slate-900/50">
          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {activeMessages.length === 0 && (
              <div className="text-center py-6 space-y-3">
                <div className={`w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br ${currentAgent.color} flex items-center justify-center text-white shadow-lg`}>
                  <currentAgent.icon className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-white">{currentAgent.name}</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  {currentAgent.description}
                </p>

                {/* Starters */}
                <div className="pt-3 space-y-2 text-left">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 text-center">
                    Suggested prompts
                  </p>
                  {currentAgent.starterPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt)}
                      className="w-full text-left text-xs p-2.5 rounded-lg bg-slate-800/70 hover:bg-slate-800 border border-white/5 hover:border-white/20 text-slate-300 hover:text-white transition flex items-center justify-between group"
                    >
                      <span className="line-clamp-1">"{prompt}"</span>
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-500">
                  <span>{msg.sender === 'user' ? 'You' : currentAgent.name}</span>
                  <span>•</span>
                  <span>{msg.time}</span>
                </div>
                <div
                  className={`relative group max-w-[90%] rounded-2xl p-3.5 text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none shadow-md'
                      : 'bg-slate-800/90 text-slate-200 border border-white/10 rounded-bl-none shadow-lg'
                  }`}
                >
                  {msg.text}

                  {msg.sender === 'agent' && (
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="absolute top-2 right-2 p-1 rounded bg-black/40 hover:bg-black/60 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-slate-400 text-xs px-2 py-1">
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse delay-75" />
                <div className="w-2 h-2 rounded-full bg-pink-400 animate-pulse delay-150" />
                <span className="text-[11px] ml-1">{currentAgent.name} is thinking...</span>
              </div>
            )}
          </div>

          {/* Quick Prompts Bar if messages exist */}
          {activeMessages.length > 0 && (
            <div className="px-4 py-2 flex items-center gap-1.5 overflow-x-auto border-t border-white/5 scrollbar-none">
              {currentAgent.starterPrompts.slice(0, 2).map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(p)}
                  className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="p-3.5 border-t border-white/10 bg-slate-950/80">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={`Ask ${currentAgent.name}...`}
                className="flex-1 bg-slate-800/90 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isTyping}
                className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-40 text-white shadow-md transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
