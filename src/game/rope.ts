// Pure verlet-style rope/cloth integrator for the finish ribbon (reference `fe` /
// animateRopePoints). No Pixi dependency so it can be unit-tested for stability.
import { ROPE } from '../config/constants';

export interface RopePoint {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function makeRopePoints(
  start: { x: number; y: number },
  dir: { x: number; y: number },
  segments: number = ROPE.SEGMENTS,
  spacing: number = ROPE.SEGMENT_DISTANCE,
): RopePoint[] {
  // Normalize direction so points are evenly spaced along the tape.
  const len = Math.hypot(dir.x, dir.y) || 1;
  const ux = (dir.x / len) * spacing;
  const uy = (dir.y / len) * spacing;
  const pts: RopePoint[] = [];
  for (let i = 0; i < segments; i++) {
    pts.push({ x: start.x + ux * i, y: start.y + uy * i, vx: 0, vy: 0 });
  }
  return pts;
}

/**
 * Advance the rope one frame. Point 0 is pinned (the pole). Mutates `points`.
 * Returns the updated animationTime. Mirrors the reference integrator exactly:
 * gravity + travelling sine wave + damping + 1-iteration distance constraint.
 */
export function stepRope(points: RopePoint[], animationTime: number): number {
  const t = animationTime + ROPE.TIME_STEP;
  const decay = Math.exp(-t * ROPE.TIME_DECAY);

  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    // forces
    p.vy += ROPE.GRAVITY * decay;
    p.vx += Math.sin(t + i * ROPE.WAVE_SPEED) * ROPE.WAVE_AMPLITUDE * decay * ROPE.WAVE_DECAY_SCALE;
    // damping
    p.vx *= ROPE.DAMPING;
    p.vy *= ROPE.DAMPING;
    // integrate
    p.x += p.vx;
    p.y += p.vy;
    // distance constraint toward predecessor (1 Jacobi iteration, stiffness 0.5)
    const prev = points[i - 1];
    const dx = p.x - prev.x;
    const dy = p.y - prev.y;
    const f = Math.hypot(dx, dy) || ROPE.SEGMENT_DISTANCE;
    const k = ((f - ROPE.SEGMENT_DISTANCE) / f) * ROPE.CONSTRAINT_STIFFNESS;
    p.x -= dx * k;
    p.y -= dy * k;
  }
  return t;
}

/** Rope has settled when it's had time to swing and motion is negligible. */
export function ropeSettled(points: RopePoint[], animationTime: number): boolean {
  if (animationTime <= ROPE.MIN_ANIMATION_TIME) return false;
  let sum = 0;
  for (let i = 1; i < points.length; i++) {
    sum += Math.hypot(points[i].vx, points[i].vy);
  }
  const mean = sum / Math.max(1, points.length - 1);
  return mean < ROPE.MIN_VELOCITY_THRESHOLD;
}
