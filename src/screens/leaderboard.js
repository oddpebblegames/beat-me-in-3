/**
 * Leaderboard Screen — Beat Me in 3
 *
 * Shows Today / All-time leaderboard tabs.
 * Current player row is always visible (even outside top 10).
 * Handles loading, empty, and error states.
 */

import { sfxClick, sfxNav } from '../audio/sfx.js';
import { getUID } from '../firebase/auth.js';

/**
 * @param {HTMLElement} container
 * @param {object} params
 * @param {(tab: 'today'|'quick'|'friend') => Promise<{entries, userRank, userEntry}>} params.loadLeaderboard
 * @param {() => void} params.onBack
 */
export function renderLeaderboard(container, { loadLeaderboard, onBack }) {
  let currentTab = 'today';

  container.innerHTML = `
    <div class="lb-screen">

      <!-- Header -->
      <header class="lb-header">
        <button class="btn btn-icon" data-action="back" aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <h1 class="lb-title">🏆 Leaderboard</h1>
        <div style="width:44px"></div>
      </header>

      <!-- Tabs -->
      <div class="lb-tabs" role="tablist">
        <button class="lb-tab lb-tab--active" data-tab="today" role="tab" aria-selected="true">
          Today
        </button>
        <button class="lb-tab" data-tab="quick" role="tab" aria-selected="false">
          ⚡ Quick
        </button>
        <button class="lb-tab" data-tab="friend" role="tab" aria-selected="false">
          🤜 Friend
        </button>
      </div>

      <!-- Content area -->
      <div class="lb-content" id="lb-content" aria-live="polite">
        <div class="lb-loading">
          <div class="lb-spinner" aria-label="Loading..."></div>
          <span>Loading scores…</span>
        </div>
      </div>

    </div>
  `;

  _applyStyles(container);

  // Event delegation
  container.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action], [data-tab]');
    if (!btn) return;

    if (btn.dataset.action === 'back') {
      sfxNav();
      onBack?.();
      return;
    }

    if (btn.dataset.tab) {
      const tab = btn.dataset.tab;
      if (tab === currentTab) return;
      sfxClick();
      currentTab = tab;

      // Update tab active state
      container.querySelectorAll('.lb-tab').forEach((t) => {
        const isActive = t.dataset.tab === tab;
        t.classList.toggle('lb-tab--active', isActive);
        t.setAttribute('aria-selected', String(isActive));
      });

      await _loadAndRender(container, tab, loadLeaderboard);
    }
  });

  // Initial load
  _loadAndRender(container, 'today', loadLeaderboard);
}

async function _loadAndRender(container, tab, loadLeaderboard) {
  const content = container.querySelector('#lb-content');
  if (!content) return;

  content.innerHTML = `
    <div class="lb-loading" role="status">
      <div class="lb-spinner" aria-hidden="true"></div>
      <span>Loading…</span>
    </div>
  `;

  let data;
  try {
    data = await loadLeaderboard(tab);
  } catch {
    content.innerHTML = `
      <div class="lb-error" role="alert">
        <span>Couldn't load scores.</span>
        <br>Check your connection and try again.
      </div>
    `;
    return;
  }

  const { entries, userRank } = data;

  if (!entries || entries.length === 0) {
    content.innerHTML = `
      <div class="lb-empty" role="status">
        <div style="font-size:48px;">🌍</div>
        <p>No scores yet. Be the first!</p>
      </div>
    `;
    return;
  }

  const myUID = getUID();

  const isToday = tab === 'today';
  const scoreLabel = isToday ? 'Tries' : 'Wins';

  content.innerHTML = `
    <div class="lb-table" role="table" aria-label="${tab} leaderboard">
      <div class="lb-table-header" role="row">
        <span role="columnheader">#</span>
        <span role="columnheader">Player</span>
        <span role="columnheader">${scoreLabel}</span>
      </div>
      ${entries.map((entry) => _renderRow(entry, isToday, myUID)).join('')}
    </div>
    ${userRank > 0 ? `
      <p class="lb-rank-note" aria-label="Your rank">
        Your rank: #${userRank}
      </p>
    ` : ''}
  `;
}

