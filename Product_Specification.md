# The Golden Glow - Product Specification

## 1. Purpose and Vision
The Golden Glow is a gamified micro-activities platform designed to inspire daily personal growth through quick, rewarding interactions. Users complete mindful tasks, play casual games, collect Golden Credits, and engage in a referral program to grow their influence and unlock rewards. The platform should be delightful, responsive, and frictionless whether the user is a guest or authenticated via supported providers.

## 2. Target Users and Personas
- Explorer (Guest): Tries the app instantly without sign-up, plays games, previews rewards, and may later create an account.
- Achiever (Registered User): Returns daily to complete tasks, claim rewards, spin wheels, and track progress.
- Connector (Referrer): Invites friends to earn bonuses and climb leaderboards.
- Competitor (Gamer): Focuses on high scores and streaks across mini-games.

## 3. Core Features
1) Authentication and Session
- Support guest mode with smooth upgrade to authenticated account.
- Persist minimal user profile: id, username, points/credits, streaks, basic settings.
- Handle Supabase unavailability gracefully (fallbacks, local storage).

2) Home Experience
- Hero section, Daily Wisdom quote, and clear calls-to-action.
- Rewards & Golden Credits button: navigates to /rewards and displays current balance and claim states (e.g., free spin, daily reward).
- Invite Friends button: navigates to /referral with easy copy-link and social sharing.
- Compact Daily Tasks widget was removed from Home; Daily Tasks live at /daily-tasks.

3) Rewards & Golden Credits (/rewards)
- View balance and history (earn/spend).
- Daily login reward with claim state.
- Wheel of Destiny free spin state.
- Clear feedback for accrual and redemption.

4) Referral System (/referral)
- Display unique referral link, copy to clipboard.
- Show referred users and earned bonuses.
- Clear explanation of rules and limits.

5) Daily Tasks (/daily-tasks)
- List of tasks (game tasks, social/referral tasks, adverts), each with progress and actions.
- Actions: Play Now (navigate to game), Claim Reward, Watch Ad (if configured).
- Prevent unintended navigation via proper event handling.

6) Games
- Multiple mini-games (e.g., Sacred Tapping, Gates of Knowledge, TicTacToe, etc.).
- Start from /games/:gameId and return to previous context.
- Track basic stats (scores, streaks) with tolerant sync when offline.

7) Leaderboard (/leaderboard)
- Display top users and recent improvements.
- Encourage healthy competition; anti-cheat safeguards.

8) Navigation & Layout
- Mobile-first bottom navigation (Home, Daily Tasks, Rewards, Games, Profile/More).
- No overlapping clickable layers; proper z-index and pointer-events for reliable taps.

## 4. Non-Functional Requirements
- Performance: quick load, responsive interactions; avoid blocking network calls.
- Reliability: graceful degradation when Supabase is unreachable.
- Security & Privacy: protect user data, no secret leakage in client logs.
- Accessibility: semantic HTML, focus states, contrast-aware.
- Observability: console warnings minimized; errors surfaced with friendly UI states.

## 5. Key Flows and Acceptance Criteria
A) Rewards navigation
- Given a logged-in user on Home, when tapping "Access Rewards & Golden Credits", then user navigates to /rewards and sees current points and claim states.

B) Referral navigation
- Given a logged-in user on Home, when tapping "Invite Friends & Earn Rewards", then user navigates to /referral and sees a copyable referral link.

C) Daily Tasks actions
- Tapping "Play Now" on a task navigates to the specified game; it does not trigger any unrelated navigation.
- Tapping "Claim Reward" increases balance and updates UI state.

D) Guest upgrade flow
- A guest can play and accrue local progress; upon sign-in, basic progress syncs without errors.

E) Overlay and propagation safety
- Buttons capture taps even if nearby elements visually overlap; no accidental redirects (e.g., to /daily-tasks).

## 6. Out of Scope (for now)
- Complex marketplace or on-chain wallet integrations.
- Real-money transactions.

## 7. Metrics of Success
- Daily active users, task completion rate, referral conversions, average session length, error rate, and client-side performance metrics (TTI, interaction latency).

## 8. Risks & Mitigations
- Supabase downtime: local fallbacks and retry strategies.
- Event propagation causing mis-navigation: stopPropagation guards and z-index hardening.
- Mobile tap ergonomics: large hit targets, spacing, and no hidden overlays.

## 9. Engineering Notes
- Tech stack: React + Vite, TailwindCSS, Supabase client; Playwright-based test generation via TestSprite MCP.
- Environments: local dev at http://localhost:3001/; production via Git hosting and chosen deploy target.

## 10. Release Checklist
- All critical navigation paths pass automated tests.
- Rewards and Referral flows verified on mobile viewport.
- No console errors on primary pages.
- Documentation updated (this spec, QA test report).