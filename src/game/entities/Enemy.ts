import { AnimatedSprite, Container, Spritesheet, Texture } from 'pixi.js';
import { DESIGN_HEIGHT, ENEMY, HITBOX, OFFSCREEN_LEFT, PLAYER, Z } from '../../config/constants';
import { shrinkRect, type Rect } from '../collision';

/** Chaser: moves left faster than the world (worldSpeed + CHASE_SPEED), faces the player. */
export class Enemy extends Container {
  private sprite: AnimatedSprite;

  constructor(sheet: Spritesheet) {
    super();
    const all =
      (sheet.animations.default as Texture[]) ??
      (Object.values(sheet.animations)[0] as Texture[]);
    // Only the first clean run cycle — the atlas packs several clips into
    // `default`, and looping through all of them makes the chaser twitch.
    const frames = all.slice(0, ENEMY.RUN_FRAME_COUNT);
    this.sprite = new AnimatedSprite(frames);
    this.sprite.anchor.set(0.5, 1);
    this.sprite.animationSpeed = ENEMY.ANIMATION_SPEED;
    this.sprite.scale.x = -1; // face left, toward the player
    this.sprite.play();
    this.addChild(this.sprite);
    this.scale.set(PLAYER.SCALE * ENEMY.SCALE_MULT);
    this.y = DESIGN_HEIGHT - PLAYER.GROUND_Y - ENEMY.GROUND_OFFSET;
    this.zIndex = Z.ENEMIES;
  }

  update(dtMs: number, worldSpeed: number): void {
    this.x -= ((worldSpeed + ENEMY.CHASE_SPEED) * dtMs) / 1000;
  }

  getBoundsRect(): Rect {
    const w = Math.abs(this.sprite.width) * Math.abs(this.scale.x);
    const h = this.sprite.height * this.scale.y;
    const full = { x: this.x - w / 2, y: this.y - h, w, h };
    return shrinkRect(full, HITBOX.ENEMY.X, HITBOX.ENEMY.Y, HITBOX.ENEMY.OFFSET_X, HITBOX.ENEMY.OFFSET_Y);
  }

  isOffScreen(): boolean {
    return this.x < OFFSCREEN_LEFT;
  }
}
