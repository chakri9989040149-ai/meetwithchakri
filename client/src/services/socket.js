import { io } from 'socket.io-client';

// Determine the backend socket URL based on environment variables or current window origin
const getSocketUrl = () => {
  // 1. Primary backend URL configured via VITE_BACKEND_URL
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL.replace(/\/api\/?$/, '').replace(/\/+$/, '');
  }

  // 2. Secondary / fallback environment variables
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL.replace(/\/+$/, '');
  }
  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL.replace(/\/+$/, '');
  }
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '').replace(/\/+$/, '');
  }
  
  // 3. Browser environment fallback (localhost/LAN detection vs origin)
  if (typeof window !== 'undefined') {
    const { hostname, port, protocol } = window.location;
    // If running in development (localhost, 127.0.0.1, or port 5173/3000), default to localhost:5000
    if (hostname === 'localhost' || hostname === '127.0.0.1' || port === '5173' || port === '3000') {
      return `${protocol}//${hostname}:5000`;
    }
    return window.location.origin;
  }

  // 4. Fallback for SSR or non-browser execution
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
