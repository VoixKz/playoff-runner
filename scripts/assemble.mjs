// Post-build: place the playable + generate the published docs/ site.
//   dist/index.html      — the deliverable (bare self-contained playable, ≤5 MB)
//   docs/playable.html   — same bare playable, published
//   docs/index.html      — device-frame shell with the game inlined (srcdoc) → the
//                          live showcase; works online and offline as one file
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');
const docs = path.resolve('docs');
fs.mkdirSync(docs, { recursive: true });

const MAX = 5 * 1024 * 1024;
const built = path.join(dist, 'original/index.html'); // vite output
if (!fs.existsSync(built)) {
  console.error('✗ missing build output (did `vite build` run?)');
  process.exit(1);
}

// 1) Bare playable — the deliverable.
fs.copyFileSync(built, path.join(dist, 'index.html'));
fs.copyFileSync(built, path.join(docs, 'playable.html'));
const bytes = fs.statSync(path.join(dist, 'index.html')).size;
let ok = bytes <= MAX;
console.log(
  `${ok ? '✓' : '✗ OVER 5MB'} dist/index.html  ${(bytes / 1024 / 1024).toFixed(2)} MB  → docs/playable.html`,
);

// 2) Showcase — the shell with the playable inlined into the iframe (srcdoc).
const IFRAME = '<iframe id="game" title="playable" allow="autoplay"></iframe>';
const shell = fs.readFileSync(path.resolve('scripts/shell.html'), 'utf8');
const playable = fs.readFileSync(built, 'utf8');
if (!shell.includes(IFRAME)) {
  console.error('✗ shell iframe tag not found in scripts/shell.html');
  ok = false;
} else {
  const esc = playable.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  // Concatenate + use a function replacer so '$' sequences in the minified game
  // JS aren't interpreted as String.replace patterns ($&, $1, …).
  const framed = '<iframe id="game" title="playable" allow="autoplay" srcdoc="' + esc + '"></iframe>';
  fs.writeFileSync(path.join(docs, 'index.html'), shell.replace(IFRAME, () => framed));
  console.log('✓ docs/index.html  (device frames + game inlined — works offline)');
}

// Cleanup: old structure + vite temp dir; keep Pages from running Jekyll.
fs.rmSync(path.join(docs, 'play'), { recursive: true, force: true });
fs.rmSync(path.join(docs, 'preview.html'), { force: true });
fs.rmSync(path.join(dist, 'preview.html'), { force: true });
fs.rmSync(path.join(dist, 'original'), { recursive: true, force: true });
fs.writeFileSync(path.join(docs, '.nojekyll'), '');

if (!ok) {
  console.error('\nAssemble failed (missing output or over 5 MB).');
  process.exit(1);
}
console.log('\n✓ dist/index.html (deliverable) + docs/ (live site: index = showcase, playable.html = bare) ready.');
