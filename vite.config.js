import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        multiplayer: resolve(import.meta.dirname, 'multiplayer.html'),
      },
    },
  },
});