import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import meetingRoutes from './routes/meetingRoutes.js';
import { setupMeetingSocket } from './socket/meetingSocket.js';
import { inMemoryStore } from './db/index.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || process.env.CORS_ORIGIN || 'http://localhost:5173';

// Determine if an incoming origin is allowed
const isOriginAllowed = (origin) => {
  // Allow requests with no origin (like mobile apps, curl, server-to-server)
  if (!origin) return true;

  // Always allow in non-production environments
  if (process.env.NODE_ENV !== 'production') return true;

  // Configured allowed origins list
  const configuredOrigins = [
    CLIENT_URL,
    process.env.CORS_ORIGIN,
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()) : []),
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ].filter(Boolean);

  if (configuredOrigins.some(allowed => origin === allowed || origin.startsWith(allowed))) {
    return true;
  }

  // Public deployment hosts (GitHub Pages, Vercel, Netlify, Cloudflare tunnels)
  if (
    origin.endsWith('.github.io') ||
    origin.endsWith('.vercel.app') ||
    origin.endsWith('.netlify.app') ||
    origin.endsWith('.trycloudflare.com')
  ) {
    return true;
  }

  // Permissive fallback so signaling works across public networks
  return true;
};

// CORS configuration for both dev and production
app.use(cors({
  origin: (origin, callback) => {
    callback(null, isOriginAllowed(origin) ? true : false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      callback(null, isOriginAllowed(origin) ? true : false);
    },
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Setup socket signaling and collaborative logic
setupMeetingSocket(io);

// API Routes
app.use('/api', meetingRoutes);

// ICE / STUN / TURN credentials endpoint
app.get('/api/ice-servers', (req, res) => {
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ];

  if (process.env.TURN_SERVER_URL) {
    iceServers.push({
      urls: process.env.TURN_SERVER_URL,
      username: process.env.TURN_USERNAME || '',
      credential: process.env.TURN_CREDENTIAL || ''
    });
  }

  res.json({
    success: true,
    iceServers
  });
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: "Chakri's Meet Server",
    tagline: 'Discuss and Create the New Things',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    activeRooms: inMemoryStore.meetings.size,
    onlineParticipants: inMemoryStore.participants.size
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('========================================================');
  console.log("CHAKRI'S MEET — REAL-TIME SIGNALING & MEDIA SERVER");
  console.log('"Discuss and Create the New Things"');
  console.log(`🚀 Server listening on port ${PORT} (0.0.0.0)`);
  console.log(`🌐 Health endpoint: http://localhost:${PORT}/api/health`);
  console.log(`📡 ICE Servers endpoint: http://localhost:${PORT}/api/ice-servers`);
  console.log('========================================================');
});

export { app, server, io };
