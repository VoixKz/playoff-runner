// A Skin bundles every themeable asset + theme/copy. Gameplay constants live in
// constants.ts and are identical across skins — only presentation differs.

export interface SpritesheetData {
  texture: string; // image URL / data-URI
  atlas: unknown; // Pixi spritesheet JSON ({frames, animations, meta})
}

export interface SkinAssets {
  background: string;
  player: SpritesheetData;
  enemy: SpritesheetData;
  dollar: string; // primary collectible (60%)
  paypalCard: string; // secondary collectible (40%)
  finishTape: string; // checker tape texture → MeshRope
  finishFloor: string; // perspective checkered finish zone painted on the road
  obstacle: string;
  obstacleGlow: string;
  trees: string[];
  bushes: string[];
  lamp: string;
  confetti: string[];
  tapHand: string;
  failBadge: string;
  rewardCard: string; // end-card reward artwork
  lightRays: string;
  bannerPortrait: string;
  bannerLandscape: string;
  font: string; // TTF URL
}

export interface SkinAudio {
  jump: string;
  hit: string;
  hurt: string;
  collect: string;
  win: string;
  lose: string;
  music: string;
}

export interface SkinTheme {
  /** Pixi stage clear colour. */
  bgColor: number;
  fontFamily: string;
  counterTextColor: string;
  ctaGradient: [string, string];
  ctaBorder: string;
  currency: string;
  /** Optional tint applied to parallax props (trees/bushes/lamps) to fit the theme. */
  propTint?: number;
}

export interface SkinCopy {
  start: string;
  jump: string;
  winTitle: string;
  winSubtitle: string;
  loseTitle: string;
  loseSubtitle: string;
  cta: string;
  reward: string; // sub-label, e.g. "Choose your reward!"
  countdown: string;
  disclaimer: string;
  praises: string[];
}

export interface Skin {
  id: 'original';
  assets: SkinAssets;
  audio: SkinAudio;
  theme: SkinTheme;
  copy: SkinCopy;
  /** Store / landing URLs for the CTA. */
  store: { google: string; apple: string };
}
