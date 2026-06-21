// All gameplay constants, lifted 1:1 from the reverse-engineered reference.
// Single source of truth — do not scatter magic numbers.

/** Portrait design space. The stage is scaled to fit the screen height. */
export const DESIGN_WIDTH = 720;
export const DESIGN_HEIGHT = 1280;

/** Pixi stage background — warm peach 0xFCE4D6 (NOT yellow). */
export const BACKGROUND_COLOR = 0xfce4d6;

export const PLAYER = {
  X_POSITION: 0.18, // fraction of design width → 129.6px
  GROUND_Y: 280, // groundY = DESIGN_HEIGHT - 280 = 1000
  JUMP_HEIGHT: 300, // peak rise in px
  JUMP_DURATION: 800, // ms for a full sine-arc jump
  INVINCIBILITY_TIME: 500, // ms i-frames after a hit
  SCALE: 0.54,
  ANIMATION_SPEED: 0.15,
  BLINK_INTERVAL: 100, // ms tint toggle during invincibility
  TINT_HURT: 0xff2604,
  TINT_NORMAL: 0xffffff,
} as const;

export const WORLD = {
  BASE_SPEED: 600, // px/sec, constant (no ramp)
  DECELERATION_RATE: 0.9, // per-frame multiplier once finish reached
  MIN_SPEED: 10, // below this, snap to 0 → win
  LAMP_SPACING: 800,
  BG_TILE_COUNT: 6,
} as const;

export const ENEMY = {
  CHASE_SPEED: 300, // added on top of world speed
  SCALE_MULT: 1.3, // relative to PLAYER.SCALE
  GROUND_OFFSET: 20, // sits 20px above player ground line
  // ~matches the chaser's speed over the ground (less foot-slide) and reads as
  // smoothly as the player's run instead of a frantic shuffle.
  ANIMATION_SPEED: 0.3,
  // The enemy atlas concatenates 5 separate walk/run clips (each with its own
  // source size) under one `default` list. Playing all 44 frames makes the
  // chaser jerk between gaits — use only the first complete, consistent cycle.
  RUN_FRAME_COUNT: 10,
} as const;

export const OBSTACLE = {
  PULSE_SPEED: 0.003,
  SCALE_MIN: 0.9,
  SCALE_MAX: 1.1,
  BASE_SCALE: 0.8,
  GROUND_OFFSET: 20,
  WARNING_Y: 800, // "EVADE" label y
  WARNING_PULSE: 0.008,
} as const;

export const COLLECTIBLE = {
  DOLLAR_VALUE: 20, // plain dollar
  PAYPAL_VALUE: 40, // PayPal card
  DOLLAR_RATIO: 0.6, // < 0.6 → dollar, else paypal card
  RADIUS: 60, // world-space pickup radius
  Y_BASE: 800, // DESIGN_HEIGHT - GROUND_Y - 200
  BASE_SCALE: 0.15,
  PAYPAL_SCALE_MULT: 1.2,
  PULSE_SPEED: 5e-4,
  PULSE_MIN: 0.95,
  PULSE_MAX: 1.05,
  BOB_AMPLITUDE: 5,
} as const;

export const HITBOX = {
  PLAYER: { X: 0.25, Y: 0.7, OFFSET_X: 0, OFFSET_Y: -0.15 },
  ENEMY: { X: 0.3, Y: 0.5, OFFSET_X: 0, OFFSET_Y: 0.2 },
  OBSTACLE_SHRINK: 10,
} as const;

export const MAX_HP = 3;

export const TUTORIAL_PAUSE_DISTANCE = 300; // px before tutorial enemy → pause

/** Finish-line MeshRope cloth integrator config (reference `fe`). */
export const ROPE = {
  SEGMENTS: 10,
  GRAVITY: 0.3,
  DAMPING: 0.95,
  WAVE_SPEED: 0.01,
  WAVE_AMPLITUDE: 2,
  WAVE_DECAY_SCALE: 0.1, // wave term scaled by decay * this
  TIME_STEP: 0.05, // animationTime += per frame
  TIME_DECAY: 0.15, // decay = exp(-animationTime * 0.15)
  MIN_VELOCITY_THRESHOLD: 0.1,
  MIN_ANIMATION_TIME: 1,
  SEGMENT_DISTANCE: 10,
  CONSTRAINT_STIFFNESS: 0.5,
} as const;

/**
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │  FINISH GATE — hand-tuning panel                                           │
 * │  Everything about how the finish looks lives HERE. Edit these numbers      │
 * │  and refresh the game — no other file needs touching.                      │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * COORDINATE SYSTEM (design space, 720 wide × 1280 tall):
 *   • X grows to the RIGHT  →   0 = far left,  360 = centre,  720 = far right
 *   • Y grows DOWNWARD      ↓   0 = top,  1000 = the runner's feet,  1280 = bottom
 *   • The purple road sits around Y ≈ 1000 (that's where the player stands).
 *   • Smaller Y = HIGHER on screen.  Bigger Y = LOWER on screen.
 *
 * The gate is 3 pieces: a 4-corner checkered FLOOR quad, two dark POLES (each a
 * free top→bottom line), and the yellow TAPE between the pole tops. Tune in that
 * order. Open the game with `?finish` to park the gate on screen and tune live.
 */
