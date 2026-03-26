# API Reference — Beat Me in 3

## Overview

Beat Me in 3 has no custom REST API. All backend interactions go through the **Firebase SDK** directly from the client. This document describes the Firestore data contracts, Firebase Security Rules, and internal module interfaces.

---

## Firebase Firestore

### Base URL
```
https://firestore.googleapis.com/v1/projects/[PROJECT_ID]/databases/(default)/documents/
```
All access is via the Firebase JS SDK (not direct HTTP).

---

### Collection: `scores`

Stores daily challenge results, one document per player per day.

**Document ID:** `{YYYY-M-DD}_{UID}`

**Write:** After each completed daily session (10 matches or end of day)

**Read:** Leaderboard queries — top 10 by `(totalTries ASC, totalTime ASC)` for a given `date`

#### Schema
```typescript
interface ScoreDocument {
  uid: string;           // Firebase Anonymous Auth UID
  name: string;          // Display name (cosmetic, no auth enforcement)
  totalTries: number;    // Sum of tries for each match (losses = 3 per match)
  totalTime: number;     // Total time in milliseconds
  matchesPlayed: number; // 1–10
  matchesWon: number;    // 0–10
  date: string;          // "YYYY-M-DD"
  timestamp: Timestamp;  // Server timestamp
  flag: string;          // Country flag emoji (e.g. "🇺🇸")
}
```

#### Security Rules
```javascript
match /scores/{docId} {
  allow read: if true; // public leaderboard
  allow write: if request.auth != null
    && request.auth.uid == request.resource.data.uid
    && docId == request.resource.data.date + "_" + request.auth.uid;
}
```

---

### Collection: `wins_quick`

Stores cumulative quick challenge (vs bot) win counts.

**Document ID:** `{UID}`

**Write:** On each quick challenge win (upsert)

**Read:** All-time leaderboard queries — top 10 by `wins DESC`

#### Schema
```typescript
interface WinsQuickDocument {
  uid: string;
  name: string;
  wins: number;
  flag: string;
  timestamp: Timestamp;
}
```

---

### Collection: `wins_friend`

Stores cumulative friend challenge win counts.

**Document ID:** `{UID}`

**Write:** On each friend challenge win (upsert)

**Read:** All-time leaderboard — top 10 by `wins DESC`

#### Schema
```typescript
interface WinsFriendDocument {
  uid: string;
  name: string;
  wins: number;
  flag: string;
  timestamp: Timestamp;
}
```

---

## Firebase Authentication

### Method: Anonymous Auth
All players are signed in anonymously on first load. No email or password required.

```javascript
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// Auto sign-in
signInAnonymously(auth);

// Observe auth state
onAuthStateChanged(auth, (user) => {
  if (user) {
    store.set('uid', user.uid);
  }
});
```

**Notes:**
- UID is stable per device/browser until user clears site data
- Firestore security rules use UID for write authorization
- Username is cosmetic only (stored in localStorage + Firestore document)

---

## Internal Module Interfaces

### `game/engine.js`

```typescript
interface GameEngine {
  init(config: GameConfig): void;
  submitGuess(guess: number): GuessResult;
  useHint(): HintResult;
  getState(): GameState;
}

interface GameConfig {
  secretNumber: number;   // 0–9
  mode: 'daily' | 'quick' | 'friend';
  maxAttempts: number;    // default: 3
  timeLimit: number;      // milliseconds, default: 15000
}

interface GuessResult {
  correct: boolean;
  hint: 'higher' | 'lower' | null;
  attemptsUsed: number;
  timeElapsed: number;
}

interface HintResult {
  range: [number, number]; // e.g. [5, 9]
  success: boolean;        // false if no hints owned
}

interface GameState {
  status: 'idle' | 'playing' | 'won' | 'lost';
  attempts: Attempt[];
  secretNumber: number;
  mode: GameConfig['mode'];
}
```

---

### `state/store.js`

```typescript
interface Store {
  get(key: string): any;
  set(key: string, value: any): void;
  subscribe(key: string, callback: (value: any) => void): () => void;
}
```
Backed by localStorage. All writes are synchronous. Subscribers are notified on change.

---

### `firebase/scores.js`

```typescript
interface ScoresAPI {
  submitDailyScore(score: DailyScore): Promise<void>;
  getTodayScores(): Promise<ScoreDocument[]>;
  getAllTimeScores(mode: 'quick' | 'friend'): Promise<WinsDocument[]>;
  getUserRank(uid: string, mode: string): Promise<number>;
}
```

---

### `utils/challenge.js`

```typescript
interface ChallengeURL {
  encode(number: number): string;    // returns base64 URL-safe token
  decode(token: string): {
    number: number;
    timestamp: number;
    valid: boolean;                  // false if expired (> 24h) or malformed
  };
}
```

---

## Error Handling

### Firebase Errors
All Firebase calls are wrapped in try/catch. On failure:
- **Write failure:** Show toast "Score not saved — check connection"
- **Read failure:** Show stale cache or empty state with "Couldn't load scores"
- **Auth failure:** Retry once after 2s, then allow offline play

### Offline Mode
Service Worker serves cached HTML/assets. Game functions in offline mode:
- Daily Challenge: playable, score saved locally, synced on reconnect
- Leaderboard: shows "Offline — showing cached scores"
- Friend Challenge: link generation works offline, submission waits for connectivity

---

## Analytics Events

All events tracked via `firebase/analytics.js` wrapper:

| Event | Parameters | Trigger |
|---|---|---|
| `game_start` | mode, matchIndex | Game screen shown |
| `guess_submitted` | guess, correct, attempts, timeLeft | Submit pressed |
| `game_win` | mode, tries, timeMs | Player wins |
| `game_lose` | mode, secretNumber | Player loses |
| `hint_used` | hintsRemaining | Hint button tapped |
| `hint_purchased` | quantity, price | Purchase confirmed |
| `streak_extended` | streakCount | Daily streak incremented |
| `streak_broken` | previousStreak | Streak reset |
| `challenge_sent` | — | Friend challenge link created |
| `challenge_received` | — | Incoming challenge link decoded |
| `leaderboard_viewed` | tab | Leaderboard opened |
| `result_shared` | method (native/clipboard/text) | Share button tapped |
| `onboarding_completed` | — | Tutorial finished |
| `notification_enabled` | — | Push permission granted |
