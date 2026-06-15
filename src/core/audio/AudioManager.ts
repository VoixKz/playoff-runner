import { Howl, Howler } from 'howler';
import type { SkinAudio } from '../../config/skins/types';

type Key = keyof SkinAudio;

const VOLUMES: Record<Key, number> = {
  jump: 0.5,
  hit: 0.6,
  hurt: 0.7,
  collect: 0.4,
  win: 0.8,
  lose: 0.8,
  music: 0.3,
};

/** Howler wrapper. Loading never blocks startup (both onload/onloaderror resolve). */
export class AudioManager {
  private sounds = new Map<Key, Howl>();
  private unlocked = false;

  constructor(private readonly manifest: SkinAudio) {}

  async init(): Promise<void> {
    Howler.html5PoolSize = 10;
    const keys = Object.keys(this.manifest) as Key[];
    await Promise.all(
      keys.map(
        (key) =>
          new Promise<void>((resolve) => {
            const howl = new Howl({
              src: [this.manifest[key]],
              volume: VOLUMES[key],
              loop: key === 'music',
              onload: () => resolve(),
              onloaderror: () => resolve(),
            });
            this.sounds.set(key, howl);
          }),
      ),
    );
  }

  /** Call on first user gesture (pointerdown) to satisfy autoplay policies. */
  unlock(): void {
    this.unlocked = true;
  }

  play(key: Key): void {
    if (!this.unlocked) return;
    this.sounds.get(key)?.play();
  }

  stopMusic(): void {
    this.sounds.get('music')?.stop();
  }

  setMuted(muted: boolean): void {
    Howler.mute(muted);
  }
}