export const FINISH = {
  // ── 1 · CHECKERED FLOOR — a free 4-corner quad (drag each corner) ───────────
  //   Four fully independent corners — make it a parallelogram, a trapezoid,
  //   whatever sits flat on the purple road. Each corner is (X right+, Y down+).
  //   The texture is a FLAT checker; THESE corners create all the perspective.
  //   Default = parallelogram sheared LEFT (top edge shifted left of the bottom).
  FLOOR_TL_X: 30, FLOOR_TL_Y: 885, //  top-left      ┌
  FLOOR_TR_X: 730, FLOOR_TR_Y: 885, //  top-right     ┐
  FLOOR_BR_X: 820, FLOOR_BR_Y: 1005, //  bottom-right ┘
  FLOOR_BL_X: 120, FLOOR_BL_Y: 1005, //  bottom-left  └
  //   Cell frequency — the checker is generated from these, so change them freely:
  FLOOR_COLS: 39, //  how many squares ACROSS (width).  Bigger = NARROWER cells.
  FLOOR_ROWS: 8, //   how many squares DOWN (height).   Bigger = SHORTER cells.
  FLOOR_COLOR_A: 0xf5f5f8, //  light squares.
  FLOOR_COLOR_B: 0x262234, //  dark squares.

  // ── 2 · POLES — each pole is a line from a TOP point to a BOTTOM point ───────
  //   Full control of BOTH coordinates of BOTH ends of EACH pole. The tape ties
  //   to each pole's TOP point, so moving a TOP also moves that end of the tape.
  POLE_COLOR: 0x2e2a3a, //  dark grey-purple.  0x000000 = black, 0x3a2f4a = darker violet.
  POLE_WIDTH: 9, //  thickness of each pole in px.
  POLE_TOP_EXTRA: 18, //  how far the pole pokes UP past its TOP point (above the tape knot).
  LEFT_POLE_TOP_X: 35, LEFT_POLE_TOP_Y: 805, //   LEFT pole — TOP end (tape ties here)
  LEFT_POLE_BOT_X: 35, LEFT_POLE_BOT_Y: 885, //  LEFT pole — BOTTOM end (on the ground)
  RIGHT_POLE_TOP_X: 120, RIGHT_POLE_TOP_Y: 888, //  RIGHT pole — TOP end (tape ties here)
  RIGHT_POLE_BOT_X: 120, RIGHT_POLE_BOT_Y: 1005, // RIGHT pole — BOTTOM end (on the ground)

  // ── 3 · TAPE — the taut ribbon (its OWN endpoints, colour & thickness) ──────
  //   The tape is generated in code (no texture), so the colour is exactly what
  //   you set here. Its two ends are independent points — by default they sit on
  //   the pole tops; move them freely to slide/tilt/detach the ribbon.
  TAPE_LEFT_X: 35, TAPE_LEFT_Y: 805, //   LEFT end of the tape
  TAPE_RIGHT_X: 120, TAPE_RIGHT_Y: 888, // RIGHT end of the tape  (different Ys = tilt)
  TAPE_COLOR: 0xf2c200, //  ribbon colour (0xRRGGBB).  e.g. 0xff3b3b = red, 0xffffff = white.
  TAPE_THICKNESS: 9, //    ribbon height in px (also the thickness of the torn halves).

  // ── 4 · BREAK TIMING (when the runner tears through the tape) ───────────────
  //   The tape snaps when the LEFT pole reaches the player. Keep ≈ LEFT_POLE_TOP_X.
  BREAK_OFFSET: 120,
} as const;

export const CONFETTI = {
  PARTICLE_COUNT: 28, // per side — enough for a lively burst without tanking FPS at the finish
  LIFETIME: 5000,
  SCALE_MIN: 0.8,
  SCALE_MAX: 1.5,
  BURST_SPEED_MIN: 12,
  BURST_SPEED_MAX: 20,
  ANGLE_SPREAD: 30, // degrees
  GRAVITY: 0.05,
  AIR_RESISTANCE: 0.998,
  FADE_AFTER: 0.7, // fraction of life
  ROTATION_MIN: 0.02,
  ROTATION_MAX: 0.1,
  OVERLAY_ALPHA: 0.6,
} as const;

export const FAIL_FLASH_MS = 1500;
export const COUNTDOWN_SECONDS = 60;
export const BALANCE_COUNTUP_MS = 1000;

/** Z-order (reference enum `me`). */
export const Z = {
  FAR_BACKGROUND: 0,
  MID_BACKGROUND: 5,
  NEAR_BACKGROUND: 8,
  GROUND: 10,
  COLLECTIBLES: 20,
  OBSTACLES: 30,
  FINISH_LINE: 35,
  ENEMIES: 40,
  WARNING_LABEL: 50,
  PLAYER: 70,
  OVERLAY: 85,
  CONFETTI: 90,
} as const;

export type GameStateName =
  | 'LOADING'
  | 'INTRO'
  | 'RUNNING'
  | 'PAUSED'
  | 'END_WIN'
  | 'END_LOSE';

export type PlayerAnim = 'idle' | 'run' | 'jump' | 'hurt';
