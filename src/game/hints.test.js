/**
 * Hint System Unit Tests — Beat Me in 3
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getHintsOwned,
  addHints,
  getTrialHintUsed,
  canUseHint,
  useHint,
} from './hints.js';

const _store = {};
vi.mock('../state/store.js', () => ({
  get      : (k)    => (k in _store ? _store[k] : null),
  set      : (k, v) => { _store[k] = v; },
  getNumber: (k, d) => (typeof _store[k] === 'number' ? _store[k] : d),
}));

// Mock daily.js getTodayKey
vi.mock('./daily.js', () => ({
  getTodayKey: () => '2026-3-26',
}));

beforeEach(() => {
  Object.keys(_store).forEach(k => delete _store[k]);
});

describe('getHintsOwned()', () => {
  it('returns 0 with no hints', () => {
    expect(getHintsOwned()).toBe(0);
  });
  it('returns stored count', () => {
    _store['hints_owned'] = 3;
    expect(getHintsOwned()).toBe(3);
  });
});

describe('addHints()', () => {
  it('adds to owned count', () => {
    addHints(2);
    expect(getHintsOwned()).toBe(2);
    addHints(3);
    expect(getHintsOwned()).toBe(5);
  });
  it('throws for non-positive count', () => {
    expect(() => addHints(0)).toThrow(RangeError);
    expect(() => addHints(-1)).toThrow(RangeError);
  });
  it('throws for non-integer count', () => {
    expect(() => addHints(1.5)).toThrow(RangeError);
  });
});

describe('canUseHint()', () => {
  it('returns trial when no hints owned and no trial used', () => {
    const r = canUseHint();
    expect(r.canUse).toBe(true);
    expect(r.source).toBe('trial');
  });

  it('returns owned when hints are available', () => {
    addHints(1);
    const r = canUseHint();
    expect(r.canUse).toBe(true);
    expect(r.source).toBe('owned');
  });

  it('returns false when no hints and trial used', () => {
    _store['trial_hint_2026-3-26'] = true;
    const r = canUseHint();
    expect(r.canUse).toBe(false);
  });
});

describe('useHint()', () => {
  it('returns correct ±2 range', () => {
    const { range } = useHint(5);
    expect(range[0]).toBe(3);
    expect(range[1]).toBe(7);
  });

  it('clamps range at 0', () => {
    const { range } = useHint(1);
    expect(range[0]).toBe(0);
    expect(range[1]).toBe(3);
  });

  it('clamps range at 9', () => {
    const { range } = useHint(8);
    expect(range[0]).toBe(6);
    expect(range[1]).toBe(9);
  });

  it('uses owned hint before trial', () => {
    addHints(2);
    const { source } = useHint(5);
    expect(source).toBe('owned');
    expect(getHintsOwned()).toBe(1);
  });

  it('uses trial when no owned hints', () => {
    const { source } = useHint(5);
    expect(source).toBe('trial');
    expect(getTrialHintUsed()).toBe(true);
  });

  it('throws after trial + no owned hints', () => {
    useHint(5); // consumes trial
    expect(() => useHint(5)).toThrow('No hints available');
  });

  it('throws for invalid secret', () => {
    expect(() => useHint(-1)).toThrow(RangeError);
    expect(() => useHint(10)).toThrow(RangeError);
    expect(() => useHint(5.5)).toThrow(RangeError);
  });
});
