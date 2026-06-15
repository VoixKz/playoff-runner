import type { GameStateName } from '../config/constants';

// Allowed transitions (reference state machine `ge`). Pure & testable.
const TRANSITIONS: Record<GameStateName, GameStateName[]> = {
  LOADING: ['INTRO'],
  INTRO: ['RUNNING'],
  RUNNING: ['PAUSED', 'END_WIN', 'END_LOSE'],
  PAUSED: ['RUNNING'],
  END_WIN: [],
  END_LOSE: [],
};

export interface StateChange {
  from: GameStateName;
  to: GameStateName;
}

export class StateMachine {
  private _state: GameStateName;
  private listeners = new Set<(c: StateChange) => void>();

  constructor(initial: GameStateName = 'LOADING') {
    this._state = initial;
  }

  get state(): GameStateName {
    return this._state;
  }

  is(...states: GameStateName[]): boolean {
    return states.includes(this._state);
  }

  canTransition(to: GameStateName): boolean {
    return TRANSITIONS[this._state].includes(to);
  }

  /** Returns true if the transition was applied. Invalid transitions are ignored. */
  transition(to: GameStateName): boolean {
    if (!this.canTransition(to)) return false;
    const from = this._state;
    this._state = to;
    this.listeners.forEach((fn) => fn({ from, to }));
    return true;
  }

  onChange(fn: (c: StateChange) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}
