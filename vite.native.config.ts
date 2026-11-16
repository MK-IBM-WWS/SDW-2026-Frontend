import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// A separate build preserves lab 7 PWA/Pages behavior. Native builds never use its proxy or SW.
export default defineConfig({
 plugins: [react(), {
  name: 'native-entry',
  transformIndexHtml: { order: 'pre', handler(html) { return html.replace('/src/main.tsx','/src/native/main.tsx').replace(/<link rel="manifest"[^>]*>/, ''); } },
 }],
 base: './',
 publicDir: 'native-public',
 worker: { format: 'es' },
 build: { outDir: 'dist-native', emptyOutDir: true },
 server: { host: '0.0.0.0', port: 3001, strictPort: true },
});
