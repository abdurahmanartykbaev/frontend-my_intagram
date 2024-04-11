import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build',
    chunkSizeWarningLimit: 1600
  },
  resolve: {
    alias: {
      'react-query/devtools': 'react-query/es/devtools/index'
    }
  }
});
