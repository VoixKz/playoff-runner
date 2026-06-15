<!-- Auto-generated from reverse-engineering the reference playable at https://playbox.play.plbx.ai/playoff/runner/_raw
     Source of truth for the 1:1 clone. Constants/identifiers are the original minified names. -->

# Playoff Runner — Clone & Reskin Spec (PixiJS Auto-Runner Playable)

**Source of truth:** `/tmp/ref_game.html` (single-file Vite build, PixiJS v8.x — build strings seen: `8.3.4` / `8.14.3`; treat as **v8, target 8.3+**). Game logic concentrated on minified lines **1367** (`GameController Iq`, entities, parallax), **1385** (`App Zq`, UI, input, audio `Fq`), **1400** (end screens, countdown, praise, SDK wiring). Identifiers below are the actual minified names so they can be cross-referenced against the original.

---

## 1. Overview

A single-tap **auto-runner** playable ad for a money-rewards app ("Playoff" / PayPal-themed; store id `ae.goragaming.playoff.blocks.game.make.earn.money.rewarded`). The runner is pinned to a fixed screen position while the world scrolls left; the player taps to jump over chasing enemies and ground obstacles while auto-collecting dollar bills and PayPal cards, then breaks a finish-line tape to win. The core loop is: **tap to start → run/collect/jump for ~22 s through a hand-authored level → cross the finish line (win) or lose all 3 HP (lose) → end card with a count-up reward and Install CTA** (there is no in-ad retry; "retry" = install the app).

---

## 2. Game state machine

Two enums. Game state `ge`: `LOADING, INTRO, RUNNING, PAUSED, JUMPING, HURT, END_WIN, END_LOSE`. Player anim state `pe`: `IDLE, RUN, JUMP, HURT`. State changes broadcast via `emit("stateChange",{from,to})`; the app's `onStateChange` only reacts to `RUNNING` (hide tutorial, start music).

| From | Trigger | To | Side effects |
|---|---|---|---|
| construct → `LOADING` | `init()` finishes (assets + audio + finish effects) | `INTRO` | player shown idle; `showTutorial("start")` → "Tap to start earning!" + pulsing hand |
| `INTRO` | first tap → `start()` | `RUNNING` | `isRunning=true`, `player.run()`, emit `"start"`, music plays, tutorial hidden |
| `RUNNING` | tutorial enemy within `TUTORIAL_PAUSE_DISTANCE=300`px (`checkTutorialTrigger`) | `PAUSED` | `isRunning=false`, `player.idle()`, parallax+enemies frozen, `showTutorial("enemy")` → "Jump to avoid enemies" |
| `PAUSED` | tap → `resumeFromTutorial()` | `RUNNING` | `jumpingEnabled=true`, resume world, **auto-performs first jump**, emit `tutorialComplete` |
| `RUNNING` | `player.x >= finishLine.tapeBreakX` → `startDeceleration()` | (stays RUNNING) | `finishLine.breakTape()`, `isDecelerating=true`, emit `crossedFinish` → confetti + dark overlay |
| decelerating | `currentSpeed` decays `< MIN_SPEED(10)` → set 0, then `setTimeout(handleWin,500)` | `END_WIN` | `player.idle()`, parallax pause, emit `win{score}` → win card + balance count-up + 60 s countdown |
| `RUNNING` | `hp` reaches 0 (`handlePlayerHit`→`handleLose`) | `END_LOSE` | `player.idle(true)`, parallax pause, emit `lose{score}` → 1500 ms FAIL flash → same end card (lose copy) |

`JUMPING`/`HURT` are tracked on the player (anim states), not separate world states. A `reset()` method exists on the controller but **is not wired to any UI button** — there is no playable restart.

---

## 3. Controls & player movement

**Single input: tap/click anywhere on the canvas.** `setupInput()`: `app.canvas.addEventListener("pointerdown", () => { xe.unlock(); gameController.handleTap(); })`. No swipe/drag/hold/lanes/keyboard; desktop and touch identical (pointer events).

`handleTap()` is state-dependent:
- `INTRO` → `start()`
- `PAUSED` → `resumeFromTutorial()` (ends tutorial, auto-jumps)
- `RUNNING` → **jump**, only if `jumpingEnabled && player.isOnGround && !finishLineSpawned`

The player **never moves horizontally** — pinned at a fixed X; the world scrolls past. One vertical degree of freedom (jump). Anchor `(0.5, 1)` (feet).

