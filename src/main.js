/**
 * Beat Me in 3 — Application Entry Point
 *
 * Bootstraps Firebase, auth, state, and the initial screen.
 * All screen logic lives in src/screens/. All game logic in src/game/.
 */

import './styles/base.css';

// App init happens after DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  // Screens and modules will be wired up as they are built in subsequent tasks.
  // This entry point ensures Vite picks up the CSS and the module graph compiles.

  // Register Service Worker
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register(
        new URL('./sw.js', import.meta.url),
        { type: 'module', scope: '/beat-me-in-3/' }
      );
    } catch {
      // SW registration failure is non-fatal
    }
  }
});
