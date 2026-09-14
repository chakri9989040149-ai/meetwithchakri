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

// CORS configuration for both dev and production
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    // In development or if explicitly allowed via CLIENT_URL / CORS_ORIGIN
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    const allowedOrigins = [
      CLIENT_URL,
      process.env.CORS_ORIGIN,
      'http://localhost:5173',
      'http://localhost:3000'
    ].filter(Boolean);

    // Also match any vercel preview domains if configured
    if (allowedOrigins.some(o => origin.startsWith(o)) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }

    // Default allow with origin reflection for WebRTC flexibility
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
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
