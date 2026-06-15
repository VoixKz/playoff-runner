import { describe, it, expect } from 'vitest';
import { makeRopePoints, stepRope, ropeSettled } from '../src/game/rope';
import { ROPE } from '../src/config/constants';

describe('makeRopePoints', () => {
  it('creates evenly spaced collinear points along a direction', () => {
    const pts = makeRopePoints({ x: 0, y: 0 }, { x: 1, y: 0 });
    expect(pts.length).toBe(ROPE.SEGMENTS);
    expect(pts[1].x).toBeCloseTo(ROPE.SEGMENT_DISTANCE);
    expect(pts[1].y).toBeCloseTo(0);
    expect(pts.every((p) => p.vx === 0 && p.vy === 0)).toBe(true);
  });
});

describe('stepRope integrator', () => {
  it('pins point 0 (the pole) — it never moves', () => {
    const pts = makeRopePoints({ x: 100, y: 200 }, { x: 1, y: 0 });
    const p0 = { ...pts[0] };
    let t = 0;
    for (let i = 0; i < 50; i++) t = stepRope(pts, t);
    expect(pts[0].x).toBe(p0.x);
    expect(pts[0].y).toBe(p0.y);
  });

  it('advances animationTime by the fixed step', () => {
    const pts = makeRopePoints({ x: 0, y: 0 }, { x: 1, y: 0 });
    expect(stepRope(pts, 0)).toBeCloseTo(ROPE.TIME_STEP);
  });

  it('makes the free end fall under gravity early on', () => {
    const pts = makeRopePoints({ x: 0, y: 0 }, { x: 1, y: 0 });
    let t = 0;
    for (let i = 0; i < 10; i++) t = stepRope(pts, t);
    expect(pts[pts.length - 1].y).toBeGreaterThan(0); // sagged downward
  });

  it('is stable and settles to rest (no NaN / blowup)', () => {
    const pts = makeRopePoints({ x: 0, y: 0 }, { x: 1, y: 0 });
    let t = 0;
    let settled = false;
    for (let i = 0; i < 2000 && !settled; i++) {
      t = stepRope(pts, t);
      settled = ropeSettled(pts, t);
    }
    expect(settled).toBe(true);
    expect(pts.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true);
  });

  it('keeps segment lengths bounded near the rest distance', () => {
    const pts = makeRopePoints({ x: 0, y: 0 }, { x: 1, y: 0 });
    let t = 0;
    for (let i = 0; i < 500; i++) t = stepRope(pts, t);
    for (let i = 1; i < pts.length; i++) {
      const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      expect(d).toBeLessThan(ROPE.SEGMENT_DISTANCE * 3);
    }
  });
});
