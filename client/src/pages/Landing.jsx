import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Video,
  Plus,
  ArrowRight,
  Sparkles,
  Shield,
  Palette,
  Users,
  Zap,
  BarChart2,
  FileText,
  CheckCircle2,
  Lock,
  Globe,
  CircleDot,
  SlidersHorizontal,
  Bot,
  BookOpen,
  Share2,
  Mic,
  Smile,
  ShieldCheck,
  Check
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Logo from '../components/Logo';

export default function Landing() {
  const [roomCode, setRoomCode] = useState('');
  const [currentTheme, setCurrentTheme] = useState(
    localStorage.getItem('chakri_theme') || 'theme-midnight'
  );
  const navigate = useNavigate();

  const handleThemeChange = (newTheme) => {
    setCurrentTheme(newTheme);
    localStorage.setItem('chakri_theme', newTheme);
  };

  const handleCreateMeeting = () => {
    navigate('/create');
  };

  const handleJoinMeeting = (e) => {
    e.preventDefault();
    if (!roomCode.trim()) return;
    const cleanCode = roomCode.trim().replace(/^.*\/room\//, '');
    navigate(`/room/${cleanCode}`);
  };

  return (
    <div className={`min-h-screen ${currentTheme} bg-slate-950 text-white flex flex-col selection:bg-indigo-500 selection:text-white relative overflow-x-hidden font-sans`}>
      {/* Navigation */}
      <Navbar
        onInstantMeetingClick={handleCreateMeeting}
        currentTheme={currentTheme}
        onSelectTheme={handleThemeChange}
      />

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 sm:pt-24 sm:pb-32 overflow-hidden">
        {/* Cinematic Ambient Glow Background */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] sm:w-[900px] h-[550px] bg-gradient-to-tr from-purple-600/30 via-indigo-600/25 to-blue-600/20 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse" />
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-pink-600/15 rounded-full blur-[120px] pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 shadow-lg text-indigo-300 text-xs font-semibold mb-8 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin-slow" />
            <span>Zero App Downloads &bull; Pure Browser WebRTC &bull; Built by Chakri</span>
          </div>

          {/* Primary Tagline & Heading */}
          <h1 className="font-extrabold text-4xl sm:text-6xl lg:text-7xl tracking-tight text-white max-w-4xl mx-auto leading-[1.12]">
            CHAKRI'S MEET
            <span className="block mt-2 text-3xl sm:text-5xl lg:text-6xl font-black bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              "Meet. Connect. Collaborate."
            </span>
          </h1>

          {/* Subheading */}
          <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            Powerful video meetings with smarter collaboration, beautiful experiences, and seamless communication.
            Zero APKs, zero desktop installs — just open your browser and connect instantly.
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto">
            <button
              onClick={handleCreateMeeting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 text-base font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 rounded-2xl shadow-xl shadow-purple-600/30 hover:shadow-purple-600/50 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span>Start a Meeting</span>
            </button>

            {/* Quick Room Code Input */}
            <form onSubmit={handleJoinMeeting} className="w-full sm:w-auto flex items-center bg-slate-900/90 backdrop-blur-md rounded-2xl border border-white/15 p-1.5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all shadow-lg">
              <input
                type="text"
                placeholder="Enter room ID..."
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="px-4 py-2.5 text-sm text-white placeholder-slate-500 bg-transparent focus:outline-none w-44 sm:w-40 font-mono"
              />
              <button
                type="submit"
                disabled={!roomCode.trim()}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all disabled:opacity-30 border border-white/10"
              >
                Join
              </button>
            </form>
          </div>

          {/* Hero Visual Preview Stage */}
          <div className="mt-16 sm:mt-20 relative max-w-5xl mx-auto">
            <div className="relative rounded-3xl p-3 bg-gradient-to-b from-white/15 to-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl shadow-purple-900/40">
              <div className="rounded-2xl bg-slate-950 overflow-hidden border border-white/10 aspect-[16/9] max-h-[520px] flex flex-col">
                {/* Mock Window Top Bar */}
                <div className="px-4 py-3 bg-slate-900/90 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    <span className="ml-3 text-xs font-mono text-slate-400">CHAKRI'S MEET &bull; Room #chakri-product-sync</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      <span>REC 04:12</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>HD WebRTC</span>
                    </div>
                  </div>
                </div>

                {/* Mock Video Grid with Feature Badges */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 p-4 gap-4 bg-slate-950/80 relative">
                  {/* Tile 1: Host with Cinematic Filter */}
                  <div className="relative rounded-2xl overflow-hidden bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 flex flex-col items-center justify-center p-6 shadow-lg group">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-lg shadow-indigo-500/30 ring-4 ring-indigo-500/30">
                      C
                    </div>
                    <span className="text-sm font-semibold text-white">Chakri (Host)</span>
                    <span className="text-xs text-indigo-300 flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                      Speaking &bull; Cinematic Filter Active
                    </span>
                    <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] text-white border border-white/10 flex items-center gap-1.5">
                      <Mic className="w-3 h-3 text-emerald-400" />
                      <span>HD Audio</span>
                    </div>
                    <div className="absolute top-3 right-3 px-2 py-0.5 bg-indigo-600/80 rounded text-[10px] font-bold text-white uppercase">
                      Cinematic
                    </div>
                  </div>

                  {/* Tile 2: Participant */}
                  <div className="relative rounded-2xl overflow-hidden bg-gradient-to-tr from-slate-900 via-purple-950 to-slate-900 border border-purple-500/30 flex flex-col items-center justify-center p-6 shadow-lg group">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-lg shadow-purple-500/30 ring-4 ring-purple-500/30">
                      F
                    </div>
                    <span className="text-sm font-semibold text-white">Friend (Mobile Browser)</span>
                    <span className="text-xs text-purple-300 flex items-center gap-1 mt-0.5">
                      Collaborating &bull; Zero Download
                    </span>
                    <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] text-white border border-white/10 flex items-center gap-1.5">
                      <Globe className="w-3 h-3 text-sky-400" />
                      <span>Public Link</span>
                    </div>
                    <div className="absolute bottom-3 right-3 text-xl animate-bounce">
                      🚀
                    </div>
                  </div>
                </div>

                {/* Mock Bottom Controls */}
                <div className="p-3 bg-slate-900/90 border-t border-white/10 flex items-center justify-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white text-xs">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white text-xs">
                    <Video className="w-4 h-4" />
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xs">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center text-white text-xs">
                    <CircleDot className="w-4 h-4" />
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white text-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-white text-xs">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-pink-600 flex items-center justify-center text-white text-xs">
                    <Smile className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section 1: Why Chakri's Meet? */}
      <section id="features" className="py-20 bg-slate-900/50 border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Why Chakri's Meet?</span>
            <h2 className="mt-2 text-3xl sm:text-5xl font-extrabold text-white">
              Instant connectivity. Zero downloads. Total freedom.
            </h2>
            <p className="mt-4 text-base text-slate-400">
              No APKs, no desktop client installs, and no complex registration hoops. Pure WebRTC power directly in your browser.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Reason 1 */}
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-white/10 hover:border-indigo-500/50 transition-all hover:-translate-y-1 shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center mb-6">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">100% Browser Native</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Works seamlessly in Chrome, Safari, Edge, Firefox, Android browsers, and iPhones without asking anyone to download anything.
              </p>
            </div>

            {/* Reason 2 */}
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-white/10 hover:border-purple-500/50 transition-all hover:-translate-y-1 shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Ultra-Fast P2P Mesh</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Peer-to-peer WebRTC video and audio pipelines bypass slow central transcoding servers for sub-100ms real-time conversations.
              </p>
            </div>

            {/* Reason 3 */}
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-white/10 hover:border-pink-500/50 transition-all hover:-translate-y-1 shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/20 border border-pink-500/40 text-pink-400 flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Private & Encrypted</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Every video stream is secured by DTLS/SRTP encryption. Complete host controls allow room locking, participant kicking, and muting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section 2: Core Capabilities Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Comprehensive Suite</span>
            <h2 className="mt-2 text-3xl sm:text-5xl font-extrabold text-white">
              Every tool modern teams need in one place.
            </h2>
            <p className="mt-4 text-base text-slate-400">
              Chakri's Meet combines video conferencing with creative collaboration, AI assistants, and studio-grade controls.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. Video Meetings */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 hover:border-indigo-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                <Video className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">HD Video & Audio</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Crystal clear 1080p video with throttled audio meters to prevent laptop lag. Auto-adapts to variable mobile bandwidths.
              </p>
            </div>

            {/* 2. Screen Sharing */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 hover:border-indigo-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                <Share2 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">Screen Sharing</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Present entire screens, specific application windows, or browser tabs with high frame rate and audio pass-through.
              </p>
            </div>

            {/* 3. Recording Feature */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 hover:border-rose-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
                <CircleDot className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">Meeting Recording</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Transparent client-side MediaRecorder capture. Displays active timers and notices, saving directly to your computer as WebM.
              </p>
            </div>

            {/* 4. Camera Filters */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 hover:border-amber-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">10 Camera Filters</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                From Cinematic and Vintage to Warm, Cool, Neon, and Cyberpunk. Hardware GPU-accelerated with zero CPU latency.
              </p>
            </div>

            {/* 5. Live Emojis & Reactions */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 hover:border-pink-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center mb-4">
                <Smile className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">10 Live Reactions</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Express yourself with animated floating emojis (👍, 👏, 😂, ❤️, 🔥, 🎉, 😮, 😢, 🤔, 🚀) synchronized in real-time.
              </p>
            </div>

            {/* 6. Productivity & Moderation */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 hover:border-emerald-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <Shield className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">Host Controls & Security</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Room lock, mute-all, kick participants, hand raising queue, live meeting timer, and copyable invite links.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section 3: AI Suite (Chakri AI, Chakri Notes, Agent Hub) */}
      <section id="ai-suite" className="py-20 bg-slate-900/40 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Intelligent Workflows</span>
            <h2 className="mt-2 text-3xl sm:text-5xl font-extrabold text-white">
              The Chakri AI Suite
            </h2>
            <p className="mt-4 text-base text-slate-400">
              Inspired by the intelligence of ChatGPT, Gemini, and NotebookLM, but built specifically for your video discussions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* AI 1: Chakri AI Copilot */}
            <div className="p-8 rounded-3xl bg-slate-900/90 border border-purple-500/30 hover:border-purple-500/60 transition-all shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Chakri AI Copilot</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                Instant meeting summaries, action item checklists, professional follow-up email drafts, and structured agendas generated on demand.
              </p>
              <div className="text-xs text-purple-300 font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Live in-call assistant
              </div>
            </div>

            {/* AI 2: Chakri Notes (NotebookLM Style) */}
            <div className="p-8 rounded-3xl bg-slate-900/90 border border-indigo-500/30 hover:border-indigo-500/60 transition-all shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/30">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Chakri Notes</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                NotebookLM-inspired knowledge tool. Ingest meeting documents, paste text, search archives, and ask source-grounded questions.
              </p>
              <div className="text-xs text-indigo-300 font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Source-grounded synthesis
              </div>
            </div>

            {/* AI 3: AI Agent Hub */}
            <div className="p-8 rounded-3xl bg-slate-900/90 border border-pink-500/30 hover:border-pink-500/60 transition-all shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-600 text-white flex items-center justify-center mb-6 shadow-lg shadow-pink-500/30">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">AI Agent Hub</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                8 specialized agents: Meeting, Study, Coding, Presentation, Brainstorming, Notes, Task Planner, and Interview Simulator.
              </p>
              <div className="text-xs text-pink-300 font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4" /> 8 specialized intelligences
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section 4: Create Together Collaboration */}
      <section id="collaboration" className="py-20 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Interactive Brainstorming</span>
            <h2 className="mt-2 text-3xl sm:text-5xl font-extrabold text-white">
              "Discuss and Create the New Things"
            </h2>
            <p className="mt-4 text-base text-slate-400">
              Meetings are better when everyone participates. Chakri's Meet equips your calls with synchronized interactive canvas tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Whiteboard */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 hover:border-indigo-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center mb-4">
                <Palette className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">Smart Ideas Board</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Multiplayer drawing canvas with highlighters, sticky notes, and shapes synced live across all screens.
              </p>
            </div>

            {/* Polls */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 hover:border-sky-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-4">
                <BarChart2 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">Live Polls</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Launch interactive questions during calls with real-time percentage graphs and participant feedback.
              </p>
            </div>

            {/* Collab Notes */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 hover:border-violet-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">Shared Minutes</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Co-edit live meeting notes simultaneously so everyone leaves with an identical understanding of decisions.
              </p>
            </div>

            {/* Agenda */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 hover:border-emerald-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">Structured Agenda</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Track topic progress step-by-step to keep calls disciplined, focused, and completed on schedule.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-12 border-t border-white/10 bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <Logo size="md" showTagline={true} />
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} Chakri's Meet &bull; Owned & Engineered by Chakri &bull; Pure Browser WebRTC
          </p>
        </div>
      </footer>
    </div>
  );
}
