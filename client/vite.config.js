import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: 'all',
    hmr: {
      clientPort: 5173,
    },
    proxy: {
      '/location':  'http://localhost:3000',
      '/get_data':  'http://localhost:3000',
      '/mobile':    'http://localhost:3000',
      '/camstream': 'http://localhost:3000',
      '/camip':     'http://localhost:3000',
    },
  },
});
