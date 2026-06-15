// Assemble the two single-file builds into dist/: index.html (clone) + solana.html (reskin).
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');
const map = [
  ['original/index.html', 'index.html'],
  ['solana/index.html', 'solana.html'],
];

const MAX = 5 * 1024 * 1024;
let ok = true;
for (const [src, dest] of map) {
  const from = path.join(dist, src);
  const to = path.join(dist, dest);
  if (!fs.existsSync(from)) {
    console.error(`✗ missing build output: ${src} (did the build run?)`);
    ok = false;
    continue;
  }
  fs.copyFileSync(from, to);
  const bytes = fs.statSync(to).size;
  const mb = (bytes / 1024 / 1024).toFixed(2);
  const flag = bytes > MAX ? '✗ OVER 5MB' : '✓';
  if (bytes > MAX) ok = false;
  console.log(`${flag} dist/${dest.padEnd(12)} ${mb} MB (${bytes} bytes)`);
}

// Clean up the per-skin subdirs so dist/ holds only the two deliverables.
for (const sub of ['original', 'solana']) {
  fs.rmSync(path.join(dist, sub), { recursive: true, force: true });
}

if (!ok) {
  console.error('\nAssemble failed (missing output or bundle over 5MB).');
  process.exit(1);
}
console.log('\n✓ dist/index.html (clone) + dist/solana.html (reskin) ready.');
