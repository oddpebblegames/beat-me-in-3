# Setup — Beat Me in 3

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | ≥ 18.0 | Required for Vite build tools |
| npm | ≥ 9.0 | Bundled with Node.js |
| Git | ≥ 2.30 | For version control |
| Firebase account | — | Free Spark plan sufficient for development |
| Modern browser | Chrome 90+, Safari 15+, Firefox 90+ | For Web Audio API + Service Worker |

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/oddpebblegames/beat-me-in-3.git
cd beat-me-in-3

# 2. Install dependencies
npm install

# 3. Configure Firebase (see Firebase Setup below)
cp .env.example .env.local
# Edit .env.local with your Firebase config

# 4. Start development server
npm run dev
# → Opens http://localhost:5173

# 5. Run tests
npm test

# 6. Build for production
npm run build
# → Output: dist/
```

---

## Firebase Setup

### 1. Create a Firebase Project
1. Go to https://console.firebase.google.com
2. Click **Add project**
3. Enable **Google Analytics** (recommended)

### 2. Enable Services
In the Firebase console for your project:
- **Firestore Database** → Create database → Start in production mode
- **Authentication** → Sign-in method → Enable **Anonymous**
- **Analytics** → Should be enabled if you opted in at project creation

### 3. Firestore Security Rules
In Firestore → Rules, paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Scores: public read, authenticated write by UID
    match /scores/{docId} {
      allow read: if true;
      allow write: if request.auth != null
        && request.auth.uid == request.resource.data.uid
        && docId.matches(request.resource.data.date + "_" + request.auth.uid);
    }

    // Quick wins: public read, authenticated write by UID
    match /wins_quick/{uid} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == uid;
    }

    // Friend wins: public read, authenticated write by UID
    match /wins_friend/{uid} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

### 4. Get Firebase Config
1. Project Settings → General → Your apps → Add app (Web)
2. Register app, copy the config object
3. Paste into `.env.local`:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-app
VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXX
```

---

## Development

### NPM Scripts

```bash
npm run dev          # Start Vite dev server (hot reload)
npm run build        # Production build → dist/
npm run preview      # Preview production build locally
npm test             # Run Vitest unit tests
npm run test:ui      # Vitest with browser UI
npm run test:e2e     # Playwright end-to-end tests
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
```

### Development Server
```
http://localhost:5173/beat-me-in-3/
```
Service Worker is disabled in development (requires HTTPS or localhost with specific config).

To test Service Worker locally:
```bash
npm run build && npm run preview
# → http://localhost:4173/beat-me-in-3/
```

---

## Testing

### Unit Tests (Vitest)
```bash
npm test
# or with watch mode:
npm run test:watch
```

Test files are colocated with source: `src/**/*.test.js`

Key test areas:
- `game/engine.test.js` — guess logic, timer, scoring
- `game/daily.test.js` — seed generation, match counting
- `utils/challenge.test.js` — URL encode/decode, timestamp validation
- `state/store.test.js` — get/set/subscribe

### End-to-End Tests (Playwright)
```bash
npm run test:e2e
```

Requires a running dev or preview server. Tests cover:
- Full game flow (start → guess → win/lose)
- Daily challenge (10 matches, score submission)
- Friend challenge (generate link, use link)
- Leaderboard rendering
- Offline mode (via Playwright network intercept)

---

## Production Deployment

### GitHub Pages (default)

The project deploys automatically via GitHub Actions on push to `main`.

**Manual deploy:**
```bash
npm run build
# dist/ contents → gh-pages branch
```

GitHub Actions workflow (`.github/workflows/deploy.yml`) handles:
1. `npm ci`
2. `npm test`
3. `npm run build`
4. Deploy `dist/` to `gh-pages` branch

### Custom Domain
Update `manifest.json` and `vite.config.js` `base` option to match your domain.

---

## Environment Variables Reference

```env
# Required
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Optional
VITE_FIREBASE_MEASUREMENT_ID=   # For Analytics
VITE_BASE_URL=/beat-me-in-3/    # Deployment base path (default: /beat-me-in-3/)
```

---

## Troubleshooting

### Audio doesn't play on first tap
Web Audio requires a user gesture to initialize the AudioContext. The app pre-warms the context on first tap anywhere. If audio is still silent, check browser autoplay policy settings.

### Service Worker not updating
Hard refresh (`Ctrl+Shift+R`) to bypass cache, or use DevTools → Application → Service Workers → Update.

### Firebase permission denied
Ensure Firestore security rules are published (not just saved as draft). Check that Anonymous Auth is enabled in Firebase Console.

### Leaderboard not loading
Verify Firestore rules allow public reads on `scores`, `wins_quick`, `wins_friend` collections.

### Friend challenge link expired
Challenge links are valid for 24 hours. Generate a new link to share.
