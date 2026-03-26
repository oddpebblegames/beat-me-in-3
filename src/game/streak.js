/**
 * Streak Logic — Beat Me in 3
 *
 * Rules:
 * - Streak increments only once per UTC calendar day
 * - Streak breaks only after missing an entire calendar day
 * - Grace period: completing daily within the same session that spans
 *   midnight (e.g. 23:58 → 00:02) counts as one consecutive day
 *   (stored session date prevails; only a full-day gap breaks the streak)
 *
 * Storage keys (all prefixed bmi3_ by the store):
 *   streak          — current streak count
 *   best_streak     — all-time best
 *   streak_last_day — UTC date key of last day streak was incremented
 */

import { getNumber, getString, set } from '../state/store.js';

// ── Public API ────────────────────────────────────────────────

/**
 * Call this when the player completes the daily challenge for today.
 * Idempotent — safe to call multiple times per day.
 *
 * @param {string|null} [_todayKey]  "YYYY-M-DD" override for testing
 * @returns {{ streak: number, bestStreak: number, increased: boolean }}
 */
export function onDailyComplete(_todayKey) {
  const today    = _todayKey ?? _utcDateKey();
  const lastDay  = getString('streak_last_day', '');

  if (lastDay === today) {
    // Already counted today — idempotent
    const streak = getNumber('streak', 0);
    return { streak, bestStreak: getNumber('best_streak', 0), increased: false };
  }

  const currentStreak = getNumber('streak', 0);
  let newStreak;

  if (lastDay === '') {
    // First ever daily completion
    newStreak = 1;
  } else if (_isConsecutiveDay(lastDay, today)) {
    // Played yesterday (or bridging midnight in same session)
    newStreak = currentStreak + 1;
  } else {
    // Missed at least one full day — streak resets
    newStreak = 1;
  }

  const bestStreak = Math.max(newStreak, getNumber('best_streak', 0));

  set('streak', newStreak);
  set('best_streak', bestStreak);
  set('streak_last_day', today);

  return { streak: newStreak, bestStreak, increased: true };
}

/**
 * Read the current streak without modifying it.
 * @returns {{ streak: number, bestStreak: number, lastDay: string }}
 */
export function getStreakState() {
  return {
    streak    : getNumber('streak', 0),
    bestStreak: getNumber('best_streak', 0),
    lastDay   : getString('streak_last_day', ''),
  };
}

/**
 * Check whether the current streak is still alive (no missed days).
 * Useful for deciding whether to show a "streak at risk" warning.
 *
 * @param {string|null} [_todayKey]  override for testing
 * @returns {boolean}
 */
export function isStreakAlive(_todayKey) {
  const today   = _todayKey ?? _utcDateKey();
  const lastDay = getString('streak_last_day', '');

  if (!lastDay) return false; // never played
  if (lastDay === today) return true;
  return _isConsecutiveDay(lastDay, today);
}

// ── Internals ─────────────────────────────────────────────────

/**
 * Returns "YYYY-M-DD" in UTC.
 */
function _utcDateKey(_now) {
  const d = _now ? new Date(_now) : new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

/**
 * Returns true if `nextKey` is exactly one UTC calendar day after `prevKey`.
 * Grace-period handling: only a full-day gap (≥2 days apart) breaks the streak.
 *
 * @param {string} prevKey  "YYYY-M-DD"
 * @param {string} nextKey  "YYYY-M-DD"
 */
function _isConsecutiveDay(prevKey, nextKey) {
  const prev = _parseDateKey(prevKey);
  const next = _parseDateKey(nextKey);

  if (!prev || !next) return false;

  // Advance prev by one day
  const expected = new Date(Date.UTC(prev.y, prev.m - 1, prev.d + 1));
  const nextDate = new Date(Date.UTC(next.y, next.m - 1, next.d));

  return expected.getTime() === nextDate.getTime();
}

/**
 * Parse "YYYY-M-DD" → { y, m, d } or null on failure.
 */
function _parseDateKey(key) {
  if (!key) return null;
  const parts = key.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return { y: parts[0], m: parts[1], d: parts[2] };
}
