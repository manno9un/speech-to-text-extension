import { defineConfig } from 'vite';
import { resolve } from 'path';

// Dedicated build for the background service worker.
// Building it via the main multi-page build injects Vite's module-preload
// polyfill, which references `document` and crashes in a service worker
// (which has no DOM). A standalone library build avoids that entirely and
// emits a clean ES module.
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@services': resolve(__dirname, './src/services'),
      '@utils': resolve(__dirname, './src/utils'),
      '@types': resolve(__dirname, './src/types'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/background/background.ts'),
      formats: ['es'],
      fileName: () => 'background.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
