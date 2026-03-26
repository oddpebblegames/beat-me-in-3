import { describe, it, expect, beforeEach } from 'vitest';
import { clear } from '../state/store.js';
import {
  getTodayKey,
  getDailySecret,
  getDailyState,
  resetDailyState,
  isDailyComplete,
  recordMatchResult,
  remainingMatches,
  nextMatchSecret,
  MAX_DAILY_MATCHES,
} from './daily.js';

beforeEach(() => {
  clear();
});

// Fixed timestamp: 2024-03-15 12:00:00 UTC
const TS_MAR15 = Date.UTC(2024, 2, 15, 12, 0, 0);
const TS_MAR16 = Date.UTC(2024, 2, 16, 0, 30, 0);

describe('getTodayKey', () => {
  it('returns YYYY-M-DD format', () => {
    expect(getTodayKey(TS_MAR15)).toBe('2024-3-15');
  });

  it('different timestamps on same UTC day return same key', () => {
    const morning = Date.UTC(2024, 2, 15, 0, 0, 0);
    const evening = Date.UTC(2024, 2, 15, 23, 59, 0);
    expect(getTodayKey(morning)).toBe(getTodayKey(evening));
  });

  it('timestamps across midnight produce different keys', () => {
    const before = Date.UTC(2024, 2, 15, 23, 59, 59);
    const after  = Date.UTC(2024, 2, 16, 0, 0, 1);
    expect(getTodayKey(before)).not.toBe(getTodayKey(after));
  });
});

describe('getDailySecret', () => {
  it('returns a number 0–9', () => {
    for (let i = 0; i < 10; i++) {
      const s = getDailySecret('2024-3-15', i);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(9);
      expect(Number.isInteger(s)).toBe(true);
    }
  });

  it('is deterministic — same inputs, same output', () => {
    expect(getDailySecret('2024-3-15', 0)).toBe(getDailySecret('2024-3-15', 0));
    expect(getDailySecret('2024-3-15', 5)).toBe(getDailySecret('2024-3-15', 5));
  });

  it('different matchIndex produces (usually) different secret', () => {
    const secrets = Array.from({ length: 10 }, (_, i) => getDailySecret('2024-3-15', i));
    const unique = new Set(secrets);
    // Not all 10 are required to be unique, but most should differ
    expect(unique.size).toBeGreaterThan(3);
  });

  it('different dates produce different secrets for matchIndex 0', () => {
    const a = getDailySecret('2024-3-15', 0);
    const b = getDailySecret('2024-3-16', 0);
    // High probability of difference
    expect(a !== b || getDailySecret('2024-3-17', 0) !== a).toBe(true);
  });
});

describe('getDailyState', () => {
  it('returns fresh state if no saved state', () => {
    const state = getDailyState(TS_MAR15);
    expect(state.matchesCompleted).toBe(0);
    expect(state.totalTries).toBe(0);
    expect(state.totalTime).toBe(0);
    expect(state.scoreDetail).toEqual([]);
  });

  it('resets state when date changes', () => {
    getDailyState(TS_MAR15); // initialize for Mar 15
    recordMatchResult({ won: true, tries: 2, time: 5000 }, TS_MAR15);

    // Move to Mar 16 — state should reset
    const state = getDailyState(TS_MAR16);
    expect(state.matchesCompleted).toBe(0);
    expect(state.totalTries).toBe(0);
    expect(state.date).toBe('2024-3-16');
  });
});

describe('recordMatchResult', () => {
  it('increments matchesCompleted', () => {
    getDailyState(TS_MAR15);
    recordMatchResult({ won: true, tries: 1, time: 3000 }, TS_MAR15);
    expect(getDailyState(TS_MAR15).matchesCompleted).toBe(1);
  });

  it('adds tries to totalTries on win', () => {
    getDailyState(TS_MAR15);
    recordMatchResult({ won: true, tries: 2, time: 5000 }, TS_MAR15);
    expect(getDailyState(TS_MAR15).totalTries).toBe(2);
  });

  it('counts loss as 3 tries', () => {
    getDailyState(TS_MAR15);
    recordMatchResult({ won: false, tries: 3, time: 8000 }, TS_MAR15);
    expect(getDailyState(TS_MAR15).totalTries).toBe(3);
  });

  it('accumulates tries across multiple matches', () => {
    getDailyState(TS_MAR15);
    recordMatchResult({ won: true, tries: 1, time: 2000 }, TS_MAR15);
    recordMatchResult({ won: true, tries: 2, time: 4000 }, TS_MAR15);
    recordMatchResult({ won: false, tries: 3, time: 15000 }, TS_MAR15);
    expect(getDailyState(TS_MAR15).totalTries).toBe(6);
  });

  it('accumulates time', () => {
    getDailyState(TS_MAR15);
    recordMatchResult({ won: true, tries: 1, time: 3000 }, TS_MAR15);
    recordMatchResult({ won: true, tries: 1, time: 2500 }, TS_MAR15);
    expect(getDailyState(TS_MAR15).totalTime).toBe(5500);
  });
});

describe('isDailyComplete', () => {
  it('returns false when no matches played', () => {
    expect(isDailyComplete(TS_MAR15)).toBe(false);
  });

  it('returns true after 10 matches', () => {
    getDailyState(TS_MAR15);
    for (let i = 0; i < MAX_DAILY_MATCHES; i++) {
      recordMatchResult({ won: true, tries: 1, time: 1000 }, TS_MAR15);
    }
    expect(isDailyComplete(TS_MAR15)).toBe(true);
  });
});

describe('remainingMatches', () => {
  it('returns 10 when fresh', () => {
    expect(remainingMatches(TS_MAR15)).toBe(MAX_DAILY_MATCHES);
  });

  it('decrements with each match', () => {
    getDailyState(TS_MAR15);
    recordMatchResult({ won: true, tries: 1, time: 1000 }, TS_MAR15);
    recordMatchResult({ won: true, tries: 1, time: 1000 }, TS_MAR15);
    expect(remainingMatches(TS_MAR15)).toBe(8);
  });

  it('never returns negative', () => {
    getDailyState(TS_MAR15);
    for (let i = 0; i < MAX_DAILY_MATCHES + 2; i++) {
      recordMatchResult({ won: true, tries: 1, time: 1000 }, TS_MAR15);
    }
    expect(remainingMatches(TS_MAR15)).toBe(0);
  });
});

describe('nextMatchSecret', () => {
  it('returns deterministic value for match 0', () => {
    const a = nextMatchSecret(TS_MAR15);
    resetDailyState('2024-3-15');
    const b = nextMatchSecret(TS_MAR15);
    expect(a).toBe(b);
  });

  it('changes after recording a match', () => {
    getDailyState(TS_MAR15);
    const secret0 = nextMatchSecret(TS_MAR15);
    recordMatchResult({ won: true, tries: 1, time: 1000 }, TS_MAR15);
    const secret1 = nextMatchSecret(TS_MAR15);
    // Not guaranteed to differ but the index changed
    expect(typeof secret1).toBe('number');
    expect(secret1).toBeGreaterThanOrEqual(0);
    expect(secret1).toBeLessThanOrEqual(9);
    // At least record that we asked for a different index
    expect(getDailyState(TS_MAR15).matchesCompleted).toBe(1);
    // secret0 was for index 0, secret1 for index 1
    expect(secret1).toBe(getDailySecret('2024-3-15', 1));
    expect(secret0).toBe(getDailySecret('2024-3-15', 0));
  });
});
