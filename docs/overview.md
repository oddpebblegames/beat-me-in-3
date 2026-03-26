# Overview — Beat Me in 3

## Purpose

**Beat Me in 3** is a mobile-first casual daily number-guessing game, inspired by Wordle's daily ritual mechanic. Players are challenged to guess a hidden digit (0–9) in 3 attempts or fewer, with 15 seconds per attempt. The game is designed to be played in under 2 minutes — making it the ideal morning commute, coffee break, or bathroom companion.

## Scope

- Progressive Web App (PWA) — installable on iOS and Android from the browser
- Hosted on GitHub Pages (static hosting, no server-side rendering)
- Real-time leaderboards via Firebase Firestore
- Three game modes: Daily Challenge, Quick Challenge (vs bot), Friend Challenge
- Social sharing (result cards, challenge links)
- Streaks, stats, and personal bests

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Vanilla JavaScript (ES Modules) |
| UI | HTML5 + CSS3 (no framework) |
| Audio | Web Audio API (synthesized SFX + BGM) |
| Backend | Firebase Firestore (real-time DB) |
| Auth | Firebase Anonymous Auth + username linking |
| Analytics | Firebase Analytics |
| Hosting | GitHub Pages |
| PWA | Service Worker + Web App Manifest |
| Build | Vite (bundling, minification, code splitting) |
| Testing | Vitest (unit) + Playwright (E2E) |

## Key Architectural Decisions

### Single Page Application (SPA) without a framework
The game's complexity does not justify a full framework. Vanilla JS with ES Modules provides adequate structure with zero runtime overhead. Screens are toggled via CSS classes, not virtual DOM diffing.

### Firebase as sole backend
Avoids the need for a custom server. Firestore handles real-time leaderboard sync. Firebase Anonymous Auth provides stable identity without friction-heavy registration.

### Procedural Web Audio
All SFX and background music are synthesized at runtime. Eliminates audio file downloads, works offline, and allows pitch/tempo variation for feel.

### Vite for build tooling
Enables ES Module syntax in development with tree-shaking and minification for production. Preserves zero-framework architecture while enabling code splitting.

### Progressive difficulty via game modes
Rather than increasing core guess complexity, depth is added through social pressure (leaderboards, streaks) and time pressure (15s timer with escalating urgency cues).

## Unique Value Proposition

- **30-second daily ritual** — low barrier to entry, high habit-forming potential
- **Social by default** — every session is shareable; every result invites a challenge
- **Deterministic daily seed** — all players face the same number each day, enabling fair global comparison
- **Offline-capable** — plays with full UX even without network (single-player modes)
