/**
 * Quick Challenge Mode — Beat Me in 3
 *
 * Single match against a bot that guesses randomly.
 * Player wins if they guess in ≤ bot's tries.
 * Win submitted to `wins_quick` Firestore collection.
 */

import { createEngine } from './engine.js';
import { set, getNumber, getString } from '../state/store.js';
import { submitWin } from '../firebase/scores.js';

/**
 * Simulate a bot guessing a number 0–9.
 * Bot picks randomly from remaining candidates each turn.
 * Returns the number of tries the bot took (1–3, or null if bot failed).
 *
 * @param {number} secret  0–9
 * @returns {number|null}  1, 2, 3, or null (bot lost too)
 */
export function simulateBotGuess(secret) {
  const pool = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let tries = 1; tries <= 3; tries++) {
    const idx   = Math.floor(Math.random() * pool.length);
    const guess = pool.splice(idx, 1)[0];
    if (guess === secret) return tries;
  }
  return null; // bot failed within 3 tries
}

/**
 * Create a quick-mode game session.
 *
 * @param {number} secretNumber  0–9
 * @returns {{ engine, botTries, start, submitGuess, getResult }}
 */
export function createQuickGame(secretNumber) {
  const engine   = createEngine({ secretNumber, mode: 'quick' });
  const botTries = simulateBotGuess(secretNumber);

  function start() {
    engine.start();
  }

  function submitGuess(guess) {
    return engine.submitGuess(guess);
  }

  /**
   * Get the final result once the game is over.
   * @returns {{ playerWon: boolean, playerTries: number|null, botTries: number|null, secret: number }}
   */
  function getResult() {
    const state = engine.getState();
    const playerTries = state.status === 'won' ? state.attempts.length : null;

    // Player wins if they guessed AND used ≤ bot's tries (or bot failed)
    const playerWon =
      state.status === 'won' &&
      (botTries === null || playerTries <= botTries);

    return { playerWon, playerTries, botTries, secret: secretNumber };
  }

  return { engine, botTries, start, submitGuess, getResult };
}

/**
 * Submit a quick-mode win to Firestore.
 * Fails silently — game continues offline.
 *
 * @param {{ playerTries: number, botTries: number|null, totalTimeMs: number }} resultData
 */
export async function recordQuickWin() {
  try {
    await submitWin('quick');

    // Update local win counter
    const wins = getNumber('quick_wins', 0);
    set('quick_wins', wins + 1);
  } catch {
    // Offline or auth failure — non-fatal
  }
}
