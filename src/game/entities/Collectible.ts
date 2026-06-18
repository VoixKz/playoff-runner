import { Container, Sprite, Texture } from 'pixi.js';
import { COLLECTIBLE, OFFSCREEN_LEFT, Z } from '../../config/constants';

export type CollectibleKind = 'dollar' | 'paypal';

/** A floating, pulsing pickup. Collection is circle-vs-rect (radius in world space). */
export class Collectible extends Container {
  readonly kind: CollectibleKind;
  readonly value: number;
  collected = false;
  private sprite: Sprite;
  private baseScale: number;
  private t = 0;

  constructor(texture: Texture, kind: CollectibleKind, value: number) {
    super();
    this.kind = kind;
    this.value = value;
    this.sprite = new Sprite(texture);
    this.sprite.anchor.set(0.5);
    this.baseScale = COLLECTIBLE.BASE_SCALE * (kind === 'paypal' ? COLLECTIBLE.PAYPAL_SCALE_MULT : 1);
    this.addChild(this.sprite);
    this.zIndex = Z.COLLECTIBLES;
  }

  update(dtMs: number, speed: number): void {
    this.x -= (speed * dtMs) / 1000;
    this.t += dtMs;
    const pulse = 1 + 0.05 * Math.sin(this.t * COLLECTIBLE.PULSE_SPEED);
    this.sprite.scale.set(this.baseScale * pulse);
    this.sprite.y = Math.sin(this.t * 0.002) * COLLECTIBLE.BOB_AMPLITUDE;
  }

  /** Pickup circle in design space. */
  get circle(): { cx: number; cy: number; r: number } {
    return { cx: this.x, cy: this.y + this.sprite.y, r: COLLECTIBLE.RADIUS };
  }

  isOffScreen(): boolean {
    return this.x < OFFSCREEN_LEFT;
  }
}
