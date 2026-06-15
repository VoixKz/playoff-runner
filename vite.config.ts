import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

const SKIN = process.env.SKIN === 'solana' ? 'solana' : 'original';

// Single self-contained HTML: inline ALL assets as base64 data-URIs (no separate
// fetches), inline JS + CSS. assetsInlineLimit:Infinity forces every asset inline.
export default defineConfig({
  base: './',
  define: {
    __SKIN__: JSON.stringify(SKIN),
  },
  build: {
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 8192,
    target: 'es2020',
    minify: 'esbuild',
  },
  plugins: [viteSingleFile({ removeViteModuleLoader: true })],
});
