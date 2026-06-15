import { describe, it, expect } from 'vitest';
import {
  shrinkRect,
  insetRect,
  rectsIntersect,
  circleIntersectsRect,
  type Rect,
} from '../src/game/collision';

describe('shrinkRect', () => {
  it('shrinks centered by the given factors', () => {
    const full: Rect = { x: 0, y: 0, w: 100, h: 100 };
    const r = shrinkRect(full, 0.5, 0.5);
    expect(r).toEqual({ x: 25, y: 25, w: 50, h: 50 });
  });

  it('applies offset relative to dimensions', () => {
    const full: Rect = { x: 0, y: 0, w: 100, h: 100 };
    const r = shrinkRect(full, 0.5, 0.5, 0, -0.15);
    // center y shifts up by 15 → top = 50center -25half -15 = 10
    expect(r.y).toBe(10);
    expect(r.x).toBe(25);
  });
});

describe('insetRect', () => {
  it('insets symmetrically', () => {
    expect(insetRect({ x: 0, y: 0, w: 100, h: 100 }, 10)).toEqual({
      x: 10,
      y: 10,
      w: 80,
      h: 80,
    });
  });
});

describe('rectsIntersect', () => {
  const a: Rect = { x: 0, y: 0, w: 10, h: 10 };
  it('detects overlap', () => {
    expect(rectsIntersect(a, { x: 5, y: 5, w: 10, h: 10 })).toBe(true);
  });
  it('rejects separation', () => {
    expect(rectsIntersect(a, { x: 20, y: 0, w: 5, h: 5 })).toBe(false);
  });
  it('treats edge-touching as non-overlap', () => {
    expect(rectsIntersect(a, { x: 10, y: 0, w: 5, h: 5 })).toBe(false);
  });
});

describe('circleIntersectsRect', () => {
  const rect: Rect = { x: 0, y: 0, w: 10, h: 10 };
  it('hits when center inside', () => {
    expect(circleIntersectsRect(5, 5, 1, rect)).toBe(true);
  });
  it('hits when circle grazes a corner within radius', () => {
    expect(circleIntersectsRect(12, 12, 4, rect)).toBe(true); // dist √8≈2.83 < 4
  });
  it('misses when beyond radius from nearest edge', () => {
    expect(circleIntersectsRect(20, 5, 5, rect)).toBe(false); // dist 10 > 5
  });
});
