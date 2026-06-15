import { describe, it, expect } from 'vitest';
import { SpawnScheduler, LEVEL_SCRIPT } from '../src/game/Level';

const W = 720;

describe('LEVEL_SCRIPT', () => {
  it('is ordered by distance and ends with the finish at 18', () => {
    for (let i = 1; i < LEVEL_SCRIPT.length; i++) {
      expect(LEVEL_SCRIPT[i].distance).toBeGreaterThanOrEqual(LEVEL_SCRIPT[i - 1].distance);
    }
    const last = LEVEL_SCRIPT[LEVEL_SCRIPT.length - 1];
    expect(last.type).toBe('finish');
    expect(last.distance).toBe(18);
  });

  it('marks the first enemy as the tutorial pause', () => {
    const firstEnemy = LEVEL_SCRIPT.find((e) => e.type === 'enemy');
    expect(firstEnemy?.pauseForTutorial).toBe(true);
    expect(firstEnemy?.distance).toBe(3);
  });
});

describe('SpawnScheduler', () => {
  it('fires an entry one screen-width before its distance', () => {
    const s = new SpawnScheduler();
    // entry@1 triggers at 1*720 - 720 = 0
    expect(s.due(0, W).map((e) => e.distance)).toEqual([1]);
    // entry@2 triggers at 2*720-720 = 720
    expect(s.due(719, W)).toEqual([]);
    expect(s.due(720, W).map((e) => e.distance)).toEqual([2]);
  });

  it('returns multiple entries when several are due at once', () => {
    const s = new SpawnScheduler();
    // jump far ahead → everything up to that trigger fires in order
    const due = s.due(3 * W, W); // triggers <= 2160 → entries @1,@2,@3,@4
    expect(due.map((e) => e.distance)).toEqual([1, 2, 3, 4]);
  });

  it('walks the whole script exactly once and then is finished', () => {
    const s = new SpawnScheduler();
    const all = s.due(100 * W, W);
    expect(all.length).toBe(LEVEL_SCRIPT.length);
    expect(s.finished).toBe(true);
    expect(s.due(200 * W, W)).toEqual([]);
  });

  it('reset() rewinds', () => {
    const s = new SpawnScheduler();
    s.due(100 * W, W);
    s.reset();
    expect(s.finished).toBe(false);
    expect(s.due(0, W).map((e) => e.distance)).toEqual([1]);
  });
});
