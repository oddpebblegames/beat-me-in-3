/**
 * Friend Challenge URL Utilities — Beat Me in 3
 *
 * Encodes a secret number + timestamp into a URL-safe base64 token.
 * Tokens expire after 24 hours to prevent replay attacks.
 *
 * Format: base64url( JSON.stringify({ n: number, t: timestamp }) )
 */

const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Encode a challenge token.
 * @param {number} number  0–9
 * @param {number} [_now]  Timestamp override for testing
 * @returns {string}  URL-safe base64 token
 */
export function encode(number, _now) {
  if (!Number.isInteger(number) || number < 0 || number > 9) {
    throw new RangeError(`number must be an integer 0–9, got: ${number}`);
  }
  const payload = JSON.stringify({ n: number, t: _now ?? Date.now() });
  return btoa(payload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decode a challenge token.
 * @param {string} token  URL-safe base64 token
 * @param {number} [_now]  Timestamp override for testing
 * @returns {{ number: number, timestamp: number, valid: boolean, reason: string }}
 */
export function decode(token, _now) {
  if (!token || typeof token !== 'string') {
    return _invalid('missing token');
  }

  let raw;
  try {
    // Restore standard base64 from URL-safe variant
    const b64 = token.replace(/-/g, '+').replace(/_/g, '/');
    raw = JSON.parse(atob(b64));
  } catch {
    return _invalid('malformed token');
  }

  if (typeof raw.n !== 'number' || typeof raw.t !== 'number') {
    return _invalid('invalid payload structure');
  }

  if (!Number.isInteger(raw.n) || raw.n < 0 || raw.n > 9) {
    return _invalid('number out of range');
  }

  const age = (_now ?? Date.now()) - raw.t;
  if (age > TTL_MS) {
    return { number: raw.n, timestamp: raw.t, valid: false, reason: 'token expired' };
  }

  if (age < 0) {
    return _invalid('token timestamp is in the future');
  }

  return { number: raw.n, timestamp: raw.t, valid: true, reason: 'ok' };
}

function _invalid(reason) {
  return { number: null, timestamp: null, valid: false, reason };
}

/**
 * Build the full shareable URL for a challenge.
 * @param {number} number  0–9
 * @param {string} baseUrl  e.g. "https://oddpebblegames.github.io/beat-me-in-3/"
 * @param {number} [_now]
 * @returns {string}
 */
export function buildChallengeUrl(number, baseUrl, _now) {
  const token = encode(number, _now);
  const url = new URL(baseUrl);
  url.searchParams.set('c', token);
  return url.toString();
}

/**
 * Extract and decode a challenge token from the current page URL.
 * @param {string} [search]  window.location.search override for testing
 * @param {number} [_now]
 * @returns {ReturnType<decode> | null}  null if no ?c= param
 */
export function extractFromUrl(search, _now) {
  const params = new URLSearchParams(search ?? window.location.search);
  const token = params.get('c');
  if (!token) return null;
  return decode(token, _now);
}
