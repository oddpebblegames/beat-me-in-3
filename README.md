# Beat Me in 3 🎮

> Guess the secret number in 3 tries. 15 seconds. Daily challenge, global leaderboard.

A mobile-first PWA daily number-guessing game. Play in under 2 minutes — three game modes, friend duels, real-time leaderboards.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Vanilla JavaScript (ES Modules, no framework) |
| Build | Vite + vite-plugin-pwa |
| Backend | Firebase (Firestore + Anonymous Auth) |
| Hosting | GitHub Pages |
| Testing | Vitest (unit) + Playwright (E2E) |

---

## Quick Start (5 steps)

```bash
# 1. Clone
git clone https://github.com/oddpebblegames/beat-me-in-3.git
cd beat-me-in-3

# 2. Install dependencies
npm install

# 3. Copy and fill in env
cp .env.example .env
# → edit .env with your Firebase credentials

# 4. Start dev server
npm run dev

# 5. Open
# http://localhost:5173/beat-me-in-3/
```

---

## Firebase Setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Anonymous Authentication** (Build → Authentication → Sign-in method)
3. Create a **Firestore database** (Build → Firestore Database, start in production mode)
4. Deploy security rules: `firebase deploy --only firestore:rules`
5. Copy your config keys into `.env` (see `.env.example` for required vars)

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server at localhost:5173 |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:watch` | Watch mode |
| `npm run test:e2e` | Run Playwright E2E tests |

---

## Deployment

The CI/CD pipeline (`.github/workflows/deploy.yml`) automatically:
1. Runs lint + unit tests on every push
2. Builds the production bundle
3. Deploys `dist/` to GitHub Pages on push to `main`

---

## Project Structure

```
src/
  game/          Game logic (engine, daily, hints, streak, quick, friend)
  state/         localStorage-backed reactive store
  screens/       UI screens (home, game, settings, stats, leaderboard)
  audio/         Web Audio engine + SFX + BGM
  firebase/      Auth, Firestore scores, leaderboard modules
  utils/         Challenge URL encoding, share, notifications, focus trap
  styles/        CSS design tokens + base styles
e2e/             Playwright E2E tests
docs/            Project documentation
```

---

## Documentation

- [Overview](docs/overview.md) — Purpose, scope, tech stack
- [Architecture](docs/architecture.md) — System design and component map
- [API](docs/api.md) — Module interfaces and contracts
- [Setup](docs/setup.md) — Full setup instructions
- [Roadmap](docs/ROADMAP.md) — Product roadmap
- [Tasks](docs/TASKS.md) — Task breakdown
- [Sprints](docs/SPRINTS.md) — Sprint plan

---

## Game Modes

| Mode | Description |
|---|---|
| **Daily Challenge** | 10 deterministic matches per day (same numbers globally). Score posted to global leaderboard. |
| **Quick Play** | Single match vs a randomly-guessing bot. Win if you guess in ≤ bot's tries. |
| **Friend Challenge** | Set a number → share link → opponent plays with your number. Challenge back! |

---

*Built with the Claude Code autonomous engineering agent.*
