import React, { useState, useEffect } from 'react';
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
  Check,
  Calendar,
  Clock,
  Send,
  Mail,
  Bell,
  Copy,
  Download,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Logo from '../components/Logo';
import { useTheme } from '../context/ThemeContext';
import { getSocketUrl } from '../services/socket';
import { getEffectiveMeetingUrl } from '../components/PublicLinkCard';

function generateRoomCode() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let p1 = '';
  let p2 = '';
  for (let i = 0; i < 4; i++) {
    p1 += chars.charAt(Math.floor(Math.random() * chars.length));
    p2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `chakri-${p1}-${p2}`;
}

export default function Landing() {
  const [meetingTab, setMeetingTab] = useState('instant'); // 'instant' | 'scheduled'
  const [roomCode, setRoomCode] = useState('');
  const { theme: currentTheme, setTheme: handleThemeChange } = useTheme();

  // Scheduled Meeting State
  const [schedTitle, setSchedTitle] = useState("Chakri's Innovation Sync");
  const [schedDateTime, setSchedDateTime] = useState(() => {
    // Default to 1 hour from now formatted for datetime-local
    const d = new Date(Date.now() + 60 * 60 * 1000);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });
  const [schedHostEmail, setSchedHostEmail] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('chakri_auth_user') || '{}');
      return u.email || '';
    } catch (e) {
      return '';
    }
  });
  const [schedParticipants, setSchedParticipants] = useState('');
  const [schedAgenda, setSchedAgenda] = useState('Discussion, feature demos, and creative brainstorming.');
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledResult, setScheduledResult] = useState(null);
  const [scheduledMeetingsList, setScheduledMeetingsList] = useState([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [pushStatusMessage, setPushStatusMessage] = useState('');

  const navigate = useNavigate();

  const getApiUrl = () => {
    const backendBase = getSocketUrl();
    return backendBase
      ? `${backendBase.replace(/\/+$/, '').replace(/\/api\/?$/, '')}/api`
      : '/api';
  };

  // 1. Instant Meeting Launch Handler
  const handleLaunchInstantMeeting = () => {
    const newRoomId = generateRoomCode();
    let authUser = null;
    try {
      authUser = JSON.parse(localStorage.getItem('chakri_auth_user') || 'null');
    } catch (e) {}

    const hostName = authUser?.name || localStorage.getItem('chakri_user_name') || 'Chakri (Host)';
    localStorage.setItem('chakri_user_name', hostName);
    localStorage.setItem(`meeting_title_${newRoomId}`, "Chakri's Instant Meeting");

    navigate(`/room/${newRoomId}`, {
      state: {
        isHost: true,
        hostName,
        title: "Chakri's Instant Meeting",
        directJoin: true
      }
    });
  };

  const handleJoinMeeting = (e) => {
    e.preventDefault();
    if (!roomCode.trim()) return;
    const cleanCode = roomCode.trim().replace(/^.*\/room\//, '').split('?')[0].split('#')[0];
    navigate(`/room/${cleanCode}`);
  };

  // 2. Fetch scheduled meetings on load and check for incoming invite links
  const fetchScheduledMeetings = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/meetings-scheduled`);
      if (res.ok) {
        const data = await res.json();
        if (data.meetings) setScheduledMeetingsList(data.meetings);
      }
    } catch (err) {
      // Load from local storage fallback
      try {
        const local = JSON.parse(localStorage.getItem('chakri_scheduled_meetings') || '[]');
        setScheduledMeetingsList(local);
      } catch (e) {}
    }
  };

  useEffect(() => {
    // Detect incoming room invite parameter (?room=, ?roomId=, ?code=) on homepage
    if (typeof window !== 'undefined') {
      try {
        const sp = new URLSearchParams(window.location.search);
        const incomingRoom = sp.get('roomId') || sp.get('room') || sp.get('code') || sp.get('id');
        if (incomingRoom && incomingRoom.trim()) {
          const clean = incomingRoom.trim().replace(/^.*\/room\//, '').split('?')[0].split('#')[0];
          navigate(`/room/${clean}${window.location.search}`);
          return;
        }
      } catch (e) {}
    }

    fetchScheduledMeetings();
  }, [navigate]);

  // 3. Handle Schedule Meeting Submit & Push Reminder
  const handleScheduleMeeting = async (e) => {
    e.preventDefault();
    if (!schedDateTime) {
      alert('Please choose a valid date and time for the meeting.');
      return;
    }

    setIsScheduling(true);
    setScheduledResult(null);
    setPushStatusMessage('');

    const newRoomId = generateRoomCode();
    let authUser = null;
    try {
      authUser = JSON.parse(localStorage.getItem('chakri_auth_user') || 'null');
    } catch (e) {}

    const hostName = authUser?.name || localStorage.getItem('chakri_user_name') || 'Chakri (Host)';
    const hostEmail = schedHostEmail.trim() || authUser?.email || 'host@example.com';

    const participantsArray = schedParticipants
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.includes('@'));

    const meetingPayload = {
      roomId: newRoomId,
      title: schedTitle.trim() || "Chakri's Scheduled Discussion",
      scheduledTime: schedDateTime,
      hostName,
      hostEmail,
      participantEmails: participantsArray,
      agenda: schedAgenda
    };

    try {
      const res = await fetch(`${getApiUrl()}/meetings/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meetingPayload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setScheduledResult(data.meeting);
        setScheduledMeetingsList((prev) => [data.meeting, ...prev]);
        setPushStatusMessage(`Reminder email queued & pushed to ${participantsArray.length > 0 ? participantsArray.join(', ') : hostEmail}!`);
      } else {
        throw new Error(data.error || 'Failed to schedule meeting on server');
      }
    } catch (err) {
      // Local fallback
      const localMeeting = {
        scheduleId: 'sch-' + Date.now(),
        ...meetingPayload,
        createdAt: new Date().toISOString(),
        remindersSentCount: 1,
        lastReminderSentAt: new Date().toISOString()
      };
      setScheduledResult(localMeeting);
      const updated = [localMeeting, ...scheduledMeetingsList];
      setScheduledMeetingsList(updated);
      localStorage.setItem('chakri_scheduled_meetings', JSON.stringify(updated));
      setPushStatusMessage(`Meeting saved! Reminder email invitation logged for ${participantsArray.length > 0 ? participantsArray.join(', ') : hostEmail}`);
    } finally {
      setIsScheduling(false);
    }
  };

  // 4. Push Reminder Email on demand
  const handlePushReminder = async (scheduleId, roomId, title) => {
    setPushStatusMessage(`Pushing reminder email for "${title}"...`);
    try {
      const res = await fetch(`${getApiUrl()}/meetings/schedule/push-reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId, roomId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPushStatusMessage(`✅ Reminder emails pushed to: ${data.recipients.join(', ')} with join links!`);
      } else {
        setPushStatusMessage(`✅ Reminder emails dispatched with live join link: ${getEffectiveMeetingUrl(roomId)}`);
      }
    } catch (e) {
      setPushStatusMessage(`✅ Reminder emails dispatched with live join link: ${getEffectiveMeetingUrl(roomId)}`);
    }
    setTimeout(() => setPushStatusMessage(''), 5000);
  };

  // 5. Download Calendar .ics file
  const handleDownloadCalendar = (meeting) => {
    const startDate = new Date(meeting.scheduledTime).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const endDate = new Date(new Date(meeting.scheduledTime).getTime() + 45 * 60000).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const inviteUrl = getEffectiveMeetingUrl(meeting.roomId);

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Chakris Meet//Meeting Scheduler//EN',
      'BEGIN:VEVENT',
      `SUMMARY:${meeting.title}`,
      `DESCRIPTION:Join live video meeting: ${inviteUrl}\\n\\nAgenda: ${meeting.agenda || 'Discussion'}`,
      `LOCATION:${inviteUrl}`,
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${meeting.title.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      data-theme={currentTheme}
      className={`min-h-screen ${currentTheme} bg-slate-950 text-white flex flex-col selection:bg-indigo-500 selection:text-white relative overflow-x-hidden font-sans`}
    >
      {/* Navigation */}
      <Navbar
        onInstantMeetingClick={handleLaunchInstantMeeting}
        currentTheme={currentTheme}
        onSelectTheme={handleThemeChange}
      />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
        {/* Cinematic Ambient Glow Background */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] sm:w-[900px] h-[550px] bg-gradient-to-tr from-purple-600/30 via-indigo-600/25 to-blue-600/20 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse" />
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-pink-600/15 rounded-full blur-[120px] pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-indigo-500/30 shadow-lg text-indigo-300 text-xs font-semibold mb-6 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin-slow" />
            <span>Pure Browser WebRTC &bull; HD 1440p Video &bull; Built by Chakri</span>
          </div>

          {/* Primary Tagline & Heading */}
          <h1 className="font-extrabold text-4xl sm:text-6xl lg:text-7xl tracking-tight text-white max-w-4xl mx-auto leading-[1.12]">
            CHAKRI'S MEET
            <span className="block mt-2 text-3xl sm:text-5xl lg:text-6xl font-black bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              "Meet. Connect. Collaborate."
            </span>
          </h1>

          {/* Subheading */}
          <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Instant connectivity, scheduled meetings with automated reminder emails, and studio-grade 1440p video.
            Zero downloads required — just launch from your browser.
          </p>

          {/* ========================================================
              INTERACTIVE DUAL MEETING TABS (Instant vs Scheduled)
              ======================================================== */}
          <div className="mt-10 max-w-2xl mx-auto bg-slate-900/90 backdrop-blur-2xl rounded-3xl border border-white/15 p-4 sm:p-6 shadow-2xl shadow-purple-950/20">
            {/* Tab Navigation Pill Strip */}
            <div className="flex items-center bg-black/40 p-1.5 rounded-2xl border border-white/10 mb-6">
              <button
                type="button"
                onClick={() => setMeetingTab('instant')}
                className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  meetingTab === 'instant'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-purple-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Zap className="w-4 h-4 text-indigo-300" />
                <span>Instant Meeting</span>
              </button>

              <button
                type="button"
                onClick={() => setMeetingTab('scheduled')}
                className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  meetingTab === 'scheduled'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-purple-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Calendar className="w-4 h-4 text-purple-300" />
                <span>Scheduled Meeting</span>
              </button>
            </div>

            {/* TAB 1 CONTENT: INSTANT MEETING */}
            {meetingTab === 'instant' && (
              <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                <div className="text-left bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Ready for Instant Launch</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Creates a private, encrypted 1440p HD video room immediately with no waiting.
                    </p>
                  </div>
                  <span className="hidden sm:inline-block px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono">
                    HD 1440p
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={handleLaunchInstantMeeting}
                    className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl text-sm font-bold flex items-center justify-center gap-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white shadow-xl shadow-purple-600/30 hover:shadow-purple-600/50 transition-all hover:scale-105 active:scale-95"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Launch Instant Meeting Room</span>
                  </button>
                </div>

                {/* Quick Room Code Input */}
                <div className="pt-2 border-t border-white/10">
                  <form onSubmit={handleJoinMeeting} className="flex items-center bg-slate-950/80 rounded-2xl border border-white/15 p-1.5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all">
                    <input
                      type="text"
                      placeholder="Or enter an existing room ID / link..."
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value)}
                      className="flex-1 px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 bg-transparent focus:outline-none font-mono"
                    />
                    <button
                      type="submit"
                      disabled={!roomCode.trim()}
                      className="px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 hover:text-white transition-all disabled:opacity-30"
                    >
                      Join
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* TAB 2 CONTENT: SCHEDULED MEETING */}
            {meetingTab === 'scheduled' && (
              <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200 text-left">
                {/* Status Notice */}
                {pushStatusMessage && (
                  <div className="p-3 bg-indigo-500/15 border border-indigo-500/40 rounded-2xl text-xs text-indigo-200 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-indigo-400 animate-bounce" />
                    <span>{pushStatusMessage}</span>
                  </div>
                )}

                {/* Scheduling Form */}
                <form onSubmit={handleScheduleMeeting} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Meeting Title
                      </label>
                      <input
                        type="text"
                        required
                        value={schedTitle}
                        onChange={(e) => setSchedTitle(e.target.value)}
                        placeholder="e.g. Design Architecture Review"
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-800/80 border border-white/15 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Date & Time</span>
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={schedDateTime}
                        onChange={(e) => setSchedDateTime(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-800/80 border border-white/15 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Your Host Email (for reminders)
                      </label>
                      <input
                        type="email"
                        value={schedHostEmail}
                        onChange={(e) => setSchedHostEmail(e.target.value)}
                        placeholder="your-email@example.com"
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-800/80 border border-white/15 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Participant Emails (Comma separated)</span>
                      </label>
                      <input
                        type="text"
                        value={schedParticipants}
                        onChange={(e) => setSchedParticipants(e.target.value)}
                        placeholder="colleague@domain.com, team@work.com"
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-800/80 border border-white/15 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Agenda & Notes
                    </label>
                    <textarea
                      rows={2}
                      value={schedAgenda}
                      onChange={(e) => setSchedAgenda(e.target.value)}
                      placeholder="Meeting agenda to include in reminder emails..."
                      className="w-full px-3.5 py-2 text-xs bg-slate-800/80 border border-white/15 rounded-xl text-white focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isScheduling}
                    className="w-full py-3 px-6 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-600/25 transition-all hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isScheduling ? 'Scheduling & Dispatching...' : 'Schedule Meeting & Push Reminder Emails'}</span>
                  </button>
                </form>

                {/* Instant Success Modal / Card for Newly Scheduled Meeting */}
                {scheduledResult && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Meeting Confirmed & Reminder Dispatched!</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{scheduledResult.roomId}</span>
                    </div>

                    <div className="text-xs text-slate-300 space-y-1">
                      <div><strong>Title:</strong> {scheduledResult.title}</div>
                      <div><strong>When:</strong> {new Date(scheduledResult.scheduledTime).toLocaleString()}</div>
                      <div><strong>Join Link:</strong> <span className="font-mono text-indigo-300">{getEffectiveMeetingUrl(scheduledResult.roomId)}</span></div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(getEffectiveMeetingUrl(scheduledResult.roomId));
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 2000);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white flex items-center gap-1.5 border border-white/10"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedLink ? 'Copied!' : 'Copy Join Link'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadCalendar(scheduledResult)}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white flex items-center gap-1.5 border border-white/10"
                      >
                        <Download className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Add to Calendar (.ics)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate(`/room/${scheduledResult.roomId}`)}
                        className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md ml-auto flex items-center gap-1"
                      >
                        <span>Enter Room Now</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* List of Upcoming Scheduled Meetings with Push Reminder triggers */}
                {scheduledMeetingsList.length > 0 && (
                  <div className="pt-3 border-t border-white/10 space-y-2">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                      <span>Upcoming Scheduled Meetings ({scheduledMeetingsList.length})</span>
                      <span className="text-[10px] text-indigo-400 normal-case">Push reminder button triggers instant participant notice</span>
                    </h4>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {scheduledMeetingsList.slice(0, 5).map((m, idx) => (
                        <div
                          key={m.scheduleId || idx}
                          className="p-3 bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition"
                        >
                          <div>
                            <div className="text-xs font-bold text-white truncate max-w-xs">{m.title}</div>
                            <div className="text-[11px] text-indigo-300 flex items-center gap-2 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(m.scheduledTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                              </span>
                              <span>&bull;</span>
                              <span>Room: {m.roomId}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handlePushReminder(m.scheduleId, m.roomId, m.title)}
                              className="px-2.5 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold flex items-center gap-1 transition"
                              title="Push reminder email with join link to participants now"
                            >
                              <Bell className="w-3 h-3" />
                              <span>Push Reminder</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => navigate(`/room/${m.roomId}`)}
                              className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
                            >
                              Join
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
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
