// Assemble the two single-file builds into dist/ (deliverables) and docs/play/
// (served by the GitHub Pages device-preview shell at docs/index.html).
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');
const docsPlay = path.resolve('docs/play');
fs.mkdirSync(docsPlay, { recursive: true });

const map = [
  { src: 'original/index.html', dist: 'index.html', play: 'original.html' },
];

const MAX = 5 * 1024 * 1024;
let ok = true;
for (const m of map) {
  const from = path.join(dist, m.src);
  if (!fs.existsSync(from)) {
    console.error(`✗ missing build output: ${m.src} (did the build run?)`);
    ok = false;
    continue;
  }
  fs.copyFileSync(from, path.join(dist, m.dist));
  fs.copyFileSync(from, path.join(docsPlay, m.play));
  const bytes = fs.statSync(path.join(dist, m.dist)).size;
  const mb = (bytes / 1024 / 1024).toFixed(2);
  const flag = bytes > MAX ? '✗ OVER 5MB' : '✓';
  if (bytes > MAX) ok = false;
  console.log(`${flag} dist/${m.dist.padEnd(12)} ${mb} MB  → docs/play/${m.play}`);
}

// Self-contained framed preview: inline the playable into the device-shell iframe
// via `srcdoc` → ONE standalone HTML (device frames + game) that opens offline.
const IFRAME = '<iframe id="game" title="playable" allow="autoplay"></iframe>';
const shell = fs.readFileSync(path.resolve('docs/index.html'), 'utf8');
const playable = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
if (!shell.includes(IFRAME)) {
  console.error('✗ device-shell iframe tag not found — cannot build preview.html');
  ok = false;
} else {
  const esc = playable.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  // Build by concatenation + use a function replacer so '$' sequences in the
  // minified game JS aren't interpreted as String.replace patterns ($&, $1, …).
  const framed = '<iframe id="game" title="playable" allow="autoplay" srcdoc="' + esc + '"></iframe>';
  const preview = shell.replace(IFRAME, () => framed);
  fs.writeFileSync(path.join(dist, 'preview.html'), preview);
  fs.writeFileSync(path.resolve('docs/preview.html'), preview);
  const mb = (Buffer.byteLength(preview) / 1024 / 1024).toFixed(2);
  console.log(`✓ dist/preview.html  ${mb} MB  (self-contained: device frames + game) → docs/preview.html`);
}

fs.rmSync(path.join(dist, 'original'), { recursive: true, force: true });
// Keep Pages from running Jekyll over the build artifacts.
fs.writeFileSync(path.resolve('docs/.nojekyll'), '');

if (!ok) {
  console.error('\nAssemble failed (missing output or bundle over 5MB).');
  process.exit(1);
}
console.log('\n✓ dist/ deliverables + docs/play/ shell artifacts ready.');
