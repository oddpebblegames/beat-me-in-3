/**
 * Stats Modal — Beat Me in 3
 *
 * Shows personal statistics as a bottom sheet modal.
 * Stats: played, wins, win rate, avg tries, best time, streaks, distribution
 */

import { getNumber, getString, getObject } from '../state/store.js';
import { sfxClick } from '../audio/sfx.js';

export function renderStats(overlayEl, { onClose }) {
  const stats = getObject('stats', {
    played: 0,
    wins: 0,
    totalTries: 0,
    bestTimeMs: null,
    dist: { 1: 0, 2: 0, 3: 0 },
  });

  const streak = getNumber('streak', 0);
  const bestStreak = getNumber('best_streak', 0);
  const username = getString('username', 'Player');
  const flag = getString('flag', '');

  const winRate = stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : 0;
  const avgTries = stats.wins > 0 ? (stats.totalTries / stats.wins).toFixed(1) : '–';
  const bestTime = stats.bestTimeMs ? (stats.bestTimeMs / 1000).toFixed(1) + 's' : '–';

  const maxDist = Math.max(...Object.values(stats.dist ?? { 1: 0, 2: 0, 3: 0 }), 1);

  overlayEl.innerHTML = `
    <div class="modal-sheet stats-sheet" role="dialog" aria-modal="true" aria-label="Your Statistics">
      <div class="modal-handle" aria-hidden="true"></div>

      <div class="stats-header">
        <h2 class="stats-title">📊 Your Stats</h2>
        <button class="btn btn-icon stats-close" data-action="close" aria-label="Close stats">✕</button>
      </div>

      <div class="stats-player">
        <span class="stats-flag">${flag}</span>
        <span class="stats-username">${username}</span>
      </div>

      <!-- Key metrics -->
      <div class="stats-grid">
        <div class="stats-cell">
          <span class="stats-num">${stats.played}</span>
          <span class="stats-label">Played</span>
        </div>
        <div class="stats-cell">
          <span class="stats-num">${winRate}%</span>
          <span class="stats-label">Win Rate</span>
        </div>
        <div class="stats-cell">
          <span class="stats-num">${avgTries}</span>
          <span class="stats-label">Avg Tries</span>
        </div>
        <div class="stats-cell">
          <span class="stats-num">${bestTime}</span>
          <span class="stats-label">Best Time</span>
        </div>
      </div>

      <!-- Streaks -->
      <div class="stats-streaks">
        <div class="stats-streak-item">
          <span class="stats-streak-icon">🔥</span>
          <div>
            <span class="stats-num stats-num--sm">${streak}</span>
            <span class="stats-label">Current Streak</span>
          </div>
        </div>
        <div class="stats-streak-item">
          <span class="stats-streak-icon">⭐</span>
          <div>
            <span class="stats-num stats-num--sm">${bestStreak}</span>
            <span class="stats-label">Best Streak</span>
          </div>
        </div>
      </div>

      <!-- Guess distribution -->
      <div class="stats-dist-section">
        <h3 class="stats-dist-title">Guess Distribution</h3>
        ${[1, 2, 3].map((n) => {
          const count = stats.dist?.[n] ?? 0;
          const pct = Math.round((count / maxDist) * 100);
          return `
            <div class="stats-dist-row" role="presentation">
              <span class="stats-dist-label">${n}</span>
              <div class="stats-dist-bar-track" role="meter" aria-valuenow="${count}" aria-label="${count} win${count !== 1 ? 's' : ''} in ${n} tr${n === 1 ? 'y' : 'ies'}">
                <div class="stats-dist-bar" style="width:max(8px, ${pct}%)"></div>
              </div>
              <span class="stats-dist-count">${count}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  overlayEl.classList.add('active');
  _applyStyles(overlayEl);

  overlayEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (btn?.dataset.action === 'close') {
      sfxClick();
      _close(overlayEl, onClose);
    }
    // Click outside modal sheet closes it
    if (e.target === overlayEl) {
      sfxClick();
      _close(overlayEl, onClose);
    }
  });
}

function _close(overlayEl, onClose) {
  overlayEl.classList.remove('active');
  setTimeout(() => {
    overlayEl.innerHTML = '';
    onClose?.();
  }, 350);
}

function _applyStyles() {
  if (document.getElementById('stats-styles')) return;

  const style = document.createElement('style');
  style.id = 'stats-styles';
  style.textContent = `
    .stats-sheet {
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-handle {
      width: 36px;
      height: 4px;
      background: var(--color-border-strong);
      border-radius: var(--radius-full);
      margin: 0 auto var(--space-5);
    }

    .stats-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-4);
    }

    .stats-title {
      font-family: var(--font-display);
      font-size: var(--text-xl);
    }

    .stats-close {
      font-size: var(--text-base);
    }

    .stats-player {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin-bottom: var(--space-5);
      font-size: var(--text-md);
      color: var(--color-text-secondary);
    }

    .stats-flag { font-size: var(--text-xl); }
    .stats-username { font-family: var(--font-display); }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-3);
      margin-bottom: var(--space-5);
    }

    .stats-cell {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-1);
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-3) var(--space-2);
    }

    .stats-num {
      font-family: var(--font-display);
      font-size: var(--text-xl);
      color: var(--color-text-primary);
      line-height: 1;
    }

    .stats-num--sm { font-size: var(--text-2xl); }

    .stats-label {
      font-size: 10px;
      color: var(--color-text-muted);
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .stats-streaks {
      display: flex;
      gap: var(--space-4);
      margin-bottom: var(--space-5);
    }

    .stats-streak-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      flex: 1;
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
    }

    .stats-streak-icon { font-size: var(--text-2xl); }

    .stats-dist-section {
      margin-top: var(--space-2);
    }

    .stats-dist-title {
      font-family: var(--font-display);
      font-size: var(--text-md);
      margin-bottom: var(--space-4);
      color: var(--color-text-secondary);
    }

    .stats-dist-row {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      margin-bottom: var(--space-3);
    }

    .stats-dist-label {
      font-family: var(--font-display);
      font-size: var(--text-md);
      color: var(--color-text-secondary);
      min-width: 16px;
      text-align: center;
    }

    .stats-dist-bar-track {
      flex: 1;
      height: 28px;
      background: var(--color-bg-card);
      border-radius: var(--radius-sm);
      overflow: hidden;
    }

    .stats-dist-bar {
      height: 100%;
      background: linear-gradient(90deg, var(--color-brand-500), var(--color-brand-400));
      border-radius: var(--radius-sm);
      transition: width var(--duration-slower) var(--ease-out-expo);
      min-width: 8px;
    }

    .stats-dist-count {
      font-family: var(--font-display);
      font-size: var(--text-sm);
      color: var(--color-text-muted);
      min-width: 24px;
      text-align: right;
    }
  `;
  document.head.appendChild(style);
}
