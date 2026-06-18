import { Container, Graphics, MeshRope, Point, Sprite, Texture } from 'pixi.js';
import { DESIGN_HEIGHT, DESIGN_WIDTH, PLAYER, ROPE, Z } from '../config/constants';
import { ropeSettled, stepRope, type RopePoint } from './rope';

interface RopeHalf {
  points: RopePoint[];
  meshPoints: Point[];
  mesh: MeshRope;
}

/**
 * Finish gate: two poles + a checker tape. While running the tape is a pair of
 * rotated Sprites; when the runner hits it, breakTape() swaps each half for a
 * PixiJS MeshRope driven by the verlet integrator (rope.ts) so it falls like cloth.
 */
export class FinishLine extends Container {
  private leftTape: Sprite;
  private rightTape: Sprite;
  private halves: RopeHalf[] = [];
  private animationTime = 0;
  private broken = false;
  private settled = false;
  private readonly tapeTexture: Texture;
  private readonly floorTexture: Texture;
  private readonly groundY: number;
  private readonly tapeY: number;

  constructor(tapeTexture: Texture, floorTexture: Texture) {
    super();
    this.zIndex = Z.FINISH_LINE;
    this.tapeTexture = tapeTexture;
    this.floorTexture = floorTexture;
    this.groundY = DESIGN_HEIGHT - PLAYER.GROUND_Y;
    this.tapeY = this.groundY - 232; // ~runner head height, so the tape is broken by the runner

    // checkered finish strip on the road (behind poles/tape), like the reference
    this.addChild(this.makeFloorPattern());

    const leftPoleX = 50;
    const rightPoleX = DESIGN_WIDTH - 50;
    this.addChild(this.makePole(leftPoleX), this.makePole(rightPoleX));

    this.leftTape = new Sprite(tapeTexture);
    this.leftTape.anchor.set(0, 0);
    this.leftTape.scale.set(ROPE.TAPE_SCALE_X, ROPE.TAPE_SCALE_Y);
    this.leftTape.rotation = ROPE.LEFT_TAPE_ROTATION;
    this.leftTape.position.set(leftPoleX, this.tapeY);

    this.rightTape = new Sprite(tapeTexture);
    this.rightTape.anchor.set(0, 0);
    this.rightTape.scale.set(ROPE.TAPE_SCALE_X, ROPE.TAPE_SCALE_Y);
    this.rightTape.rotation = ROPE.RIGHT_TAPE_ROTATION;
    this.rightTape.position.set(rightPoleX, this.tapeY);

    this.addChild(this.leftTape, this.rightTape);
  }

  private makePole(x: number): Graphics {
    const g = new Graphics();
    g.rect(-6, this.tapeY - 20, 12, this.groundY - this.tapeY + 20).fill(0x4a3b6b);
    g.x = x;
    return g;
  }

  /** Perspective checkered finish zone painted on the road (reference `floorPattern`). */
  private makeFloorPattern(): Sprite {
    const floor = new Sprite(this.floorTexture);
    floor.anchor.set(0.5, 0.55);
    floor.position.set(DESIGN_WIDTH / 2, this.groundY - 20);
    return floor;
  }

  get isBroken(): boolean {
    return this.broken;
  }

  /** Swap each tape sprite for a MeshRope whose control points the integrator drives. */
  breakTape(): void {
    if (this.broken) return;
    this.broken = true;
    this.leftTape.visible = false;
    this.rightTape.visible = false;
    this.halves.push(this.buildHalf(this.leftTape, ROPE.LEFT_OFFSET_X, ROPE.LEFT_OFFSET_Y));
    this.halves.push(this.buildHalf(this.rightTape, ROPE.RIGHT_OFFSET_X, ROPE.RIGHT_OFFSET_Y));
  }

  private buildHalf(tape: Sprite, offX: number, offY: number): RopeHalf {
    const length = this.tapeTexture.width * tape.scale.x * ROPE.LENGTH_FACTOR;
    const spacing = length / (ROPE.SEGMENTS - 1);
    const dx = Math.cos(tape.rotation) * spacing;
    const dy = Math.sin(tape.rotation) * spacing;
    const points: RopePoint[] = [];
    const meshPoints: Point[] = [];
    for (let i = 0; i < ROPE.SEGMENTS; i++) {
      const px = tape.x + dx * i + offX;
      const py = tape.y + dy * i + offY;
      points.push({ x: px, y: py, vx: 0, vy: 0 });
      meshPoints.push(new Point(px, py));
    }
    const mesh = new MeshRope({ texture: this.tapeTexture, points: meshPoints });
    this.addChild(mesh);
    return { points, meshPoints, mesh };
  }

  update(dtMs: number, speed: number): void {
    this.x -= (speed * dtMs) / 1000; // scrolls with the world
    if (!this.broken || this.settled) return;

    // Step both halves on the same clock (same input time → same decay envelope).
    const t = this.animationTime;
    const newT = stepRope(this.halves[0].points, t);
    if (this.halves[1]) stepRope(this.halves[1].points, t);
    this.animationTime = newT;

    let allSettled = true;
    for (const half of this.halves) {
      for (let i = 0; i < half.points.length; i++) {
        half.meshPoints[i].x = half.points[i].x;
        half.meshPoints[i].y = half.points[i].y;
      }
      if (!ropeSettled(half.points, this.animationTime)) allSettled = false;
    }
    this.settled = allSettled;
  }
}
