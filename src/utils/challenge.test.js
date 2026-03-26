/**
 * Friend Challenge URL Tests — Beat Me in 3
 */

import { describe, it, expect } from 'vitest';
import { encode, decode, buildChallengeUrl, extractFromUrl } from './challenge.js';

const FIXED_NOW = 1_700_000_000_000; // fixed timestamp for tests
const TTL = 24 * 60 * 60 * 1000;    // 24h in ms

describe('encode()', () => {
  it('returns a non-empty string', () => {
    expect(encode(5, FIXED_NOW)).toBeTruthy();
    expect(typeof encode(5, FIXED_NOW)).toBe('string');
  });

  it('is URL-safe (no +, /, or =)', () => {
    for (let n = 0; n <= 9; n++) {
      const token = encode(n, FIXED_NOW);
      expect(token).not.toContain('+');
      expect(token).not.toContain('/');
      expect(token).not.toContain('=');
    }
  });

  it('throws for out-of-range numbers', () => {
    expect(() => encode(-1, FIXED_NOW)).toThrow(RangeError);
    expect(() => encode(10, FIXED_NOW)).toThrow(RangeError);
    expect(() => encode(5.5, FIXED_NOW)).toThrow(RangeError);
  });
});

describe('decode()', () => {
  it('round-trips encode → decode', () => {
    for (let n = 0; n <= 9; n++) {
      const token  = encode(n, FIXED_NOW);
      const result = decode(token, FIXED_NOW);
      expect(result.valid).toBe(true);
      expect(result.number).toBe(n);
    }
  });

  it('returns valid=false for expired token', () => {
    const token  = encode(5, FIXED_NOW);
    const result = decode(token, FIXED_NOW + TTL + 1);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/expired/i);
  });

  it('returns valid=false for malformed token', () => {
    const result = decode('not-valid-base64!!!!');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/malformed/i);
  });

  it('returns valid=false for empty/null token', () => {
    expect(decode(null).valid).toBe(false);
    expect(decode('').valid).toBe(false);
  });

  it('returns valid=false for future timestamp', () => {
    const token  = encode(5, FIXED_NOW + 60_000); // 1min in future
    const result = decode(token, FIXED_NOW);
    expect(result.valid).toBe(false);
  });

  it('accepts token with 1ms left before expiry', () => {
    const token  = encode(5, FIXED_NOW);
    const result = decode(token, FIXED_NOW + TTL - 1);
    expect(result.valid).toBe(true);
  });
});

describe('buildChallengeUrl()', () => {
  it('includes ?c= parameter', () => {
    const url = buildChallengeUrl(7, 'https://example.com/', FIXED_NOW);
    expect(url).toContain('?c=');
  });

  it('decodes back to correct number', () => {
    const url   = buildChallengeUrl(3, 'https://example.com/', FIXED_NOW);
    const token = new URL(url).searchParams.get('c');
    const r     = decode(token, FIXED_NOW);
    expect(r.number).toBe(3);
  });
});

describe('extractFromUrl()', () => {
  it('returns null when no ?c= param', () => {
    expect(extractFromUrl('?foo=bar', FIXED_NOW)).toBeNull();
  });

  it('returns decoded result for valid ?c= param', () => {
    const token  = encode(9, FIXED_NOW);
    const result = extractFromUrl(`?c=${token}`, FIXED_NOW);
    expect(result.valid).toBe(true);
    expect(result.number).toBe(9);
  });

  it('returns expired result for old token', () => {
    const token  = encode(4, FIXED_NOW);
    const result = extractFromUrl(`?c=${token}`, FIXED_NOW + TTL + 1);
    expect(result.valid).toBe(false);
  });
});
