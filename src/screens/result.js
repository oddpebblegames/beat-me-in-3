/**
 * Win / Lose Result Screen — Beat Me in 3
 *
 * Shown after each match with:
 * - Win: confetti, streak update, win rays, result stats
 * - Lose: secret reveal, attempt history, encouragement
 * - Share / Play Again CTAs
 */

import { sfxWin, sfxLose, sfxApplause, sfxCrowdGroan } from '../audio/sfx.js';
import { sfxClick } from '../audio/sfx.js';
import { getNumber, getString } from '../state/store.js';

const CONFETTI_COLORS = [
  '#fbbf24', '#f97316', '#22c55e', '#3b82f6', '#a855f7',
  '#ec4899', '#14b8a6', '#ef4444', '#ffffff',
];

/**
 * @param {HTMLElement} container
 * @param {object} params
 * @param {boolean} params.won
 * @param {number} params.secret         The secret number
 * @param {number} params.tries          Tries used (1–3)
 * @param {number} params.timeMs         Total time for this match
 * @param {Array}  params.attempts       [{ guess, correct, hint, timedOut }]
 * @param {string} params.mode
 * @param {number} [params.streak]       Current streak (daily only)
 * @param {{ current, total }} [params.matchInfo]  For daily mode
 * @param {() => void} params.onPlayAgain
 * @param {() => void} params.onShare
 * @param {() => void} params.onHome
 */
export function renderResult(container, params) {
  const { won, secret, tries, timeMs, attempts, mode, streak, matchInfo, onPlayAgain, onShare, onHome } = params;

  const timeSec = (timeMs / 1000).toFixed(1);

  container.innerHTML = `
    <div class="result-screen">

      <!-- Win rays (behind content) -->
      ${won ? '<div class="win-rays" aria-hidden="true"></div>' : ''}

      <!-- Hero -->
      <div class="result-hero">
        <div class="result-emoji" role="img" aria-label="${won ? 'Trophy' : 'Skull'}">${won ? '🏆' : '💀'}</div>
        <h1 class="result-title">${won ? 'You got it!' : 'Out of tries!'}</h1>
        ${!won ? `<p class="result-secret-reveal">The number was <strong class="result-secret-num">${secret}</strong></p>` : ''}
      </div>

      <!-- Attempt history -->
      <div class="result-attempts" role="list" aria-label="Your guesses">
        ${attempts.map((a, i) => `
          <div class="result-attempt ${a.correct ? 'result-attempt--correct' : 'result-attempt--wrong'}"
               role="listitem"
               aria-label="Attempt ${i + 1}: ${a.timedOut ? 'timed out' : (a.correct ? `${a.guess} correct` : `${a.guess} was ${a.hint}`)}"
          >
            <span class="result-attempt-num">${a.timedOut ? '⏱' : (a.guess ?? '?')}</span>
            <span class="result-attempt-hint">
              ${a.correct ? '✓' : (a.timedOut ? 'Timed out' : `Go ${a.hint}`)}
            </span>
          </div>
        `).join('')}
      </div>

      <!-- Stats row -->
      <div class="result-stats">
        ${won ? `
          <div class="result-stat">
            <span class="result-stat-val">${tries}</span>
            <span class="result-stat-label">${tries === 1 ? 'Try' : 'Tries'}</span>
          </div>
          <div class="result-stat-divider" aria-hidden="true"></div>
          <div class="result-stat">
            <span class="result-stat-val">${timeSec}s</span>
            <span class="result-stat-label">Time</span>
          </div>
          ${streak && streak > 1 ? `
            <div class="result-stat-divider" aria-hidden="true"></div>
            <div class="result-stat">
              <span class="result-stat-val">🔥 ${streak}</span>
              <span class="result-stat-label">Streak</span>
            </div>
          ` : ''}
        ` : `
          <div class="result-stat">
            <span class="result-stat-val">Better luck</span>
            <span class="result-stat-label">next time!</span>
          </div>
        `}
      </div>

      <!-- Match progress (daily only) -->
      ${matchInfo ? `
        <div class="result-match-progress" aria-label="Daily progress">
          <span class="result-match-label">
            Match ${matchInfo.current} / ${matchInfo.total} done
          </span>
          <div class="result-match-dots" role="presentation">
            ${Array.from({ length: matchInfo.total }, (_, i) => `
              <div class="result-match-dot ${i < matchInfo.current ? 'result-match-dot--done' : ''}" aria-hidden="true"></div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- CTAs -->
      <div class="result-actions">
        <button class="btn btn-icon result-btn-home" data-action="home" aria-label="Back to home">
          🏠
        </button>
        <button class="btn ${won ? 'btn-green' : 'btn-primary'} btn-lg result-btn-play" data-action="play">
          ${matchInfo && matchInfo.current < matchInfo.total ? 'Next Match →' : 'Play Again'}
        </button>
        <button class="btn btn-icon result-btn-share" data-action="share" aria-label="Share result">
          📤
        </button>
      </div>

    </div>
  `;

  _applyStyles(container);

  // Play audio
  if (won) {
    sfxWin();
    setTimeout(() => sfxApplause(), 300);
    _spawnConfetti();
  } else {
    sfxLose();
    setTimeout(() => sfxCrowdGroan(), 200);
  }

  // Bind events
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    sfxClick();
    const action = btn.dataset.action;
    if (action === 'play') onPlayAgain?.();
    else if (action === 'share') onShare?.();
    else if (action === 'home') onHome?.();
  });
}

// ── Confetti ─────────────────────────────────────────────────

