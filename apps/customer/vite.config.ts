import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.VITE_API_URL ?? 'http://localhost:5000';

  return {
    plugins: [react()],
    // './' needed for Capacitor APK; Vercel works fine with it too
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
      // Proxy only runs in dev (localhost) — in production the app calls VITE_API_URL directly
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
    // Expose VITE_API_URL to the app at build time
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
    },
  };
});

