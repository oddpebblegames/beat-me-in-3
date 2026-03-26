/**
 * Countdown Animation — Beat Me in 3
 *
 * Shows "3 → 2 → 1 → Go!" overlaid on the game screen.
 * Each number animates in with a scale-pop and fades out.
 * Fires callback when complete.
 */

import { sfxCountdown } from '../audio/sfx.js';

/**
 * Run the 3-2-1-Go! countdown.
 *
 * @param {HTMLElement} container  Element to append the overlay into
 * @param {() => void} onComplete  Called after "Go!" animates out
 * @returns {() => void}  Cancel function (clears overlay immediately)
 */
export function runCountdown(container, onComplete) {
  const overlay = document.createElement('div');
  overlay.className = 'countdown-overlay';
  overlay.setAttribute('aria-live', 'assertive');
  overlay.setAttribute('aria-atomic', 'true');
  container.appendChild(overlay);

  _injectStyles();

  const steps = [3, 2, 1, 0]; // 0 = "Go!"
  let stepIndex = 0;
  let cancelled = false;
  let timeoutId = null;

  const showNext = () => {
    if (cancelled) return;

    if (stepIndex >= steps.length) {
      // All done — remove overlay and fire callback
      overlay.classList.add('countdown-overlay--out');
      timeoutId = setTimeout(() => {
        overlay.remove();
        if (!cancelled) onComplete?.();
      }, 300);
      return;
    }

    const n = steps[stepIndex];
    const label = n === 0 ? 'Go!' : String(n);

    overlay.innerHTML = `<div class="countdown-number countdown-number--in">${label}</div>`;
    overlay.setAttribute('aria-label', label);
    sfxCountdown(n);

    const el = overlay.querySelector('.countdown-number');
    // Trigger out animation after hold duration
    timeoutId = setTimeout(() => {
      if (!cancelled && el) {
        el.classList.remove('countdown-number--in');
        el.classList.add('countdown-number--out');
      }
    }, n === 0 ? 400 : 600);

    // Move to next step after animation
    timeoutId = setTimeout(() => {
      stepIndex++;
      showNext();
    }, n === 0 ? 700 : 900);
  };

  showNext();

  return () => {
    cancelled = true;
    if (timeoutId) clearTimeout(timeoutId);
    overlay.remove();
  };
}

function _injectStyles() {
  if (document.getElementById('countdown-styles')) return;

  const style = document.createElement('style');
  style.id = 'countdown-styles';
  style.textContent = `
    .countdown-overlay {
      position: fixed;
      inset: 0;
      z-index: var(--z-modal);
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(4, 14, 46, 0.75);
      backdrop-filter: blur(4px);
      pointer-events: none;
    }

    .countdown-overlay--out {
      animation: fadeOut var(--duration-slow) var(--ease-in-out) forwards;
    }

    .countdown-number {
      font-family: var(--font-display);
      font-size: 140px;
      line-height: 1;
      color: var(--color-white);
      text-shadow:
        0 0 40px rgba(77,119,224,0.6),
        0 4px 20px rgba(0,0,0,0.5);
      will-change: transform, opacity;
    }

    .countdown-number--in {
      animation: countdownIn 0.35s var(--ease-bounce) forwards;
    }

    .countdown-number--out {
      animation: countdownOut 0.3s var(--ease-in-out) forwards;
    }

    @keyframes countdownIn {
      from { transform: scale(2); opacity: 0; }
      to   { transform: scale(1); opacity: 1; }
    }

    @keyframes countdownOut {
      from { transform: scale(1);    opacity: 1; }
      to   { transform: scale(0.5);  opacity: 0; }
    }

    @keyframes fadeOut {
      from { opacity: 1; }
      to   { opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}
