import { Container, Graphics, MeshRope, Point, Sprite, Texture } from 'pixi.js';
import { DESIGN_HEIGHT, DESIGN_WIDTH, PLAYER, ROPE, Z } from '../config/constants';
import { makeRopePoints, ropeSettled, stepRope, type RopePoint } from './rope';

interface RopeHalf {
  points: RopePoint[];
  meshPoints: Point[];
  mesh: MeshRope;
}

/**
 * Finish gate: two poles + a checker tape. While running the tape is ONE taut
 * ribbon stretched between the poles (intact). When the runner crosses, breakTape()
 * hides it and hangs a PixiJS MeshRope from each pole, driven by the verlet
 * integrator (rope.ts) so each half snaps and falls like cloth.
 */
export class FinishLine extends Container {
  private tape: Sprite;
  private halves: RopeHalf[] = [];
  private animationTime = 0;
  private broken = false;
  private settled = false;
  private readonly tapeTexture: Texture;
  private readonly floorTexture: Texture;
  private readonly groundY: number;
  private readonly tapeY: number;
  private readonly leftPoleX = 50;
  private readonly rightPoleX = DESIGN_WIDTH - 50;

  constructor(tapeTexture: Texture, floorTexture: Texture) {
    super();
    this.zIndex = Z.FINISH_LINE;
    this.tapeTexture = tapeTexture;
    this.floorTexture = floorTexture;
    this.groundY = DESIGN_HEIGHT - PLAYER.GROUND_Y;
    this.tapeY = this.groundY - 232; // ~runner head height, so the runner breaks it

    // checkered finish strip on the road (behind poles/tape)
    this.addChild(this.makeFloorPattern());
    this.addChild(this.makePole(this.leftPoleX), this.makePole(this.rightPoleX));

    // ONE continuous taut ribbon stretched pole-to-pole — intact until broken.
    this.tape = new Sprite(tapeTexture);
    this.tape.anchor.set(0, 0.5);
    this.tape.position.set(this.leftPoleX, this.tapeY);
    this.tape.width = this.rightPoleX - this.leftPoleX;
    this.addChild(this.tape);
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

  /** Snap the tape: hide the ribbon, hang a falling MeshRope from each pole. */
  breakTape(): void {
    if (this.broken) return;
    this.broken = true;
    this.tape.visible = false;
    this.halves.push(this.buildHalf(this.leftPoleX, 1)); // pinned at left pole, falls toward centre
    this.halves.push(this.buildHalf(this.rightPoleX, -1)); // pinned at right pole
  }

  private buildHalf(poleX: number, dirX: number): RopeHalf {
    const length = (this.rightPoleX - this.leftPoleX) / 2; // pole → centre
    const spacing = length / (ROPE.SEGMENTS - 1);
    const points = makeRopePoints({ x: poleX, y: this.tapeY }, { x: dirX, y: 0 }, ROPE.SEGMENTS, spacing);
    const meshPoints = points.map((p) => new Point(p.x, p.y));
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
