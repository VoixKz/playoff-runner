import { AnimatedSprite, Container, Spritesheet, Texture } from 'pixi.js';
import { DESIGN_WIDTH, DESIGN_HEIGHT, PLAYER, Z, type PlayerAnim } from '../config/constants';
import type { Rect } from './collision';

/** The runner: pinned in X, one vertical DOF (sine-arc jump), i-frame blink on hit. */
export class Player extends Container {
  private sprite: AnimatedSprite;
  private anims: Record<string, Texture[]>;
  private current: PlayerAnim = 'idle';

  private jumping = false;
  private jumpProgress = 0;
  private jumpStartY = 0;

  isInvincible = false;
  private invincTimer = 0;
  private blinkTimer = 0;

  readonly groundY: number;
  onJump?: () => void;

  constructor(sheet: Spritesheet) {
    super();
    this.anims = sheet.animations as unknown as Record<string, Texture[]>;
    const initial = this.anims.idle ?? this.anims.run ?? Object.values(this.anims)[0];
    this.sprite = new AnimatedSprite(initial);
    this.sprite.anchor.set(0.5, 1);
    this.sprite.animationSpeed = PLAYER.ANIMATION_SPEED;
    this.sprite.onComplete = () => {
      if (this.current === 'hurt' && !this.jumping) this.run();
    };
    this.addChild(this.sprite);

    this.scale.set(PLAYER.SCALE);
    this.zIndex = Z.PLAYER;
    this.groundY = DESIGN_HEIGHT - PLAYER.GROUND_Y;
    this.position.set(DESIGN_WIDTH * PLAYER.X_POSITION, this.groundY);
    this.setAnim('idle');
  }

  private setAnim(name: PlayerAnim): void {
    const frames = this.anims[name] ?? this.anims.run ?? this.anims.idle;
    if (!frames) return;
    if (this.current === name && this.sprite.playing) return;
    this.current = name;
    this.sprite.textures = frames;
    if (name === 'jump') {
      this.sprite.loop = false;
      this.sprite.animationSpeed = PLAYER.ANIMATION_SPEED * 1.5;
    } else if (name === 'hurt') {
      this.sprite.loop = false;
      this.sprite.animationSpeed = PLAYER.ANIMATION_SPEED * 2;
    } else {
      this.sprite.loop = true;
      this.sprite.animationSpeed = PLAYER.ANIMATION_SPEED;
    }
    this.sprite.gotoAndPlay(0);
  }

  idle(): void {
    if (!this.jumping) this.setAnim('idle');
  }
  run(): void {
    if (!this.jumping) this.setAnim('run');
  }

  get isOnGround(): boolean {
    return !this.jumping;
  }

  jump(): void {
    if (this.jumping) return;
    this.jumping = true;
    this.jumpProgress = 0;
    this.jumpStartY = this.groundY;
    this.setAnim('jump');
    this.onJump?.();
  }

  hurt(): void {
    this.isInvincible = true;
    this.invincTimer = PLAYER.INVINCIBILITY_TIME;
    this.blinkTimer = PLAYER.BLINK_INTERVAL;
    this.setAnim('hurt');
  }

  update(dtMs: number): void {
    if (this.jumping) {
      this.jumpProgress += dtMs / PLAYER.JUMP_DURATION;
      if (this.jumpProgress >= 1) {
        this.jumping = false;
        this.y = this.jumpStartY;
        this.run();
      } else {
        this.y = this.jumpStartY - Math.sin(this.jumpProgress * Math.PI) * PLAYER.JUMP_HEIGHT;
      }
    }

    if (this.isInvincible) {
      this.invincTimer -= dtMs;
      this.blinkTimer -= dtMs;
      if (this.blinkTimer <= 0) {
        this.blinkTimer = PLAYER.BLINK_INTERVAL;
        this.sprite.tint = this.sprite.tint === PLAYER.TINT_NORMAL ? PLAYER.TINT_HURT : PLAYER.TINT_NORMAL;
      }
      if (this.invincTimer <= 0) {
        this.isInvincible = false;
        this.sprite.tint = PLAYER.TINT_NORMAL;
      }
    }
  }

  /** Full design-space bounds (anchor is bottom-center). */
  getBoundsRect(): Rect {
    const w = this.sprite.width * this.scale.x;
    const h = this.sprite.height * this.scale.y;
    return { x: this.x - w / 2, y: this.y - h, w, h };
  }

  reset(): void {
    this.jumping = false;
    this.jumpProgress = 0;
    this.isInvincible = false;
    this.sprite.tint = PLAYER.TINT_NORMAL;
    this.y = this.groundY;
    this.setAnim('idle');
  }
}
