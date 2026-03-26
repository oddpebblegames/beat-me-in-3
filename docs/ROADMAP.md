# Roadmap — Beat Me in 3

## Vision

Beat Me in 3 is the 30-second daily ritual that belongs on every phone's home screen. We win when opening the app is automatic — as habitual as checking the weather. Every design, technical, and business decision serves one goal: the lowest friction path from "I have 30 seconds" to "I just beat my friend's score and shared it."

The game's core loop is intentionally simple (guess 0–9 in 3 tries). Our moat is not complexity — it's the social layer, the daily commitment hook, and the feeling of satisfaction from a perfectly timed 1-try win.

---

## Phase 1 — MVP: The Rock-Solid Daily

**Goal:** Ship a production-quality daily game that feels like it came from a real studio. No broken edges, no missing auth, no fake buttons. Everything that ships works.

### Scope
- **Architecture refactor:** Single 2,408-line HTML file → modular ES modules with Vite build
- **Firebase Anonymous Auth:** Stable identity per device, UID-keyed Firestore documents, no username squatting
- **Firestore Security Rules:** Enforce ownership, prevent spoofed leaderboard entries
- **Error handling & offline resilience:** Graceful degradation for all Firebase calls; local score queue for offline sync
- **Onboarding flow:** First-run tutorial (3 screens: how to guess, timer explanation, streak intro)
- **Visual polish pass:** Consistent design system (spacing, typography scale, color tokens), micro-animations at 60fps using CSS transforms only
- **Sound mixing:** Normalize all SFX volumes, test across device speakers vs headphones
- **Hint shop UI:** Honest placeholder state (coming soon) instead of non-functional purchase buttons
- **Push notifications:** Fix SW notification scheduling — replace setTimeout hack with proper persistent alarm via background sync
- **Performance:** Lighthouse Performance ≥ 90, TTI < 2.5s, JS bundle < 50KB gzipped
- **CI/CD pipeline:** GitHub Actions — lint + test + build + deploy on every push to main
- **Unit tests:** Core game logic (engine, scoring, daily seed, challenge URL)

### Success Criteria
- Playable daily challenge with stable identity across sessions
- Leaderboard shows only legitimate scores (UID-validated writes)
- Zero console errors in production
- Lighthouse score ≥ 90/90/90/100 (Perf/Acc/BP/SEO)
- 100% of core game paths covered by unit tests

---

## Phase 2 — Growth: Hooks & Virality

**Goal:** Every session creates a new player. Every win creates a share. Every share creates a challenge.

### Scope
- **Achievement system:** 20 unlockable achievements (speed demon, streak master, 1-try wizard, etc.) with animated unlock modals
- **Improved result card:** Canvas-rendered share card with player rank, streak, and guess visualization — designed to be screenshot-worthy
- **Animated leaderboard:** Rank change animations, "you moved up 3 spots!" moment
- **Challenge tournaments:** 5-round head-to-head friend tournaments with bracket display
- **Real in-app purchases:** RevenueCat integration (or native browser payment API) for hint packs and theme unlocks
- **Daily digest notification:** Rich push notification showing yesterday's leaderboard result and today's challenge preview
- **Country/regional leaderboards:** Filter leaderboard by country (using existing flag data)
- **Player profiles:** Public profile page (shareable URL) showing streak, stats, badge collection
- **Taunt system:** Quick reactions (👏, 😮, 🔥) sendable after beating a friend's score
- **A/B testing infrastructure:** Firebase Remote Config for experiment flags
- **Crash & error reporting:** Sentry integration

### Success Criteria
- K-factor ≥ 0.3 (30% of players invite at least one friend within first week)
- D7 retention ≥ 25%
- Achievement unlock rate ≥ 60% on first-session achievements
- IAP conversion rate ≥ 2% of MAU

---

## Phase 3 — Scale: Reliability & Longevity

**Goal:** The game runs flawlessly for 100K daily active users with zero manual intervention.

### Scope
- **Firebase to custom backend migration path:** Evaluate costs at scale; architect optional Node.js/Cloud Functions layer for rate limiting and fraud detection
- **Anti-cheat system:** Server-side score validation (time-series anomaly detection, impossible score filtering)
- **Admin dashboard:** Internal tool for viewing flagged users, managing leaderboards, pushing announcements
- **Seasonal content:** Weekly rotating themes, limited-time events (holiday modes, partner collaborations)
- **Native app wrappers:** Capacitor-based iOS/Android apps for App Store / Play Store distribution
- **Internationalization (i18n):** Full translation for top 10 languages by player count
- **Accessibility audit:** WCAG 2.1 AA compliance — screen reader support, keyboard navigation, high contrast mode
- **Performance at scale:** CDN optimization, Firestore index tuning, connection pooling
- **Monitoring & observability:** Uptime monitoring, real-time error rate dashboards, alerting
- **Subscription model:** Optional "Beat Me in 3 Pro" — unlimited matches, custom themes, no ads, exclusive badges

### Success Criteria
- 99.9% uptime SLA
- p95 leaderboard load time < 500ms under 10K concurrent users
- Zero P0 bugs shipped to production in any 30-day window
- App Store / Play Store rating ≥ 4.5 stars

---

## Deferred

The following items are explicitly out of scope until Phase 3 or later, to prevent scope creep:

- **Multiplayer real-time (WebSocket):** Too complex for current architecture; friend challenges cover synchronous social without it
- **Custom secret number submission beyond friend mode:** Opens abuse vectors
- **User-generated content (custom themes, levels):** Moderation overhead not justified at current scale
- **Web monetization / crypto integration:** Not aligned with casual game audience
- **Desktop-first UI redesign:** Mobile-first covers 95% of the audience
- **Dedicated server infrastructure:** Firebase scales to growth phase; custom backend deferred to Phase 3
- **Video/audio recording of gameplay:** Privacy and storage complexity exceeds current scope
