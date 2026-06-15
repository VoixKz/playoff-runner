// Pure collision math — no Pixi dependency, fully unit-testable.
// Two models coexist (per reference): circle-vs-rect for collectibles, AABB for hazards.

export interface Rect {
  x: number; // top-left
  y: number;
  w: number;
  h: number;
}

/**
 * Shrink a sprite's full bounds to a tighter hitbox, keeping it centered,
 * then translate by (offsetX*w, offsetY*h). Matches reference `Te` shrink/offset.
 */
export function shrinkRect(
  full: Rect,
  factorX: number,
  factorY: number,
  offsetX = 0,
  offsetY = 0,
): Rect {
  const w = full.w * factorX;
  const h = full.h * factorY;
  const cx = full.x + full.w / 2 + full.w * offsetX;
  const cy = full.y + full.h / 2 + full.h * offsetY;
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

/** Symmetric inset by `px` on every side (reference OBSTACLE_SHRINK). */
export function insetRect(full: Rect, px: number): Rect {
  return { x: full.x + px, y: full.y + px, w: full.w - px * 2, h: full.h - px * 2 };
}

/** Axis-aligned bounding-box overlap. */
export function rectsIntersect(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** Circle (cx,cy,r) vs rect via closest-point distance. */
export function circleIntersectsRect(cx: number, cy: number, r: number, rect: Rect): boolean {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}
