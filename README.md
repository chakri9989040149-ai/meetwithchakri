# Chakri's Meet — Advanced Browser Video Meeting Platform

> **"Discuss and Create the New Things"**

A modern, high-performance, browser-only instant video meeting platform built with React, Vite, Tailwind CSS, Framer Motion, WebRTC, Node.js, Express, Socket.io, and PostgreSQL.

---

## 🌟 Key Features

### 1. 100% Browser-Native Experience
- **Zero Downloads**: No desktop software, no APKs, no browser extensions, and no mandatory account creation.
- **Instant Room Generation**: Create an instant meeting with a single click and share a unique link (`https://your-domain.com/room/chakri-xxxx-xxxx`).
- **Smart Public Link & Localhost Detector**: When running locally, warns that `localhost` is private and provides zero-config Cloudflare Tunnel support (`npx cloudflared tunnel --url http://localhost:5173`) and custom public URL overrides so friends on other devices and networks can join immediately.
- **Web Share API**: Native device share sheet integration with one-click clipboard fallback.

### 2. Custom 2-Screen Intro Sequence (`IntroSequence.jsx`)
- Screen 1: **"welcome to the chakri's meet"** with luxury light-theme aesthetics, glowing brand visuals, and smooth Framer Motion entrance.
- Screen 2: **"discuss and create the new things"** showcasing the creative workspace collaboration concept.
- Dedicated `/intro` route, skip intro, auto-advance, and `prefers-reduced-motion` accessibility support.

### 3. Pre-Join Meeting Lobby (`JoinPreview.jsx`)
- Real-time local camera video preview with horizontal mirroring.
- Web Audio API microphone volume meter reacting dynamically to the user's voice.
- Camera and microphone toggles before joining.
- Device selection dropdowns (audio/video inputs).
- Display name input and graceful fallback for denied permissions.

### 4. Real-Time WebRTC Audio & Video Mesh (`useWebRTC.js`)
- Real-time peer-to-peer audio and video streaming using browser `RTCPeerConnection`.
- Active speaker detection with dynamic purple glowing ring animation.
- Video off avatar placeholder with initials and subtle gradient.
- Native screen sharing via `getDisplayMedia` with automatic track replacement.
- Configurable STUN servers for NAT traversal.

### 5. "Create Together" In-Meeting Collaboration Hub
- **Smart Ideas Board (`SmartBoard.jsx`)**: Real-time collaborative HTML5 canvas whiteboard with pen, highlighter, shapes (rectangle, circle, line), eraser, sticky notes, color palette, and PNG export.
- **Live Polls (`LivePolls.jsx`)**: Instant question creator with real-time synchronized voting and percentage progress bars.
- **Collaborative Notes (`CollabNotes.jsx`)**: Synchronized shared notes for meeting minutes, decisions, and action items.
- **Meeting Agenda (`MeetingAgenda.jsx`)**: Checkable discussion points with progress completion tracker.

### 6. Interactive Engagement & Moderation
- **Live In-Call Chat**: Real-time text messages with timestamps, sender tags, auto-scroll, and unread counter badge.
- **Floating Reactions**: Animated emoji reactions (👍, 👏, ❤️, 😂, 🎉, 💡) that float up the screen in real-time.
- **Raise Hand**: Digital hand raise with audible alert and indicator badge.
- **Host Controls**: Host identification (👑), "Mute All", per-participant mute, remove participant (kick), and room locking.

---

## 📁 Project Structure

