import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// When frontend runs in Docker, proxy to backend service. When local, proxy to localhost:8005.
const proxyTarget = process.env.VITE_PROXY_TARGET || 'http://localhost:8005';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    watch: {
      usePolling: true,
    },
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 3005,
  },
});
