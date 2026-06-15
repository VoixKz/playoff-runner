# Playoff Runner — Clone + Solana Reskin · Design Spec

**Date:** 2026-06-15
**Author:** (with Claude)
**Reference:** https://playbox.play.plbx.ai/playoff/runner (real game at `/playoff/runner/_raw`)
**Reverse-engineered source of truth:** [`docs/reference-spec.md`](../../reference-spec.md) — exact constants, level script, finish-rope integrator, asset catalog.

---

## 1. Goal

Build a **1:1 clone** of the Playbox "Playoff" auto-runner playable, then a **reskin** (⭐ star task) in a Solana / "Toly" crypto setting. Both delivered as **self-contained single HTML files** that match the ТЗ in full.

Two deliverables from one codebase:
- `dist/index.html` — faithful clone on the **extracted original assets** (ТЗ mandates extracting assets from the reference).
- `dist/solana.html` — reskin: new character run-cycle + background + collectibles + end-card, AI-generated (Nano Banana).

## 2. ТЗ compliance checklist (every requirement mapped)

| ТЗ requirement | How this design satisfies it |
|---|---|
| Logic from scratch on a JS/TS game engine | PixiJS v8 + TypeScript, hand-written game logic (no copied source). |
| Quality ≥ original | 1:1 mechanics from `reference-spec.md`, incl. the MeshRope finish ribbon. |
| Extract assets from the reference page | Done — 45 assets extracted to `assets/original/` (see §6). |
| Missing assets via generative AI | Reskin assets generated in Nano Banana. |
| Single HTML build, everything inlined | Vite + `vite-plugin-singlefile`; assets as base64 data-URIs. |
| Opens fullscreen, adaptive | Pixi `resizeTo:window`, height-fit scaling, `touch-action:none`, fullscreen canvas. |
| No freezes (low-tier mobile) | DPR clamp ≤2, object pooling, per-frame culling, deltaMS-scaled loop, pause on hidden. Verified under 6× CPU throttle. |
| Finish ribbon with rope effect | True PixiJS `MeshRope` + verlet integrator (gravity+wave+damping+distance-constraint). |
| Bundle ≤ 5 MB | Reference is 2.9 MB; we target ≤3 MB per HTML. WebP/AVIF re-encode, subset font, MP3 audio. |
| Git, multiple meaningful commits | Repo initialized; commit per milestone (see §11). |
| Publish on github.io / vercel | GitHub Pages (chosen). |
| ⭐ Reskin character + background | Solana/Toly skin via config-driven skin system. |

## 3. Core mechanics to replicate (summary; full detail in reference-spec.md)

- **Auto-runner**: player pinned at `x = 0.18·W`, ground at `H−280`; world scrolls left at constant **600 px/s** (deltaMS-scaled, no ramp).
- **Single input**: tap/click. INTRO→start, PAUSED(tutorial)→resume+auto-jump, RUNNING→jump.
- **Jump**: parametric **sine arc** `y = startY − sin(progress·π)·300` over **800 ms**; no double-jump, no gravity.
- **State machine**: `LOADING→INTRO→RUNNING⇄PAUSED→(END_WIN | END_LOSE)`; no in-ad retry (retry = install).
- **Hazards**: enemies chase at `speed+300`; obstacles move at world speed with flashing "EVADE" warning. 3 HP, 500 ms invincibility blink on hit.
- **Collectibles**: 60% dollar (value 20) / 40% PayPal card (5–50). Circle-vs-rect pickup, fly-to-counter, praise popups.
- **Finish**: at distance 18 (~22 s) the tape breaks → MeshRope cloth + confetti + dark overlay → decelerate → end card with balance count-up + 60 s countdown + CTA.
- **Design space** 720×1280, height-fit scaling, HUD in DOM overlay.

## 4. Architecture

PixiJS v8 (WebGL, auto-batched sprites) + Howler.js (audio). TypeScript throughout. Build: Vite → `vite-plugin-singlefile`. **No GSAP** — DOM HUD animations use CSS `@keyframes` (as the original does), in-game easing uses a ~30-line tween/easing helper. This keeps the bundle lean.

**Module layout (`src/`):**

