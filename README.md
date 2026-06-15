# Playoff Runner — PixiJS playable (clone + Solana reskin)

A from-scratch clone of the Playbox **"Playoff" runner** playable ad, plus a **Solana / "Toly"** reskin (⭐ star task). Each build is a single self-contained HTML file under 5 MB.

**Reference:** https://playbox.play.plbx.ai/playoff/runner

## Live

- **Clone (original skin):** `index.html` → _GitHub Pages link added on deploy_
- **Solana reskin:** `solana.html`

> Portrait-first playable. On desktop it sits in a centered column (like the original preview); on a phone or in Chrome DevTools device mode it fills the screen.

## What it does (1:1 with the reference)

Single-tap **auto-runner**: the runner is pinned in X while the world scrolls at a constant 600 px/s. Tap to jump (a parametric **sine arc**, 300 px / 800 ms — not gravity) over chasing enemies and cones, auto-collecting cash. After a ~22 s hand-authored level the **finish tape** snaps and the runner wins, ending on a reward count-up + install CTA. 3 HP; a brief tutorial pauses the world for the first enemy.

All gameplay constants (speeds, jump, hitboxes, level script, finish-rope physics) were reverse-engineered from the reference and live in [`src/config/constants.ts`](src/config/constants.ts); the full reverse-engineering is in [`docs/reference-spec.md`](docs/reference-spec.md).

## The finish ribbon (ТЗ-required rope effect)

While running, the checker tape is two rotated sprites. When the runner crosses, each half is swapped for a PixiJS **`MeshRope`** whose control points are driven by a **verlet integrator** ([`src/game/rope.ts`](src/game/rope.ts)): gravity + a travelling sine wave + damping + a per-frame distance constraint, with an `exp(-t)` decay envelope — so the tape falls and settles like cloth. Pinned at the pole, it dangles and comes to rest.

## Tech & approach

- **PixiJS v8** (WebGL) + **Howler** (audio) + **TypeScript**, bundled by **Vite** + `vite-plugin-singlefile` → one HTML with every asset inlined as a base64 data-URI (no external requests).
- **Assets** were extracted directly from the reference (sprite atlases, textures, audio, font) into [`assets/original/`](assets/original). Solana art is AI-style generated as SVG→PNG ([`scripts/gen-solana-assets.mjs`](scripts/gen-solana-assets.mjs)).
- **One codebase, two skins.** A build-time `@skin` alias selects [`original`](src/config/skins/original.ts) or [`solana`](src/config/skins/solana.ts); gameplay is identical, only assets/theme/copy differ, so each HTML bundles only its own art.
- **No freezes on low-end mobile:** DPR clamped at 2, every motion scaled by `deltaMS` (frame-rate independent), object pooling for scenery + confetti, per-frame off-screen culling, auto-batched sprites, and the game **pauses on `visibilitychange` / MRAID `viewableChange`** (saves battery in energy-save mode).
- **Playable SDK:** MRAID / Facebook Playable / Playbox / window-open fallbacks for the CTA; audio unlock on first tap.
- **Tested:** pure logic (state machine, collision, level scheduler, rope integrator) has 27 Vitest unit tests; the full loop was verified in-browser end to end.

## Develop / build

```bash
npm install
npm run dev            # original skin  → http://localhost:5173
npm run dev:solana     # solana skin
npm test               # unit tests
npm run build          # → dist/index.html (clone) + dist/solana.html (reskin)
```

`npm run build` also enforces the ≤5 MB budget per file.

## Project layout

```
src/core      Pixi app, state machine, audio, SDK, asset loader
src/game      controller, player, entities, parallax, finish-rope, confetti, level
src/ui        DOM HUD, tutorial, end card, fail flash (CSS animations)
src/config    constants + skins (original / solana)
assets        original/ (extracted)  +  solana/ (generated)
docs          reference-spec.md (reverse-engineering)  +  design spec
```
