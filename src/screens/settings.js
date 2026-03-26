/**
 * Settings Screen — Beat Me in 3
 *
 * Renders settings panel as a bottom sheet modal.
 * Settings: sound toggle, numpad theme selector (4 themes),
 *           notification permission, username change.
 * All preferences persisted to store immediately on change.
 */

import { getBool, getString, set, subscribe } from '../state/store.js';
import { sfxClick } from '../audio/sfx.js';

const THEMES = [
  { id: 'default', label: 'Classic',  preview: ['#6366f1', '#4f46e5'] },
  { id: 'neon',    label: 'Neon',     preview: ['#22d3ee', '#0ea5e9'] },
  { id: 'forest',  label: 'Forest',   preview: ['#4ade80', '#16a34a'] },
  { id: 'fire',    label: 'Fire',     preview: ['#fb923c', '#dc2626'] },
];

let _unsubs = [];

export function renderSettings(overlayEl, { onClose }) {
  const soundOn       = getBool('sound_enabled', true);
  const currentTheme  = getString('numpad_theme', 'default');
  const username      = getString('username', '');

  overlayEl.innerHTML = `
    <div class="modal-sheet settings-sheet" role="dialog" aria-modal="true" aria-label="Settings">
      <div class="modal-handle" aria-hidden="true"></div>

      <div class="settings-header">
        <h2 class="settings-title">⚙️ Settings</h2>
        <button class="btn btn-icon settings-close" data-action="close" aria-label="Close settings">✕</button>
      </div>

      <!-- Username -->
      <section class="settings-section" aria-labelledby="lbl-username">
        <h3 class="settings-section-title" id="lbl-username">Player Name</h3>
        <div class="settings-username-row">
          <input
            id="settings-username-input"
            class="settings-input"
            type="text"
            maxlength="20"
            placeholder="Enter your name…"
            value="${_escapeHtml(username)}"
            aria-label="Player name"
          />
          <button class="btn settings-save-btn" data-action="save-username" aria-label="Save player name">
            Save
          </button>
        </div>
        <p class="settings-hint" id="username-feedback" aria-live="polite"></p>
      </section>

      <!-- Sound -->
      <section class="settings-section" aria-labelledby="lbl-sound">
        <h3 class="settings-section-title" id="lbl-sound">Sound</h3>
        <label class="settings-toggle-row">
          <span class="settings-toggle-label">
            <span class="settings-toggle-icon" aria-hidden="true">${soundOn ? '🔊' : '🔇'}</span>
            <span id="sound-label-text">${soundOn ? 'Sound On' : 'Sound Off'}</span>
          </span>
          <button
            role="switch"
            aria-checked="${soundOn}"
            id="sound-toggle"
            class="toggle-switch ${soundOn ? 'toggle-switch--on' : ''}"
            data-action="toggle-sound"
            aria-label="Toggle sound"
          >
            <span class="toggle-knob" aria-hidden="true"></span>
          </button>
        </label>
      </section>

      <!-- Numpad Theme -->
      <section class="settings-section" aria-labelledby="lbl-theme">
        <h3 class="settings-section-title" id="lbl-theme">Numpad Theme</h3>
        <div class="settings-themes" role="radiogroup" aria-labelledby="lbl-theme">
          ${THEMES.map((t) => `
            <button
              role="radio"
              aria-checked="${t.id === currentTheme}"
              class="theme-chip ${t.id === currentTheme ? 'theme-chip--active' : ''}"
              data-action="set-theme"
              data-theme="${t.id}"
              aria-label="${t.label} theme"
            >
              <span
                class="theme-chip-swatch"
                style="background: linear-gradient(135deg, ${t.preview[0]}, ${t.preview[1]})"
                aria-hidden="true"
              ></span>
              <span class="theme-chip-label">${t.label}</span>
            </button>
          `).join('')}
        </div>
      </section>

      <!-- Notifications -->
      <section class="settings-section" aria-labelledby="lbl-notif">
        <h3 class="settings-section-title" id="lbl-notif">Notifications</h3>
        <div class="settings-notif-row">
          <div class="settings-notif-info">
            <span class="settings-toggle-icon" aria-hidden="true">🔔</span>
            <div>
              <span class="settings-notif-title">Daily Reminder</span>
              <p class="settings-hint">Get notified when the daily challenge resets.</p>
            </div>
          </div>
          <button
            id="notif-btn"
            class="btn settings-notif-btn"
            data-action="request-notifications"
            aria-label="Enable daily notifications"
          >
            ${_notifButtonLabel()}
          </button>
        </div>
        <p class="settings-hint" id="notif-feedback" aria-live="polite"></p>
      </section>

    </div>
  `;

  _applySettingsStyles(overlayEl);
  _bindEvents(overlayEl, { onClose });
}

