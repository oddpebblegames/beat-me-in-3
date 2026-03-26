/**
 * E2E Test Helpers — Beat Me in 3
 *
 * Shared utilities for mocking Firebase and localStorage
 * in Playwright tests, allowing full game flows without a
 * real Firestore backend.
 */

/**
 * Inject localStorage state before the page loads.
 * @param {import('@playwright/test').Page} page
 * @param {Record<string, unknown>} state  Key-value map (keys WITHOUT the bmi3_ prefix)
 */
export async function setLocalState(page, state) {
  await page.addInitScript((stateEntries) => {
    for (const [key, value] of stateEntries) {
      localStorage.setItem('bmi3_' + key, JSON.stringify(value));
    }
  }, Object.entries(state));
}

/**
 * Stub Firebase modules so tests run offline.
 * Intercepts all Firestore calls and returns empty results.
 */
export async function stubFirebase(page) {
  await page.addInitScript(() => {
    // Stub initializeApp / getFirestore / getAuth so imports don't crash
    window.__fbStubbed = true;

    // Intercept dynamic Firebase imports via a global flag checked by the app
    window.FIREBASE_STUB = {
      signInAnonymously: () => Promise.resolve({ user: { uid: 'test-uid-12345' } }),
      getDocs: () => Promise.resolve({ docs: [] }),
      setDoc: () => Promise.resolve(),
      getDoc: () => Promise.resolve({ exists: () => false, data: () => ({}) }),
      onSnapshot: (_, cb) => { cb({ docs: [] }); return () => {}; },
    };
  });
}

/**
 * Read a localStorage value from the page context.
 * @param {import('@playwright/test').Page} page
 * @param {string} key  Without bmi3_ prefix
 */
export async function getLocalState(page, key) {
  return page.evaluate((k) => {
    const raw = localStorage.getItem('bmi3_' + k);
    if (raw === null) return null;
    try { return JSON.parse(raw); } catch { return raw; }
  }, key);
}
