/**
 * Background Music Sequencer — Beat Me in 3
 *
 * Procedurally generates a looping melody using the Web Audio engine.
 * No audio files needed — all synthesized at runtime.
 * Designed to be relaxed but upbeat, appropriate for a 30-second game.
 *
 * The melody is a simple 8-note pattern in C major, played with a warm
 * sine wave and a subtle bass line.
 */

import { getCtx, isMuted } from './engine.js';

// ── Melody Definition ────────────────────────────────────────
// Frequencies in C major (C D E G A): relaxed pentatonic feel
const MELODY = [
  { freq: 523, dur: 0.3 },   // C5
  { freq: 659, dur: 0.3 },   // E5
  { freq: 784, dur: 0.3 },   // G5
  { freq: 659, dur: 0.3 },   // E5
  { freq: 880, dur: 0.4 },   // A5
  { freq: 784, dur: 0.2 },   // G5
  { freq: 659, dur: 0.3 },   // E5
  { freq: 523, dur: 0.4 },   // C5 (resolve)
];

const BASS = [
  { freq: 131, dur: 0.6 },   // C3
  { freq: 165, dur: 0.6 },   // E3
  { freq: 196, dur: 0.6 },   // G3
  { freq: 165, dur: 0.6 },   // E3
];

const BEAT_VOL = 0.12;
const BASS_VOL = 0.08;

// ── State ────────────────────────────────────────────────────
let _playing = false;
let _timeoutId = null;
const _scheduleAheadTime = 0.1; // seconds to schedule ahead
let _melodyStep = 0;
let _bassStep = 0;
let _nextNoteTime = 0;
let _activeNodes = [];

// ── Public API ───────────────────────────────────────────────

export function start() {
  if (_playing) return;
  if (isMuted()) return;

  const ctx = getCtx();
  if (!ctx) return;

  _playing = true;
  _melodyStep = 0;
  _bassStep = 0;
  _nextNoteTime = ctx.currentTime + 0.1;

  _schedule();
}

export function stop() {
  _playing = false;
  if (_timeoutId) {
    clearTimeout(_timeoutId);
    _timeoutId = null;
  }
  // Fade out active nodes gracefully
  const ctx = getCtx();
  if (ctx) {
    _activeNodes.forEach(({ gain }) => {
      try {
        gain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
      } catch {
        // Node may already be stopped
      }
    });
  }
  _activeNodes = [];
}

export function isPlaying() {
  return _playing;
}

// ── Scheduling Loop ──────────────────────────────────────────

function _schedule() {
  if (!_playing) return;

  const ctx = getCtx();
  if (!ctx) return;

  // Schedule notes up to _scheduleAheadTime seconds in advance
  while (_nextNoteTime < ctx.currentTime + _scheduleAheadTime) {
    _scheduleMelodyNote();
    _scheduleBassNote();
  }

  // Re-schedule in 50ms
  _timeoutId = setTimeout(_schedule, 50);
}

function _scheduleMelodyNote() {
  const note = MELODY[_melodyStep % MELODY.length];
  _playNote(note.freq, 'sine', note.dur * 0.85, BEAT_VOL, _nextNoteTime, 0.01, 0.08);
  _nextNoteTime += note.dur;
  _melodyStep++;
}

function _scheduleBassNote() {
  // Bass plays at half the melody speed
  if (_melodyStep % 2 === 0) {
    const note = BASS[_bassStep % BASS.length];
    _playNote(note.freq, 'triangle', note.dur * 0.9, BASS_VOL, _nextNoteTime - MELODY[(_melodyStep - 1) % MELODY.length].dur, 0.02, 0.15);
    _bassStep++;
  }
}

function _playNote(freq, type, duration, vol, startTime, attack, release) {
  const ctx = getCtx();
  if (!ctx || isMuted()) return;

  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(vol, startTime + attack);
  gain.gain.setValueAtTime(vol, startTime + duration - release);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);

  _activeNodes.push({ osc, gain });

  // Clean up stopped nodes periodically
  if (_activeNodes.length > 20) {
    _activeNodes = _activeNodes.slice(-10);
  }
}
