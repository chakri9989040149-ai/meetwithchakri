import { io } from 'socket.io-client';

// Determine the backend socket URL based on environment variables or current window origin
const getSocketUrl = () => {
  // 1. Explicit production/staging socket URL
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  // 2. Alternative server URL env variable
  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL;
  }
  // 3. API URL env variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
  }
  
  // 4. In development: if on localhost or LAN IP, default to port 5000 if not proxied
  if (typeof window !== 'undefined') {
    const { hostname, port } = window.location;
    // If client is on 5173 in dev without proxy, connect to port 5000 on the same host/IP
    if (port === '5173') {
      return `${window.location.protocol}//${hostname}:5000`;
    }
    return window.location.origin;
  }

  return 'http://localhost:5000';
};

let socket = null;

export const getSocket = () => {
  if (!socket) {
    const url = getSocketUrl();
    console.log('⚡ Initializing Socket.io connection to:', url);

    socket = io(url, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('✅ Connected to Chakri Meet signaling server with ID:', socket.id);
    });

    socket.on('connect_error', (error) => {
      console.warn('⚠️ Socket connection error:', error.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('⚡ Disconnected from signaling server:', reason);
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
