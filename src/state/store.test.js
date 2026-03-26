import { describe, it, expect, beforeEach } from 'vitest';
import { get, set, remove, subscribe, clear, getNumber, getString, getBool, getObject } from './store.js';

beforeEach(() => {
  localStorage.clear();
});

describe('store: basic get/set', () => {
  it('returns null for unknown key', () => {
    expect(get('nonexistent')).toBeNull();
  });

  it('stores and retrieves a string', () => {
    set('username', 'Alice');
    expect(get('username')).toBe('Alice');
  });

  it('stores and retrieves a number', () => {
    set('streak', 5);
    expect(get('streak')).toBe(5);
  });

  it('stores and retrieves an object', () => {
    const stats = { played: 10, wins: 7 };
    set('stats', stats);
    expect(get('stats')).toEqual(stats);
  });

  it('stores and retrieves a boolean', () => {
    set('sound', false);
    expect(get('sound')).toBe(false);
  });

  it('stores and retrieves zero correctly', () => {
    set('count', 0);
    expect(get('count')).toBe(0);
  });
});

describe('store: remove', () => {
  it('removes a key', () => {
    set('foo', 'bar');
    remove('foo');
    expect(get('foo')).toBeNull();
  });
});

describe('store: clear', () => {
  it('wipes all bmi3_ keys', () => {
    set('a', 1);
    set('b', 2);
    clear();
    expect(get('a')).toBeNull();
    expect(get('b')).toBeNull();
  });

  it('does not wipe unrelated keys', () => {
    localStorage.setItem('other_key', 'safe');
    set('a', 1);
    clear();
    expect(localStorage.getItem('other_key')).toBe('safe');
  });
});

describe('store: subscribe', () => {
  it('notifies subscriber on set', () => {
    const calls = [];
    subscribe('score', (v) => calls.push(v));
    set('score', 10);
    expect(calls).toEqual([10]);
  });

  it('notifies with null on remove', () => {
    const calls = [];
    subscribe('score', (v) => calls.push(v));
    set('score', 10);
    remove('score');
    expect(calls).toEqual([10, null]);
  });

  it('unsubscribe stops notifications', () => {
    const calls = [];
    const unsub = subscribe('score', (v) => calls.push(v));
    set('score', 1);
    unsub();
    set('score', 2);
    expect(calls).toEqual([1]);
  });

  it('multiple subscribers all receive updates', () => {
    const a = [], b = [];
    subscribe('x', (v) => a.push(v));
    subscribe('x', (v) => b.push(v));
    set('x', 42);
    expect(a).toEqual([42]);
    expect(b).toEqual([42]);
  });

  it('subscriber error does not break other subscribers', () => {
    const good = [];
    subscribe('y', () => { throw new Error('bad subscriber'); });
    subscribe('y', (v) => good.push(v));
    set('y', 99);
    expect(good).toEqual([99]);
  });
});

describe('store: typed helpers', () => {
  it('getNumber returns default when key missing', () => {
    expect(getNumber('missing', 7)).toBe(7);
  });

  it('getNumber returns stored number', () => {
    set('n', 42);
    expect(getNumber('n')).toBe(42);
  });

  it('getString returns default when missing', () => {
    expect(getString('s', 'default')).toBe('default');
  });

  it('getBool returns default when missing', () => {
    expect(getBool('b', true)).toBe(true);
  });

  it('getBool returns stored false correctly', () => {
    set('b', false);
    expect(getBool('b', true)).toBe(false);
  });

  it('getObject returns default for non-object', () => {
    set('arr', [1, 2, 3]);
    expect(getObject('arr', {})).toEqual({});
  });

  it('getObject returns stored object', () => {
    set('obj', { a: 1 });
    expect(getObject('obj')).toEqual({ a: 1 });
  });
});
