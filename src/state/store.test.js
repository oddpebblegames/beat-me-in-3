/**
 * State Store Unit Tests — Beat Me in 3
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { get, set, remove, clear, subscribe, getNumber, getString, getBool, getObject } from './store.js';

beforeEach(() => {
  localStorage.clear();
});

describe('set() / get()', () => {
  it('stores and retrieves a number', () => {
    set('score', 42);
    expect(get('score')).toBe(42);
  });

  it('stores and retrieves a string', () => {
    set('name', 'Alice');
    expect(get('name')).toBe('Alice');
  });

  it('stores and retrieves an object', () => {
    set('data', { a: 1, b: [1, 2] });
    expect(get('data')).toEqual({ a: 1, b: [1, 2] });
  });

  it('stores and retrieves boolean', () => {
    set('flag', false);
    expect(get('flag')).toBe(false);
  });

  it('returns null for missing key', () => {
    expect(get('nonexistent')).toBeNull();
  });

  it('overwrites previous value', () => {
    set('x', 1);
    set('x', 2);
    expect(get('x')).toBe(2);
  });
});

describe('remove()', () => {
  it('deletes a key', () => {
    set('key', 'val');
    remove('key');
    expect(get('key')).toBeNull();
  });

  it('is safe to call on non-existent key', () => {
    expect(() => remove('ghost')).not.toThrow();
  });
});

describe('clear()', () => {
  it('removes all bmi3_ keys', () => {
    set('a', 1);
    set('b', 2);
    clear();
    expect(get('a')).toBeNull();
    expect(get('b')).toBeNull();
  });

  it('does not affect non-bmi3_ keys', () => {
    localStorage.setItem('other_key', 'keep');
    set('a', 1);
    clear();
    expect(localStorage.getItem('other_key')).toBe('keep');
  });
});

describe('subscribe()', () => {
  it('calls callback when key is set', () => {
    const cb = vi.fn();
    subscribe('watched', cb);
    set('watched', 99);
    expect(cb).toHaveBeenCalledWith(99);
  });

  it('calls callback with null on remove', () => {
    const cb = vi.fn();
    subscribe('watched', cb);
    set('watched', 1);
    remove('watched');
    expect(cb).toHaveBeenLastCalledWith(null);
  });

  it('returns an unsubscribe function', () => {
    const cb = vi.fn();
    const unsub = subscribe('x', cb);
    unsub();
    set('x', 1);
    expect(cb).not.toHaveBeenCalled();
  });

  it('does not call unsubscribed callback', () => {
    const cb = vi.fn();
    const unsub = subscribe('y', cb);
    set('y', 1);
    unsub();
    set('y', 2);
    expect(cb).toHaveBeenCalledTimes(1);
  });
});

describe('getNumber()', () => {
  it('returns stored number', () => {
    set('n', 7);
    expect(getNumber('n')).toBe(7);
  });
  it('returns default when missing', () => {
    expect(getNumber('missing', 5)).toBe(5);
  });
  it('returns default when stored value is not a number', () => {
    set('n', 'abc');
    expect(getNumber('n', 0)).toBe(0);
  });
});

describe('getString()', () => {
  it('returns stored string', () => {
    set('s', 'hello');
    expect(getString('s')).toBe('hello');
  });
  it('returns default when missing', () => {
    expect(getString('missing', 'def')).toBe('def');
  });
  it('returns default when stored value is not a string', () => {
    set('s', 42);
    expect(getString('s', '')).toBe('');
  });
});

describe('getBool()', () => {
  it('returns true/false', () => {
    set('b', true);
    expect(getBool('b')).toBe(true);
    set('b', false);
    expect(getBool('b')).toBe(false);
  });
  it('returns default for missing', () => {
    expect(getBool('missing', true)).toBe(true);
  });
});

describe('getObject()', () => {
  it('returns stored object', () => {
    set('o', { x: 1 });
    expect(getObject('o')).toEqual({ x: 1 });
  });
  it('returns default for missing', () => {
    expect(getObject('missing', { a: 1 })).toEqual({ a: 1 });
  });
  it('returns default for arrays (not plain objects)', () => {
    set('arr', [1, 2]);
    expect(getObject('arr', {})).toEqual({});
  });
});