function _spawnConfetti() {
  const layer = document.getElementById('confetti-layer');
  if (!layer) return;

  layer.innerHTML = '';

  // First wave: 50 pieces
  for (let i = 0; i < 50; i++) {
    _createPiece(layer, i * 20);
  }

  // Second wave: 20 stars
  const stars = ['⭐', '🌟', '✨'];
  for (let i = 0; i < 20; i++) {
    _createStar(layer, 600 + i * 30, stars[i % stars.length]);
  }

  // Clean up after 5 seconds
  setTimeout(() => { layer.innerHTML = ''; }, 5000);
}

function _createPiece(layer, delay) {
  const el = document.createElement('div');
  el.className = 'confetti-piece';
  el.style.cssText = `
    left: ${Math.random() * 100}%;
    background: ${CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]};
    width: ${6 + Math.random() * 8}px;
    height: ${6 + Math.random() * 8}px;
    border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
    animation-duration: ${2.5 + Math.random() * 2.5}s;
    animation-delay: ${delay}ms;
  `;
  layer.appendChild(el);
}

function _createStar(layer, delay, emoji) {
  const el = document.createElement('div');
  el.className = 'confetti-star';
  el.textContent = emoji;
  el.style.cssText = `
    left: ${Math.random() * 100}%;
    font-size: ${16 + Math.random() * 16}px;
    animation-duration: ${3 + Math.random() * 2}s;
    animation-delay: ${delay}ms;
  `;
  layer.appendChild(el);
}

// ── Styles ───────────────────────────────────────────────────

function _applyStyles(container) {
  if (document.getElementById('result-screen-styles')) return;

  const style = document.createElement('style');
  style.id = 'result-screen-styles';
  style.textContent = `
    .result-screen {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      gap: var(--space-5);
      padding-top: var(--space-6);
      position: relative;
    }

    /* Win rays */
    .win-rays {
      position: fixed;
      top: 50%;
      left: 50%;
      width: 200vw;
      height: 200vw;
      transform: translate(-50%, -50%) scale(0);
      background: conic-gradient(
        from 0deg,
        transparent 0deg, rgba(245,166,35,0.06) 10deg, transparent 20deg,
        transparent 40deg, rgba(245,166,35,0.06) 50deg, transparent 60deg,
        transparent 80deg, rgba(245,166,35,0.06) 90deg, transparent 100deg,
        transparent 120deg, rgba(245,166,35,0.06) 130deg, transparent 140deg,
        transparent 160deg, rgba(245,166,35,0.06) 170deg, transparent 180deg,
        transparent 200deg, rgba(245,166,35,0.06) 210deg, transparent 220deg,
        transparent 240deg, rgba(245,166,35,0.06) 250deg, transparent 260deg,
        transparent 280deg, rgba(245,166,35,0.06) 290deg, transparent 300deg,
        transparent 320deg, rgba(245,166,35,0.06) 330deg, transparent 340deg,
        transparent 360deg
      );
      animation: winRay 1.5s var(--ease-out-expo) forwards;
      pointer-events: none;
      z-index: -1;
    }

    /* Hero */
    .result-hero {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-3);
      text-align: center;
    }

    .result-emoji {
      font-size: 80px;
      line-height: 1;
      animation: pop var(--duration-slow) var(--ease-bounce);
    }

    .result-title {
      font-family: var(--font-display);
      font-size: var(--text-3xl);
    }

    .result-secret-reveal {
      font-size: var(--text-md);
      color: var(--color-text-secondary);
    }

    .result-secret-num {
      font-family: var(--font-display);
      font-size: var(--text-4xl);
      color: var(--color-red-300);
    }

    /* Attempts */
    .result-attempts {
      display: flex;
      gap: var(--space-3);
      justify-content: center;
    }

    .result-attempt {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-1);
      padding: var(--space-3);
      border-radius: var(--radius-md);
      min-width: 64px;
    }

    .result-attempt--correct {
      background: rgba(40,181,100,0.15);
      border: 1px solid var(--color-green-400);
    }

    .result-attempt--wrong {
      background: rgba(229,53,53,0.1);
      border: 1px solid rgba(229,53,53,0.3);
    }

    .result-attempt-num {
      font-family: var(--font-display);
      font-size: var(--text-2xl);
    }

    .result-attempt-hint {
      font-size: var(--text-xs);
      color: var(--color-text-muted);
      text-align: center;
    }

    /* Stats */
    .result-stats {
      display: flex;
      align-items: center;
      gap: var(--space-5);
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      padding: var(--space-4) var(--space-8);
    }

    .result-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-1);
    }

    .result-stat-val {
      font-family: var(--font-display);
      font-size: var(--text-2xl);
      color: var(--color-text-primary);
    }

    .result-stat-label {
      font-size: var(--text-xs);
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .result-stat-divider {
      width: 1px;
      height: 32px;
      background: var(--color-border);
    }

    /* Match progress */
    .result-match-progress {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
    }

    .result-match-label {
      font-size: var(--text-sm);
      color: var(--color-text-muted);
    }

    .result-match-dots {
      display: flex;
      gap: var(--space-2);
    }

    .result-match-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--color-border);
    }

    .result-match-dot--done {
      background: var(--color-green-400);
    }

    /* Actions */
    .result-actions {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      width: 100%;
    }

    .result-btn-home,
    .result-btn-share {
      font-size: var(--text-xl);
      padding: var(--space-4);
    }

    .result-btn-play { flex: 1; }

    /* Confetti */
    #confetti-layer {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: var(--z-confetti);
      overflow: hidden;
    }

    .confetti-piece {
      position: absolute;
      top: -10px;
      animation: confettiFall linear forwards;
    }

    .confetti-star {
      position: absolute;
      top: -20px;
      animation: confettiFall linear forwards;
    }
  `;
  document.head.appendChild(style);
}
