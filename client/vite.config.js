import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function copy404Plugin() {
  return {
    name: 'copy-404-html',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist');
      const indexPath = path.resolve(distDir, 'index.html');
      const notFoundPath = path.resolve(distDir, '404.html');
      if (fs.existsSync(indexPath)) {
        fs.copyFileSync(indexPath, notFoundPath);
      }
    }
  };
}

export default defineConfig({
  base: '/meetwithchakri/',
  plugins: [react(), copy404Plugin()],
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
