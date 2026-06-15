// Hand-authored level script (reference `Gl`). `distance` is in screen-widths;
// `yOffset` raises a collectible above the 800 baseline (forces a jump for high arcs).

export type EntityType = 'collectible' | 'obstacle' | 'enemy' | 'finish';

export interface LevelEntry {
  type: EntityType;
  distance: number; // in screen-widths
  yOffset?: number;
  pauseForTutorial?: boolean;
  warningLabel?: boolean;
}

export const LEVEL_SCRIPT: LevelEntry[] = [
  { type: 'collectible', distance: 1 },
  { type: 'collectible', distance: 2 },
  { type: 'enemy', distance: 3, pauseForTutorial: true },
  // jump arc of coins
  { type: 'collectible', distance: 4, yOffset: 50 },
  { type: 'collectible', distance: 4.2, yOffset: 150 },
  { type: 'collectible', distance: 4.4, yOffset: 250 },
  { type: 'collectible', distance: 4.6, yOffset: 150 },
  { type: 'collectible', distance: 4.8, yOffset: 50 },
  { type: 'obstacle', distance: 5.6, warningLabel: true },
  { type: 'collectible', distance: 6.4 },
  { type: 'enemy', distance: 7 },
  // arc
  { type: 'collectible', distance: 7.6 },
  { type: 'collectible', distance: 7.8, yOffset: 100 },
  { type: 'collectible', distance: 8, yOffset: 200 },
  { type: 'collectible', distance: 8.2, yOffset: 280 },
  { type: 'collectible', distance: 8.4, yOffset: 200 },
  { type: 'collectible', distance: 8.6, yOffset: 100 },
  { type: 'obstacle', distance: 9, warningLabel: true },
  { type: 'collectible', distance: 9.6 },
  { type: 'enemy', distance: 10 },
  { type: 'collectible', distance: 10.6 },
  { type: 'collectible', distance: 11, yOffset: 80 },
  { type: 'collectible', distance: 11.2, yOffset: 180 },
  { type: 'collectible', distance: 11.4, yOffset: 80 },
  { type: 'obstacle', distance: 12 },
  { type: 'enemy', distance: 12.6 },
  { type: 'collectible', distance: 13 },
  { type: 'collectible', distance: 13.2, yOffset: 100 },
  { type: 'collectible', distance: 13.4, yOffset: 200 },
  { type: 'collectible', distance: 13.6, yOffset: 100 },
  { type: 'obstacle', distance: 14, warningLabel: true },
  { type: 'collectible', distance: 14.5 },
  { type: 'enemy', distance: 15 },
  { type: 'collectible', distance: 15.4, yOffset: 80 },
  { type: 'collectible', distance: 15.6, yOffset: 180 },
  { type: 'collectible', distance: 15.8, yOffset: 260 },
  { type: 'collectible', distance: 16, yOffset: 180 },
  { type: 'collectible', distance: 16.2, yOffset: 80 },
  { type: 'obstacle', distance: 16.5 },
  { type: 'finish', distance: 18 },
];

/**
 * Pure spawn scheduler. Walks the script in order; an entry fires when
 * `distanceTraveled >= entry.distance * workingWidth - workingWidth`
 * (one screen-width early so it spawns off-screen right). Deterministic and testable.
 */
export class SpawnScheduler {
  private index = 0;
  constructor(private readonly script: LevelEntry[] = LEVEL_SCRIPT) {}

  reset(): void {
    this.index = 0;
  }

  get finished(): boolean {
    return this.index >= this.script.length;
  }

  /** Returns all entries whose trigger distance has been reached since the last call. */
  due(distanceTraveled: number, workingWidth: number): LevelEntry[] {
    const out: LevelEntry[] = [];
    while (this.index < this.script.length) {
      const entry = this.script[this.index];
      const trigger = entry.distance * workingWidth - workingWidth;
      if (distanceTraveled >= trigger) {
        out.push(entry);
        this.index++;
      } else {
        break;
      }
    }
    return out;
  }
}
