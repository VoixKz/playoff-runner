// Generates the Solana/"Toly" reskin art (SVG -> PNG via sharp) into assets/solana/.
// Theme: Solana purple (#9945FF) → teal (#14F195) on a neon-night palette.
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('assets/solana');
fs.mkdirSync(OUT, { recursive: true });

const PURPLE = '#9945FF';
const TEAL = '#14F195';

async function render(name, w, h, svg) {
  await sharp(Buffer.from(svg)).resize(w, h).png().toFile(path.join(OUT, name));
  console.log('  ✓', name, `${w}x${h}`);
}

/** The Solana mark: three slanted bars. */
function solMark(cx, cy, scale, gradId) {
  const bw = 150 * scale;
  const bh = 34 * scale;
  const skew = 26 * scale;
  const gap = 50 * scale;
  const bar = (y) =>
    `<path d="M ${cx - bw / 2 + skew},${y} L ${cx + bw / 2 + skew},${y} L ${cx + bw / 2 - skew},${y + bh} L ${cx - bw / 2 - skew},${y + bh} Z" fill="url(#${gradId})"/>`;
  return bar(cy - gap - bh / 2) + bar(cy - bh / 2) + bar(cy + gap - bh / 2);
}

// ---------- background (neon Solana skyline) ----------
function buildings() {
  let out = '';
  const base = 560;
  let x = -20;
  let i = 0;
  const widths = [120, 80, 160, 100, 140, 90, 180, 110, 130, 95, 150, 85, 170, 120, 140];
  const heights = [220, 320, 160, 260, 200, 300, 140, 240, 280, 180, 230, 330, 170, 250, 210];
  while (x < 1727) {
    const w = widths[i % widths.length];
    const bh = heights[i % heights.length];
    const neon = i % 2 === 0 ? PURPLE : TEAL;
    out += `<rect x="${x}" y="${base - bh}" width="${w - 8}" height="${bh}" fill="#160d2b"/>`;
    out += `<rect x="${x}" y="${base - bh}" width="${w - 8}" height="4" fill="${neon}" opacity="0.9"/>`;
    // a couple of lit windows
    out += `<rect x="${x + 12}" y="${base - bh + 24}" width="10" height="14" fill="${neon}" opacity="0.5"/>`;
    out += `<rect x="${x + w - 30}" y="${base - bh + 60}" width="10" height="14" fill="${neon}" opacity="0.4"/>`;
    x += w;
    i++;
  }
  return out;
}
const stars = Array.from({ length: 60 }, (_, i) => {
  const x = (i * 137) % 1707;
  const y = (i * 61) % 420;
  const r = (i % 3) * 0.6 + 0.6;
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="#cfc2ff" opacity="${0.3 + (i % 4) * 0.15}"/>`;
}).join('');

const bgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1707" height="704" viewBox="0 0 1707 704">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#080614"/>
      <stop offset="0.45" stop-color="#1a0b35"/>
      <stop offset="0.78" stop-color="#3b1d63"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.82" r="0.7">
      <stop offset="0" stop-color="#9945FF" stop-opacity="0.55"/>
      <stop offset="0.5" stop-color="#14F195" stop-opacity="0.12"/>
      <stop offset="1" stop-color="#14F195" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#241140"/>
      <stop offset="1" stop-color="#0c0820"/>
    </linearGradient>
  </defs>
  <rect width="1707" height="704" fill="url(#sky)"/>
  ${stars}
  <rect width="1707" height="704" fill="url(#glow)"/>
  ${buildings()}
  <!-- horizon neon line -->
  <rect x="0" y="556" width="1707" height="6" fill="#14F195" opacity="0.7"/>
  <rect x="0" y="556" width="1707" height="2" fill="#aef7d6" opacity="0.9"/>
  <!-- road -->
  <rect x="0" y="560" width="1707" height="144" fill="url(#road)"/>
  <rect x="0" y="566" width="1707" height="3" fill="#9945FF" opacity="0.6"/>
  <g opacity="0.5" fill="#14F195">
    ${Array.from({ length: 12 }, (_, i) => `<rect x="${i * 150 + 30}" y="636" width="80" height="6" rx="3"/>`).join('')}
  </g>
</svg>`;

// ---------- SOL coin ----------
const coinSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#9945FF"/>
      <stop offset="1" stop-color="#14F195"/>
    </linearGradient>
    <radialGradient id="face" cx="0.5" cy="0.4" r="0.7">
      <stop offset="0" stop-color="#2a1a4d"/>
      <stop offset="1" stop-color="#140b28"/>
    </radialGradient>
    <linearGradient id="mark" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#9945FF"/>
      <stop offset="1" stop-color="#14F195"/>
    </linearGradient>
  </defs>
  <circle cx="512" cy="512" r="492" fill="url(#ring)"/>
  <circle cx="512" cy="512" r="430" fill="url(#face)"/>
  <circle cx="512" cy="512" r="430" fill="none" stroke="#14F195" stroke-width="6" opacity="0.4"/>
  ${solMark(512, 512, 2.4, 'mark')}
</svg>`;

// ---------- crypto energy card (secondary collectible) ----------
function card(title, sub) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="550" viewBox="0 0 800 550">
  <defs>
    <linearGradient id="cardbg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2b1356"/>
      <stop offset="1" stop-color="#120a26"/>
    </linearGradient>
    <linearGradient id="cm" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#9945FF"/>
      <stop offset="1" stop-color="#14F195"/>
    </linearGradient>
  </defs>
  <rect x="20" y="20" width="760" height="510" rx="48" fill="url(#cardbg)" stroke="url(#cm)" stroke-width="8"/>
  <rect x="60" y="70" width="120" height="78" rx="14" fill="url(#cm)" opacity="0.85"/>
  ${solMark(400, 250, 2.0, 'cm')}
  <text x="400" y="430" font-family="Arial, Helvetica, sans-serif" font-size="92" font-weight="900" fill="#ffffff" text-anchor="middle">${title}</text>
  <text x="400" y="490" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" fill="#14F195" text-anchor="middle">${sub}</text>
</svg>`;
}

// ---------- finish tape (Solana diagonal stripes) ----------
const tapeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="382" height="51" viewBox="0 0 382 51">
  <defs>
    <pattern id="stripes" width="40" height="51" patternUnits="userSpaceOnUse" patternTransform="skewX(-20)">
      <rect width="20" height="51" fill="#9945FF"/>
      <rect x="20" width="20" height="51" fill="#14F195"/>
    </pattern>
  </defs>
  <rect width="382" height="51" fill="url(#stripes)"/>
</svg>`;

// ---------- footer banners ----------
function banner(w) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="201" viewBox="0 0 ${w} 201">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#9945FF"/>
      <stop offset="1" stop-color="#7b2ff7"/>
    </linearGradient>
    <linearGradient id="cm2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#14F195"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="201" fill="url(#bg)"/>
  ${solMark(120, 100, 1.6, 'cm2')}
  <text x="230" y="135" font-family="Arial, Helvetica, sans-serif" font-size="96" font-weight="900" fill="#ffffff">Solana Run</text>
</svg>`;
}

console.log('Generating Solana assets →', OUT);
await render('background.png', 1707, 704, bgSvg);
await render('sol-coin.png', 1024, 1024, coinSvg);
await render('crypto-card.png', 800, 550, card('+ SOL', 'energy'));
await render('reward-card.png', 800, 550, card('SOL WALLET', 'rewards claimed'));
await render('finish-tape.png', 382, 51, tapeSvg);
await render('banner-portrait.png', 1080, 201, banner(1080));
await render('banner-landscape.png', 2022, 201, banner(2022));
console.log('Done.');
