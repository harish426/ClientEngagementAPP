import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  base: './', // Ensures relative asset paths work on GitHub Pages and custom subpaths
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
