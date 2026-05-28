import { defineConfig } from 'vite';
import { resolve } from 'path';

// Dedicated build for the content script.
// Chrome content scripts must be a single self-contained file: no runtime ES
// module imports, no code-splitting. We force everything into one IIFE and
// write it to dist/content.js, appending to the main build's output.
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
    // Do NOT clear dist here — the main build runs first and we append to it.
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/content/content.ts'),
      name: 'SpeechToTextContent',
      formats: ['iife'],
      fileName: () => 'content.js',
    },
    rollupOptions: {
      output: {
        // Force a single bundle — no shared chunks.
        inlineDynamicImports: true,
        extend: true,
      },
    },
  },
});
