# Playoff Runner — PixiJS playable (Playbox clone)

A from-scratch clone of the Playbox **"Playoff" runner** playable ad. The build is a single self-contained HTML file under 5 MB.

**Reference:** https://playbox.play.plbx.ai/playoff/runner

## Live

**▶ Device preview (recommended):** https://voixkz.github.io/playoff-runner/
A Playbox-style harness that frames the playable in selectable **phones & tablets** with a **portrait/landscape** toggle, **sound** mute, and an **ad-pause** (MRAID viewable demo) overlay.

**Bare single-file playable** (the actual deliverable):
- https://voixkz.github.io/playoff-runner/play/original.html

> The playable **fills any viewport** — portrait and landscape — with no letterboxing, and adapts to every device in the preview.

## What it does (1:1 with the reference)

Single-tap **auto-runner**: the runner is pinned in X while the world scrolls at a constant 600 px/s. Tap to jump (a parametric **sine arc**, 300 px / 800 ms — not gravity) over chasing enemies and cones, auto-collecting cash. After a ~22 s hand-authored level the **finish tape** snaps and the runner wins, ending on a reward count-up + install CTA. 3 HP; a brief tutorial pauses the world for the first enemy.

All gameplay constants (speeds, jump, hitboxes, level script, finish-rope physics) were reverse-engineered from the reference and live in [`src/config/constants.ts`](src/config/constants.ts).

## The finish ribbon (ТЗ-required rope effect)

While running, the checker tape is two rotated sprites. When the runner crosses, each half is swapped for a PixiJS **`MeshRope`** whose control points are driven by a **verlet integrator** ([`src/game/rope.ts`](src/game/rope.ts)): gravity + a travelling sine wave + damping + a per-frame distance constraint, with an `exp(-t)` decay envelope — so the tape falls and settles like cloth. Pinned at the pole, it dangles and comes to rest. A checkered strip is painted on the road at the finish.

## Tech & approach

- **PixiJS v8** (WebGL) + **Howler** (audio) + **TypeScript**, bundled by **Vite** + `vite-plugin-singlefile` → one HTML with every asset inlined as a base64 data-URI (no external requests).
- **Assets** were extracted directly from the reference (sprite atlases, textures, audio, font) into [`assets/original/`](assets/original).
- **No freezes on low-end mobile:** DPR clamped at 1.5, MSAA off, native vsync pacing, every motion scaled by `deltaMS` (frame-rate independent), object pooling for scenery + confetti, viewport-relative off-screen culling, auto-batched sprites, and the game **pauses on `visibilitychange` / MRAID `viewableChange`** (saves battery in energy-save mode). Open with `?fps` for an on-screen FPS meter.
- **Playable SDK:** MRAID / Facebook Playable / Playbox / window-open fallbacks for the CTA; audio unlock on first tap.
- **Tested:** pure logic (state machine, collision, level scheduler, rope integrator) has 27 Vitest unit tests; the full loop was verified in-browser end to end.

## Develop / build

```bash
npm install
npm run dev            # → http://localhost:5173
npm test               # unit tests
npm run build          # → dist/index.html (also copies to docs/play/original.html)
```

`npm run build` also enforces the ≤5 MB budget.

## Project layout

```
src/core      Pixi app, state machine, audio, SDK, asset loader
src/game      controller, player, entities, parallax, finish-rope, confetti, level
src/ui        DOM HUD, tutorial, end card, fail flash (CSS animations)
src/config    constants + skin (assets/theme/copy)
assets        original/ (extracted from the reference)
scripts       single-file assemble step
docs          GitHub Pages: preview shell (index.html) + play/ (the playable)
```