**Player constants `oe`:**
```
X_POSITION:0.18, GROUND_Y:280, JUMP_HEIGHT:300, JUMP_DURATION:800,
INVINCIBILITY_TIME:500, SCALE:0.54, ANIMATION_SPEED:0.15
```
- Screen X = `$e * 0.18 = 129.6`px. Ground Y = `Me - GROUND_Y = 1280 - 280 = 1000`.
- **Jump = parametric sine arc, NOT gravity.** In player `update(t)` (t = ms delta): `jumpProgress += t/800`; if `>=1` land + play RUN; else `y = jumpStartY - sin(jumpProgress*PI)*300` (peak 300px at progress 0.5). No cancel, no double-jump (`if(!isJumping)` guard). `isOnGround === !isJumping`.
- Anim speeds: run/idle loop at `0.15`; jump `loop=false, speed=0.15*1.5`; hurt `loop=false, speed=0.15*2`.
- **Invincibility after hit:** 500 ms; sprite blinks every 100 ms, tint toggles white `0xFFFFFF` ↔ red `0xFF2604`; collisions skipped while `isInvincible`.

---

## 4. World / scrolling / difficulty

**Design space:** `$e=720` (width) × `Me=1280` (height) — portrait-first. `Jl()` swaps working dims `yt/es` on orientation: portrait `yt=720, es=1280`; landscape `yt=1280, es=720`. `yt` (working width) drives spawn math.

**Scroll model — single-plane (`Tq` parallax class, `extends Container`, `sortableChildren=true`):**
```
Ye = { BASE_SPEED:600, PARALLAX:{ GROUND:1 } }
```
- Constant **600 px/sec**; every prop uses speedMultiplier 1. Depth conveyed by **z-layering + scale + Y**, not differential scroll. `update(t, A)`: `r = A*t/1000`; tiles/props shift `-r` and wrap.
- Prop spacing: `LAMP_SPACING:800`, `TREE_MIN_SPACING:300`, `TREE_MAX_SPACING:500`, `SCREEN_BUFFER:1200`, `roadY = Me-GROUND_Y = 1000`.
- 6 mirrored, cover-scaled background tiles (`bgScale = Math.max($e/w, Me/h)`, every other tile x-flipped to hide seams). Road is baked into the bg texture (no separate road sprite in the success path).
- `pause()`/`resume()` toggle `isPaused` (tutorial pause + finish/win).

**Difficulty:** **no procedural ramp, no acceleration.** Speed is constant 600 px/s the whole run; the only change is end-of-level deceleration (`*0.9`/frame). Difficulty comes purely from hand-authored `Gl` spacing.

**Distance & spawning (`checkSpawns`/`spawnEntity`):**
- `distanceTraveled += currentSpeed * t/1000` (px in design space).
- Level = fixed scripted array `Gl` of `{type, distance, ...}`; `distance` is in **screen-widths** (×`yt`).
- Spawn trigger: `distanceTraveled >= entry.distance*yt - yt` (one screen-width early). Spawn X = `yt + yt*0.5` (1.5 screen-widths off-screen right).
- Win at finish `{type:"finish", distance:18}` → ~`18*720/600 ≈ 21.6 s` of running (minus tutorial pause).

**Full level script `Gl`** (distance = screen-widths; `y` = yOffset above the 800 baseline):
```
collectible@1, collectible@2, enemy@3(pauseForTutorial),
collectible@4 y50, @4.2 y150, @4.4 y250, @4.6 y150, @4.8 y50      (jump arc),
obstacle@5.6(warn), collectible@6.4, enemy@7,
collectible@7.6, @7.8 y100, @8 y200, @8.2 y280, @8.4 y200, @8.6 y100 (arc),
obstacle@9(warn), collectible@9.6, enemy@10,
collectible@10.6, @11 y80, @11.2 y180, @11.4 y80, obstacle@12, enemy@12.6,
collectible@13, @13.2 y100, @13.4 y200, @13.6 y100, obstacle@14(warn),
collectible@14.5, enemy@15, @15.4 y80, @15.6 y180, @15.8 y260, @16 y180, @16.2 y80,
obstacle@16.5, finish@18
```

---

## 5. Collectibles, obstacles, win/lose

