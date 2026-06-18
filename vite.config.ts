import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Single self-contained HTML: inline ALL assets as base64 data-URIs (no separate
// fetches), inline JS + CSS. assetsInlineLimit:Infinity forces every asset inline.
export default defineConfig({
  base: './',
  build: {
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 8192,
    target: 'es2020',
    minify: 'esbuild',
  },
  plugins: [viteSingleFile({ removeViteModuleLoader: true })],
});
