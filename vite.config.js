import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: { chunkSizeWarningLimit: 3500 }, // Pokémon data is large; learnsets load lazily and are never fetched
  server: {
    // Same proxy as vercel.json, so pokepast.es links work while developing locally
    proxy: {
      '/pp': {
        target: 'https://pokepast.es',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/pp/, ''),
      },
    },
  },
});
