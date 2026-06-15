import { Container, Sprite, Texture } from 'pixi.js';
import { CONFETTI, Z } from '../config/constants';

interface Particle {
  sprite: Sprite;
  vx: number;
  vy: number;
  vr: number;
  life: number;
  maxLife: number;
  active: boolean;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const DEG = Math.PI / 180;

/** Two-cannon confetti burst. Pooled sprites; driven by the game ticker (respects pause). */
export class Confetti extends Container {
  private pool: Particle[] = [];

  constructor(textures: Texture[]) {
    super();
    this.zIndex = Z.CONFETTI;
    const total = CONFETTI.PARTICLE_COUNT * 2;
    for (let i = 0; i < total; i++) {
      const sprite = new Sprite(textures[i % textures.length]);
      sprite.anchor.set(0.5);
      sprite.visible = false;
      this.addChild(sprite);
      this.pool.push({ sprite, vx: 0, vy: 0, vr: 0, life: 0, maxLife: 0, active: false });
    }
  }

  burst(width: number, height: number): void {
    let idx = 0;
    const fire = (originX: number, baseAngle: number) => {
      for (let i = 0; i < CONFETTI.PARTICLE_COUNT && idx < this.pool.length; i++, idx++) {
        const p = this.pool[idx];
        const angle = baseAngle + rand(-CONFETTI.ANGLE_SPREAD, CONFETTI.ANGLE_SPREAD) * DEG;
        const speed = rand(CONFETTI.BURST_SPEED_MIN, CONFETTI.BURST_SPEED_MAX);
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        p.vr = rand(CONFETTI.ROTATION_MIN, CONFETTI.ROTATION_MAX) * (Math.random() < 0.5 ? -1 : 1);
        p.life = 0;
        p.maxLife = CONFETTI.LIFETIME;
        p.active = true;
        p.sprite.visible = true;
        p.sprite.alpha = 1;
        p.sprite.position.set(originX, height * 0.7);
        p.sprite.scale.set(rand(CONFETTI.SCALE_MIN, CONFETTI.SCALE_MAX));
      }
    };
    fire(0, -60 * DEG); // bottom-left → up-right
    fire(width, -120 * DEG); // bottom-right → up-left
  }

  update(dtMs: number): void {
    const f = dtMs / 16.667;
    for (const p of this.pool) {
      if (!p.active) continue;
      p.vy += CONFETTI.GRAVITY * f;
      p.vx *= CONFETTI.AIR_RESISTANCE;
      p.vy *= CONFETTI.AIR_RESISTANCE;
      p.sprite.x += p.vx * f;
      p.sprite.y += p.vy * f;
      p.sprite.rotation += p.vr * f;
      p.life += dtMs;
      const r = p.life / p.maxLife;
      if (r >= CONFETTI.FADE_AFTER) {
        p.sprite.alpha = Math.max(0, 1 - (r - CONFETTI.FADE_AFTER) / (1 - CONFETTI.FADE_AFTER));
      }
      if (p.life >= p.maxLife) {
        p.active = false;
        p.sprite.visible = false;
      }
    }
  }
}
