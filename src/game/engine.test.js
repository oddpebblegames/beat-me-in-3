import { describe, it, expect, beforeEach } from 'vitest';
import { createEngine, GameStatus, getHint, _setNow } from './engine.js';

// Use a fake clock
let fakeTime = 0;
beforeEach(() => {
  fakeTime = 0;
  _setNow(() => fakeTime);
});

function makeEngine(secret = 5, overrides = {}) {
  return createEngine({ secretNumber: secret, mode: 'daily', ...overrides });
}

describe('createEngine: validation', () => {
  it('throws on secret < 0', () => {
    expect(() => makeEngine(-1)).toThrow(RangeError);
  });

  it('throws on secret > 9', () => {
    expect(() => makeEngine(10)).toThrow(RangeError);
  });

  it('throws on non-integer secret', () => {
    expect(() => makeEngine(3.5)).toThrow(RangeError);
  });
});

describe('engine: start', () => {
  it('starts in IDLE status', () => {
    const e = makeEngine();
    expect(e.getState().status).toBe(GameStatus.IDLE);
  });

  it('transitions to PLAYING on start()', () => {
    const e = makeEngine();
    e.start();
    expect(e.getState().status).toBe(GameStatus.PLAYING);
  });

  it('throws if submitGuess called before start', () => {
    const e = makeEngine();
    expect(() => e.submitGuess(5)).toThrow();
  });
});

describe('engine: correct guess', () => {
  it('returns correct=true and status WON on first try', () => {
    const e = makeEngine(5);
    e.start();
    const result = e.submitGuess(5);
    expect(result.correct).toBe(true);
    expect(result.hint).toBeNull();
    expect(result.status).toBe(GameStatus.WON);
    expect(result.attemptsUsed).toBe(1);
  });

  it('state shows WON after correct guess', () => {
    const e = makeEngine(3);
    e.start();
    e.submitGuess(3);
    expect(e.getState().status).toBe(GameStatus.WON);
  });
});

describe('engine: wrong guesses', () => {
  it('returns hint=higher when guess is too low', () => {
    const e = makeEngine(7);
    e.start();
    const r = e.submitGuess(3);
    expect(r.correct).toBe(false);
    expect(r.hint).toBe('higher');
    expect(r.status).toBe(GameStatus.PLAYING);
  });

  it('returns hint=lower when guess is too high', () => {
    const e = makeEngine(2);
    e.start();
    const r = e.submitGuess(8);
    expect(r.correct).toBe(false);
    expect(r.hint).toBe('lower');
  });

  it('transitions to LOST after maxAttempts wrong guesses', () => {
    const e = makeEngine(5);
    e.start();
    e.submitGuess(1); // wrong
    e.submitGuess(2); // wrong
    const r = e.submitGuess(3); // wrong — exhausted
    expect(r.status).toBe(GameStatus.LOST);
  });

  it('records all attempts', () => {
    const e = makeEngine(5);
    e.start();
    e.submitGuess(1);
    e.submitGuess(9);
    e.submitGuess(4);
    expect(e.getState().attempts).toHaveLength(3);
  });

  it('throws RangeError on invalid guess', () => {
    const e = makeEngine();
    e.start();
    expect(() => e.submitGuess(-1)).toThrow(RangeError);
    expect(() => e.submitGuess(10)).toThrow(RangeError);
    expect(() => e.submitGuess(5.5)).toThrow(RangeError);
  });
});

describe('engine: win on 2nd or 3rd attempt', () => {
  it('wins on 2nd attempt', () => {
    const e = makeEngine(5);
    e.start();
    e.submitGuess(2); // wrong
    const r = e.submitGuess(5); // correct
    expect(r.correct).toBe(true);
    expect(r.status).toBe(GameStatus.WON);
    expect(r.attemptsUsed).toBe(2);
  });

  it('wins on 3rd attempt', () => {
    const e = makeEngine(5);
    e.start();
    e.submitGuess(1);
    e.submitGuess(9);
    const r = e.submitGuess(5);
    expect(r.correct).toBe(true);
    expect(r.status).toBe(GameStatus.WON);
    expect(r.attemptsUsed).toBe(3);
  });
});

describe('engine: timeOut', () => {
  it('counts timeout as wrong attempt', () => {
    const e = makeEngine(5);
    e.start();
    const r = e.timeOut();
    expect(r.correct).toBe(false);
    expect(r.timedOut).toBe(true);
    expect(r.attemptsUsed).toBe(1);
    expect(r.status).toBe(GameStatus.PLAYING);
  });

  it('loses after 3 timeouts', () => {
    const e = makeEngine(5);
    e.start();
    e.timeOut();
    e.timeOut();
    const r = e.timeOut();
    expect(r.status).toBe(GameStatus.LOST);
  });
});

describe('engine: time tracking', () => {
  it('records elapsed time per attempt', () => {
    const e = makeEngine(5);
    e.start();
    fakeTime = 3000;
    e.submitGuess(2);
    expect(e.getState().attempts[0].timeElapsed).toBe(3000);
  });

  it('getTotalTime returns elapsed since start', () => {
    const e = makeEngine(5);
    e.start();
    fakeTime = 8000;
    expect(e.getTotalTime()).toBe(8000);
  });
});

describe('engine: cannot guess after game over', () => {
  it('throws if guessing after WIN', () => {
    const e = makeEngine(5);
    e.start();
    e.submitGuess(5);
    expect(() => e.submitGuess(5)).toThrow();
  });

  it('throws if guessing after LOST', () => {
    const e = makeEngine(5);
    e.start();
    e.submitGuess(1);
    e.submitGuess(2);
    e.submitGuess(3);
    expect(() => e.submitGuess(4)).toThrow();
  });
});

describe('getHint helper', () => {
  it('returns null when guess equals secret', () => {
    expect(getHint(5, 5)).toBeNull();
  });

  it('returns higher when guess < secret', () => {
    expect(getHint(3, 7)).toBe('higher');
  });

  it('returns lower when guess > secret', () => {
    expect(getHint(8, 2)).toBe('lower');
  });
});

describe('engine: triesUsed', () => {
  it('triesUsed reflects attempts count', () => {
    const e = makeEngine(5);
    e.start();
    expect(e.getState().triesUsed).toBe(0);
    e.submitGuess(1);
    expect(e.getState().triesUsed).toBe(1);
  });
});
