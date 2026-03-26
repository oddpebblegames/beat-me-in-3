/**
 * Home Screen — Beat Me in 3
 *
 * Renders the main menu with:
 * - Player avatar and streak badge
 * - Daily / Quick / Friend challenge buttons
 * - Daily reset countdown
 * - Leaderboard and settings shortcuts
 */

import { getNumber, getString, getBool, subscribe } from '../state/store.js';
import { isDailyComplete, remainingMatches } from '../game/daily.js';
import { sfxClick } from '../audio/sfx.js';
import { watchPlayerCount } from '../utils/player-count.js';

let _countdownInterval = null;
let _stopPlayerCount   = null;

export function renderHome(container, { onDaily, onQuick, onFriend, onLeaderboard, onStats, onSettings }) {
  container.innerHTML = `
    <div class="home-screen">

      <!-- Header bar -->
      <header class="home-header">
        <button class="btn btn-icon home-stats-btn" aria-label="View your stats" data-action="stats">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <rect x="3" y="12" width="4" height="9" rx="1"/>
            <rect x="10" y="7" width="4" height="14" rx="1"/>
            <rect x="17" y="3" width="4" height="18" rx="1"/>
          </svg>
        </button>

        <div class="home-brand">
          <span class="home-logo-text">Beat Me in 3</span>
        </div>

        <button class="btn btn-icon home-settings-btn" aria-label="Settings" data-action="settings">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </header>

      <!-- Player badge -->
      <div class="home-profile">
        <div class="home-avatar" aria-hidden="true">
          <span class="home-avatar-initial"></span>
          <div class="home-streak-badge" id="streak-badge" aria-label="Current streak"></div>
        </div>
        <div class="home-profile-info">
          <span class="home-username" id="home-username"></span>
          <span class="home-subtitle" id="home-subtitle"></span>
        </div>
      </div>

      <!-- Game mode buttons -->
      <div class="home-modes" role="group" aria-label="Game modes">

        <button class="mode-btn mode-daily" data-action="daily" id="btn-daily">
          <div class="mode-btn-icon" aria-hidden="true">📅</div>
          <div class="mode-btn-content">
            <span class="mode-btn-title">Daily Challenge</span>
            <span class="mode-btn-sub" id="daily-sub">vs the world</span>
          </div>
          <div class="mode-btn-arrow" aria-hidden="true">›</div>
        </button>

        <div class="home-modes-row">
          <button class="mode-btn mode-quick" data-action="quick">
            <div class="mode-btn-icon" aria-hidden="true">⚡</div>
            <div class="mode-btn-content">
              <span class="mode-btn-title">Quick Play</span>
              <span class="mode-btn-sub">vs Bot</span>
            </div>
          </button>

          <button class="mode-btn mode-friend" data-action="friend">
            <div class="mode-btn-icon" aria-hidden="true">🤜</div>
            <div class="mode-btn-content">
              <span class="mode-btn-title">Challenge</span>
              <span class="mode-btn-sub">a Friend</span>
            </div>
          </button>
        </div>

      </div>

      <!-- Leaderboard shortcut -->
      <button class="home-leaderboard-btn" data-action="leaderboard">
        <span class="home-lb-icon" aria-hidden="true">🏆</span>
        <span>Leaderboard</span>
        <span class="home-lb-arrow" aria-hidden="true">›</span>
      </button>

      <!-- Player count -->
      <div class="home-player-count" id="home-player-count" aria-live="polite">
        <span class="home-player-count-num" id="player-count-num">--</span>
        <span class="home-player-count-label"> players today</span>
      </div>

      <!-- Daily countdown -->
      <div class="home-countdown" id="home-countdown" aria-live="polite">
        <span class="home-countdown-label">Next reset in </span>
        <span class="home-countdown-time" id="countdown-time"></span>
      </div>

    </div>
  `;

  _applyHomeStyles(container);
  _bindEvents(container, { onDaily, onQuick, onFriend, onLeaderboard, onStats, onSettings });
  _updateProfile(container);
  _updateDailyButton(container);
  _startCountdown(container);
  _startPlayerCount(container);
}

export function destroyHome() {
  if (_countdownInterval) {
    clearInterval(_countdownInterval);
    _countdownInterval = null;
  }
  if (_stopPlayerCount) {
    _stopPlayerCount();
    _stopPlayerCount = null;
  }
}

// ── Internals ────────────────────────────────────────────────

function _bindEvents(container, handlers) {
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn || btn.disabled) return;

    sfxClick();
    const action = btn.dataset.action;

    if (action === 'daily') handlers.onDaily?.();
    else if (action === 'quick') handlers.onQuick?.();
    else if (action === 'friend') handlers.onFriend?.();
    else if (action === 'leaderboard') handlers.onLeaderboard?.();
    else if (action === 'stats') handlers.onStats?.();
    else if (action === 'settings') handlers.onSettings?.();
  });
}

function _updateProfile(container) {
  const username = getString('username', '');
  const streak = getNumber('streak', 0);
  const bestStreak = getNumber('best_streak', 0);

  const nameEl = container.querySelector('#home-username');
  const subEl = container.querySelector('#home-subtitle');
  const badgeEl = container.querySelector('#streak-badge');
  const initialEl = container.querySelector('.home-avatar-initial');

  if (nameEl) nameEl.textContent = username || 'New Player';
  if (subEl) subEl.textContent = bestStreak > 0 ? `Best streak: ${bestStreak}` : 'Start playing!';
  if (initialEl) initialEl.textContent = (username?.[0] ?? '?').toUpperCase();

  if (badgeEl) {
    if (streak > 0) {
      badgeEl.textContent = `🔥 ${streak}`;
      badgeEl.style.display = 'flex';
      badgeEl.setAttribute('aria-label', `${streak} day streak`);
    } else {
      badgeEl.style.display = 'none';
    }
  }
}