### Collectibles (class `lq`)
- **Two kinds, random at spawn:** `Math.random() < 0.6 ? "dollar" : "paypalCard"` (60% dollar / 40% PayPal card).
- **Values `Gt`:** dollar = `DOLLAR_VALUE:20` (fixed); PayPal card = random int `[PAYPAL_CARD_MIN:5, PAYPAL_CARD_MAX:50]`; `START_BALANCE:0`.
- **Y placement:** `y = Me - GROUND_Y - 200 - yOffset = 800 - yOffset` (higher yOffset = higher; arcs of 50–280 require jumps).
- **Visual:** base scale 0.15 (dollar) / `0.15*1.2` (paypal); sinusoidal pulse (`Ti.PULSE_SPEED:5e-4`, scale 0.95–1.05) + vertical bob `sin(pulseTime*2)*5`.
- **Collection = circle-vs-rect:** collectible as circle of world-radius `COLLECTIBLE_RADIUS:60 * worldScale` vs player hitbox rect (closest-point distance < radius). On collect: hidden, `score += value`, emit `collect{score, collectibleType}`, fly-to-counter DOM animation (0.4 s), and a praise popup every 3–4 pickups.

### Obstacles & enemies (both → hit)
**Enemy `sq`** (`{type:"enemy"}`):
- Moves left **faster than world**: `speed = currentSpeed + CHASE_SPEED(300)` (a chaser). Scaled `oe.SCALE*1.3`, x-flipped to face player. `y = Me-GROUND_Y-20 = 980`.
- First enemy (`@3, pauseForTutorial:true`) is the tutorial enemy (pauses at 300 px).

**Obstacle `oq`** (`{type:"obstacle"}`):
- Moves left at `currentSpeed` only (no chase). Pulsing glow (`Mt = {PULSE_SPEED:.003, SCALE_MIN:.9, SCALE_MAX:1.1, BASE_SCALE:.8}`). `y = 980`.
- `warningLabel:true` → flashing red **"EVADE"** label at `y = 800`, pulsing `1 + sin(now*0.008)*0.1`, scrolls with world, removed past `gameX < -200`.

**Collision (`checkCollisions`, AABB `rectanglesIntersect`),** skipped while `isInvincible`. Hitboxes shrunk via `Te`:
```
PLAYER {X:0.25, Y:0.7} + offset {X:0, Y:-0.15}
ENEMY  {X:0.3,  Y:0.5} + offset {X:0, Y:0.2}
OBSTACLE_SHRINK: 10 px each side
```
On hit (`handlePlayerHit`): `hp--`, `player.hurt()` (500 ms invincibility + blink), emit `hit{hp}` → re-render hearts + hit/hurt SFX. **Jumping clears both hazards** (player rises above the ground-level hitbox).

### Win / lose
- **HP `Yi.MAX_HP:3`** (3 heart emojis). Lose is not instant — 3 hits → `handleLose()` → `END_LOSE`.
- **Win:** reach finish marker → `startDeceleration()` → `currentSpeed *= DECELERATION_RATE(0.9)`/frame → `<10` → `setTimeout(handleWin,500)` → `END_WIN`. Once `finishLineSpawned`, jumping is disabled.

---

## 6. Finish ribbon — the rope/cloth effect (exact reproduction)

**Verdict:** a true PixiJS **`MeshRope`** (minified `Pf`/`Qf`) backed by **`RopeGeometry`** (`Nf`/`Rf`), but **only after the runner hits the tape**. Before the break the checker banner is a plain textured **`Sprite`**. There is **no custom cloth/wave shader** — Pixi's stock mesh shader; all motion is CPU-side control-point displacement. There is **no shatter/particle tear on the ribbon** — celebration is a separate confetti burst.

**Config `fe`:**
```
ROPE_SEGMENTS:10, ROPE_LENGTH_FACTOR:0.3, GRAVITY:0.3, DAMPING:0.95,
WAVE_SPEED:0.01, TIME_DECAY:0.15, MIN_VELOCITY_THRESHOLD:0.1, MIN_ANIMATION_TIME:1,
ROPE_SEGMENT_DISTANCE:10, LEFT_ROPE_OFFSET_X:0, LEFT_ROPE_OFFSET_Y:0,
RIGHT_ROPE_OFFSET_X:20, RIGHT_ROPE_OFFSET_Y:-20, TAPE_BREAK_OFFSET:-300
```

