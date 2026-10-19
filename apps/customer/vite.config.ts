import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  // IMPORTANT: base must be './' for Capacitor to work (resolves from dist/)
  base: './',
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@fastfood/shared-types': resolve(__dirname, '../../packages/shared-types/src/index.ts'),
      '@fastfood/utils': resolve(__dirname, '../../packages/utils/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/v1': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query'],
          maps: ['leaflet', 'react-leaflet'],
        },
      },
    },
  },
});
