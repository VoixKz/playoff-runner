import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { fileURLToPath } from 'node:url';

const SKIN = process.env.SKIN === 'solana' ? 'solana' : 'original';

// Resolve `@skin` to the active skin module so each build bundles ONLY its own
// assets (keeps both HTML files small / under 5MB).
const skinModule = fileURLToPath(new URL(`./src/config/skins/${SKIN}.ts`, import.meta.url));

// Single self-contained HTML: inline ALL assets as base64 data-URIs (no separate
// fetches), inline JS + CSS. assetsInlineLimit:Infinity forces every asset inline.
export default defineConfig({
  base: './',
  define: {
    __SKIN__: JSON.stringify(SKIN),
  },
  resolve: {
    alias: { '@skin': skinModule },
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
