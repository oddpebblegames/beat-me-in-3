/**
 * Friend Challenge Mode — Beat Me in 3
 *
 * Flow A (Challenger): Pick a number → generate link → share
 * Flow B (Receiver):   ?c= param detected → auto-start with encoded number
 *
 * Win submitted to `wins_friend` Firestore collection.
 * "Challenge Back" token generated on result screen.
 */

import { createEngine } from './engine.js';
import { encode, decode, buildChallengeUrl, extractFromUrl } from '../utils/challenge.js';
import { submitWin } from '../firebase/scores.js';
import { set, getNumber } from '../state/store.js';

const BASE_URL = typeof window !== 'undefined'
  ? `${window.location.origin}${window.location.pathname}`
  : 'https://example.com/';

// ── Challenger Flow ───────────────────────────────────────────

/**
 * Generate a shareable challenge URL for a given number.
 * @param {number} number  0–9
 * @returns {string}  Full URL with ?c= token
 */
export function generateChallengeUrl(number) {
  return buildChallengeUrl(number, BASE_URL);
}

// ── Receiver Flow ─────────────────────────────────────────────

/**
 * Check if the current URL contains a valid friend challenge.
 * @returns {{ valid: boolean, number: number|null, reason: string }}
 */
export function detectIncomingChallenge() {
  const result = extractFromUrl();
  if (!result) return { valid: false, number: null, reason: 'no challenge in URL' };
  return { valid: result.valid, number: result.number, reason: result.reason };
}

/**
 * Create a friend-mode game session from a decoded secret.
 * @param {number} secretNumber  0–9
 * @returns {{ engine, start, submitGuess, getResult }}
 */
export function createFriendGame(secretNumber) {
  const engine = createEngine({ secretNumber, mode: 'friend' });

  function start() {
    engine.start();
  }

  function submitGuess(guess) {
    return engine.submitGuess(guess);
  }

  /**
   * Get result summary once game is over.
   * @returns {{ won: boolean, tries: number|null, secret: number }}
   */
  function getResult() {
    const state = engine.getState();
    return {
      won   : state.status === 'won',
      tries : state.status === 'won' ? state.attempts.length : null,
      secret: secretNumber,
    };
  }

  return { engine, start, submitGuess, getResult };
}

// ── Challenge Back ────────────────────────────────────────────

/**
 * Generate a "Challenge Back" URL with a NEW random secret.
 * @returns {string}
 */
export function generateChallengeBackUrl() {
  const newSecret = Math.floor(Math.random() * 10);
  return generateChallengeUrl(newSecret);
}

// ── Submission ────────────────────────────────────────────────

/**
 * Record a friend-mode win to Firestore. Fails silently offline.
 */
export async function recordFriendWin() {
  try {
    await submitWin('friend');

    const wins = getNumber('friend_wins', 0);
    set('friend_wins', wins + 1);
  } catch {
    // Offline or auth failure — non-fatal
  }
}
