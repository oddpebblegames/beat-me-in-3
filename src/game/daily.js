/**
 * Daily Challenge Logic — Beat Me in 3
 *
 * - Deterministic secret number from date + matchIndex
 * - 10-match daily session tracking
 * - State resets at UTC midnight
 */

import { get, set, getObject, getNumber } from '../state/store.js';

export const MAX_DAILY_MATCHES = 10;

// ── Date Helpers ────────────────────────────────────────────

/** Returns "YYYY-M-DD" in UTC */
export function getTodayKey(_now) {
  const d = _now ? new Date(_now) : new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

/**
 * Deterministic secret number for a given date and match index.
 * Uses a simple hash so the same date+match always yields the same number.
 * All players see the same number globally (no per-user randomness).
 *
 * @param {string} dateKey  "YYYY-M-DD"
 * @param {number} matchIndex  0–9
 * @returns {number}  0–9
 */
export function getDailySecret(dateKey, matchIndex) {
  // Stable hash: mix date characters with match index
  let hash = 0;
  const seed = dateKey + ':' + matchIndex;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0; // unsigned 32-bit
  }
  return hash % 10;
}

// ── Daily State ─────────────────────────────────────────────

const KEYS = {
  DATE: 'daily_date',
  MATCHES: 'daily_matches',     // number of matches completed today
  TOTAL_TRIES: 'daily_tries',   // cumulative tries (lower = better)
  TOTAL_TIME: 'daily_time',     // cumulative time in ms
  SCORE_DETAIL: 'daily_score',  // array of per-match { tries, time, won }
};

/**
 * Returns the daily session state, resetting it if the date has changed.
 */
export function getDailyState(_now) {
  const today = getTodayKey(_now);
  const savedDate = get(KEYS.DATE);

  if (savedDate !== today) {
    resetDailyState(today);
  }

  return {
    date: today,
    matchesCompleted: getNumber(KEYS.MATCHES, 0),
    totalTries: getNumber(KEYS.TOTAL_TRIES, 0),
    totalTime: getNumber(KEYS.TOTAL_TIME, 0),
    scoreDetail: get(KEYS.SCORE_DETAIL) ?? [],
  };
}

/** Explicitly reset daily state for a new day */
export function resetDailyState(dateKey) {
  set(KEYS.DATE, dateKey ?? getTodayKey());
  set(KEYS.MATCHES, 0);
  set(KEYS.TOTAL_TRIES, 0);
  set(KEYS.TOTAL_TIME, 0);
  set(KEYS.SCORE_DETAIL, []);
}

/** Check if the daily challenge is complete (all 10 matches played) */
export function isDailyComplete(_now) {
  const state = getDailyState(_now);
  return state.matchesCompleted >= MAX_DAILY_MATCHES;
}

/**
 * Record a completed match result.
 * @param {{ won: boolean, tries: number, time: number }} result
 * @param {number|null} _now  Optional timestamp for testing
 */
export function recordMatchResult(result, _now) {
  const state = getDailyState(_now);

  const tries = result.won ? result.tries : 3; // losses count as 3 tries
  const detail = state.scoreDetail.concat([{
    tries,
    time: result.time,
    won: result.won,
  }]);

  set(KEYS.MATCHES, state.matchesCompleted + 1);
  set(KEYS.TOTAL_TRIES, state.totalTries + tries);
  set(KEYS.TOTAL_TIME, state.totalTime + result.time);
  set(KEYS.SCORE_DETAIL, detail);
}

/** How many matches remain today */
export function remainingMatches(_now) {
  const state = getDailyState(_now);
  return Math.max(0, MAX_DAILY_MATCHES - state.matchesCompleted);
}

/**
 * Get the secret number for the current (next) match.
 * matchIndex is zero-based from matchesCompleted.
 */
export function nextMatchSecret(_now) {
  const state = getDailyState(_now);
  return getDailySecret(state.date, state.matchesCompleted);
}
