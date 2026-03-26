/**
 * Leaderboard Module — Beat Me in 3
 *
 * Provides real-time and one-shot leaderboard data.
 * Handles empty collections and network failures gracefully.
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { db } from './init.js';
import { getUID } from './auth.js';
import { getTodayKey } from '../game/daily.js';

const COL_SCORES = 'scores';
const COL_WINS_QUICK = 'wins_quick';
const COL_WINS_FRIEND = 'wins_friend';
const LEADERBOARD_LIMIT = 10;

// ── Today's Daily Leaderboard ────────────────────────────────

/**
 * One-shot fetch of today's daily leaderboard.
 * @param {string|null} [_now]  Date override for testing
 * @returns {Promise<{ entries: Array, userRank: number, userEntry: object|null }>}
 */
export async function getTodayLeaderboard(_now) {
  const today = getTodayKey(_now);
  try {
    const q = query(
      collection(db, COL_SCORES),
      where('date', '==', today),
      orderBy('totalTries', 'asc'),
      orderBy('totalTime', 'asc'),
      limit(50) // fetch more than display limit to find user rank
    );
    const snap = await getDocs(q);
    const all = snap.docs.map((d, i) => ({ rank: i + 1, ...d.data() }));
    return _processLeaderboard(all);
  } catch (err) {
    console.warn('Failed to fetch today leaderboard:', err.code ?? err.message);
    return { entries: [], userRank: 0, userEntry: null };
  }
}

/**
 * Real-time subscription to today's leaderboard.
 * @param {(data: { entries: Array, userRank: number }) => void} callback
 * @param {string|null} [_now]
 * @returns {() => void}  Unsubscribe function
 */
export function subscribeTodayLeaderboard(callback, _now) {
  const today = getTodayKey(_now);
  const q = query(
    collection(db, COL_SCORES),
    where('date', '==', today),
    orderBy('totalTries', 'asc'),
    orderBy('totalTime', 'asc'),
    limit(50)
  );

  return onSnapshot(
    q,
    (snap) => {
      const all = snap.docs.map((d, i) => ({ rank: i + 1, ...d.data() }));
      callback(_processLeaderboard(all));
    },
    (err) => {
      console.warn('Leaderboard snapshot error:', err.code ?? err.message);
      callback({ entries: [], userRank: 0, userEntry: null });
    }
  );
}

// ── All-Time Win Leaderboard ─────────────────────────────────

/**
 * @param {'quick'|'friend'} mode
 * @returns {Promise<{ entries: Array, userRank: number, userEntry: object|null }>}
 */
export async function getAllTimeLeaderboard(mode) {
  const col = mode === 'quick' ? COL_WINS_QUICK : COL_WINS_FRIEND;
  try {
    const q = query(
      collection(db, col),
      orderBy('wins', 'desc'),
      limit(50)
    );
    const snap = await getDocs(q);
    const all = snap.docs.map((d, i) => ({ rank: i + 1, ...d.data() }));
    return _processLeaderboard(all);
  } catch (err) {
    console.warn('Failed to fetch all-time leaderboard:', err.code ?? err.message);
    return { entries: [], userRank: 0, userEntry: null };
  }
}

// ── Helpers ──────────────────────────────────────────────────

function _processLeaderboard(all) {
  const uid = getUID();
  const userIdx = all.findIndex((e) => e.uid === uid);
  const userEntry = userIdx !== -1 ? all[userIdx] : null;
  const userRank = userIdx !== -1 ? userIdx + 1 : 0;

  // Top N for display
  const entries = all.slice(0, LEADERBOARD_LIMIT);

  // Ensure user entry is appended if outside top N
  if (userEntry && userRank > LEADERBOARD_LIMIT) {
    entries.push({ ...userEntry, rank: userRank });
  }

  return { entries, userRank, userEntry };
}
