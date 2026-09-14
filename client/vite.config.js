import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/meetwithchakri/',
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    allowedHosts: true, // Allow tunnel hosts (trycloudflare.com, ngrok, localtunnel, etc.)
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true
      }
    }
  }
});