```
main.ts                 boot: SDK adapter → fonts.ready → App.init → GameController.init
core/
  App.ts                Pixi Application setup, resize/scaling, ticker wiring
  StateMachine.ts       game states + transitions + event emitter (pure, unit-tested)
  Events.ts             typed emitter
  audio/AudioManager.ts Howler manifest, unlock, mute-on-pause
  sdk/PlayableSDK.ts    MRAID / FbPlayableAd / fallback CTA + viewableChange pause
game/
  GameController.ts     orchestrates entities, spawns, collisions, win/lose
  Player.ts             AnimatedSprite, sine-arc jump, hurt/invincibility
  Parallax.ts           pooled bg tiles + props, scroll + wrap
  entities/Collectible.ts  Obstacle.ts  Enemy.ts   (pooled)
  FinishLine.ts         tape sprites → breakTape() → MeshRope ribbon + integrator
  Confetti.ts           own-rAF particle burst (respects pause)
  Level.ts              the scripted level array (Gl) + spawn scheduler
  collision.ts          circle-vs-rect + AABB w/ shrink/offset (pure, unit-tested)
ui/
  Hud.ts                hearts, money counter, fly-to-counter, praise, warning
  Tutorial.ts           tap-to-start + jump-to-avoid overlays + hand
  EndCard.ts            win/lose card, balance count-up, countdown, CTA
  Fail.ts               FAIL flash → end card
config/
  constants.ts          all numeric constants from reference-spec.md (single source)
  skins/                skin system (see §5)
    types.ts            Skin interface (textures, colors, copy, audio, end-card)
    original.ts         original-asset skin
    solana.ts           Solana/Toly reskin
assets/
  original/             45 extracted reference assets
  solana/               AI-generated reskin assets
```

**Why this structure:** each unit has one purpose and a clear interface, is independently testable (pure logic split from Pixi rendering), and stays small enough to reason about. `GameController` owns the world; `FinishLine`/`Confetti` are self-contained; the **skin** is the only thing that differs between the two builds.

## 5. Skin system (clone vs reskin from one codebase)

A `Skin` object injected at boot decides every themeable thing — there is **zero gameplay difference** between builds:

```ts
interface Skin {
  id: 'original' | 'solana';
  background: TextureSource;          // scrolling bg
  player: { sheet, atlasMeta };       // run-cycle spritesheet + frame meta
  collectibles: { primary, secondary, ratio };  // dollar/SOL, paypal/wallet
  obstacle, obstacleGlow, enemy;
  finishTape: TextureSource;          // checker / Solana-tape
  props: { trees[], lamps[], bushes[] };
  confetti: TextureSource[];
  colors: { bg: number; cta: [from,to,border]; counterText };
  copy: { start, jump, win, lose, cta, reward, countdown, disclaimer };
  endCard: { cardArt, lightRays, currency };
  audio: AudioManifest;               // can share original SFX
}
```

Build target chosen by Vite env (`SKIN=original|solana`) → emits `index.html` / `solana.html`. Constants and logic are shared; only the `Skin` import changes.

## 6. Assets

**Original (extracted):** 45 files already pulled from the reference into `/tmp/ref_assets/` → copied to `assets/original/` with meaningful names (player sheets, bg, checker tape, dollar, paypal, cones, trees/bushes/lamp, confetti ×6, tap-hand, FAIL, banners, CTA art, light-rays, font TTF, 8 audio). Player spritesheets (03 female / 04 prisoner) are packed atlases — frames `idle:18, run:8, jump:10, hurt:5`; I'll author an inline atlas JSON (frame rects) since the original's is inline.

**Solana reskin (generate in Nano Banana):**
- Toly-style crypto-founder **run-cycle spritesheet** (same 41-frame breakdown so animation code is unchanged).
- Neon Solana **background** (purple→teal gradient, abstract skyline, road baked in) at 1707×704-ish.
- Collectibles: **SOL coin** + **wallet/USDC card**.
- Finish tape in Solana gradient; end-card = **Phantom-wallet cashout** art; recolor confetti.
- Reuse original SFX/music (audio is theme-neutral) to save the size budget and time.

All re-encoded to WebP/AVIF; font subset; keep each HTML ≤3 MB.

## 7. Finish ribbon (the graded feature) — implementation plan

Reproduce the reference exactly (config `fe` in reference-spec.md §6):
1. While running: checker tape = two rotated, x-stretched `Sprite`s on poles (`leftTape.rotation=0.4`, `rightTape.rotation=−2.5`, `scale(1.8,1)`).
2. Trigger at `player.x ≥ finishLine.x − 300`.
3. `breakTape()`: hide sprites; for each half build **10 collinear `Point`s** over `texture.width·scale.x·0.3` in the sprite's transformed frame; `new MeshRope({texture, points})`, `autoUpdate=true`; point[0] pinned to pole.
4. Per-frame integrator (`animationTime += 0.05`, `decay = exp(−animationTime·0.15)`): gravity `vy += 0.3·decay`, wave `vx += sin(animationTime + i·0.01)·0.2·decay`, damping `×0.95`, integrate, then **1-iteration distance constraint** (segment len 10, stiffness 0.5). Auto-stop when mean |v| < 0.1 and time > 1.
5. Separate confetti burst (50/side, own rAF, gravity 0.05, air-resistance 0.998, fade after 70% life) + dark overlay alpha 0.6.

