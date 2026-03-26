/**
 * Push Notification Scheduling — Beat Me in 3
 *
 * Schedules a daily 8am UTC reminder via the Service Worker.
 * Uses IndexedDB-persisted alarm (see sw.js) so the notification
 * survives browser restarts as long as the SW is still registered.
 *
 * Permission is requested after the user's first win to avoid
 * cold-prompt friction.
 */

import { getBool, set } from '../state/store.js';

const NOTIF_KEY         = 'notifications_enabled';
const REMINDER_HOUR_UTC = 8; // 08:00 UTC daily

// ── Public API ────────────────────────────────────────────────

/**
 * Request notification permission.
 * @returns {Promise<'granted'|'denied'|'default'>}
 */
export async function requestNotificationPermission() {
  if (!_isSupported()) return 'default';
  const result = await Notification.requestPermission();
  set(NOTIF_KEY, result === 'granted');
  if (result === 'granted') {
    await scheduleDailyReminder();
  }
  return result;
}

/**
 * Schedule (or re-schedule) the daily 8am UTC notification.
 * Should be called after any win to keep the alarm fresh.
 */
export async function scheduleDailyReminder() {
  if (!_isSupported()) return;
  if (Notification.permission !== 'granted') return;

  const sw = await _getSW();
  if (!sw) return;

  const delay = _msUntilNextReminder();
  sw.postMessage({
    type : 'SCHEDULE_NOTIFICATION',
    delay,
    title: 'Beat Me in 3 🎮',
    body : "Today's Daily Challenge is ready — can you hold your streak?",
  });
}

/**
 * Called after a win to conditionally prompt for notifications
 * (only if never asked before).
 */
export async function maybePromptAfterWin() {
  if (!_isSupported()) return;
  if (getBool(NOTIF_KEY, false)) {
    // Already enabled — just reschedule
    await scheduleDailyReminder();
    return;
  }
  if (Notification.permission === 'default') {
    await requestNotificationPermission();
  }
}

// ── Internals ─────────────────────────────────────────────────

function _isSupported() {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

async function _getSW() {
  try {
    const reg = await navigator.serviceWorker.ready;
    return reg.active ?? null;
  } catch {
    return null;
  }
}

/**
 * Milliseconds until the next 08:00 UTC.
 * If it's already past 08:00 today, returns time until 08:00 tomorrow.
 */
function _msUntilNextReminder() {
  const now = new Date();
  const next = new Date();
  next.setUTCHours(REMINDER_HOUR_UTC, 0, 0, 0);

  if (next <= now) {
    next.setUTCDate(next.getUTCDate() + 1);
  }

  return next.getTime() - now.getTime();
}
