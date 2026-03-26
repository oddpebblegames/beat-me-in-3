/**
 * Reactive state store backed by localStorage.
 *
 * - get(key)              → current value (parsed JSON) or null
 * - set(key, value)       → persist to localStorage, notify subscribers
 * - subscribe(key, fn)    → fn called with new value on every set(); returns unsub fn
 * - remove(key)           → delete from localStorage, notify with null
 * - clear()               → wipe all bmi3_ keys (used in tests)
 */

const PREFIX = 'bmi3_';
const listeners = new Map(); // key → Set of callbacks

function storageKey(key) {
  return PREFIX + key;
}

export function get(key) {
  try {
    const raw = localStorage.getItem(storageKey(key));
    if (raw === null) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function set(key, value) {
  try {
    localStorage.setItem(storageKey(key), JSON.stringify(value));
  } catch {
    // Storage quota exceeded or unavailable — degrade gracefully
  }
  notify(key, value);
}

export function remove(key) {
  localStorage.removeItem(storageKey(key));
  notify(key, null);
}

export function clear() {
  const keys = Object.keys(localStorage).filter((k) => k.startsWith(PREFIX));
  keys.forEach((k) => localStorage.removeItem(k));
  // Notify all active subscriptions with null
  listeners.forEach((_, key) => notify(key, null));
}

/**
 * Subscribe to changes on a specific key.
 * @param {string} key
 * @param {(value: any) => void} callback
 * @returns {() => void} Unsubscribe function
 */
export function subscribe(key, callback) {
  if (!listeners.has(key)) {
    listeners.set(key, new Set());
  }
  listeners.get(key).add(callback);
  return () => {
    listeners.get(key)?.delete(callback);
  };
}

function notify(key, value) {
  listeners.get(key)?.forEach((fn) => {
    try {
      fn(value);
    } catch {
      // Subscriber errors must not break the store
    }
  });
}

// Convenience helpers for typed values
export function getNumber(key, defaultValue = 0) {
  const v = get(key);
  return typeof v === 'number' ? v : defaultValue;
}

export function getString(key, defaultValue = '') {
  const v = get(key);
  return typeof v === 'string' ? v : defaultValue;
}

export function getBool(key, defaultValue = false) {
  const v = get(key);
  return typeof v === 'boolean' ? v : defaultValue;
}

export function getObject(key, defaultValue = {}) {
  const v = get(key);
  return v !== null && typeof v === 'object' && !Array.isArray(v) ? v : defaultValue;
}
