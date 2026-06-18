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

fs.rmSync(path.join(dist, 'original'), { recursive: true, force: true });
// Keep Pages from running Jekyll over the build artifacts.
fs.writeFileSync(path.resolve('docs/.nojekyll'), '');

if (!ok) {
  console.error('\nAssemble failed (missing output or bundle over 5MB).');
  process.exit(1);
}
console.log('\n✓ dist/ deliverables + docs/play/ shell artifacts ready.');
