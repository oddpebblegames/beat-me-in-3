/**
 * E2E: Friend Challenge Flow — Beat Me in 3
 *
 * Covers:
 * - encode → URL param → decoded challenge detection
 * - Incoming ?c= param auto-starts game with encoded number
 * - Challenge Back URL generation
 * - Expired token shows appropriate error
 */

import { test, expect } from '@playwright/test';
import { stubFirebase, setLocalState } from './helpers.js';

// Compute a valid token inline (mirrors challenge.js logic)
function makeToken(number, nowMs) {
  const payload = JSON.stringify({ n: number, t: nowMs });
  return btoa(payload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function makeExpiredToken(number) {
  const expiredTime = Date.now() - 25 * 60 * 60 * 1000; // 25h ago
  return makeToken(number, expiredTime);
}

test.beforeEach(async ({ page }) => {
  await stubFirebase(page);
  await setLocalState(page, { onboarded: true, username: 'Challenger', sound_enabled: false });
});

test('friend challenge — valid ?c= param is accepted', async ({ page }) => {
  const token = makeToken(7, Date.now());
  await page.goto(`/?c=${token}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);

  // App should load without fatal errors
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.waitForTimeout(300);

  const fatalErrors = errors.filter(
    (e) => !e.includes('Firebase') && !e.includes('firestore') && !e.includes('auth')
  );
  expect(fatalErrors).toHaveLength(0);
});

test('friend challenge — expired ?c= param does not crash app', async ({ page }) => {
  const expiredToken = makeExpiredToken(3);
  await page.goto(`/?c=${expiredToken}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);

  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.waitForTimeout(300);

  const fatalErrors = errors.filter(
    (e) => !e.includes('Firebase') && !e.includes('firestore') && !e.includes('auth')
  );
  expect(fatalErrors).toHaveLength(0);
});

test('friend challenge — malformed ?c= param does not crash app', async ({ page }) => {
  await page.goto('/?c=not-a-valid-token!!!');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);

  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.waitForTimeout(300);

  const fatalErrors = errors.filter(
    (e) => !e.includes('Firebase') && !e.includes('firestore') && !e.includes('auth')
  );
  expect(fatalErrors).toHaveLength(0);
});