**Reproduction steps:**
1. **During run:** draw the checker banner (asset 09) as a rotated, x-stretched `Sprite` — two tape sprites: `leftTape.rotation=0.4`, `rightTape.rotation=-2.5`, both `scale.set(1.8,1)`, `anchor(0,0)`. Plus `floorPattern`, `leftPole`, `rightPole`.
2. **Trigger:** `player.x >= tapeBreakX` where `tapeBreakX = finishLine.x + TAPE_BREAK_OFFSET(-300)` (i.e. 300 px before center). → `startDeceleration()` → `breakTape()` + emit `crossedFinish`.
3. **`breakTape()`:** hide both tape sprites; for each half build `points` = **10 collinear `Point`s** spaced along the sprite's local X for `texture.width * sprite.scale.x * 0.3` (only ~30% of the tape — a short dangling stub), transformed by the sprite's rotation/anchor/position plus the left/right offset. Create `new MeshRope({ texture, points })` (rope width = `texture.height`), `autoUpdate=true`. Give each point velocity `{x:0, y:0}`.
4. **Per-frame integrator** (`updateRopeAnimation` → `animateRopePoints`): `animationTime += 0.05`; `decay = exp(-animationTime * 0.15)`. For points `1..n` (point 0 pinned to pole):
   - gravity: `vy += GRAVITY(0.3) * decay`
   - wave: `vx += sin(animationTime + i*WAVE_SPEED(0.01)) * 2 * decay * 0.1`
   - damping: `vx *= 0.95; vy *= 0.95`
   - integrate: `p.x += vx; p.y += vy`
   - **distance constraint** (1-iteration Jacobi, stiffness 0.5) toward `ROPE_SEGMENT_DISTANCE(10)` from predecessor: `f=hypot(dx,dy); k=(f-10)/f; p.x -= dx*k*0.5; p.y -= dy*k*0.5`
   `MeshRope.autoUpdate` re-extrudes the ribbon each frame (`RopeGeometry.updateVertices` pushes two verts ±width/2 along the segment normal; UVs 0→1 along length, no tiling).
5. **Auto-stop** when mean velocity `< 0.1` and `animationTime > 1`.

**Celebration (separate, `triggerFinishEffects` → confetti `kq`):** dark overlay (`alpha 0.6`) + `confettiEmitter.burstFromSides($e, Me)`. Confetti config `G`: `PARTICLE_COUNT:50` per side, `LIFETIME:5000ms`, scale 0.8–1.5, `BURST_SPEED 12–20`, `BURST_ANGLE_SPREAD:30°`, `GRAVITY:0.05`, `AIR_RESISTANCE:0.998`, fade after 70% of life, rotation 0.02–0.1. Two cannons from bottom-left (-70°) and bottom-right (-110°) at 70% screen height; 50 confetti **Sprites** each (textures 21–26); runs on its **own `requestAnimationFrame` loop** (its own `performance.now()` delta), auto-stops when empty, destroys sprites on expiry (no leak).

---

## 7. Rendering, resize/adaptive layout, performance

**`Application.init`:**
```js
await app.init({
  width: innerWidth, height: innerHeight,
  backgroundColor: 16573654,                       // 0xFCE4D6 warm peach (NOT yellow)
  resolution: Math.min(devicePixelRatio || 1, 2),  // DPR clamped at 2
  autoDensity: true, antialias: true, resizeTo: window
});
```
No `preference` (→ auto-detect, WebGL2 first; canvas last). No `powerPreference` (→ `"default"`). Canvas appended to `#game-container`.

**Resize — fit-by-height + horizontal-center (`setupResponsiveScaling`):**
```js
Jl();
const scale = innerHeight / Me;          // height-only uniform scale, no aspect distortion
app.stage.scale.set(scale);
app.stage.position.set((innerWidth - $e*scale)/2, 0);   // center 720-wide column, no vertical letterbox
canvas.style.position="absolute"; canvas.style.left="0"; canvas.style.top="0";
```
- Wired: `window.resize` → `setupResponsiveScaling()` + `fitTextToContainer(scoreDisplay,28,12)`; `orientationchange` → `setTimeout(handler, 100)` (debounced for viewport settle).
- **No safe-area handling** (no `env(safe-area-inset)`, no `viewport-fit=cover`). HUD is HTML in `#ui-container` (`position:fixed; inset:0; pointer-events:none; z-index:100`).
- Body CSS: `width/height:100%; overflow:hidden; touch-action:none; -webkit-touch-callout:none; user-select:none`.

