/**
 * Game Engine Unit Tests — Beat Me in 3
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createEngine, GameStatus, getHint, _setNow } from './engine.js';

let _time = 0;
beforeEach(() => {
  _time = 0;
  _setNow(() => _time);
});

function tick(ms) { _time += ms; }

// ── createEngine ─────────────────────────────────────────────

describe('createEngine — validation', () => {
  it('throws for secret < 0', () => {
    expect(() => createEngine({ secretNumber: -1, mode: 'daily' })).toThrow(RangeError);
  });
  it('throws for secret > 9', () => {
    expect(() => createEngine({ secretNumber: 10, mode: 'daily' })).toThrow(RangeError);
  });
  it('throws for non-integer secret', () => {
    expect(() => createEngine({ secretNumber: 3.5, mode: 'daily' })).toThrow(RangeError);
  });
  it('accepts valid secrets 0–9', () => {
    for (let i = 0; i <= 9; i++) {
      expect(() => createEngine({ secretNumber: i, mode: 'daily' })).not.toThrow();
    }
  });
});

describe('start()', () => {
  it('transitions from IDLE to PLAYING', () => {
    const e = createEngine({ secretNumber: 5, mode: 'daily' });
    expect(e.getState().status).toBe(GameStatus.IDLE);
    e.start();
    expect(e.getState().status).toBe(GameStatus.PLAYING);
  });
  it('throws if called twice', () => {
    const e = createEngine({ secretNumber: 5, mode: 'daily' });
    e.start();
    expect(() => e.start()).toThrow();
  });
  it('throws if called after win', () => {
    const e = createEngine({ secretNumber: 5, mode: 'daily' });
    e.start();
    e.submitGuess(5);
    expect(() => e.start()).toThrow();
  });
});

describe('submitGuess()', () => {
  it('returns correct=true and status=WON on correct guess', () => {
    const e = createEngine({ secretNumber: 7, mode: 'daily' });
    e.start();
    const r = e.submitGuess(7);
    expect(r.correct).toBe(true);
    expect(r.hint).toBeNull();
    expect(r.status).toBe(GameStatus.WON);
  });

  it('returns hint "higher" when guess is too low', () => {
    const e = createEngine({ secretNumber: 7, mode: 'daily' });
    e.start();
    const r = e.submitGuess(3);
    expect(r.correct).toBe(false);
    expect(r.hint).toBe('higher');
    expect(r.status).toBe(GameStatus.PLAYING);
  });

  it('returns hint "lower" when guess is too high', () => {
    const e = createEngine({ secretNumber: 3, mode: 'daily' });
    e.start();
    const r = e.submitGuess(8);
    expect(r.correct).toBe(false);
    expect(r.hint).toBe('lower');
  });

  it('transitions to LOST after 3 wrong guesses', () => {
    const e = createEngine({ secretNumber: 5, mode: 'daily' });
    e.start();
    e.submitGuess(0);
    e.submitGuess(1);
    const r = e.submitGuess(2);
    expect(r.status).toBe(GameStatus.LOST);
  });

  it('throws on wrong guess after game is over', () => {
    const e = createEngine({ secretNumber: 5, mode: 'daily' });
    e.start();
    e.submitGuess(5); // win
    expect(() => e.submitGuess(5)).toThrow();
  });

  it('throws on invalid guess values', () => {
    const e = createEngine({ secretNumber: 5, mode: 'daily' });
    e.start();
    expect(() => e.submitGuess(-1)).toThrow(RangeError);
    expect(() => e.submitGuess(10)).toThrow(RangeError);
    expect(() => e.submitGuess(3.5)).toThrow(RangeError);
  });

  it('records attempt count correctly', () => {
    const e = createEngine({ secretNumber: 9, mode: 'daily' });
    e.start();
    e.submitGuess(0);
    e.submitGuess(1);
    expect(e.getState().triesUsed).toBe(2);
  });
});

describe('timeOut()', () => {
  it('records a timed-out attempt', () => {
    const e = createEngine({ secretNumber: 5, mode: 'daily' });
    e.start();
    const r = e.timeOut();
    expect(r.timedOut).toBe(true);
    expect(r.correct).toBe(false);
    expect(r.status).toBe(GameStatus.PLAYING);
  });

  it('transitions to LOST after 3 timeouts', () => {
    const e = createEngine({ secretNumber: 5, mode: 'daily' });
    e.start();
    e.timeOut();
    e.timeOut();
    const r = e.timeOut();
    expect(r.status).toBe(GameStatus.LOST);
  });

  it('throws if called when not playing', () => {
    const e = createEngine({ secretNumber: 5, mode: 'daily' });
    expect(() => e.timeOut()).toThrow();
  });
});

describe('getState()', () => {
  it('returns snapshot (not live reference)', () => {
    const e = createEngine({ secretNumber: 5, mode: 'daily' });
    e.start();
    const s1 = e.getState();
    e.submitGuess(0);
    const s2 = e.getState();
    expect(s1.triesUsed).toBe(0);
    expect(s2.triesUsed).toBe(1);
  });

  it('includes mode', () => {
    const e = createEngine({ secretNumber: 5, mode: 'friend' });
    expect(e.getState().mode).toBe('friend');
  });
});

describe('getTotalTime()', () => {
  it('returns 0 before start', () => {
    const e = createEngine({ secretNumber: 5, mode: 'daily' });
    expect(e.getTotalTime()).toBe(0);
  });

  it('returns elapsed ms after start', () => {
    const e = createEngine({ secretNumber: 5, mode: 'daily' });
    e.start();
    tick(1500);
    expect(e.getTotalTime()).toBe(1500);
  });
});

describe('getHint()', () => {
  it('returns null for correct guess', () => {
    expect(getHint(5, 5)).toBeNull();
  });
  it('returns "higher" when guess < secret', () => {
    expect(getHint(3, 7)).toBe('higher');
  });
  it('returns "lower" when guess > secret', () => {
    expect(getHint(8, 2)).toBe('lower');
  });
});
