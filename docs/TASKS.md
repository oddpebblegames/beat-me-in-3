# Tasks — Beat Me in 3

All tasks target Phase 1 MVP scope. Each task is independently committable to its own `AIAgent/*` branch.

---

## Sprint 1 — Foundation & Infrastructure

### T001 · [SETUP] Initialize Vite project structure and toolchain
Branch:  AIAgent/T001-vite-setup
Deps:    —
Done:    `package.json` present with vite, vitest, eslint; `npm run dev` starts a dev server; `npm run build` produces a `dist/` folder; `npm test` runs without error

---

### T002 · [INFRA] Configure GitHub Actions CI/CD pipeline
Branch:  AIAgent/T002-github-actions
Deps:    T001
Done:    `.github/workflows/deploy.yml` runs lint + test + build on every push; deploys `dist/` to gh-pages branch on push to main

---

### T003 · [SETUP] Extract Firebase config to environment variables
Branch:  AIAgent/T003-firebase-env
Deps:    T001
Done:    `.env.example` lists all required `VITE_FIREBASE_*` keys; Firebase init reads from `import.meta.env`; no secrets hardcoded in source

---

### T004 · [SETUP] Create base HTML shell and CSS design system
Branch:  AIAgent/T004-design-system
Deps:    T001
Done:    `index.html` is a minimal shell (<50 lines); `src/styles/tokens.css` defines all color, spacing, typography, shadow, and animation tokens as CSS custom properties; `src/styles/base.css` applies resets and base typography

---

## Sprint 2 — State & Core Engine

### T005 · [FEAT] Implement reactive state store (localStorage-backed)
Branch:  AIAgent/T005-state-store
Deps:    T001
Done:    `src/state/store.js` exports `get`, `set`, `subscribe`; unit tests verify read/write/subscribe; localStorage is the backing store

---

### T006 · [FEAT] Implement core game engine module
Branch:  AIAgent/T006-game-engine
Deps:    T005
Done:    `src/game/engine.js` exports `init`, `submitGuess`, `getState`; handles 3-attempt logic, timer tracking, win/lose state transitions; 100% unit test coverage for all branches

---

### T007 · [FEAT] Implement daily challenge seed and match tracking
Branch:  AIAgent/T007-daily-logic
Deps:    T005, T006
Done:    `src/game/daily.js` generates deterministic secret from date + matchIndex; tracks 10-match daily state in store; `getDailyState()`, `incrementMatch()`, `resetDailyIfNewDay()` all tested

---

### T008 · [FEAT] Implement hint system
Branch:  AIAgent/T008-hints
Deps:    T006
Done:    `src/game/hints.js` exports `useHint(secret)` returning range ±2; tracks `hintsOwned` in store; validates owned count before use; free daily hint logic; unit tests for all edge cases

---

### T009 · [FEAT] Implement friend challenge URL encode/decode
Branch:  AIAgent/T009-challenge-url
Deps:    T001
Done:    `src/utils/challenge.js` exports `encode(number)` and `decode(token)`; timestamp included; decode returns `{ number, valid }` with 24h expiry check; unit tests for encode/decode/expiry

---

## Sprint 3 — Firebase Integration

### T010 · [FEAT] Implement Firebase Anonymous Auth module
Branch:  AIAgent/T010-firebase-auth
Deps:    T003, T005
Done:    `src/firebase/auth.js` signs in anonymously on load; persists UID to store; `getUID()` always returns non-null after init; handles auth failures gracefully

---

### T011 · [FEAT] Implement Firestore scores module
Branch:  AIAgent/T011-firebase-scores
Deps:    T010
Done:    `src/firebase/scores.js` exports `submitDailyScore`, `getTodayScores`, `getUserRank`; all writes include UID; handles offline (queues write, retries on reconnect); read failures return empty array not thrown errors

---

### T012 · [FEAT] Implement Firestore leaderboard module
Branch:  AIAgent/T012-firebase-leaderboard
Deps:    T011
Done:    `src/firebase/leaderboard.js` exports `getTodayLeaderboard`, `getAllTimeLeaderboard`; returns sorted arrays; real-time listener available; handles empty collections