**Ticker / loop:** default ticker, **no FPS cap, no fixed timestep**. `app.ticker.add(()=>update())`; `update(){ gameController.update(app.ticker.deltaMS); }`. All movement = `value * deltaMS / 1000` (frame-rate independent). Pause/resume via `ticker.stop()/start()` driven by MRAID `viewableChange`.

**Z-order enum `me`:** `FAR_BACKGROUND:0, MID_BACKGROUND:5, NEAR_BACKGROUND:8, GROUND:10, COLLECTIBLES:20, OBSTACLES:30, FINISH_LINE:35, ENEMIES:40, WARNING_LABEL:50, PLAYER:70, OVERLAY:85, CONFETTI:90`. Layers back→front: sky/city bg (z0, 6 mirrored tiles) → trees (z5) → lamps + bushes (z8) → entities → player (z70) → overlay (z85) → confetti (z90).

**Performance techniques to replicate:**
- DPR clamp at 2 (biggest mobile fill-rate guard).
- **Object pooling:** parallax props (trees/lamps/bushes) and 6 bg tiles created once, recycled via wrap-around (`updatePool`); never created/destroyed during play.
- **Per-frame culling:** `cleanupEntities()` filter-removes off-screen enemies/obstacles/collectibles via `isOffScreen()`.
- **Batching:** all scenery/entities are plain `Sprite`/`AnimatedSprite` (auto-batched); Graphics only for static overlay + fallback bg.
- **Atlas vs individual:** player is a `Spritesheet` atlas; scenery/confetti are individual textures.
- **Graceful degradation:** `Tq.init()` wraps texture load in `try/catch` → `createFallbackBackground()` (cheap Graphics rects) so a decode failure never freezes.
- Audio off GPU path (Howler, `html5PoolSize:10`, mute on pause). No `will-change`/`translateZ` (WebGL canvas).

---

## 8. Screens, HUD, audio, SDK hooks

**Bootstrap (`zq`):** `await Xq()` (no-op) → `new qp` (SDK adapter) → `await document.fonts.ready` (the embedded `GameFont` TTF) → `await new Zq().init()`. **No preloader/progress bar** — page bg `#1a1a2e` during load; `init()` → `showTutorial("start")` immediately. `Zq.init()`: `createUI()` → `await xe.init()` (audio) → `new Iq(app)` + `await gameController.init()` (Pixi assets, sequential `await te.load(dataURL)` per texture) → `await initFinishEffects()`.

**HUD (all HTML/DOM in `#ui-container`):**
- **Hearts (left):** `.hp-container`, `renderHearts(3)`, lost hearts class `empty` (opacity .3), 28px.
- **Money counter (right):** PayPal balance badge img (asset 41/`Oq`) + overlaid `#score-display` `$0`, PayPal blue `#003087`, weight 900; `updateScore` = `$` + `Math.floor(score)` + `fitTextToContainer(el,28,12)`; pulse on collect.
- **No progress meter** to the finish (progress = parallax scroll only).
- Fly-to-counter `.flying-collectible` (dynamic `@keyframes`, 0.4 s, 720° spin); praise popups `["Awesome!","Fantastic!","Great!","Perfect!"]`.
- In-world warning `Text` "EVADE" (red `#ff0000`, GameFont 32px, yellow box).
- Footer: cash banner (assets 38 landscape / 39 portrait, aspect 5.37:1 / 10:1) + `.footer-cta` "DOWNLOAD" (yellow gradient, pulsing); hidden on end screen.
- Global font: `@font-face GameFont` (TTF, asset 44), forced `font-family:GameFont!important`.

**Tutorial:** `.tutorial-overlay` text "Tap to start earning!" + `.tutorial-hand` (img asset 37, `pulse` 1→1.1). Mid-level swaps text to "Jump to avoid enemies".

**End card (`createEndOverlay`):** title "Congratulations!" / subtitle "Choose your reward!" (lose: "You didn't make it!" / "Try again on the app!"). `.paypal-card-wrapper` with rotating `.lights-effect` (asset 43/`jq`, 8 s rotate) + PayPal card (asset 41/42) + `#end-amount` `$0.00`. `playEndScreenAnimations`: `card-scale-bounce` (0→1.5→1), lights fade-in; after 600 ms `animateBalance` counts up over 1 s cubic-ease-out. `.countdown` "Next payment in one minute", `startCountdown(60)` ticks MM:SS, hides at 0. CTA `#cta-button` "Install and Earn" (yellow gradient `#ffe44d→#ff9500`, 3px `#E07800` border, pulsing; lose adds `.lose` → red).

