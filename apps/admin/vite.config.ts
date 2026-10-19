import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@fastfood/shared-types': resolve(__dirname, '../../packages/shared-types/src/index.ts'),
      '@fastfood/utils': resolve(__dirname, '../../packages/utils/src/index.ts'),
    },
  },
  server: {
    port: 5175,
    proxy: { '/v1': { target: 'http://localhost:5000', changeOrigin: true } },
  },
});
