import { io } from 'socket.io-client';

// Determine the backend socket URL based on environment variables, URL params, or defaults
export const getSocketUrl = () => {
  // 1. Explicit URL parameter (?backend=https://... or ?server=https://...)
  if (typeof window !== 'undefined') {
    try {
      const params = new URLSearchParams(window.location.search);
      const queryBackend = params.get('backend') || params.get('server');
      if (queryBackend) {
        const clean = decodeURIComponent(queryBackend).replace(/\/api\/?$/, '').replace(/\/+$/, '');
        localStorage.setItem('chakri_backend_url', clean);
        return clean;
      }
    } catch (e) {}
  }

  // 2. If running locally (localhost, 127.0.0.1, or client dev port 5173/3000), always connect to local signaling server
  if (typeof window !== 'undefined') {
    const { hostname, port, protocol } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || port === '5173' || port === '3000') {
      return `${protocol}//${hostname}:5000`;
    }
  }

  // 3. Primary backend URL configured via VITE_BACKEND_URL
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL.replace(/\/api\/?$/, '').replace(/\/+$/, '');
  }

  // 4. Stored user backend URL in localStorage (ignore dead/ephemeral trycloudflare tunnels)
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('chakri_backend_url');
    if (saved && !saved.includes('trycloudflare.com')) {
      return saved.replace(/\/api\/?$/, '').replace(/\/+$/, '');
    }
  }

  // 5. Secondary environment variables
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL.replace(/\/+$/, '');
  }
  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL.replace(/\/+$/, '');
  }
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '').replace(/\/+$/, '');
  }

  // 6. Default fallback
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