function _renderRow(entry, isToday, myUID) {
  const isMe = entry.uid === myUID;
  const rankEmoji = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : '';
  const score = isToday
    ? `${entry.totalTries ?? '–'} (${((entry.totalTime ?? 0) / 1000).toFixed(1)}s)`
    : String(entry.wins ?? 0);

  return `
    <div class="lb-row ${isMe ? 'lb-row--me' : ''}" role="row" aria-label="${entry.name}, rank ${entry.rank}">
      <span class="lb-rank" role="cell">
        ${rankEmoji || `#${entry.rank}`}
      </span>
      <span class="lb-player" role="cell">
        <span class="lb-flag">${entry.flag ?? ''}</span>
        <span class="lb-name">${entry.name ?? 'Anonymous'}</span>
        ${isMe ? '<span class="lb-you-badge">YOU</span>' : ''}
      </span>
      <span class="lb-score" role="cell">${score}</span>
    </div>
  `;
}

function sfxNav() {
  sfxClick();
}

function _applyStyles(container) {
  if (document.getElementById('lb-styles')) return;

  const style = document.createElement('style');
  style.id = 'lb-styles';
  style.textContent = `
    .lb-screen {
      display: flex;
      flex-direction: column;
      width: 100%;
      gap: var(--space-4);
    }

    .lb-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }

    .lb-title {
      font-family: var(--font-display);
      font-size: var(--text-xl);
    }

    .lb-tabs {
      display: flex;
      gap: var(--space-2);
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      padding: var(--space-1);
    }

    .lb-tab {
      flex: 1;
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-lg);
      font-family: var(--font-body);
      font-size: var(--text-sm);
      font-weight: var(--font-semibold);
      color: var(--color-text-muted);
      cursor: pointer;
      transition: all var(--duration-normal) var(--ease-in-out);
    }

    .lb-tab--active {
      background: var(--color-brand-600);
      color: var(--color-white);
    }

    .lb-content {
      flex: 1;
      min-height: 200px;
    }

    .lb-loading, .lb-error, .lb-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--space-3);
      padding: var(--space-12);
      color: var(--color-text-muted);
      font-size: var(--text-sm);
      text-align: center;
    }

    .lb-spinner {
      width: 32px;
      height: 32px;
      border: 3px solid var(--color-border);
      border-top-color: var(--color-brand-400);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .lb-table {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .lb-table-header {
      display: grid;
      grid-template-columns: 48px 1fr auto;
      gap: var(--space-3);
      padding: var(--space-2) var(--space-4);
      font-size: var(--text-xs);
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .lb-row {
      display: grid;
      grid-template-columns: 48px 1fr auto;
      gap: var(--space-3);
      align-items: center;
      padding: var(--space-3) var(--space-4);
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      animation: slideUp var(--duration-slow) var(--ease-out-expo);
    }

    .lb-row--me {
      background: rgba(26, 63, 168, 0.3);
      border-color: var(--color-brand-400);
      box-shadow: var(--shadow-glow-brand);
    }

    .lb-rank {
      font-family: var(--font-display);
      font-size: var(--text-lg);
      text-align: center;
    }

    .lb-player {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      overflow: hidden;
    }

    .lb-flag { font-size: var(--text-lg); }

    .lb-name {
      font-family: var(--font-display);
      font-size: var(--text-base);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .lb-you-badge {
      font-size: 10px;
      font-weight: var(--font-bold);
      padding: 2px 6px;
      background: var(--color-gold-500);
      color: var(--color-brand-900);
      border-radius: var(--radius-full);
      flex-shrink: 0;
    }

    .lb-score {
      font-family: var(--font-display);
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
      text-align: right;
      white-space: nowrap;
    }

    .lb-rank-note {
      font-size: var(--text-sm);
      color: var(--color-text-muted);
      text-align: center;
      padding: var(--space-3);
    }
  `;
  document.head.appendChild(style);
}