**FAIL screen:** `.fail-overlay` (`#000c`) + FAIL badge (asset 40/`Dq`, `fail-scale-in` 0→1.2→1, 0.8 s); after **1500 ms** reveals the same end card with lose copy.

**Localization:** table `Pl = {en:FS, es:YS, it:DS}` (EN/ES/IT) but locale hard-coded `OS="en"` → `ae=FS` (USD `$`). Disclaimer: "The actual payment depends on playing and interacting with the JustPlay app."

**Audio (Howler v2.2.4, manager `Fq`/`xe`, manifest `Kq`):** 8 sounds, base64 data-URIs, preloaded via `Promise.all` (both `onload` and `onloaderror` resolve → never blocks startup). `unlock()` on first pointerdown; `play()` early-returns if `!isUnlocked`. Mute on pause (`Howler.mute(true)`), unmute on resume.

| key | vol | loop | trigger |
|---|---|---|---|
| jump | 0.5 | — | every jump (`on("jump")`) |
| hit | 0.6 | — | collision (played with hurt) |
| hurt | 0.7 | — | collision (same handler as hit) |
| collect | 0.4 | — | pickup |
| step | 0.3 | — | **loaded but never triggered** |
| win | 0.8 | — | `on("win")` → stopMusic + play |
| lose | 0.8 | — | `on("lose")` → stopMusic + play |
| music | 0.3 | **loop** | first transition to RUNNING; stopped on win/lose |

**Playable SDK adapter (class `qp`):**
- Store URLs: Google Play `...playoff.blocks.game.make.earn.money.rewarded`; App Store `id6444492155`. `getStoreUrl()` picks by UA `/Android/i`.
- **MRAID (`initMRAID`):** if no `mraid` → `markReady()` immediately; else wait for `ready`, then add `viewableChange` (→ pause/resume) and `sizeChange` listeners.
- **`download()` priority:** (1) `window.FbPlayableAd.onCTAClick()`; (2) `mraid.openStoreUrl(url)` else `mraid.open(url)`; (3) `super_html.download()`; (4) `window.open(url,"_blank")`. Wired to `#cta-button` + `#footer-cta` clicks.
- `gameEnd()`: `mraid.close()` + `super_html.game_end()`. Other bridges: `super_html.is_audio()`, `is_hide_download()`, `set_google_play_url/set_app_store_url`.
- **Viewability ↔ pause:** `on("viewableChange", e => e ? resume() : pause())` pauses ticker + audio when scrolled out of view.
- **Playbox host wrapper** (separate `<script>` blocks, NOT the game): overrides `window.open` and a capturing click listener so any `http`/`_blank`/`window.open` becomes `location.href="/_redirect?url=..."` (top frame) or `window.parent.postMessage({type:"CTA_CLICK", url}, "*")` (iframed); exposes `window.playboxCTA(url)`. Replicate only if targeting the Playbox host.

---

## 9. Full asset catalog (45 files)

