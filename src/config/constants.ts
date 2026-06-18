// All gameplay constants, lifted 1:1 from the reverse-engineered reference
// (see docs/reference-spec.md). Single source of truth — do not scatter magic numbers.

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
  TREE_MIN_SPACING: 300,
  TREE_MAX_SPACING: 500,
  BUSH_MIN_SPACING: 250,
  BUSH_MAX_SPACING: 450,
  SCREEN_BUFFER: 1200,
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
  LENGTH_FACTOR: 0.3, // only ~30% of tape length dangles
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
  LEFT_OFFSET_X: 0,
  LEFT_OFFSET_Y: 0,
  RIGHT_OFFSET_X: 20,
  RIGHT_OFFSET_Y: -20,
  TAPE_BREAK_OFFSET: -300, // break when player.x >= finish.x - 300
  // Tuned for our full-width poles (50 / 670): each half runs from its pole down to
  // the centre so the two meet in a clean shallow V, instead of overshooting into a
  // crossed X (the reference's .4/-2.5/1.8 were for its narrow gate).
  LEFT_TAPE_ROTATION: 0.22,
  RIGHT_TAPE_ROTATION: 2.92,
  TAPE_SCALE_X: 0.83,
  TAPE_SCALE_Y: 1,
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
