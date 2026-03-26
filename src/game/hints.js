/**
 * Hint System — Beat Me in 3
 *
 * Hints reveal a ±2 range around the secret number.
 * Players can own hints (purchased) plus one free trial per day.
 *
 * External API:
 *   canUseHint()          → { canUse: bool, reason: string }
 *   useHint(secret)       → { range: [min, max] } or throws
 *   getHintsOwned()       → number
 *   addHints(count)       → void
 *   getTrialHintUsed()    → bool (whether free trial used today)
 */

import { get, set, getNumber } from '../state/store.js';
import { getTodayKey } from './daily.js';

const HINT_RANGE = 2; // ±2 from secret

// ── Store Keys ──────────────────────────────────────────────
const KEY_HINTS_OWNED = 'hints_owned';

function trialKey(_now) {
  return `trial_hint_${getTodayKey(_now)}`;
}

// ── Public API ───────────────────────────────────────────────

export function getHintsOwned() {
  return getNumber(KEY_HINTS_OWNED, 0);
}

export function addHints(count) {
  if (!Number.isInteger(count) || count <= 0) {
    throw new RangeError(`count must be a positive integer, got: ${count}`);
  }
  set(KEY_HINTS_OWNED, getHintsOwned() + count);
}

export function getTrialHintUsed(_now) {
  return get(trialKey(_now)) === true;
}

/**
 * Check if a hint can be used.
 * @param {number|null} _now  Timestamp for testing
 * @returns {{ canUse: boolean, reason: string, source: 'owned'|'trial'|null }}
 */
export function canUseHint(_now) {
  if (getHintsOwned() > 0) {
    return { canUse: true, reason: 'owned hint available', source: 'owned' };
  }
  if (!getTrialHintUsed(_now)) {
    return { canUse: true, reason: 'free daily trial available', source: 'trial' };
  }
  return { canUse: false, reason: 'no hints available', source: null };
}

/**
 * Use a hint to reveal the range containing the secret.
 * Deducts from owned count, or marks trial as used.
 *
 * @param {number} secret   0–9
 * @param {number|null} _now  Timestamp for testing
 * @returns {{ range: [number, number], source: 'owned'|'trial' }}
 */
export function useHint(secret, _now) {
  if (!Number.isInteger(secret) || secret < 0 || secret > 9) {
    throw new RangeError(`secret must be integer 0–9, got: ${secret}`);
  }

  const { canUse, source } = canUseHint(_now);
  if (!canUse) {
    throw new Error('No hints available');
  }

  // Deduct
  if (source === 'owned') {
    set(KEY_HINTS_OWNED, getHintsOwned() - 1);
  } else {
    set(trialKey(_now), true);
  }

  const min = Math.max(0, secret - HINT_RANGE);
  const max = Math.min(9, secret + HINT_RANGE);

  return { range: [min, max], source };
}