| # | filename | type | dims / size | what it is | source var → role |
|---|---|---|---|---|---|
| 00 | 00_image.avif | avif | 2×2, ~0.3 KB | near-white pixel | engine fallback/blank texture |
| 01 | 01_image.webp | webp | 1×1, 38 B | white pixel | blank/fallback texture |
| 02 | 02_image.png | png | 1×1, 68 B | white pixel | `WHITE_PNG` default white texture |
| 03 | 03_image.png | png | 932×1506, 243 KB | **female runner spritesheet** | player A atlas (`_S`); idle18/run8/jump10/hurt5 |
| 04 | 04_image.png | png | 1682×1771, 438 KB | **bald/bearded striped-shirt runner** | player B atlas (`rq`); same 41-frame layout |
| 05 | 05_image.webp | webp | 119×135 | orange traffic cone | obstacle sprite (`nq`) |
| 06 | 06_image.webp | webp | 119×135 | red blurred cone | obstacle **glow** (`aq`) |
| 07 | 07_image.png | png | 1024×1024 | green dollar bill | collectible "dollar" (`Mp`) |
| 08 | 08_image.webp | webp | 808×551 | PayPal logo (color) | collectible "paypalCard" (`Ep`) |
| 09 | 09_image.png | png | 382×51 | b/w checker tape | **finish-line tape texture** (`hq`) → MeshRope |
| 10 | 10_image.png | png | 102×8 | mauve strip | finish-line/horizon strip (`cq`) |
| 11 | 11_image.png | png | 135×13 | purple gradient strip | finish-line accent strip (`uq`) |
| 12 | 12_image.png | png | 40×20 | yellow band | finish-line tape/post piece (`dq`) |
| 13 | 13_image.png | png | 46×23 | yellow diagonal band | finish-line tape/ribbon piece (`fq`) |
| 14 | 14_image.png | png | 1707×704, 148 KB | sky + city + road | **scrolling background** (`gq` → bgTexture) |
| 15 | 15_image.png | png | 236×192 | olive bush | bush #1 (`mq`) |
| 16 | 16_image.png | png | 199×205 | olive bush | bush #2 (`Sq`) |
| 17 | 17_image.png | png | 333×276 | large olive bush | bush #3 (`qq`) |
| 18 | 18_image.png | png | 89×357 | twin-lantern lamp | lamppost (`Mq`) |
| 19 | 19_image.png | png | 483×383 | purple-trunk tree (wide) | tree #1 (`Eq`) |
| 20 | 20_image.png | png | 338×382 | purple-trunk tree (tall) | tree #2 (`Vq`) |
| 21 | 21_image.png | png | 19×19 | orange fragment | confetti particle (`bq`) |
| 22 | 22_image.png | png | 37×24 | red swoosh | confetti particle (`yq`) |
| 23 | 23_image.png | png | 12×13 | magenta chip | confetti particle (`xq`) |
| 24 | 24_image.png | png | 30×15 | cyan strip | confetti particle (`vq`) |
| 25 | 25_image.png | png | 14×13 | pink-orange chip | confetti particle (`Cq`) |
| 26 | 26_image.png | png | 14×17 | yellow chip | confetti particle (`Uq`) |
| 27 | 27_audio.wav | wav | 48 B | silent | SFX placeholder |
| 28 | 28_audio.wav | wav | 48 B | silent | SFX placeholder |
| 29 | 29_audio.mpeg | mpeg | ~0.44 s | blip | **jump** SFX (`Bq`, .5) |
| 30 | 30_audio.mpeg | mpeg | ~0.26 s | impact | **hit** SFX (`Nq`, .6) |
| 31 | 31_audio.mpeg | mpeg | ~0.50 s | hurt | **hurt** SFX (`Qq`, .7) |
| 32 | 32_audio.mpeg | mpeg | ~0.63 s | chime | **collect** SFX (`wq`, .4) |
| 33 | 33_audio.mpeg | mpeg | ~0.55 s | footstep | **step** SFX (`Pq`, .3) — never triggered |
| 34 | 34_audio.mpeg | mpeg | ~5.07 s | jingle | **win** (`Jq`, .8) |
| 35 | 35_audio.mpeg | mpeg | ~3.74 s | jingle | **lose** (`Gq`, .8) |
| 36 | 36_audio.mpeg | mpeg | ~60 s, 352 KB | track | **music loop** (`Wq`, .3) |
| 37 | 37_image.png | png | 1572×1477, 73 KB | pointing hand | **tap hand** prompt (`Yq`) |
| 38 | 38_image.webp | webp | 2022×201 | "Playoff" banner | **footer landscape** (`Kl`) |
| 39 | 39_image.webp | webp | 1080×201 | "Playoff" banner | **footer portrait** (`Fl`) |
| 40 | 40_image.png | png | 250×250 | red FAIL badge | **lose FAIL badge** (`Dq`) |
| 41 | 41_image.webp | webp | 808×551 | PayPal logo card | **win "PayPal Balance" + HUD counter** (`Oq`) |
| 42 | 42_image.png | png | 800×200 | PayPal + blue button | **CTA button artwork** (`Lq`) |
| 43 | 43_image.png | png | 512×512 | white radial rays | **end-card light-rays** (`jq`) |
| 44 | 44_font.ttf | ttf | 26 KB | TrueType font | **HUD/UI font** (GameFont) |

**Spritesheet layout (players 03 & 04, packed/trimmed atlas — not a uniform grid):** `idle:18, run:8, jump:10, hurt:5 = 41 frames`, frame source size ~358×314. Index by named atlas frames, not row×col. All 45 files md5-match base64 data-URIs in the HTML.

---

## 10. Build & size notes (≤5 MB target)

