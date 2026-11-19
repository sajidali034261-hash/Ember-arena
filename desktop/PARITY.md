# Ember Arena — Android ↔ Windows desktop feature parity

Reference: `android-emberarena` (Kotlin/Compose) screens, `ArenaRepository` endpoints and `functions/src` validation.
Both apps talk to the same production backend (`https://vortex-arena-backend.rork.app/api`) with the same accounts.

Status key: **Implemented** · **Not implemented** · **Incompatible / excluded** · **Requires configuration**

## Accounts & auth
| Android feature | Endpoint | Desktop status | Notes |
|---|---|---|---|
| Sign up (username, email, password, confirm, terms) | `POST /auth/signup` | Implemented | Same rules: username `^[A-Za-z0-9_.]{3,20}$`, password 8–128 with a letter and a digit. Signup bonus toast. |
| Log in (username or email) | `POST /auth/login` | Implemented | Server errors (`INVALID_CREDENTIALS`, `BANNED`, `RATE_LIMITED`) shown verbatim. |
| Session restore on launch | `GET /me` | Implemented | Token encrypted with Windows DPAPI via Electron `safeStorage`; never exposed to the UI. |
| Email verification (request + 6-digit code) | `POST /auth/verify/request`, `/auth/verify/confirm` | Implemented | |
| Forgot / reset password | `POST /auth/password/forgot`, `/auth/password/reset` | Requires configuration | UI implemented; emails only arrive once the backend `MAIL_FROM` sender is configured (same as Android). |
| Change password (signs out other devices) | `POST /auth/password/change` | Implemented | |
| Sign out / sign out of all devices | `POST /auth/logout` | Implemented | |
| Delete account (password, coins forfeited) | `POST /auth/delete` | Implemented | |
| Session expiry (401) → back to login | — | Implemented | |

## Main screens
| Android feature | Endpoint | Desktop status | Notes |
|---|---|---|---|
| Home dashboard (hero stats, wallet, daily, arena stats, games, featured, upcoming, recent) | `GET /home` | Implemented | |
| Games list | `GET /games` | Implemented | |
| Game detail (upcoming / live / completed tabs) | `GET /games/:id` | Implemented | |
| Tournament detail (countdown, slots, prizes, format, rules, standings) | `GET /tournaments/:id` | Implemented | |
| Tournament registration (pick game account, min level, fee, balance after) | `POST /tournaments/:id/register` | Implemented | Fee is paid in virtual coins only. |
| Leave tournament (refund) | `POST /tournaments/:id/withdraw` | Implemented | |
| Requirement fixes (link game ID, level, verify, coins) | — | Implemented | "Not enough coins" points to daily rewards instead of a top-up. |
| Room ID / password reveal + copy | (in detail) | Implemented | Clipboard write is the only permission granted. |
| My result | (in detail) | Implemented | |
| My Matches (upcoming / live / completed) | `GET /me/tournaments?tab=` | Implemented | |
| Leaderboard (all-time / weekly / tournaments) | `GET /leaderboard?scope=` | Implemented | |
| Profile (stats, achievements, history, game IDs) | `GET /profile` | Implemented | |
| Edit profile (username, avatar 0–3) | `PATCH /me` | Implemented | |
| Game IDs: list / add / edit / remove | `/game-accounts` | Implemented | Same rules: name 2–24, ID `^[A-Za-z0-9#_.-]{4,32}$`, level 1–100. |
| Notifications (filters, mark read, mark all, deep links) | `GET /notifications`, `POST …/read`, `…/read-all` | Implemented | Includes announcements (`ann:` items). Polls every 30 s while open. |
| Announcements | via `/notifications` | Implemented | |
| Daily rewards (7-day streak, claim, history, verification gate) | `GET /daily`, `POST /daily/claim` | Implemented | |
| Coin wallet balance + transaction history (all / earned / spent, paging) | `GET /wallet/transactions` | Implemented | Read-only. |
| Support hub (tickets, reports, FAQ) | `/support/tickets`, `/support/reports`, `/support/faqs` | Implemented | |
| New ticket / ticket thread / reply | `POST /support/tickets`, `…/messages` | Implemented | Ticket thread polls every 20 s. |
| Report a problem (tournament-linked or general) | `POST /support/reports` | Implemented | |

## Excluded or platform-limited
| Android feature | Desktop status | Reason |
|---|---|---|
| Coin top-up (WhatsApp payment request) | Incompatible / excluded | Desktop policy: no real-money deposits. Blocked in the main-process allowlist (`/wallet/topup`). |
| Coin withdrawal (cash-out request) | Incompatible / excluded | Desktop policy: no withdrawals or cash-outs. Blocked in the allowlist (`/wallet/withdraw`). |
| WhatsApp contact links / external payment config | Incompatible / excluded | Only used by top-up / withdrawal (`/config` is blocked). |
| Push / system notifications | Not implemented | No push service on desktop; the unread badge refreshes every 60 s while the app is open. |
| Pull-to-refresh | Implemented (adapted) | F5 / Ctrl+R refreshes the current page. |
| Admin features | Incompatible / excluded | Desktop is player-only; `/admin/*` is blocked in the main process. |

## Windows adaptations
- Sidebar navigation, Ctrl+1…5 shortcuts, Alt+←/→ back/forward, Ctrl+, settings, Esc closes dialogs, Ctrl+Enter sends a ticket reply.
- Resizable window (min 1024×680), remembers size/position and maximized state; Windows 10/11 title-bar controls.
- Single instance; no app menu; DevTools disabled in packaged builds.