```text
chakris-meet/
│
├── client/                     # Frontend React + Vite application
│   ├── public/
│   │   └── logo.svg            # Custom modern Chakri's Meet SVG logo
│   ├── src/
│   │   ├── components/
│   │   │   ├── Logo.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── IntroSequence.jsx
│   │   │   ├── JoinPreview.jsx
│   │   │   ├── VideoTile.jsx
│   │   │   ├── MeetingControls.jsx
│   │   │   ├── ChatPanel.jsx
│   │   │   ├── ParticipantsPanel.jsx
│   │   │   └── create-together/
│   │   │       ├── SmartBoard.jsx
│   │   │       ├── LivePolls.jsx
│   │   │       ├── CollabNotes.jsx
│   │   │       └── MeetingAgenda.jsx
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   ├── CreateMeeting.jsx
│   │   │   ├── JoinMeeting.jsx
│   │   │   └── MeetingRoom.jsx
│   │   ├── hooks/
│   │   │   ├── useWebRTC.js
│   │   │   ├── useAudioMeter.js
│   │   │   └── useSocket.js
│   │   ├── services/
│   │   │   └── socket.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                     # Backend Express + Socket.io signaling
│   ├── index.js                # Server entry point
│   ├── socket/
│   │   └── meetingSocket.js    # Signaling & real-time collaboration events
│   ├── routes/
│   │   └── meetingRoutes.js    # REST API endpoints
│   ├── db/
│   │   └── index.js            # PostgreSQL pool with in-memory fallback
│   ├── package.json
│   └── .env.example
│
├── database/
│   └── schema.sql              # Complete PostgreSQL schema
│
├── README.md
└── package.json
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- [Node.js](https://nodejs.org/) v18+ (Tested with Node v24)
- npm or yarn

### 2. Installation
Install dependencies for both server and client:

```bash
# In the project root directory
npm run install:all
```

Or install individually:
```bash
cd server && npm install
cd ../client && npm install
```

### 3. Environment Variables
Create a `.env` file in `server/` (optional for local in-memory execution):

```env
PORT=5000
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/chakris_meet
```
*Note: If `DATABASE_URL` is omitted, the server automatically runs using its high-performance in-memory store so you can test immediately.*

### 4. Run Development Servers
From the root directory, run both frontend and backend concurrently:

```bash
npm run dev
```

Or run them in separate terminals:
- **Server**: `npm run dev:server` (Starts Express and Socket.io on port 5000)
- **Client**: `npm run dev:client` (Starts Vite on `http://localhost:5173`)

Open `http://localhost:5173` in your browser.

---

## 🧪 Testing Two-User Video Calls Locally

1. Open `http://localhost:5173` in your primary browser.
2. Click **"Create Instant Meeting"** -> Click **"Start Meeting"**.
3. Watch the custom 2-screen intro sequence or click **"Skip Intro"**.
4. In the pre-join lobby, verify your camera preview and microphone volume bar, enter your name, and click **"Join Meeting"**.
5. Click **"Copy Invite Link"** from the top bar.
6. Open an **Incognito / Private window** (or a second browser such as Edge/Firefox/Chrome).
7. Paste the invite link `http://localhost:5173/room/chakri-xxxx-xxxx`.
8. Enter a guest name (e.g. "Friend"), grant camera/mic access, and click **"Join Meeting"**.
9. **Result**: Both browser windows will display each other's live video feeds in the responsive video grid!
10. Test collaboration:
    - Draw on the **Smart Ideas Board** in Tab 1 -> see strokes appear instantly on Tab 2.
    - Send a chat message -> verify arrival and unread badge.
    - Create a **Live Poll** -> vote from Tab 2 and watch percentage bars update.
    - Send emoji reactions (🎉 ❤️ 💡) -> verify floating animations across screens.
    - Click **Share Screen** on Tab 1 -> see the shared screen spotlighted on Tab 2.

---

## 🔒 Production WebRTC & Deployment Considerations

### 1. STUN & TURN Servers
In local networks and simple NAT environments, public STUN servers (`stun:stun.l.google.com:19302`) enable direct peer connection. For users behind restrictive corporate firewalls or symmetric NATs, a **TURN (Traversal Using Relays around NAT)** server is required. Recommended production services include:
- [Coturn](https://github.com/coturn/coturn) (Self-hosted open-source TURN server)
- [Twilio Network Traversal Service](https://www.twilio.com/stun-turn)
- [Xirsys](https://xirsys.com/)

Configure TURN credentials in `client/src/hooks/useWebRTC.js`:
```javascript
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:your-turn-server.com:3478',
      username: 'turn_user',
      credential: 'turn_password'
    }
  ]
};
```

### 2. Multi-User Scalability (SFU Architecture)
The included WebRTC mesh implementation provides optimal direct peer-to-peer performance for small meetings (up to ~6 participants). For large-scale conferences (20 to 100+ simultaneous video streams), media should be routed through a Selective Forwarding Unit (SFU) such as **LiveKit**, **mediasoup**, or **Janus**.

### 3. HTTPS Requirement
Modern browsers require HTTPS (or `localhost`) to access `navigator.mediaDevices.getUserMedia` and `navigator.mediaDevices.getDisplayMedia`. Ensure your production domain has an SSL/TLS certificate enabled (e.g., via Let's Encrypt / Cloudflare).

---

## 📄 License
MIT License &copy; Chakri