export function destroySettings() {
  _unsubs.forEach((fn) => fn());
  _unsubs = [];
}

// ── Internals ────────────────────────────────────────────────

function _bindEvents(overlayEl, { onClose }) {
  overlayEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;

    if (action === 'close') {
      sfxClick();
      onClose?.();
      return;
    }

    if (action === 'toggle-sound') {
      sfxClick();
      const nowOn = !getBool('sound_enabled', true);
      set('sound_enabled', nowOn);
      btn.setAttribute('aria-checked', String(nowOn));
      btn.classList.toggle('toggle-switch--on', nowOn);
      const iconEl  = btn.closest('.settings-toggle-row')?.querySelector('.settings-toggle-icon');
      const labelEl = btn.closest('.settings-toggle-row')?.querySelector('#sound-label-text');
      if (iconEl)  iconEl.textContent  = nowOn ? '🔊' : '🔇';
      if (labelEl) labelEl.textContent = nowOn ? 'Sound On' : 'Sound Off';
      return;
    }

    if (action === 'set-theme') {
      sfxClick();
      const themeId = btn.dataset.theme;
      set('numpad_theme', themeId);
      overlayEl.querySelectorAll('[data-action="set-theme"]').forEach((el) => {
        const active = el.dataset.theme === themeId;
        el.classList.toggle('theme-chip--active', active);
        el.setAttribute('aria-checked', String(active));
      });
      return;
    }

    if (action === 'save-username') {
      sfxClick();
      const input    = overlayEl.querySelector('#settings-username-input');
      const feedback = overlayEl.querySelector('#username-feedback');
      const raw      = input?.value.trim() ?? '';

      if (!raw) {
        if (feedback) { feedback.textContent = 'Name cannot be empty.'; feedback.className = 'settings-hint settings-hint--error'; }
        return;
      }
      if (raw.length > 20) {
        if (feedback) { feedback.textContent = 'Max 20 characters.'; feedback.className = 'settings-hint settings-hint--error'; }
        return;
      }

      set('username', raw);
      if (feedback) { feedback.textContent = 'Saved!'; feedback.className = 'settings-hint settings-hint--success'; }
      setTimeout(() => { if (feedback) feedback.textContent = ''; }, 2000);
      return;
    }

    if (action === 'request-notifications') {
      sfxClick();
      await _requestNotifications(overlayEl);
      return;
    }
  });

  // Close on backdrop click
  overlayEl.addEventListener('click', (e) => {
    if (e.target === overlayEl) onClose?.();
  });
}

