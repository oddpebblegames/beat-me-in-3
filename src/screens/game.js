/**
 * Game Screen — Beat Me in 3
 *
 * Renders the main gameplay UI:
 * - Match counter / mode label
 * - Attempt dots (3 slots: pending/correct/wrong)
 * - Hint display
 * - Timer bar
 * - 0–9 numpad
 * - Submit button
 * - Hint button
 *
 * This component owns the visual layer only.
 * Game logic lives in src/game/engine.js.
 */

import { sfxSelect, sfxClick, sfxTick, sfxUrgent } from '../audio/sfx.js';
import { getString, getNumber } from '../state/store.js';

const TIME_LIMIT_MS = 15000;

export function renderGame(container, {
  mode,             // 'daily' | 'quick' | 'friend'
  matchInfo,        // { current, total } for daily; null otherwise
  onSubmit,         // (guess: number) => void
  onUseHint,        // () => void
  onBack,           // () => void
}) {
  container.innerHTML = `
    <div class="game-screen">

      <!-- Top bar -->
      <div class="game-topbar">
        <button class="btn btn-icon game-back-btn" aria-label="Back to home" data-action="back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>

        <div class="game-mode-label">
          ${_modeLabelHtml(mode, matchInfo)}
        </div>

        <div class="game-topbar-spacer" aria-hidden="true"></div>
      </div>

      <!-- Attempt dots -->
      <div class="game-attempts" role="group" aria-label="Attempt history">
        <div class="attempt-dot attempt-dot--pending" id="dot-0" aria-label="Attempt 1: pending"></div>
        <div class="attempt-dot attempt-dot--pending" id="dot-1" aria-label="Attempt 2: pending"></div>
        <div class="attempt-dot attempt-dot--pending" id="dot-2" aria-label="Attempt 3: pending"></div>
      </div>

      <!-- Hint display -->
      <div class="game-hint-area" id="hint-area" aria-live="polite" aria-atomic="true">
        <div class="game-hint-text" id="hint-text"></div>
      </div>

      <!-- Timer -->
      <div class="game-timer-container" role="timer" aria-label="Time remaining">
        <div class="game-timer-bar-track">
          <div class="game-timer-bar" id="timer-bar"></div>
        </div>
        <div class="game-timer-number" id="timer-number">15</div>
      </div>

      <!-- Number display (selected number) -->
      <div class="game-selected-display" id="selected-display" aria-live="polite">
        <span class="game-selected-number" id="selected-num">?</span>
      </div>

      <!-- Numpad -->
      <div class="game-numpad ${_themeClass()}" role="group" aria-label="Number pad" id="numpad">
        ${[7,8,9,4,5,6,1,2,3,0].map((n) => `
          <button
            class="numpad-btn"
            data-num="${n}"
            aria-label="${n}"
            aria-pressed="false"
          >${n}</button>
        `).join('')}
      </div>

      <!-- Action buttons -->
      <div class="game-actions">
        <button class="btn btn-gold game-hint-btn" id="hint-btn" data-action="hint" aria-label="Use a hint">
          💡 Hint
          <span class="hint-count-badge" id="hint-count"></span>
        </button>
        <button class="btn btn-green game-submit-btn" id="submit-btn" data-action="submit" disabled aria-label="Submit guess">
          Submit
        </button>
      </div>

    </div>
  `;

  _applyStyles(container);
  _bindEvents(container, { onSubmit, onUseHint, onBack });
  _updateHintButton(container);

  return {
    startTimer: (onExpire) => _startTimer(container, onExpire),
    stopTimer: () => _stopTimer(container),
    markAttempt: (idx, result) => _markAttempt(container, idx, result),
    showHint: (text) => _showHint(container, text),
    resetSelection: () => _resetSelection(container),
    shake: () => _shakeNumpad(container),
    getSelectedNum: () => _getSelectedNum(container),
    updateHintButton: () => _updateHintButton(container),
  };
}

// ── Timer ────────────────────────────────────────────────────

let _timerStart = null;
let _timerRAF = null;
let _timerInterval = null;
let _urgentStarted = false;

