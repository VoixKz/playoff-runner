import { Container, Graphics, MeshRope, PerspectiveMesh, Point, Sprite, Texture } from 'pixi.js';
import { FINISH, Z } from '../config/constants';
import { makeRopePoints, ropeSettled, stepRope, type RopePoint } from './rope';

interface RopeHalf {
  points: RopePoint[];
  meshPoints: Point[];
  mesh: MeshRope;
}

type Pt = { x: number; y: number };

/**
 * Finish gate: a 4-corner checkered floor quad, two dark poles, and a yellow tape
 * strung between the pole tops. ALL geometry/colour is read straight from the
 * FINISH block in src/config/constants.ts — tune there, not here.
 *
 * While running the tape is ONE taut ribbon between the two pole tops. When the
 * runner crosses, breakTape() hides it and hangs a PixiJS MeshRope from each pole
 * (driven by the verlet integrator in rope.ts) so each half snaps and falls.
 */
export class FinishLine extends Container {
  private tape: Sprite;
  private halves: RopeHalf[] = [];
  private animationTime = 0;
  private broken = false;
  private settled = false;
  private readonly tapeTexture: Texture;
  private readonly floorTexture: Texture;

  // The tape's own endpoints (design-space coords) — independent of the poles.
  private readonly leftKnot: Pt = { x: FINISH.TAPE_LEFT_X, y: FINISH.TAPE_LEFT_Y };
  private readonly rightKnot: Pt = { x: FINISH.TAPE_RIGHT_X, y: FINISH.TAPE_RIGHT_Y };

  constructor() {
    super();
    this.zIndex = Z.FINISH_LINE;
    this.tapeTexture = makeBarTexture(); // built from FINISH.TAPE_COLOR/THICKNESS
    this.floorTexture = makeCheckerTexture(); // built from FINISH.FLOOR_COLS/ROWS/COLOR_*

    // back-to-front: floor quad → poles → tape
    this.addChild(this.makeFloorPattern());
    this.addChild(
      this.makePole({ x: FINISH.LEFT_POLE_TOP_X, y: FINISH.LEFT_POLE_TOP_Y }, { x: FINISH.LEFT_POLE_BOT_X, y: FINISH.LEFT_POLE_BOT_Y }),
      this.makePole({ x: FINISH.RIGHT_POLE_TOP_X, y: FINISH.RIGHT_POLE_TOP_Y }, { x: FINISH.RIGHT_POLE_BOT_X, y: FINISH.RIGHT_POLE_BOT_Y }),
    );
    this.tape = this.makeTape();
    this.addChild(this.tape);
  }

  /** Checkered finish zone as a free 4-corner quad. The flat checker texture is
   *  projected onto the four FINISH.FLOOR_* corners, so they alone set the shape. */
  private makeFloorPattern(): PerspectiveMesh {
    return new PerspectiveMesh({
      texture: this.floorTexture,
      verticesX: 20, // subdivision → smoother perspective on the checker
      verticesY: 16,
      x0: FINISH.FLOOR_TL_X, y0: FINISH.FLOOR_TL_Y, // top-left
      x1: FINISH.FLOOR_TR_X, y1: FINISH.FLOOR_TR_Y, // top-right
      x2: FINISH.FLOOR_BR_X, y2: FINISH.FLOOR_BR_Y, // bottom-right
      x3: FINISH.FLOOR_BL_X, y3: FINISH.FLOOR_BL_Y, // bottom-left
    });
  }

  /** A dark pole drawn as a thick line from its TOP point down to its BOTTOM point
   *  (extended a touch above the top so it pokes past the tape knot). */
  private makePole(top: Pt, bot: Pt): Graphics {
    const dx = top.x - bot.x;
    const dy = top.y - bot.y;
    const len = Math.hypot(dx, dy) || 1;
    const tx = top.x + (dx / len) * FINISH.POLE_TOP_EXTRA; // poke past the knot
    const ty = top.y + (dy / len) * FINISH.POLE_TOP_EXTRA;
    return new Graphics()
      .moveTo(tx, ty)
      .lineTo(bot.x, bot.y)
      .stroke({ width: FINISH.POLE_WIDTH, color: FINISH.POLE_COLOR, cap: 'round' });
  }

  /** One straight ribbon from the left endpoint to the right endpoint (tilted by their Y gap). */
  private makeTape(): Sprite {
    const dx = this.rightKnot.x - this.leftKnot.x;
    const dy = this.rightKnot.y - this.leftKnot.y;
    const length = Math.hypot(dx, dy);
    const tape = new Sprite(this.tapeTexture);
    tape.anchor.set(0, 0.5); // pin the left end, centre vertically
    tape.position.set(this.leftKnot.x, this.leftKnot.y);
    tape.width = length;
    tape.height = FINISH.TAPE_THICKNESS;
    tape.rotation = Math.atan2(dy, dx); // tilt to follow the endpoint-to-endpoint slope
    return tape;
  }

  get isBroken(): boolean {
    return this.broken;
  }

  /** Snap the tape: hide the ribbon, hang a falling MeshRope from each pole. */
  breakTape(): void {
    if (this.broken) return;
    this.broken = true;
    this.tape.visible = false;
    const dx = this.rightKnot.x - this.leftKnot.x;
    const dy = this.rightKnot.y - this.leftKnot.y;
    const length = Math.hypot(dx, dy);
    const ux = dx / length;
    const uy = dy / length;
    // each half spans pole → midpoint, along the tape's own slope
    this.halves.push(this.buildHalf(this.leftKnot, ux, uy, length / 2));
    this.halves.push(this.buildHalf(this.rightKnot, -ux, -uy, length / 2));
  }

  private buildHalf(knot: Pt, dirX: number, dirY: number, length: number): RopeHalf {
    const segments = 10;
    const spacing = length / (segments - 1);
    const points = makeRopePoints({ x: knot.x, y: knot.y }, { x: dirX, y: dirY }, segments, spacing);
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

/** Build the finish-floor checker as a FLAT texture from the FINISH cell settings.
 *  The PerspectiveMesh quad supplies the perspective; this is just a plain grid, so
 *  FLOOR_COLS / FLOOR_ROWS directly control how many squares appear across / down. */
function makeCheckerTexture(): Texture {
  const cols = Math.max(1, FINISH.FLOOR_COLS);
  const rows = Math.max(1, FINISH.FLOOR_ROWS);
  const cell = 24; // source px per square (texture sharpness, not the on-screen size)
  const canvas = document.createElement('canvas');
  canvas.width = cols * cell;
  canvas.height = rows * cell;
  const ctx = canvas.getContext('2d')!;
  const a = '#' + FINISH.FLOOR_COLOR_A.toString(16).padStart(6, '0');
  const b = '#' + FINISH.FLOOR_COLOR_B.toString(16).padStart(6, '0');
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? a : b;
      ctx.fillRect(c * cell, r * cell, cell, cell);
    }
  }
  return Texture.from(canvas);
}

/** Build the tape ribbon as a solid colour bar from the FINISH tape settings.
 *  Used both for the taut sprite and (stretched along the rope) for the torn halves. */
function makeBarTexture(): Texture {
  const h = Math.max(1, Math.round(FINISH.TAPE_THICKNESS));
  const w = 32; // width is arbitrary — the sprite/rope stretches it along its length
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#' + FINISH.TAPE_COLOR.toString(16).padStart(6, '0');
  ctx.fillRect(0, 0, w, h);
  return Texture.from(canvas);
}
