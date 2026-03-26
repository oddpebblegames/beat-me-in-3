/**
 * Daily Challenge Mode — End-to-End Session Controller
 *
 * Orchestrates the full 10-match daily session:
 * - Sequences matches using deterministic secrets
 * - Records per-match results and cumulative score
 * - Submits to Firestore after each match
 * - Integrates real-time leaderboard listener
 * - Resets at UTC midnight
 */

import { createEngine } from './engine.js';
import {
  getDailyState,
  getDailySecret,
  getTodayKey,
  recordMatchResult,
  isDailyComplete,
  remainingMatches,
  nextMatchSecret,
  MAX_DAILY_MATCHES,
} from './daily.js';
import { submitDailyScore } from '../firebase/scores.js';
import { getTodayLeaderboard } from '../firebase/leaderboard.js';

let _leaderboardUnsubscribe = null;

/**
 * Start the daily session.
 * Returns a session object for managing the current match.
 *
 * @param {{ onLeaderboardUpdate?: (entries: any[]) => void }} [opts]
 * @returns {{ currentMatchIndex, totalMatches, engine, startMatch, submitGuess, finishMatch, isComplete, getScore, teardown }}
 */
export function startDailySession({ onLeaderboardUpdate } = {}) {
  let dailyState = getDailyState();
  let currentEngine = null;

  // Wire real-time leaderboard listener
  if (typeof onLeaderboardUpdate === 'function') {
    _leaderboardUnsubscribe = getTodayLeaderboard(onLeaderboardUpdate);
  }

  /**
   * Prepare the next match engine. Must be called before submitGuess.
   * @returns {{ matchIndex: number, secret: number } | null}  null if session complete
   */
  function startMatch() {
    dailyState = getDailyState();
    if (isDailyComplete()) return null;

    const matchIndex = dailyState.matchesCompleted;
    const secret     = getDailySecret(getTodayKey(), matchIndex);

    currentEngine = createEngine({ secretNumber: secret, mode: 'daily' });
    currentEngine.start();

    return { matchIndex, secret };
  }

  /**
   * Submit a guess for the current match.
   * Delegates directly to the engine.
   * @param {number} guess  0–9
   */
  function submitGuess(guess) {
    if (!currentEngine) throw new Error('No active match — call startMatch() first');
    return currentEngine.submitGuess(guess);
  }

  /**
   * Finish the current match, persist result, and submit score.
   * @returns {Promise<{ matchResult, dailyState, isSessionComplete }>}
   */
  async function finishMatch() {
    if (!currentEngine) throw new Error('No active match');

    const engineState = currentEngine.getState();
    const won         = engineState.status === 'won';
    const tries       = engineState.attempts.length;
    const totalTimeMs = engineState.attempts.reduce((sum, a) => sum + a.timeElapsed, 0);

    const matchResult = { tries, time: totalTimeMs, won };
    recordMatchResult(matchResult);

    // Refresh daily state after recording
    dailyState = getDailyState();

    // Submit cumulative score to Firestore (non-blocking)
    _submitScore(dailyState).catch(() => {});

    currentEngine = null;

    return {
      matchResult,
      dailyState,
      isSessionComplete: isDailyComplete(),
    };
  }

  function isComplete() {
    return isDailyComplete();
  }

  function getScore() {
    return getDailyState();
  }

  /**
   * Clean up real-time listeners.
   */
  function teardown() {
    if (_leaderboardUnsubscribe) {
      _leaderboardUnsubscribe();
      _leaderboardUnsubscribe = null;
    }
    currentEngine = null;
  }

  return {
    get currentMatchIndex() { return getDailyState().matchesCompleted; },
    totalMatches: MAX_DAILY_MATCHES,
    startMatch,
    submitGuess,
    finishMatch,
    isComplete,
    getScore,
    teardown,
  };
}

// ── Helpers ───────────────────────────────────────────────────

async function _submitScore(dailyState) {
  try {
    await submitDailyScore({
      totalTries    : dailyState.totalTries,
      totalTime     : dailyState.totalTime,
      matchesPlayed : dailyState.matchesCompleted,
      matchesWon    : dailyState.scoreDetail.filter((m) => m.won).length,
    });
  } catch {
    // Scores queued for retry by the scores module's offline handling
  }
}