function _startTimer(container, onExpire) {
  _timerStart = performance.now();
  _urgentStarted = false;

  const bar = container.querySelector('#timer-bar');
  const num = container.querySelector('#timer-number');

  const tick = () => {
    const elapsed = performance.now() - _timerStart;
    const remaining = Math.max(0, TIME_LIMIT_MS - elapsed);
    const fraction = remaining / TIME_LIMIT_MS;
    const seconds = Math.ceil(remaining / 1000);

    if (bar) {
      bar.style.width = `${fraction * 100}%`;
      bar.className = 'game-timer-bar' + (
        fraction <= 0.33 ? ' game-timer-bar--danger' :
        fraction <= 0.67 ? ' game-timer-bar--warning' : ''
      );
    }

    if (num) num.textContent = seconds;

    if (remaining > 0 && seconds <= 5 && !_urgentStarted) {
      _urgentStarted = true;
    }

    if (remaining <= 0) {
      _stopTimer(container);
      onExpire?.();
      return;
    }

    _timerRAF = requestAnimationFrame(tick);
  };

  // Tick sound on each second
  _timerInterval = setInterval(() => {
    const elapsed = performance.now() - _timerStart;
    const remaining = TIME_LIMIT_MS - elapsed;
    const seconds = Math.ceil(remaining / 1000);

    if (seconds <= 5 && seconds > 0) {
      sfxUrgent();
    } else if (seconds <= 10 && seconds > 5) {
      sfxTick();
    }
  }, 1000);

  _timerRAF = requestAnimationFrame(tick);
}

function _stopTimer(container) {
  if (_timerRAF) { cancelAnimationFrame(_timerRAF); _timerRAF = null; }
  if (_timerInterval) { clearInterval(_timerInterval); _timerInterval = null; }

  const bar = container.querySelector('#timer-bar');
  if (bar) bar.style.transition = 'none';
}

// ── Attempt Dots ─────────────────────────────────────────────

function _markAttempt(container, index, result) {
  const dot = container.querySelector(`#dot-${index}`);
  if (!dot) return;

  dot.classList.remove('attempt-dot--pending', 'attempt-dot--correct', 'attempt-dot--wrong');
  dot.classList.add(result === 'correct' ? 'attempt-dot--correct' : 'attempt-dot--wrong');
  dot.setAttribute('aria-label', `Attempt ${index + 1}: ${result}`);
  dot.classList.add('anim-pop');
  dot.addEventListener('animationend', () => dot.classList.remove('anim-pop'), { once: true });
}

// ── Hint Display ─────────────────────────────────────────────

function _showHint(container, text) {
  const area = container.querySelector('#hint-area');
  const el = container.querySelector('#hint-text');
  if (!el) return;

  el.textContent = text;
  area.classList.add('hint-area--visible');
}

// ── Selection ────────────────────────────────────────────────

function _resetSelection(container) {
  const display = container.querySelector('#selected-num');
  if (display) display.textContent = '?';

  container.querySelectorAll('.numpad-btn').forEach((btn) => {
    btn.classList.remove('numpad-btn--selected');
    btn.setAttribute('aria-pressed', 'false');
  });

  const submitBtn = container.querySelector('#submit-btn');
  if (submitBtn) submitBtn.disabled = true;
}

function _getSelectedNum(container) {
  const selected = container.querySelector('.numpad-btn--selected');
  return selected ? parseInt(selected.dataset.num, 10) : null;
}

function _shakeNumpad(container) {
  const numpad = container.querySelector('#numpad');
  if (!numpad) return;
  numpad.classList.remove('anim-shake');
  // Trigger reflow
  void numpad.offsetWidth;
  numpad.classList.add('anim-shake');
  numpad.addEventListener('animationend', () => numpad.classList.remove('anim-shake'), { once: true });
}

// ── Hint Button ──────────────────────────────────────────────

function _updateHintButton(container) {
  const btn = container.querySelector('#hint-btn');
  const countBadge = container.querySelector('#hint-count');
  const hintsOwned = getNumber('hints_owned', 0);

  if (!btn) return;

  if (hintsOwned > 0 && countBadge) {
    countBadge.textContent = `×${hintsOwned}`;
    countBadge.style.display = 'inline';
  } else if (countBadge) {
    countBadge.style.display = 'none';
  }
}

