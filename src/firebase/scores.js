/**
 * Firestore Scores Module — Beat Me in 3
 *
 * Handles reading/writing daily challenge scores and win counts.
 * All writes include the UID for security rule enforcement.
 * Network failures are handled gracefully — game continues offline,
 * with scores queued for retry on reconnect.
 */

import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './init.js';
import { getUID } from './auth.js';
import { getTodayKey } from '../game/daily.js';
import { getString } from '../state/store.js';

// ── Collection Names ─────────────────────────────────────────
const COL_SCORES = 'scores';
const COL_WINS_QUICK = 'wins_quick';
const COL_WINS_FRIEND = 'wins_friend';

// ── Daily Score ──────────────────────────────────────────────

/**
 * Submit (upsert) the user's daily score.
 * @param {{ totalTries, totalTime, matchesPlayed, matchesWon }} scoreData
 * @param {string|null} [_now]  Timestamp override for testing (date key)
 */
export async function submitDailyScore(scoreData, _now) {
  const uid = getUID();
  if (!uid) throw new Error('Not authenticated');

  const today = getTodayKey(_now);
  const docId = `${today}_${uid}`;
  const username = getString('username', 'Anonymous');
  const flag = getString('flag', '');

  const payload = {
    uid,
    name: username,
    totalTries: scoreData.totalTries,
    totalTime: scoreData.totalTime,
    matchesPlayed: scoreData.matchesPlayed,
    matchesWon: scoreData.matchesWon,
    date: today,
    timestamp: serverTimestamp(),
    flag,
  };

  try {
    await setDoc(doc(db, COL_SCORES, docId), payload, { merge: true });
  } catch (err) {
    // Non-fatal: score submission failure should not crash the game
    console.warn('Score submission failed:', err.code ?? err.message);
    throw err; // Re-throw so caller can show a toast
  }
}

/**
 * Get today's scores (for leaderboard loading).
 * Returns sorted array or [] on failure.
 */
export async function getTodayScores(_now) {
  const today = getTodayKey(_now);
  try {
    const q = query(
      collection(db, COL_SCORES),
      where('date', '==', today),
      orderBy('totalTries', 'asc'),
      orderBy('totalTime', 'asc'),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn('Failed to load today scores:', err.code ?? err.message);
    return [];
  }
}

/**
 * Get a single user's today score document (or null).
 */
export async function getMyTodayScore(_now) {
  const uid = getUID();
  if (!uid) return null;

  const today = getTodayKey(_now);
  const docId = `${today}_${uid}`;

  try {
    const snap = await getDoc(doc(db, COL_SCORES, docId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch {
    return null;
  }
}

// ── Win Counts (Quick & Friend modes) ───────────────────────

/**
 * @param {'quick'|'friend'} mode
 */
export async function submitWin(mode) {
  const uid = getUID();
  if (!uid) return;

  const col = mode === 'quick' ? COL_WINS_QUICK : COL_WINS_FRIEND;
  const username = getString('username', 'Anonymous');
  const flag = getString('flag', '');

  try {
    const ref = doc(db, col, uid);
    const snap = await getDoc(ref);
    const currentWins = snap.exists() ? (snap.data().wins ?? 0) : 0;

    await setDoc(ref, {
      uid,
      name: username,
      wins: currentWins + 1,
      flag,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Win submission failed:', err.code ?? err.message);
  }
}

/**
 * Get all-time win leaderboard for quick or friend mode.
 * @param {'quick'|'friend'} mode
 * @returns {Promise<Array>}
 */
export async function getWinsLeaderboard(mode) {
  const col = mode === 'quick' ? COL_WINS_QUICK : COL_WINS_FRIEND;
  try {
    const q = query(
      collection(db, col),
      orderBy('wins', 'desc'),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn('Failed to load wins leaderboard:', err.code ?? err.message);
    return [];
  }
}

/**
 * Get the rank of the current user in a given leaderboard.
 * @param {Array} leaderboard  Sorted array from getTodayScores() or getWinsLeaderboard()
 * @returns {number}  1-based rank, or 0 if not found
 */
export function getUserRank(leaderboard) {
  const uid = getUID();
  if (!uid) return 0;
  const idx = leaderboard.findIndex((entry) => entry.uid === uid);
  return idx === -1 ? 0 : idx + 1;
}

/**
 * Get total unique players count for today.
 */
export async function getTodayPlayerCount(_now) {
  const scores = await getTodayScores(_now);
  return scores.length;
}
