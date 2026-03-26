/**
 * Core Game Engine — Beat Me in 3
 *
 * Pure game logic with no UI or Firebase dependencies.
 * Manages state machine: idle → playing → won | lost
 *
 * Usage:
 *   const engine = createEngine({ secretNumber: 7, mode: 'daily' });
 *   engine.start();
 *   const result = engine.submitGuess(5);  // → { correct: false, hint: 'higher', ... }
 */

export const GameStatus = {
  IDLE: 'idle',
  PLAYING: 'playing',
  WON: 'won',
  LOST: 'lost',
};

const DEFAULT_CONFIG = {
  maxAttempts: 3,
  timeLimit: 15000, // ms
};

/**
 * @param {object} config
 * @param {number} config.secretNumber   0–9
 * @param {'daily'|'quick'|'friend'} config.mode
 * @param {number} [config.maxAttempts]  default 3
 * @param {number} [config.timeLimit]    ms, default 15000
 */
export function createEngine(config) {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  if (cfg.secretNumber < 0 || cfg.secretNumber > 9 || !Number.isInteger(cfg.secretNumber)) {
    throw new RangeError(`secretNumber must be an integer 0–9, got: ${cfg.secretNumber}`);
  }

  const state = {
    status: GameStatus.IDLE,
    attempts: [],      // [{ guess, correct, hint, timeElapsed }]
    startTime: null,   // performance.now() at game start
    attemptStartTime: null, // performance.now() at start of current attempt
    secretNumber: cfg.secretNumber,
    mode: cfg.mode,
  };

  function assertStatus(...allowed) {
    if (!allowed.includes(state.status)) {
      throw new Error(`Invalid operation: status is '${state.status}', expected one of [${allowed.join(', ')}]`);
    }
  }

  /** Start the game. Must be called before submitGuess. */
  function start() {
    assertStatus(GameStatus.IDLE);
    state.status = GameStatus.PLAYING;
    state.startTime = now();
    state.attemptStartTime = now();
  }

  /**
   * Submit a guess.
   * @param {number} guess  0–9
   * @returns {{ correct: boolean, hint: 'higher'|'lower'|null, attemptsUsed: number, timeElapsed: number, status: string }}
   */
  function submitGuess(guess) {
    assertStatus(GameStatus.PLAYING);

    if (!Number.isInteger(guess) || guess < 0 || guess > 9) {
      throw new RangeError(`Guess must be an integer 0–9, got: ${guess}`);
    }

    const timeElapsed = now() - state.attemptStartTime;
    const correct = guess === state.secretNumber;
    const hint = correct ? null : guess < state.secretNumber ? 'higher' : 'lower';

    state.attempts.push({ guess, correct, hint, timeElapsed });

    if (correct) {
      state.status = GameStatus.WON;
    } else if (state.attempts.length >= cfg.maxAttempts) {
      state.status = GameStatus.LOST;
    } else {
      // Continue — reset attempt timer for next guess
      state.attemptStartTime = now();
    }

    return {
      correct,
      hint,
      attemptsUsed: state.attempts.length,
      timeElapsed,
      status: state.status,
    };
  }

  /**
   * Mark the current attempt as timed out (counts as wrong).
   * @returns {object} Same shape as submitGuess result
   */
  function timeOut() {
    assertStatus(GameStatus.PLAYING);

    // Timeout counts as a wrong guess. We record no specific guess.
    const timeElapsed = cfg.timeLimit;
    state.attempts.push({
      guess: null,
      correct: false,
      hint: null, // no hint on timeout
      timedOut: true,
      timeElapsed,
    });

    if (state.attempts.length >= cfg.maxAttempts) {
      state.status = GameStatus.LOST;
    } else {
      state.attemptStartTime = now();
    }

    return {
      correct: false,
      hint: null,
      timedOut: true,
      attemptsUsed: state.attempts.length,
      timeElapsed,
      status: state.status,
    };
  }

  /** Get a read-only snapshot of current state */
  function getState() {
    return {
      status: state.status,
      attempts: state.attempts.slice(),
      secretNumber: state.secretNumber,
      mode: state.mode,
      totalTime: state.startTime !== null ? now() - state.startTime : 0,
      triesUsed: state.attempts.length,
    };
  }

  /**
   * Total time from game start to resolution (ms).
   * Only valid after status is WON or LOST.
   */
  function getTotalTime() {
    if (state.startTime === null) return 0;
    return now() - state.startTime;
  }

  return { start, submitGuess, timeOut, getState, getTotalTime };
}

/** Determine hint direction given a guess and secret */
export function getHint(guess, secret) {
  if (guess === secret) return null;
  return guess < secret ? 'higher' : 'lower';
}

/** Inject time source for testing */
let _now = () => performance.now();

export function _setNow(fn) {
  _now = fn;
}

function now() {
  return _now();
}
