/**
 * Sound Effects — Beat Me in 3
 *
 * All SFX use the Web Audio synthesizer (no audio files).
 * Each function is named after the game event that triggers it.
 * Volumes are normalized to sit in a consistent mix.
 */

import { playTone, playNoise } from './engine.js';

// ── UI SFX ──────────────────────────────────────────────────

/** Button press / UI tap */
export function sfxClick() {
  playTone({ freq: 660, type: 'sine', duration: 0.06, vol: 0.2 });
}

/** Number selected on numpad */
export function sfxSelect() {
  playTone({ freq: 880, type: 'sine', duration: 0.05, vol: 0.18 });
}

/** Screen transition / navigation */
export function sfxNav() {
  playTone({ freq: 440, type: 'sine', duration: 0.08, vol: 0.15, attack: 0.01 });
}

// ── Gameplay SFX ────────────────────────────────────────────

/** Wrong guess — discordant, punchy */
export function sfxWrong() {
  playTone({ freq: 180, type: 'sawtooth', duration: 0.22, vol: 0.25, attack: 0.01, release: 0.12 });
  playTone({ freq: 160, type: 'sawtooth', duration: 0.18, vol: 0.2, delay: 0.03, attack: 0.01, release: 0.1 });
}

/** Correct guess — bright, celebratory arpeggio */
export function sfxWin() {
  const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    playTone({ freq, type: 'sine', duration: 0.2, vol: 0.3, delay: i * 0.08, release: 0.08 });
  });
  // Add harmony chord at the end
  playTone({ freq: 1047, type: 'sine', duration: 0.5, vol: 0.2, delay: 0.32, attack: 0.02, release: 0.2 });
}

/** Game lost — somber descending tone */
export function sfxLose() {
  const notes = [392, 330, 262]; // G4 E4 C4 descending
  notes.forEach((freq, i) => {
    playTone({ freq, type: 'triangle', duration: 0.3, vol: 0.25, delay: i * 0.12, release: 0.15 });
  });
}

/** Timer tick sound — subtle, not annoying */
export function sfxTick() {
  playTone({ freq: 1200, type: 'sine', duration: 0.04, vol: 0.12, release: 0.02 });
}

/** Urgent tick — for final 5 seconds of timer */
export function sfxUrgent() {
  playTone({ freq: 1600, type: 'square', duration: 0.05, vol: 0.18, release: 0.02 });
  playTone({ freq: 800, type: 'square', duration: 0.05, vol: 0.15, delay: 0.02, release: 0.02 });
}

/** Hint revealed — magical shimmer */
export function sfxHint() {
  const freqs = [1047, 1319, 1568, 2093]; // C6 E6 G6 C7
  freqs.forEach((freq, i) => {
    playTone({ freq, type: 'sine', duration: 0.15, vol: 0.15, delay: i * 0.05, release: 0.08 });
  });
}

/** Streak milestone — triumphant fanfare */
export function sfxStreak() {
  const notes = [523, 659, 784, 659, 1047]; // C E G E C8
  notes.forEach((freq, i) => {
    playTone({ freq, type: 'sine', duration: 0.18, vol: 0.28, delay: i * 0.07, release: 0.08 });
  });
}

// ── Crowd SFX (longer, use sparingly) ───────────────────────

/** Win: crowd applause — noise burst shaped like clapping */
export function sfxApplause() {
  // Three waves of applause
  [0, 0.3, 0.7].forEach((delay) => {
    playNoise({ duration: 0.4, vol: 0.18, delay, filterFreq: 5000 });
  });
}

/** Lose: crowd groan — low rumble + descending tone */
export function sfxCrowdGroan() {
  playNoise({ duration: 0.8, vol: 0.12, filterFreq: 300 });
  playTone({ freq: 120, type: 'sawtooth', duration: 0.8, vol: 0.15, release: 0.4 });
  playTone({ freq: 90, type: 'sawtooth', duration: 0.6, vol: 0.1, delay: 0.1, release: 0.3 });
}

/** Countdown beep (3-2-1) */
export function sfxCountdown(n) {
  if (n > 0) {
    playTone({ freq: n === 1 ? 880 : 660, type: 'sine', duration: 0.15, vol: 0.3, release: 0.08 });
  } else {
    // "Go!" — bright ascending chord
    [523, 784, 1047].forEach((f, i) => {
      playTone({ freq: f, type: 'sine', duration: 0.25, vol: 0.28, delay: i * 0.04, release: 0.1 });
    });
  }
}
