import { describe, it, expect, beforeEach } from 'vitest';
import { clear, set } from '../state/store.js';
import { getHintsOwned, addHints, canUseHint, useHint, getTrialHintUsed } from './hints.js';

const TS = Date.UTC(2024, 2, 15, 12, 0, 0);

beforeEach(() => {
  clear();
});

describe('addHints', () => {
  it('increases owned count', () => {
    addHints(3);
    expect(getHintsOwned()).toBe(3);
  });

  it('accumulates across calls', () => {
    addHints(2);
    addHints(5);
    expect(getHintsOwned()).toBe(7);
  });

  it('throws on non-positive count', () => {
    expect(() => addHints(0)).toThrow(RangeError);
    expect(() => addHints(-1)).toThrow(RangeError);
  });

  it('throws on non-integer', () => {
    expect(() => addHints(1.5)).toThrow(RangeError);
  });
});

describe('canUseHint', () => {
  it('returns canUse=true (trial) when no hints and trial not used', () => {
    const result = canUseHint(TS);
    expect(result.canUse).toBe(true);
    expect(result.source).toBe('trial');
  });

  it('returns canUse=true (owned) when hints owned', () => {
    addHints(1);
    const result = canUseHint(TS);
    expect(result.canUse).toBe(true);
    expect(result.source).toBe('owned');
  });

  it('prefers owned over trial', () => {
    addHints(2);
    const result = canUseHint(TS);
    expect(result.source).toBe('owned');
  });

  it('returns canUse=false when no hints and trial used', () => {
    useHint(5, TS); // uses trial
    const result = canUseHint(TS);
    expect(result.canUse).toBe(false);
    expect(result.source).toBeNull();
  });
});

describe('useHint', () => {
  it('returns a valid range centered on secret', () => {
    const { range } = useHint(5, TS);
    expect(range[0]).toBe(3);
    expect(range[1]).toBe(7);
  });

  it('clamps range at 0 for secrets near lower bound', () => {
    const { range } = useHint(1, TS);
    expect(range[0]).toBe(0);
    expect(range[1]).toBe(3);
  });

  it('clamps range at 9 for secrets near upper bound', () => {
    const { range } = useHint(8, TS);
    expect(range[0]).toBe(6);
    expect(range[1]).toBe(9);
  });

  it('clamps both ends for secret=0', () => {
    const { range } = useHint(0, TS);
    expect(range[0]).toBe(0);
    expect(range[1]).toBe(2);
  });

  it('clamps both ends for secret=9', () => {
    const { range } = useHint(9, TS);
    expect(range[0]).toBe(7);
    expect(range[1]).toBe(9);
  });

  it('deducts from owned count', () => {
    addHints(3);
    useHint(5, TS);
    expect(getHintsOwned()).toBe(2);
  });

  it('marks trial used when no owned hints', () => {
    useHint(5, TS);
    expect(getTrialHintUsed(TS)).toBe(true);
  });

  it('does not use trial when owned hint available', () => {
    addHints(1);
    useHint(5, TS);
    expect(getTrialHintUsed(TS)).toBe(false);
    expect(getHintsOwned()).toBe(0);
  });

  it('throws when no hints available', () => {
    useHint(5, TS); // uses trial
    expect(() => useHint(5, TS)).toThrow('No hints available');
  });

  it('throws on invalid secret', () => {
    expect(() => useHint(-1, TS)).toThrow(RangeError);
    expect(() => useHint(10, TS)).toThrow(RangeError);
    expect(() => useHint(5.5, TS)).toThrow(RangeError);
  });

  it('returns source=trial when using free trial', () => {
    const { source } = useHint(5, TS);
    expect(source).toBe('trial');
  });

  it('returns source=owned when using owned hint', () => {
    addHints(1);
    const { source } = useHint(5, TS);
    expect(source).toBe('owned');
  });
});

describe('trial hint: daily reset', () => {
  it('trial is fresh on a new day', () => {
    const TS_DAY1 = Date.UTC(2024, 2, 15, 10, 0, 0);
    const TS_DAY2 = Date.UTC(2024, 2, 16, 10, 0, 0);
    useHint(5, TS_DAY1);
    expect(getTrialHintUsed(TS_DAY1)).toBe(true);
    expect(getTrialHintUsed(TS_DAY2)).toBe(false);
  });
});
