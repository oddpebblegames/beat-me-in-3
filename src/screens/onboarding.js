/**
 * Onboarding Tutorial — Beat Me in 3
 *
 * 3-step first-run tutorial shown to new players.
 * Steps:
 *   1. The core mechanic — guess a digit 0–9
 *   2. The timer — 15 seconds per attempt
 *   3. The streak — come back every day
 *
 * Completed state is persisted so it never shows again.
 */

import { getBool, set } from '../state/store.js';
import { sfxClick, sfxNav } from '../audio/sfx.js';

const STEPS = [
  {
    emoji: '🔢',
    title: 'Guess the Number',
    body: "A secret number (0–9) is hidden. You have 3 tries to find it. After each wrong guess, you'll get a hint: go Higher or Lower.",
    cta: 'Got it!',
  },
  {
    emoji: '⏱️',
    title: 'Beat the Clock',
    body: "You have 15 seconds per guess. The timer bar turns red when time is running out. Run out of time? That counts as a wrong guess.",
    cta: 'Understood!',
  },
  {
    emoji: '🔥',
    title: 'Build Your Streak',
    body: "Play the Daily Challenge every day to build your streak. Compete on the global leaderboard and challenge friends to beat your score.",
    cta: "Let's Play!",
  },
];

export function needsOnboarding() {
  return !getBool('onboarded', false);
}

export function renderOnboarding(container, { onComplete }) {
  let step = 0;

  const render = () => {
    const s = STEPS[step];
    const isLast = step === STEPS.length - 1;

    container.innerHTML = `
      <div class="onboard-screen">
        <div class="onboard-skip-row">
          <button class="onboard-skip" data-action="skip">Skip</button>
        </div>

        <div class="onboard-content">
          <div class="onboard-emoji" role="img" aria-label="${s.title}">${s.emoji}</div>
          <h1 class="onboard-title">${s.title}</h1>
          <p class="onboard-body">${s.body}</p>
        </div>

        <div class="onboard-dots" role="tablist" aria-label="Tutorial progress">
          ${STEPS.map((_, i) => `
            <div class="onboard-dot ${i === step ? 'onboard-dot--active' : ''}"
                 role="tab"
                 aria-selected="${i === step}"
                 aria-label="Step ${i + 1} of ${STEPS.length}">
            </div>
          `).join('')}
        </div>

        <button class="btn btn-${isLast ? 'gold' : 'primary'} btn-lg onboard-cta" data-action="next">
          ${s.cta}
        </button>
      </div>
    `;

    _applyStyles(container);
    _bindEvents(container, { onNext, onSkip });
  };

  const onNext = () => {
    sfxNav();
    if (step < STEPS.length - 1) {
      step++;
      render();
    } else {
      _complete(onComplete);
    }
  };

  const onSkip = () => {
    sfxClick();
    _complete(onComplete);
  };

  render();
}

function _complete(onComplete) {
  set('onboarded', true);
  onComplete?.();
}

function _bindEvents(container, { onNext, onSkip }) {
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'next') onNext();
    else if (btn.dataset.action === 'skip') onSkip();
  });
}

function _applyStyles(container) {
  if (document.getElementById('onboard-styles')) return;

  const style = document.createElement('style');
  style.id = 'onboard-styles';
  style.textContent = `
    .onboard-screen {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      min-height: 80vh;
      padding: var(--space-6) var(--space-5);
      gap: var(--space-6);
    }

    .onboard-skip-row {
      display: flex;
      justify-content: flex-end;
      width: 100%;
    }

    .onboard-skip {
      font-family: var(--font-body);
      font-size: var(--text-sm);
      color: var(--color-text-muted);
      background: none;
      border: none;
      cursor: pointer;
      padding: var(--space-2) var(--space-3);
    }

    .onboard-skip:hover { color: var(--color-text-secondary); }

    .onboard-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-5);
      flex: 1;
      justify-content: center;
      text-align: center;
    }

    .onboard-emoji {
      font-size: 72px;
      line-height: 1;
      animation: pop var(--duration-slow) var(--ease-bounce);
    }

    .onboard-title {
      font-family: var(--font-display);
      font-size: var(--text-3xl);
      color: var(--color-text-primary);
    }

    .onboard-body {
      font-size: var(--text-md);
      color: var(--color-text-secondary);
      line-height: var(--leading-relaxed);
      max-width: 320px;
    }

    .onboard-dots {
      display: flex;
      gap: var(--space-2);
      justify-content: center;
    }

    .onboard-dot {
      width: 8px;
      height: 8px;
      border-radius: var(--radius-full);
      background: var(--color-border-strong);
      transition: all var(--duration-normal) var(--ease-out-expo);
    }

    .onboard-dot--active {
      width: 24px;
      background: var(--color-brand-400);
    }

    .onboard-cta {
      animation: slideUp var(--duration-slower) var(--ease-out-expo);
    }
  `;
  document.head.appendChild(style);
}
