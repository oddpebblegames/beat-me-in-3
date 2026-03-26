/**
 * Global Player Count — Beat Me in 3
 *
 * Displays today's unique player count on the home screen.
 * Uses a real-time Firestore listener when available,
 * falls back to "--" on offline/error.
 *
 * Usage:
 *   const unsub = watchPlayerCount((count) => updateUI(count));
 *   // later...
 *   unsub();
 */

import { getTodayPlayerCount } from '../firebase/scores.js';

let _interval = null;

/**
 * Start watching the today's player count.
 * Calls `onUpdate(count)` immediately and then every `intervalMs`.
 *
 * @param {(count: number | '--') => void} onUpdate
 * @param {number} [intervalMs=60000]  Refresh interval (default 1 min)
 * @returns {() => void}  Stop watching
 */
export function watchPlayerCount(onUpdate, intervalMs = 60_000) {
  let active = true;

  async function fetchAndNotify() {
    if (!active) return;
    try {
      const count = await getTodayPlayerCount();
      if (active) onUpdate(count);
    } catch {
      if (active) onUpdate('--');
    }
  }

  // Immediate fetch
  fetchAndNotify();

  // Periodic refresh
  const id = setInterval(fetchAndNotify, intervalMs);

  return () => {
    active = false;
    clearInterval(id);
  };
}

/**
 * One-shot read of today's player count.
 * Returns '--' on failure.
 *
 * @returns {Promise<number | '--'>}
 */
export async function getPlayerCount() {
  try {
    return await getTodayPlayerCount();
  } catch {
    return '--';
  }
}
