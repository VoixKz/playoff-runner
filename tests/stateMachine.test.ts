import { describe, it, expect, vi } from 'vitest';
import { StateMachine } from '../src/core/StateMachine';

describe('StateMachine', () => {
  it('starts in LOADING by default', () => {
    expect(new StateMachine().state).toBe('LOADING');
  });

  it('follows the reference happy path LOADING→INTRO→RUNNING→END_WIN', () => {
    const sm = new StateMachine();
    expect(sm.transition('INTRO')).toBe(true);
    expect(sm.transition('RUNNING')).toBe(true);
    expect(sm.transition('END_WIN')).toBe(true);
    expect(sm.state).toBe('END_WIN');
  });

  it('allows the tutorial pause RUNNING⇄PAUSED', () => {
    const sm = new StateMachine('RUNNING');
    expect(sm.transition('PAUSED')).toBe(true);
    expect(sm.transition('RUNNING')).toBe(true);
  });

  it('rejects illegal transitions and stays put', () => {
    const sm = new StateMachine('LOADING');
    expect(sm.transition('RUNNING')).toBe(false);
    expect(sm.state).toBe('LOADING');
  });

  it('end states are terminal', () => {
    const sm = new StateMachine('END_WIN');
    expect(sm.canTransition('RUNNING')).toBe(false);
    expect(sm.transition('INTRO')).toBe(false);
  });

  it('notifies listeners with {from,to}', () => {
    const sm = new StateMachine('RUNNING');
    const spy = vi.fn();
    sm.onChange(spy);
    sm.transition('END_LOSE');
    expect(spy).toHaveBeenCalledWith({ from: 'RUNNING', to: 'END_LOSE' });
  });
});