---

### T013 · [INFRA] Publish Firestore Security Rules
Branch:  AIAgent/T013-firestore-rules
Deps:    T010
Done:    `firestore.rules` file in repo root with UID-enforced write rules for all collections; `README` explains how to deploy rules via Firebase CLI

---

## Sprint 4 — Audio Engine

### T014 · [FEAT] Implement Web Audio engine and SFX module
Branch:  AIAgent/T014-audio-engine
Deps:    T001
Done:    `src/audio/engine.js` exports `getCtx()`, `playTone()`; `src/audio/sfx.js` exports named SFX: `sfxClick`, `sfxWin`, `sfxLose`, `sfxWrong`, `sfxTick`, `sfxUrgent`, `sfxApplause`, `sfxGroan`; all volumes normalized; first-gesture warm-up pattern implemented

---

### T015 · [FEAT] Implement background music sequencer
Branch:  AIAgent/T015-bgm
Deps:    T014
Done:    `src/audio/bgm.js` exports `start()` and `stop()`; plays a looping procedural melody; does not overlap on re-start; stops cleanly without clicks/pops; respects global mute state

---

## Sprint 5 — UI Screens

### T016 · [FEAT] Build home screen component
Branch:  AIAgent/T016-home-screen
Deps:    T004, T005, T007
Done:    Home screen renders: username/streak badge, 3 game mode buttons (Daily/Quick/Friend), countdown to daily reset, leaderboard shortcut, settings icon; all button states (disabled when daily complete) work correctly

---

### T017 · [FEAT] Build onboarding tutorial flow
Branch:  AIAgent/T017-onboarding
Deps:    T004, T005
Done:    3-screen tutorial shown to first-time users: screen 1 (guess the number), screen 2 (timer explanation), screen 3 (streak intro); skippable; `bmi3_onboarded` set in store on completion; never shown again

---

### T018 · [FEAT] Build game screen component (numpad, attempts, timer)
Branch:  AIAgent/T018-game-screen
Deps:    T004, T006, T014
Done:    Renders: 0-9 numpad with theme variants, attempt dots (pending/correct/wrong), timer bar with color states (green/yellow/red), submit button, hint button; all events wired to engine; shake animation on wrong guess; 60fps

---

### T019 · [FEAT] Build countdown animation component
Branch:  AIAgent/T019-countdown
Deps:    T004
Done:    `src/screens/countdown.js` shows 3-2-1-Go! sequence; each number animates in/out with scale+fade; callback fired on completion; tested with mock timers

---

### T020 · [FEAT] Build win/lose screen with confetti
Branch:  AIAgent/T020-win-lose-screen
Deps:    T004, T005, T014
Done:    Win screen: confetti (50 pieces + star emojis), win rays overlay, tries count, time taken, streak update, "Play Again" and "Share" CTAs; Lose screen: reveals secret number, shows 3 attempt history, "Try Again" CTA; all SFX triggered correctly

---

### T021 · [FEAT] Build result card canvas renderer
Branch:  AIAgent/T021-result-card
Deps:    T004
Done:    `src/utils/canvas.js` renders a 360×640 result card: game name, emoji hero (🏆/💀), guess visualization boxes, tries/time stats, player name + streak; exported as PNG via html2canvas or OffscreenCanvas

---

### T022 · [FEAT] Build share utility (native share + clipboard fallback)
Branch:  AIAgent/T022-share
Deps:    T021
Done:    `src/utils/share.js` exports `shareResult(imageBlob, text, url)`; uses navigator.share if available; falls back to clipboard copy; shows toast on success/failure

---

### T023 · [FEAT] Build stats modal
Branch:  AIAgent/T023-stats-modal
Deps:    T004, T005
Done:    Stats modal shows: games played, win rate, avg tries, best time, current streak, best streak, guess distribution bar chart; all values sourced from store; renders correctly with zero stats

---

### T024 · [FEAT] Build leaderboard screen
Branch:  AIAgent/T024-leaderboard
Deps:    T004, T012
Done:    Leaderboard screen with Today/All-time tabs; shows top 10 with rank, flag, name, score; current player row highlighted and always visible (even outside top 10); loading skeleton state; error state with retry