// ── Events ───────────────────────────────────────────────────

function _bindEvents(container, { onSubmit, onUseHint, onBack }) {
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action], [data-num]');
    if (!btn) return;

    if (btn.dataset.num !== undefined) {
      const num = parseInt(btn.dataset.num, 10);
      sfxSelect();

      // Update selection
      container.querySelectorAll('.numpad-btn').forEach((b) => {
        b.classList.remove('numpad-btn--selected');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('numpad-btn--selected');
      btn.setAttribute('aria-pressed', 'true');

      const display = container.querySelector('#selected-num');
      if (display) display.textContent = String(num);

      const submitBtn = container.querySelector('#submit-btn');
      if (submitBtn) submitBtn.disabled = false;

    } else if (btn.dataset.action === 'submit') {
      sfxClick();
      const num = _getSelectedNum(container);
      if (num !== null) onSubmit?.(num);

    } else if (btn.dataset.action === 'hint') {
      sfxClick();
      onUseHint?.();

    } else if (btn.dataset.action === 'back') {
      sfxNav();
      onBack?.();
    }
  });
}

// ── Helpers ──────────────────────────────────────────────────

function _modeLabelHtml(mode, matchInfo) {
  if (mode === 'daily' && matchInfo) {
    return `<span class="game-mode-badge game-mode-badge--daily">
      Match ${matchInfo.current} / ${matchInfo.total}
    </span>`;
  }
  if (mode === 'quick') {
    return `<span class="game-mode-badge game-mode-badge--quick">Quick Play</span>`;
  }
  if (mode === 'friend') {
    return `<span class="game-mode-badge game-mode-badge--friend">Friend Challenge</span>`;
  }
  return '';
}

function _themeClass() {
  const theme = getString('numpad_theme', 'default');
  return theme === 'default' ? '' : `numpad-theme-${theme}`;
}

function sfxNav() {
  // Reuse sfxClick for back navigation
  sfxClick();
}

// ── Styles ───────────────────────────────────────────────────

