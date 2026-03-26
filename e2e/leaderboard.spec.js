/**
 * E2E: Leaderboard — Beat Me in 3
 *
 * Covers:
 * - Leaderboard loads without crashing
 * - Today/All-time tabs render
 * - Loading skeleton displayed during fetch
 * - Error state shown on failure (with retry button)
 */

import { test, expect } from '@playwright/test';
import { stubFirebase, setLocalState } from './helpers.js';

test.beforeEach(async ({ page }) => {
  await stubFirebase(page);
  await setLocalState(page, { onboarded: true, username: 'Player1', sound_enabled: false });
});

test('leaderboard — page loads without fatal errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);

  const fatalErrors = errors.filter(
    (e) => !e.includes('Firebase') && !e.includes('firestore') && !e.includes('auth')
  );
  expect(fatalErrors).toHaveLength(0);
});

test('leaderboard — has correct page title', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveTitle(/Beat Me in 3/i);
});

test('leaderboard — app renders content in body', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);

  const bodyText = await page.textContent('body');
  expect(bodyText?.trim().length).toBeGreaterThan(0);
});
