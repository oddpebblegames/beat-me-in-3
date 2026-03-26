/**
 * Firebase Anonymous Authentication — Beat Me in 3
 *
 * Signs in anonymously on app load, persisting the UID in the store.
 * The UID is stable across sessions as long as the user doesn't clear
 * their browser data.
 *
 * The display name (username) is cosmetic and stored in localStorage.
 * It is NOT tied to Firebase Auth — only the UID is authoritative for
 * Firestore security rules.
 */

import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { auth } from './init.js';
import { get, set, getString } from '../state/store.js';

let _uid = null;
let _readyResolve = null;
const _ready = new Promise((resolve) => { _readyResolve = resolve; });

/**
 * Initialize auth. Call once at app startup.
 * Returns a promise that resolves with the user's UID.
 */
export async function initAuth() {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        _uid = user.uid;
        set('uid', _uid);
        _readyResolve(_uid);
        resolve(_uid);
        unsubscribe();
      }
    });

    // Trigger sign-in if not already signed in
    signInAnonymously(auth).catch((err) => {
      // Auth errors are non-fatal — game can still run offline
      console.warn('Anonymous auth failed:', err.code);
      const stored = get('uid');
      if (stored) {
        _uid = stored;
        _readyResolve(_uid);
        resolve(_uid);
      } else {
        reject(err);
      }
    });
  });
}

/**
 * Returns the current UID. May be null if initAuth has not completed.
 * For guaranteed non-null, await getUIDWhenReady().
 */
export function getUID() {
  return _uid ?? get('uid');
}

/**
 * Resolves with the UID once auth is ready.
 * Safe to call before initAuth resolves.
 */
export function getUIDWhenReady() {
  return _ready;
}

// ── Username ─────────────────────────────────────────────────

export function getUsername() {
  return getString('username', '');
}

export function setUsername(name) {
  const trimmed = name?.trim();
  if (!trimmed) throw new Error('Username cannot be empty');
  if (trimmed.length > 24) throw new Error('Username too long (max 24 characters)');
  set('username', trimmed);
  return trimmed;
}

export function hasUsername() {
  return getUsername().length > 0;
}