function _updateDailyButton(container) {
  const btn = container.querySelector('#btn-daily');
  const sub = container.querySelector('#daily-sub');
  if (!btn) return;

  const complete = isDailyComplete();
  const remaining = remainingMatches();

  btn.disabled = complete;
  btn.setAttribute('aria-disabled', String(complete));

  if (complete) {
    btn.classList.add('mode-btn--disabled');
    if (sub) sub.textContent = 'Completed today ✓';
  } else if (remaining < 10) {
    if (sub) sub.textContent = `${remaining} match${remaining === 1 ? '' : 'es'} remaining`;
  } else {
    if (sub) sub.textContent = 'vs the world';
  }
}

function _startCountdown(container) {
  const update = () => {
    const el = container.querySelector('#countdown-time');
    if (!el) return;

    const now = new Date();
    const midnight = new Date();
    midnight.setUTCHours(24, 0, 0, 0);
    const diff = midnight - now;

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    el.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  update();
  _countdownInterval = setInterval(update, 1000);
}

function _startPlayerCount(container) {
  _stopPlayerCount = watchPlayerCount((count) => {
    const el = container.querySelector('#player-count-num');
    if (el) el.textContent = count;
  }, 60_000);
}

function _applyHomeStyles(container) {
  // Inject screen-specific styles if not already present
  if (document.getElementById('home-screen-styles')) return;

  const style = document.createElement('style');
  style.id = 'home-screen-styles';
  style.textContent = `
    .home-screen {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      gap: var(--space-5);
      padding-top: var(--space-4);
    }

    .home-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }

    .home-brand {
      text-align: center;
    }

    .home-logo-text {
      font-family: var(--font-display);
      font-size: var(--text-xl);
      color: var(--color-text-primary);
      letter-spacing: 0.02em;
    }

    .home-profile {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      width: 100%;
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      padding: var(--space-4) var(--space-5);
    }

    .home-avatar {
      position: relative;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--color-brand-500), var(--color-brand-700));
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .home-avatar-initial {
      font-family: var(--font-display);
      font-size: var(--text-xl);
      color: var(--color-white);
    }

    .home-streak-badge {
      position: absolute;
      bottom: -4px;
      right: -4px;
      background: var(--color-gold-500);
      color: var(--color-brand-900);
      border-radius: var(--radius-full);
      padding: 2px 6px;
      font-size: 11px;
      font-weight: var(--font-bold);
      display: flex;
      align-items: center;
      border: 2px solid var(--color-bg-primary);
      white-space: nowrap;
    }

    .home-username {
      font-family: var(--font-display);
      font-size: var(--text-lg);
      color: var(--color-text-primary);
      display: block;
    }

    .home-subtitle {
      font-size: var(--text-sm);
      color: var(--color-text-muted);
    }

    .home-modes {
      display: flex;
      flex-direction: column;
      width: 100%;
      gap: var(--space-3);
    }

    .home-modes-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-3);
    }

    .mode-btn {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-4) var(--space-5);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
      color: var(--color-white);
      font-family: var(--font-body);
      text-align: left;
      transition:
        transform var(--duration-fast) var(--ease-out-expo),
        filter var(--duration-fast),
        box-shadow var(--duration-fast);
      cursor: pointer;
      width: 100%;
      box-shadow: var(--shadow-btn);
      position: relative;
      top: 0;
    }

    .mode-btn:active {
      transform: translateY(3px);
      box-shadow: var(--shadow-btn-pressed);
      top: 3px;
    }

    .mode-btn:hover { filter: brightness(1.08); }
    .mode-btn:disabled, .mode-btn--disabled { opacity: 0.5; cursor: not-allowed; }

    .mode-daily {
      background: linear-gradient(135deg, var(--color-brand-500) 0%, var(--color-brand-700) 100%);
    }

    .mode-quick {
      background: linear-gradient(135deg, var(--color-green-400) 0%, var(--color-green-600) 100%);
    }

    .mode-friend {
      background: linear-gradient(135deg, var(--color-orange-400) 0%, var(--color-orange-500) 100%);
    }

    .mode-btn-icon {
      font-size: var(--text-2xl);
      flex-shrink: 0;
    }

    .mode-btn-content {
      flex: 1;
    }

    .mode-btn-title {
      display: block;
      font-family: var(--font-display);
      font-size: var(--text-md);
      font-weight: var(--font-bold);
      line-height: 1.2;
    }

    .mode-btn-sub {
      display: block;
      font-size: var(--text-xs);
      opacity: 0.8;
      margin-top: 1px;
    }

    .mode-btn-arrow {
      font-size: var(--text-xl);
      opacity: 0.7;
    }

    .home-leaderboard-btn {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      width: 100%;
      padding: var(--space-3) var(--space-5);
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      color: var(--color-text-primary);
      font-family: var(--font-body);
      font-size: var(--text-base);
      cursor: pointer;
      transition: filter var(--duration-fast);
    }

    .home-leaderboard-btn:hover { filter: brightness(1.15); }

    .home-lb-icon { font-size: var(--text-xl); }

    .home-lb-arrow {
      margin-left: auto;
      font-size: var(--text-xl);
      opacity: 0.5;
    }

    .home-player-count {
      font-size: var(--text-sm);
      color: var(--color-text-muted);
      text-align: center;
    }

    .home-player-count-num {
      font-family: var(--font-display);
      color: var(--color-brand-400);
    }

    .home-countdown {
      font-size: var(--text-xs);
      color: var(--color-text-muted);
      text-align: center;
    }

    .home-countdown-time {
      font-family: var(--font-display);
      color: var(--color-text-secondary);
    }
  `;
  document.head.appendChild(style);
}
