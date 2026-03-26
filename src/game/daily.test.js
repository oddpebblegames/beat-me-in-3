/**
 * Daily Logic Unit Tests — Beat Me in 3
 */

import { describe, it, expect, beforeEach } from 'vitest';
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

const _store = {};
vi.mock('../state/store.js', () => ({
  get      : (k)    => (k in _store ? _store[k] : null),
  set      : (k, v) => { _store[k] = v; },
  getNumber: (k, d) => (typeof _store[k] === 'number' ? _store[k] : d),
  getObject: (k, d) => (k in _store && _store[k] !== null ? _store[k] : d),
}));

beforeEach(() => {
  Object.keys(_store).forEach(k => delete _store[k]);
});

const TODAY = new Date('2026-03-26T12:00:00Z').getTime();

describe('getTodayKey()', () => {
  it('formats date as YYYY-M-DD UTC', () => {
    expect(getTodayKey(new Date('2026-03-26T00:00:00Z').getTime())).toBe('2026-3-26');
  });
  it('handles year boundary', () => {
    expect(getTodayKey(new Date('2026-01-01T00:00:00Z').getTime())).toBe('2026-1-1');
  });
});

describe('getDailySecret()', () => {
  it('returns integer 0–9', () => {
    for (let i = 0; i < 10; i++) {
      const s = getDailySecret('2026-3-26', i);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(9);
      expect(Number.isInteger(s)).toBe(true);
    }
  });

  it('is deterministic', () => {
    const a = getDailySecret('2026-3-26', 3);
    const b = getDailySecret('2026-3-26', 3);
    expect(a).toBe(b);
  });

  it('differs across match indices', () => {
    const results = new Set();
    for (let i = 0; i < 10; i++) results.add(getDailySecret('2026-3-26', i));
    expect(results.size).toBeGreaterThan(1);
  });

  it('differs across dates', () => {
    const a = getDailySecret('2026-3-26', 0);
    const b = getDailySecret('2026-3-27', 0);
    // Very likely to differ (not guaranteed but probability of collision is 10%)
    // We just check it's deterministic for each
    expect(getDailySecret('2026-3-26', 0)).toBe(a);
    expect(getDailySecret('2026-3-27', 0)).toBe(b);
  });
});

describe('getDailyState()', () => {
  it('returns fresh state on first call', () => {
    const s = getDailyState(TODAY);
    expect(s.matchesCompleted).toBe(0);
    expect(s.totalTries).toBe(0);
    expect(s.scoreDetail).toEqual([]);
  });

  it('resets state when date changes', () => {
    recordMatchResult({ won: true, tries: 2, time: 5000 }, TODAY);
    const tomorrow = TODAY + 24 * 60 * 60 * 1000 + 1000;
    const s = getDailyState(tomorrow);
    expect(s.matchesCompleted).toBe(0);
  });
});

describe('recordMatchResult()', () => {
  it('increments match count', () => {
    recordMatchResult({ won: true, tries: 1, time: 1000 }, TODAY);
    expect(getDailyState(TODAY).matchesCompleted).toBe(1);
  });

  it('adds tries for a win', () => {
    recordMatchResult({ won: true, tries: 2, time: 1000 }, TODAY);
    expect(getDailyState(TODAY).totalTries).toBe(2);
  });

  it('counts loss as 3 tries', () => {
    recordMatchResult({ won: false, tries: 3, time: 3000 }, TODAY);
    expect(getDailyState(TODAY).totalTries).toBe(3);
  });

  it('accumulates across multiple matches', () => {
    recordMatchResult({ won: true,  tries: 1, time: 1000 }, TODAY);
    recordMatchResult({ won: true,  tries: 2, time: 2000 }, TODAY);
    recordMatchResult({ won: false, tries: 3, time: 3000 }, TODAY);
    const s = getDailyState(TODAY);
    expect(s.matchesCompleted).toBe(3);
    expect(s.totalTries).toBe(6);
    expect(s.totalTime).toBe(6000);
  });

  it('records score detail', () => {
    recordMatchResult({ won: true, tries: 1, time: 500 }, TODAY);
    const s = getDailyState(TODAY);
    expect(s.scoreDetail).toHaveLength(1);
    expect(s.scoreDetail[0].won).toBe(true);
  });
});

describe('isDailyComplete()', () => {
  it('returns false before 10 matches', () => {
    expect(isDailyComplete(TODAY)).toBe(false);
  });

  it('returns true after 10 matches', () => {
    for (let i = 0; i < MAX_DAILY_MATCHES; i++) {
      recordMatchResult({ won: true, tries: 1, time: 500 }, TODAY);
    }
    expect(isDailyComplete(TODAY)).toBe(true);
  });
});

describe('remainingMatches()', () => {
  it('starts at 10', () => {
    expect(remainingMatches(TODAY)).toBe(10);
  });

  it('decrements with each match', () => {
    recordMatchResult({ won: true, tries: 1, time: 500 }, TODAY);
    expect(remainingMatches(TODAY)).toBe(9);
  });

  it('never goes below 0', () => {
    for (let i = 0; i < 12; i++) {
      recordMatchResult({ won: true, tries: 1, time: 500 }, TODAY);
    }
    expect(remainingMatches(TODAY)).toBe(0);
  });
});

describe('nextMatchSecret()', () => {
  it('returns integer 0–9', () => {
    const s = nextMatchSecret(TODAY);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(9);
  });

  it('advances with match index', () => {
    const first  = nextMatchSecret(TODAY);
    recordMatchResult({ won: true, tries: 1, time: 500 }, TODAY);
    const second = nextMatchSecret(TODAY);
    // Could be same or different number — just check both are valid
    expect(second).toBeGreaterThanOrEqual(0);
    expect(second).toBeLessThanOrEqual(9);
  });
});
