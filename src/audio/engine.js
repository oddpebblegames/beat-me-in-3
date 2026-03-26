/**
 * Web Audio Engine — Beat Me in 3
 *
 * Provides a lazy-loaded, singleton AudioContext with warm-up support.
 * All audio operations go through this module.
 *
 * Mobile browsers require a user gesture before AudioContext can
 * produce sound. We warm up on first user interaction.
 */

import { getBool } from '../state/store.js';

let _ctx = null;
let _masterGain = null;
let _warmedUp = false;

/**
 * Get (or create) the AudioContext.
 * Automatically resumes if suspended.
 * @returns {AudioContext | null}  null if Web Audio is unavailable
 */
export function getCtx() {
  if (typeof AudioContext === 'undefined' && typeof webkitAudioContext === 'undefined') {
    return null;
  }

  if (!_ctx) {
    const Ctor = window.AudioContext ?? window.webkitAudioContext;
    _ctx = new Ctor();

    // Master gain node — controls global volume
    _masterGain = _ctx.createGain();
    _masterGain.gain.value = isMuted() ? 0 : 0.7;
    _masterGain.connect(_ctx.destination);
  }

  // Resume if suspended (Chrome autoplay policy)
  if (_ctx.state === 'suspended') {
    _ctx.resume().catch(() => {});
  }

  return _ctx;
}

/**
 * Warm up the AudioContext. Must be called from a user gesture handler.
 * Safe to call multiple times.
 */
export function warmUp() {
  if (_warmedUp) return;
  const ctx = getCtx();
  if (!ctx) return;

  // Play a silent buffer to unlock audio on iOS
  const buf = ctx.createBuffer(1, 1, ctx.sampleRate);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(ctx.destination);
  src.start(0);
  _warmedUp = true;
}

/**
 * Synthesize and play a tone.
 *
 * @param {object} opts
 * @param {number} opts.freq       Frequency in Hz
 * @param {string} [opts.type]     OscillatorType: 'sine'|'square'|'sawtooth'|'triangle'
 * @param {number} [opts.duration] Duration in seconds (default 0.1)
 * @param {number} [opts.vol]      Volume 0–1 (default 0.3)
 * @param {number} [opts.delay]    Delay before start in seconds (default 0)
 * @param {number} [opts.attack]   Attack time in seconds (default 0.005)
 * @param {number} [opts.release]  Release time in seconds (default 0.05)
 */
export function playTone({
  freq,
  type = 'sine',
  duration = 0.1,
  vol = 0.3,
  delay = 0,
  attack = 0.005,
  release = 0.05,
}) {
  if (isMuted()) return;
  const ctx = getCtx();
  if (!ctx) return;

  const t = ctx.currentTime + delay;

  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(vol, t + attack);
  gain.gain.setValueAtTime(vol, t + duration - release);
  gain.gain.linearRampToValueAtTime(0, t + duration);

  osc.connect(gain);
  gain.connect(_masterGain ?? ctx.destination);

  osc.start(t);
  osc.stop(t + duration + 0.01);
}

/**
 * Play a noise burst (for applause/crowd effects).
 * @param {object} opts
 * @param {number} [opts.duration]
 * @param {number} [opts.vol]
 * @param {number} [opts.delay]
 * @param {number} [opts.filterFreq]  Low-pass cutoff Hz
 */
export function playNoise({ duration = 0.3, vol = 0.15, delay = 0, filterFreq = 4000 }) {
  if (isMuted()) return;
  const ctx = getCtx();
  if (!ctx) return;

  const bufferSize = Math.ceil(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const t = ctx.currentTime + delay;
  const src = ctx.createBufferSource();
  src.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(_masterGain ?? ctx.destination);

  src.start(t);
  src.stop(t + duration + 0.01);
}

/**
 * Mute/unmute all audio.
 */
export function setMuted(muted) {
  if (_masterGain) {
    _masterGain.gain.setTargetAtTime(muted ? 0 : 0.7, getCtx().currentTime, 0.05);
  }
}

export function isMuted() {
  return getBool('sound_muted', false);
}