function _applyStyles(container) {
  if (document.getElementById('game-screen-styles')) return;

  const style = document.createElement('style');
  style.id = 'game-screen-styles';
  style.textContent = `
    .game-screen {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      gap: var(--space-4);
      padding-top: var(--space-3);
    }

    /* ── Top Bar ── */
    .game-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }

    .game-topbar-spacer { width: 44px; }

    .game-mode-badge {
      font-family: var(--font-display);
      font-size: var(--text-sm);
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-full);
    }

    .game-mode-badge--daily  { background: var(--color-brand-700); color: var(--color-brand-200); }
    .game-mode-badge--quick  { background: var(--color-green-600); color: var(--color-green-100); }
    .game-mode-badge--friend { background: var(--color-orange-500); color: var(--color-white); }

    /* ── Attempt Dots ── */
    .game-attempts {
      display: flex;
      gap: var(--space-4);
      justify-content: center;
    }

    .attempt-dot {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      transition: all var(--duration-slow) var(--ease-bounce);
    }

    .attempt-dot--pending  { background: var(--color-attempt-pending); opacity: 0.35; }
    .attempt-dot--correct  { background: var(--color-attempt-correct); box-shadow: 0 0 10px var(--color-green-400); }
    .attempt-dot--wrong    { background: var(--color-attempt-wrong); box-shadow: 0 0 10px var(--color-red-400); }

    /* ── Hint Area ── */
    .game-hint-area {
      min-height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .game-hint-text {
      font-family: var(--font-display);
      font-size: var(--text-xl);
      color: var(--color-gold-300);
      letter-spacing: 0.04em;
    }

    .hint-area--visible .game-hint-text {
      animation: slideUp var(--duration-slow) var(--ease-out-expo);
    }

    /* ── Timer ── */
    .game-timer-container {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      width: 100%;
    }

    .game-timer-bar-track {
      flex: 1;
      height: 8px;
      background: var(--color-border);
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .game-timer-bar {
      height: 100%;
      background: var(--color-timer-safe);
      border-radius: var(--radius-full);
      transition: width 0.1s linear, background var(--duration-normal);
      width: 100%;
    }

    .game-timer-bar--warning { background: var(--color-timer-warning); }
    .game-timer-bar--danger  {
      background: var(--color-timer-danger);
      animation: pulseGlow 0.5s ease-in-out infinite alternate;
    }

    .game-timer-number {
      font-family: var(--font-display);
      font-size: var(--text-lg);
      color: var(--color-text-secondary);
      min-width: 28px;
      text-align: right;
    }

    /* ── Selected Number Display ── */
    .game-selected-display {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .game-selected-number {
      font-family: var(--font-display);
      font-size: var(--text-6xl);
      color: var(--color-text-primary);
      line-height: 1;
      text-shadow: 0 0 30px rgba(77,119,224,0.4);
      transition: all var(--duration-fast) var(--ease-bounce);
      min-width: 80px;
      text-align: center;
    }

    /* ── Numpad ── */
    .game-numpad {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-3);
      width: 100%;
      max-width: 320px;
    }

    .numpad-btn {
      aspect-ratio: 1.2;
      border-radius: var(--radius-lg);
      background: linear-gradient(180deg, var(--color-numpad-default-bg) 0%, color-mix(in srgb, var(--color-numpad-default-bg), black 20%) 100%);
      color: var(--color-white);
      font-family: var(--font-display);
      font-size: var(--text-2xl);
      border: 1px solid rgba(255,255,255,0.12);
      box-shadow: var(--shadow-btn);
      transition:
        transform var(--duration-fast) var(--ease-bounce),
        box-shadow var(--duration-fast),
        background var(--duration-fast);
      cursor: pointer;
      position: relative;
      top: 0;
    }

    .numpad-btn:active,
    .numpad-btn--selected {
      transform: translateY(3px);
      box-shadow: var(--shadow-btn-pressed);
      top: 3px;
    }

    .numpad-btn--selected {
      background: linear-gradient(180deg, var(--color-numpad-default-selected) 0%, color-mix(in srgb, var(--color-numpad-default-selected), black 25%) 100%);
      color: var(--color-brand-900);
    }

    /* Fire theme */
    .numpad-theme-fire .numpad-btn {
      background: linear-gradient(180deg, var(--color-numpad-fire-bg) 0%, var(--color-numpad-fire-shadow) 100%);
    }
    .numpad-theme-fire .numpad-btn--selected {
      background: linear-gradient(180deg, var(--color-numpad-fire-selected) 0%, color-mix(in srgb, var(--color-numpad-fire-selected), black 20%) 100%);
      color: var(--color-brand-900);
    }

    /* Purple theme */
    .numpad-theme-purple .numpad-btn {
      background: linear-gradient(180deg, var(--color-numpad-purple-bg) 0%, var(--color-numpad-purple-shadow) 100%);
    }
    .numpad-theme-purple .numpad-btn--selected {
      background: linear-gradient(180deg, var(--color-numpad-purple-selected) 0%, color-mix(in srgb, var(--color-numpad-purple-selected), black 20%) 100%);
      color: var(--color-brand-900);
    }

    /* Gold theme */
    .numpad-theme-gold .numpad-btn {
      background: linear-gradient(180deg, var(--color-numpad-gold-bg) 0%, var(--color-numpad-gold-shadow) 100%);
    }
    .numpad-theme-gold .numpad-btn--selected {
      background: linear-gradient(180deg, white 0%, var(--color-gray-200) 100%);
      color: var(--color-brand-900);
    }

    /* ── Action Buttons ── */
    .game-actions {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: var(--space-3);
      width: 100%;
      max-width: 320px;
    }

    .game-hint-btn { font-size: var(--text-base); position: relative; }

    .hint-count-badge {
      background: var(--color-brand-900);
      color: var(--color-gold-300);
      font-size: 11px;
      padding: 1px 5px;
      border-radius: var(--radius-full);
      margin-left: var(--space-1);
      font-weight: var(--font-bold);
    }

    .game-submit-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  `;
  document.head.appendChild(style);
}
