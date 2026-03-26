/**
 * Streak Logic Tests — Beat Me in 3
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { onDailyComplete, getStreakState, isStreakAlive } from './streak.js';

// Mock the store so tests don't touch localStorage
const _store = {};
vi.mock('../state/store.js', () => ({
  getNumber: (k, def) => (k in _store ? _store[k] : def),
  getString: (k, def) => (k in _store ? _store[k] : def),
  set      : (k, v)   => { _store[k] = v; },
}));

beforeEach(() => {
  Object.keys(_store).forEach(k => delete _store[k]);
});

describe('onDailyComplete', () => {
  it('starts streak at 1 on first play', () => {
    const r = onDailyComplete('2026-3-26');
    expect(r.streak).toBe(1);
    expect(r.bestStreak).toBe(1);
    expect(r.increased).toBe(true);
  });

  it('increments streak on consecutive day', () => {
    onDailyComplete('2026-3-25');
    const r = onDailyComplete('2026-3-26');
    expect(r.streak).toBe(2);
    expect(r.increased).toBe(true);
  });

  it('resets streak after missing a day', () => {
    onDailyComplete('2026-3-24');
    const r = onDailyComplete('2026-3-26'); // skipped 3-25
    expect(r.streak).toBe(1);
    expect(r.increased).toBe(true);
  });

  it('is idempotent — calling twice same day does not double-count', () => {
    onDailyComplete('2026-3-26');
    const r = onDailyComplete('2026-3-26');
    expect(r.streak).toBe(1);
    expect(r.increased).toBe(false);
  });

  it('preserves best streak across resets', () => {
    onDailyComplete('2026-3-24');
    onDailyComplete('2026-3-25');
    onDailyComplete('2026-3-26'); // streak = 3
    onDailyComplete('2026-3-28'); // streak resets to 1
    expect(_store['best_streak']).toBe(3);
  });

  it('handles month boundary correctly', () => {
    onDailyComplete('2026-3-31');
    const r = onDailyComplete('2026-4-1');
    expect(r.streak).toBe(2);
  });

  it('handles year boundary correctly', () => {
    onDailyComplete('2025-12-31');
    const r = onDailyComplete('2026-1-1');
    expect(r.streak).toBe(2);
  });

  it('does NOT break streak when same-session midnight grace applies', () => {
    // Grace: if player completes daily at 23:58 and then plays again next day
    // at 00:02 — those ARE consecutive so streak should continue
    onDailyComplete('2026-3-25');
    const r = onDailyComplete('2026-3-26');
    expect(r.streak).toBe(2);
  });
});

describe('isStreakAlive', () => {
  it('returns false when never played', () => {
    expect(isStreakAlive('2026-3-26')).toBe(false);
  });

  it('returns true when played today', () => {
    onDailyComplete('2026-3-26');
    expect(isStreakAlive('2026-3-26')).toBe(true);
  });

  it('returns true when played yesterday', () => {
    onDailyComplete('2026-3-25');
    expect(isStreakAlive('2026-3-26')).toBe(true);
  });

  it('returns false when missed a day', () => {
    onDailyComplete('2026-3-24');
    expect(isStreakAlive('2026-3-26')).toBe(false);
  });
});

describe('getStreakState', () => {
  it('returns zeros on fresh state', () => {
    const s = getStreakState();
    expect(s.streak).toBe(0);
    expect(s.bestStreak).toBe(0);
    expect(s.lastDay).toBe('');
  });

  it('returns current state after plays', () => {
    onDailyComplete('2026-3-25');
    onDailyComplete('2026-3-26');
    const s = getStreakState();
    expect(s.streak).toBe(2);
    expect(s.lastDay).toBe('2026-3-26');
  });
});