---

### T025 · [FEAT] Build settings screen
Branch:  AIAgent/T025-settings
Deps:    T004, T005
Done:    Settings screen: sound on/off toggle, numpad theme selector (4 themes), notification permission request, username change; all preferences persisted to store immediately

---

## Sprint 6 — Game Modes & Polish

### T026 · [FEAT] Wire up Quick Challenge mode (vs bot)
Branch:  AIAgent/T026-quick-mode
Deps:    T006, T011, T016, T018, T020
Done:    Quick mode: single match, bot always guesses randomly, player wins if they guess in ≤ bot's tries; win submitted to `wins_quick` Firestore collection; result card shows "vs Bot"

---

### T027 · [FEAT] Wire up Friend Challenge mode
Branch:  AIAgent/T027-friend-mode
Deps:    T009, T011, T016, T018, T020
Done:    "Set a number" screen → generate challenge link → send; incoming `?c=` param → auto-start with encoded number; "Challenge Back" button on result screen; win submitted to `wins_friend`

---

### T028 · [FEAT] Wire up Daily Challenge mode end-to-end
Branch:  AIAgent/T028-daily-mode
Deps:    T007, T011, T016, T018, T020, T024
Done:    10-match daily session with cumulative scoring; match counter displayed; score submitted to Firestore after each match; leaderboard updates in real-time; daily state resets at midnight UTC

---

### T029 · [FEAT] Implement push notification scheduling (Service Worker)
Branch:  AIAgent/T029-notifications
Deps:    T001
Done:    `sw.js` registers background sync for daily 8am notification; uses `BackgroundSyncManager` or persistent IndexedDB alarm pattern (not setTimeout); notification shows yesterday's rank + today's challenge invite; permission requested after first win

---

### T030 · [FIX] Fix streak edge cases and timezone handling
Branch:  AIAgent/T030-streak-fix
Deps:    T007
Done:    Streak increments only once per calendar day (UTC); streak breaks only after missing an entire day; grace period: playing at 11:58pm and 12:02am same session counts as consecutive; all cases covered by unit tests

---

### T031 · [FEAT] Add global player count display
Branch:  AIAgent/T031-player-count
Deps:    T012
Done:    Home screen shows "X players today" using real-time Firestore count; updates without page refresh; fallback to "--" on offline; count is today's unique UIDs in scores collection

---

## Sprint 7 — Quality & Launch Readiness

### T032 · [TEST] Write unit tests for all game modules
Branch:  AIAgent/T032-unit-tests
Deps:    T006, T007, T008, T009, T005
Done:    Vitest coverage ≥ 80% on `src/game/`, `src/utils/`, `src/state/`; all edge cases from code review covered; CI passes

---

### T033 · [TEST] Write Playwright E2E tests for critical paths
Branch:  AIAgent/T033-e2e-tests
Deps:    T028, T026, T027
Done:    Playwright tests cover: full daily game flow (win + lose), friend challenge flow (send + receive), leaderboard load, offline mode (network intercept); all pass in CI

---

### T034 · [REFACTOR] Accessibility pass (WCAG 2.1 AA)
Branch:  AIAgent/T034-accessibility
Deps:    T016, T018, T020, T023, T024, T025
Done:    All interactive elements have accessible names; focus management correct on modal open/close; color contrast ≥ 4.5:1 for all text; keyboard navigation works for all game actions; axe DevTools reports zero violations

---

### T035 · [INFRA] Optimize bundle and achieve Lighthouse ≥ 90
Branch:  AIAgent/T035-performance
Deps:    T001, T028
Done:    `npm run build` produces gzipped JS ≤ 50KB; Lighthouse Performance ≥ 90; FCP < 1.5s; TTI < 2.5s; all images optimized; fonts subset and preloaded

---

### T036 · [DOCS] Write final README and update docs
Branch:  AIAgent/T036-docs-final
Deps:    T001, T028
Done:    `README.md` covers: project description, screenshot, live URL, tech stack, quick start (5 steps), Firebase setup, deployment; all `docs/` files consistent with final implementation

---
