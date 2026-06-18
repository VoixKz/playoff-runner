import { Container, Sprite, Texture } from 'pixi.js';
import { DESIGN_HEIGHT, HITBOX, OBSTACLE, PLAYER, Z } from '../../config/constants';
import { insetRect, type Rect } from '../collision';

/** Ground hazard (cone). Moves at world speed; pulsing glow. Optional EVADE warning. */
export class Obstacle extends Container {
  readonly warningLabel: boolean;
  private sprite: Sprite;
  private glow: Sprite;
  private t = 0;

  constructor(texture: Texture, glowTexture: Texture, warningLabel = false) {
    super();
    this.warningLabel = warningLabel;
    this.glow = new Sprite(glowTexture);
    this.glow.anchor.set(0.5, 1);
    this.glow.alpha = 0.8;
    this.sprite = new Sprite(texture);
    this.sprite.anchor.set(0.5, 1);
    this.addChild(this.glow, this.sprite);
    this.scale.set(OBSTACLE.BASE_SCALE);
    this.y = DESIGN_HEIGHT - PLAYER.GROUND_Y - OBSTACLE.GROUND_OFFSET;
    this.zIndex = Z.OBSTACLES;
  }

  update(dtMs: number, speed: number): void {
    this.x -= (speed * dtMs) / 1000;
    this.t += dtMs;
    const pulse =
      OBSTACLE.SCALE_MIN +
      (OBSTACLE.SCALE_MAX - OBSTACLE.SCALE_MIN) * (0.5 + 0.5 * Math.sin(this.t * OBSTACLE.PULSE_SPEED));
    this.glow.scale.set(pulse);
  }

  getBoundsRect(): Rect {
    const w = this.sprite.width * this.scale.x;
    const h = this.sprite.height * this.scale.y;
    return insetRect({ x: this.x - w / 2, y: this.y - h, w, h }, HITBOX.OBSTACLE_SHRINK);
  }

  isOffScreen(cullX: number): boolean {
    return this.x < cullX;
  }
}
