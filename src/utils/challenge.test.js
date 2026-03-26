import { describe, it, expect } from 'vitest';
import { encode, decode, buildChallengeUrl, extractFromUrl } from './challenge.js';

const NOW = Date.UTC(2024, 2, 15, 12, 0, 0);
const ONE_HOUR = 60 * 60 * 1000;
const TWENTY_FIVE_HOURS = 25 * ONE_HOUR;

describe('encode', () => {
  it('returns a non-empty string', () => {
    const token = encode(5, NOW);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('produces URL-safe base64 (no +, /, =)', () => {
    for (let n = 0; n <= 9; n++) {
      const token = encode(n, NOW);
      expect(token).not.toMatch(/[+/=]/);
    }
  });

  it('throws RangeError for number < 0', () => {
    expect(() => encode(-1, NOW)).toThrow(RangeError);
  });

  it('throws RangeError for number > 9', () => {
    expect(() => encode(10, NOW)).toThrow(RangeError);
  });

  it('throws RangeError for non-integer', () => {
    expect(() => encode(5.5, NOW)).toThrow(RangeError);
  });

  it('encodes all digits 0–9', () => {
    for (let n = 0; n <= 9; n++) {
      expect(() => encode(n, NOW)).not.toThrow();
    }
  });
});

describe('decode: valid tokens', () => {
  it('decodes a freshly encoded token', () => {
    const token = encode(7, NOW);
    const result = decode(token, NOW);
    expect(result.valid).toBe(true);
    expect(result.number).toBe(7);
    expect(result.timestamp).toBe(NOW);
  });

  it('decodes all digits correctly', () => {
    for (let n = 0; n <= 9; n++) {
      const token = encode(n, NOW);
      const result = decode(token, NOW);
      expect(result.number).toBe(n);
      expect(result.valid).toBe(true);
    }
  });

  it('is valid when decoded 23 hours later', () => {
    const token = encode(5, NOW);
    const result = decode(token, NOW + 23 * ONE_HOUR);
    expect(result.valid).toBe(true);
  });
});

describe('decode: expired tokens', () => {
  it('is invalid after 25 hours', () => {
    const token = encode(5, NOW);
    const result = decode(token, NOW + TWENTY_FIVE_HOURS);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('expired');
    expect(result.number).toBe(5); // number still returned even on expiry
  });
});

describe('decode: malformed tokens', () => {
  it('handles null/undefined gracefully', () => {
    expect(decode(null).valid).toBe(false);
    expect(decode(undefined).valid).toBe(false);
    expect(decode('').valid).toBe(false);
  });

  it('handles garbage strings', () => {
    expect(decode('not-valid-base64!!!').valid).toBe(false);
    expect(decode('aGVsbG8=').valid).toBe(false); // base64 of "hello" — no n/t fields
  });

  it('rejects future-dated tokens', () => {
    const futureToken = encode(5, NOW + 2 * ONE_HOUR);
    const result = decode(futureToken, NOW);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('future');
  });
});

describe('buildChallengeUrl', () => {
  it('produces a URL with ?c= parameter', () => {
    const url = buildChallengeUrl(3, 'https://example.com/game/', NOW);
    expect(url).toContain('?c=');
    expect(url).toContain('https://example.com/game/');
  });

  it('produced URL decodes correctly', () => {
    const url = buildChallengeUrl(6, 'https://example.com/game/', NOW);
    const params = new URLSearchParams(new URL(url).search);
    const token = params.get('c');
    const result = decode(token, NOW);
    expect(result.number).toBe(6);
    expect(result.valid).toBe(true);
  });
});

describe('extractFromUrl', () => {
  it('returns null when no ?c= param', () => {
    expect(extractFromUrl('?foo=bar', NOW)).toBeNull();
    expect(extractFromUrl('', NOW)).toBeNull();
  });

  it('decodes token from search string', () => {
    const token = encode(4, NOW);
    const result = extractFromUrl(`?c=${token}`, NOW);
    expect(result).not.toBeNull();
    expect(result.number).toBe(4);
    expect(result.valid).toBe(true);
  });

  it('returns invalid result for bad token in URL', () => {
    const result = extractFromUrl('?c=garbage', NOW);
    expect(result.valid).toBe(false);
  });
});