Unit-test the integrator math (deterministic given a seed) so the rope is provably stable; visually verify the cloth feel.

## 8. Performance plan (no freezes)

- DPR clamp `min(devicePixelRatio,2)`; `antialias:true`, `autoDensity:true`, `resizeTo:window`.
- Default ticker; **every** motion multiplied by `deltaMS/1000` (audited) → frame-rate independent.
- **Object pooling**: 6 bg tiles + props + collectibles/obstacles/enemies created once, recycled; per-frame `cleanupEntities()` culls off-screen.
- Auto-batched `Sprite`/`AnimatedSprite`; `Graphics` only for overlay/fallback.
- Pause ticker + mute audio on MRAID `viewableChange` / `document.hidden`; confetti rAF respects pause.
- `try/catch` around texture load → cheap Graphics fallback bg (never freeze on decode error).
- **Validation:** Chrome DevTools 6× CPU throttle + mobile emulation; target steady 60fps, no GC spikes.

## 9. Adaptive layout / fullscreen

- Design space 720×1280; `scale = innerHeight/1280`; center the 720-wide column horizontally; canvas absolute, fills screen.
- `orientationchange` debounced 100 ms; `Jl()`-style working-dim swap for landscape spawn math.
- HUD = DOM overlay (`#ui-container`, `position:fixed; inset:0; pointer-events:none`).
- Body: `overflow:hidden; touch-action:none; user-select:none`. (Optionally add safe-area insets — an improvement over the original, decided during build if it doesn't break parity.)

## 10. Testing strategy

- **Vitest unit tests** for pure logic: StateMachine transitions, collision (circle-vs-rect & AABB with shrink/offset), Level spawn scheduling/distance math, scoring, rope integrator stability, resize/scale math.
- **Manual/browser verification** for rendering, feel, and perf (canvas can't be meaningfully unit-tested): play both skins, throttle test, portrait/landscape, CTA hooks.
- TDD on the pure modules (write test → implement). Rendering modules built then verified in-browser.

## 11. Git & milestones (meaningful commits)

1. `chore: scaffold Vite + TS + Pixi + singlefile build, extract original assets`
2. `feat: Pixi app, resize/scaling, state machine + tests`
3. `feat: parallax world + pooled props, player with sine-arc jump`
4. `feat: collectibles, enemies, obstacles, collisions + tests`
5. `feat: HUD, tutorial, audio manager, SDK adapter`
6. `feat: finish-line MeshRope ribbon + confetti + win/lose end card`
7. `feat: skin system; original skin = faithful clone`
8. `perf: pooling/culling/DPR pass; verified under CPU throttle`
9. `feat: Solana/Toly reskin assets + skin`
10. `build: single-file outputs; deploy to GitHub Pages`

## 12. Deployment

GitHub Pages. I init the repo locally with the above commits; you create an empty GitHub repo (or authorize `gh`), I push and enable Pages (serve `dist/`), producing a public `https://<user>.github.io/<repo>/` link (with `index.html` clone + `solana.html` reskin).

## 13. Risks (from reference-spec.md §11)

1. **MeshRope ribbon** — highest risk; verify `MeshRope`/`RopeGeometry` API on the chosen Pixi v8 minor; the pinned point[0], stiffness 0.5, `exp(−t·0.15)` decay are load-bearing.
2. Sine-arc jump (not gravity) — must match hazard-clearance timing.
3. Two collision models with asymmetric hitboxes — wrong values feel unfair/ungenerous.
4. Height-only scaling, no safe-area — may clip HUD on notched devices; keep for parity, optionally improve.
5. deltaMS scaling everywhere — any unscaled value breaks low-end timing.
6. Reskin spritesheet must keep the 41-frame layout so animation code is untouched.
7. Size budget — re-encode reskin art aggressively; reuse original audio.

## 14. Out of scope (YAGNI)

- In-ad retry button (dead `reset()` in original — skip unless asked).
- `step` SFX (loaded but never triggered in original).
- ES/IT localization (table exists, hard-coded EN; skip).
- Real crypto/wallet integration (it's a playable; CTA → store/landing only).
