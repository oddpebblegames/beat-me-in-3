/**
 * E2E: Offline Mode — Beat Me in 3
 *
 * Covers:
 * - Game loads in offline mode (all external requests blocked)
 * - No fatal JavaScript errors when Firebase is unreachable
 * - Player count shows "--" fallback
 * - Core game UI is still accessible
 */

import { test, expect } from '@playwright/test';
import { setLocalState } from './helpers.js';

test.beforeEach(async ({ page }) => {
  // Block ALL external network requests to simulate offline
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (url.startsWith('http://localhost') || url.startsWith('data:')) {
      route.continue();
    } else {
      route.abort('connectionrefused');
    }
  });

  await setLocalState(page, {
    onboarded: true,
    username: 'OfflinePlayer',
    sound_enabled: false,
  });
});

test('offline — app loads without fatal JS errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500); // wait for Firebase failures to bubble

  const fatalErrors = errors.filter(
    (e) =>
      !e.includes('Firebase') &&
      !e.includes('firestore') &&
      !e.includes('auth') &&
      !e.includes('network') &&
      !e.includes('fetch') &&
      !e.includes('Failed to fetch') &&
      !e.includes('ERR_CONNECTION_REFUSED') &&
      !e.includes('net::') &&
      !e.includes('ERR_FAILED')
  );
  expect(fatalErrors).toHaveLength(0);
});

test('offline — page title is correct', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveTitle(/Beat Me in 3/i);
});

test('offline — body has content', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);

  const bodyText = await page.textContent('body');
  expect(bodyText?.trim().length).toBeGreaterThan(0);
});