How the original stays small — replicate these:
- **Single self-contained HTML.** All assets are base64 data-URIs inlined as module-level consts (`gq=`, `_S=`, etc.); loaded straight into `Assets.load(dataURL)` — no separate fetches, no JSON atlas file (sheet meta `zS={frames, animations, meta}` is inline).
- **Heavy use of compressed formats:** WebP for the largest scenery/UI (footer banners 2022×201, obstacle, paypal card), AVIF for placeholders; PNG only where alpha/quality demands. Audio is MP3 (`.mpeg`); the 60 s music loop is the single biggest audio asset (352 KB).
- **DPR clamp at 2** keeps the backing store small at runtime (not a file-size lever but a memory/fill lever).
- **PixiJS v8 tree-shaken via Vite** — only used classes bundled; minified single module.
- **Two silent WAV placeholders (27/28)** and three white-pixel placeholders (00/01/02) are tiny (<100 B each) — engine fallbacks, keep or stub.
- Font subset is small (26 KB TTF) — subset the reskin font similarly.

For the clone: budget the biggest line items (players 03=243 KB + 04=438 KB, music 36=352 KB, bg 14=148 KB, footers 38=large WebP). Re-encode reskin art as WebP/AVIF, subset the font, and keep one combined background texture (road baked in) rather than separate layers.

---

## 11. Risks / tricky parts for the clone

1. **MeshRope ribbon (§6) is the highest-risk feature.** Getting the sprite→rope swap, the rotated/anchored control-point construction (`width*scale.x*0.3`, only 30% length), and the spring+sine+decay+distance-constraint integrator to "feel" like cloth requires careful porting. The pinned point[0], stiffness 0.5, and `exp(-time*0.15)` decay envelope are load-bearing. Verify `MeshRope` API parity on your exact PixiJS v8 minor (constructor signature `{texture, points}` and `autoUpdate`).
2. **Sine-arc jump, not physics.** Easy to accidentally implement gravity; must be `y = startY - sin(progress*PI)*300` over 800 ms so jump height/timing exactly matches hazard clearance.
3. **Two collision models coexist:** circle-vs-rect for collectibles, AABB for hazards, with asymmetric shrink/offset hitboxes (`Te`). Wrong hitboxes make the game feel unfair (hazards) or ungenerous (coins). Enemy chase speed (`+300`) means the player must jump earlier than for static obstacles.
4. **Height-only scaling with no safe-area handling** can clip HUD on notched/tall devices or overflow on very narrow portrait. The original accepts this; for a faithful clone keep it, but be aware of the trade-off.
5. **Orientation swap (`Jl`) changes spawn math** (`distance*yt`, spawn-ahead `yt*1.5`) — test both portrait and landscape; world spacing differs by orientation.
6. **No FPS cap + no fixed timestep.** Relies entirely on `deltaMS` scaling; any value not multiplied by `deltaMS/1000` will be frame-rate-dependent and cause low-end slowdown or fast-device speedup. Audit every `update()`.
7. **Confetti runs on its own rAF**, outside the Pixi ticker — it must also respect MRAID pause or it keeps animating when the ad is off-screen (the original starts it only on `crossedFinish`, but verify pause behavior).
8. **Sequential `await` per-texture loading with no progress UI** — fine when all assets are inline data-URIs (synchronous decode), but if you move to fetched assets the lack of a preloader becomes a blank-screen risk. Keep inlined or add a loader.
9. **Localization is wired (EN/ES/IT) but hard-coded to `en`.** If the reskin needs other locales, the table exists (`Pl`) — just flip `OS`/`ae`; don't rebuild it.
10. **`step` SFX and `reset()` are dead code** — don't waste effort wiring them unless the reskin wants footsteps / a retry button (a retry would be a genuine feature addition, not a port).

**Discrepancies resolved across the source analyses:**
- **backgroundColor `16573654` = `0xFCE4D6` (warm peach)** — confirmed by decode; SCREENS-AUDIO's "#FCDA16 / yellow" reading is wrong.
- **PixiJS version:** build strings `8.3.4` and `8.14.3` both appear; treat as **v8, target ≥8.3**. Use whichever 8.x minor you standardize on, but re-verify `MeshRope`/`RopeGeometry` and `Spritesheet.parse()` signatures against it.
- All numeric constants (speeds, jump, hitboxes, finish config, level script `Gl`) were consistent across all five analyses — no conflicts; values above are authoritative.