async function _requestNotifications(overlayEl) {
  const btn      = overlayEl.querySelector('#notif-btn');
  const feedback = overlayEl.querySelector('#notif-feedback');

  if (!('Notification' in window)) {
    if (feedback) { feedback.textContent = 'Notifications not supported in this browser.'; feedback.className = 'settings-hint settings-hint--error'; }
    return;
  }

  const current = Notification.permission;
  if (current === 'granted') {
    if (feedback) { feedback.textContent = 'Notifications already enabled!'; feedback.className = 'settings-hint settings-hint--success'; }
    return;
  }
  if (current === 'denied') {
    if (feedback) { feedback.textContent = 'Notifications blocked — please enable them in browser settings.'; feedback.className = 'settings-hint settings-hint--error'; }
    return;
  }

  try {
    const result = await Notification.requestPermission();
    set('notifications_enabled', result === 'granted');
    if (result === 'granted') {
      if (btn)      btn.textContent  = 'Enabled ✓';
      if (feedback) { feedback.textContent = 'You'll be reminded daily!'; feedback.className = 'settings-hint settings-hint--success'; }
    } else {
      if (feedback) { feedback.textContent = 'Permission denied.'; feedback.className = 'settings-hint settings-hint--error'; }
    }
  } catch {
    if (feedback) { feedback.textContent = 'Could not request permission.'; feedback.className = 'settings-hint settings-hint--error'; }
  }
}

function _notifButtonLabel() {
  if (!('Notification' in window)) return 'Not Supported';
  if (Notification.permission === 'granted') return 'Enabled ✓';
  if (Notification.permission === 'denied')  return 'Blocked';
  return 'Enable';
}

function _escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function _applySettingsStyles(overlayEl) {
  if (document.getElementById('settings-screen-styles')) return;

  const style = document.createElement('style');
  style.id = 'settings-screen-styles';
  style.textContent = `
    .settings-sheet {
      display: flex;
      flex-direction: column;
      gap: var(--space-5);
      padding-bottom: var(--space-6);
    }

    .settings-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .settings-title {
      font-family: var(--font-display);
      font-size: var(--text-xl);
      color: var(--color-text-primary);
      margin: 0;
    }

    .settings-section {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .settings-section-title {
      font-family: var(--font-display);
      font-size: var(--text-sm);
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin: 0;
    }

    .settings-username-row {
      display: flex;
      gap: var(--space-3);
    }

    .settings-input {
      flex: 1;
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      color: var(--color-text-primary);
      font-family: var(--font-body);
      font-size: var(--text-base);
      padding: var(--space-3) var(--space-4);
      outline: none;
      transition: border-color var(--duration-fast);
    }

    .settings-input:focus {
      border-color: var(--color-brand-500);
    }

    .settings-save-btn {
      background: var(--color-brand-500);
      color: var(--color-white);
      border: none;
      border-radius: var(--radius-md);
      padding: var(--space-3) var(--space-5);
      font-family: var(--font-display);
      font-size: var(--text-sm);
      cursor: pointer;
      transition: filter var(--duration-fast);
      white-space: nowrap;
    }

    .settings-save-btn:hover { filter: brightness(1.1); }
    .settings-save-btn:active { filter: brightness(0.9); }

    .settings-hint {
      font-size: var(--text-xs);
      color: var(--color-text-muted);
      margin: 0;
      min-height: 1em;
    }

    .settings-hint--error   { color: var(--color-red-400);   }
    .settings-hint--success { color: var(--color-green-400); }

    /* Toggle */
    .settings-toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-4) var(--space-5);
      cursor: pointer;
      user-select: none;
    }

    .settings-toggle-label {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      font-size: var(--text-base);
      color: var(--color-text-primary);
    }

    .settings-toggle-icon { font-size: var(--text-xl); }

    .toggle-switch {
      position: relative;
      width: 48px;
      height: 28px;
      border-radius: var(--radius-full);
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border);
      cursor: pointer;
      transition: background var(--duration-fast), border-color var(--duration-fast);
      flex-shrink: 0;
    }

    .toggle-switch--on {
      background: var(--color-brand-500);
      border-color: var(--color-brand-500);
    }

    .toggle-knob {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--color-white);
      transition: transform var(--duration-fast) var(--ease-out-expo);
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      pointer-events: none;
    }

    .toggle-switch--on .toggle-knob {
      transform: translateX(20px);
    }

    /* Theme chips */
    .settings-themes {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-3);
    }

    .theme-chip {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-2);
      background: var(--color-bg-card);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition:
        border-color var(--duration-fast),
        transform var(--duration-fast);
    }

    .theme-chip--active {
      border-color: var(--color-brand-500);
    }

    .theme-chip:active { transform: scale(0.95); }

    .theme-chip-swatch {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      display: block;
    }

    .theme-chip-label {
      font-size: 11px;
      color: var(--color-text-secondary);
      text-align: center;
    }

    .theme-chip--active .theme-chip-label {
      color: var(--color-brand-400);
    }

    /* Notifications row */
    .settings-notif-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-4) var(--space-5);
      gap: var(--space-4);
    }

    .settings-notif-info {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3);
      flex: 1;
    }

    .settings-notif-title {
      font-size: var(--text-base);
      color: var(--color-text-primary);
      display: block;
    }

    .settings-notif-btn {
      background: var(--color-brand-500);
      color: var(--color-white);
      border: none;
      border-radius: var(--radius-md);
      padding: var(--space-2) var(--space-4);
      font-family: var(--font-display);
      font-size: var(--text-sm);
      cursor: pointer;
      white-space: nowrap;
      transition: filter var(--duration-fast);
    }

    .settings-notif-btn:hover { filter: brightness(1.1); }
  `;
  document.head.appendChild(style);
}
