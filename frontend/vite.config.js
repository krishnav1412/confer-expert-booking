import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('react-router')) return 'router';
          if (id.includes('@tanstack')) return 'query';
          if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) return 'forms';
          if (id.includes('react-hot-toast')) return 'toast';
          if (id.includes('react-dom') || id.includes('/react/') || id.endsWith('/react')) return 'react';
          return 'vendor';
        },
      },
    },
  },
});
