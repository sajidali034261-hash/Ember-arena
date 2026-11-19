/**
 * Production backend shared with the Android app. Verified against
 * android-emberarena/app/build.gradle.kts → PRODUCTION_API_BASE_URL.
 */
export const PRODUCTION_API_BASE = "https://vortex-arena-backend.rork.app/api";

export const DEVICE_LABEL = "Ember Arena Desktop (Windows)";

type Rule = { method: string; pattern: RegExp };

const ID = "[A-Za-z0-9_\\-:.%]{1,80}";
const rule = (method: string, path: string): Rule => ({
  method,
  pattern: new RegExp("^" + path.replace(/:id/g, ID) + "$"),
});

/**
 * Player-only endpoint allowlist enforced in the main process.
 * Deliberately excluded:
 *  - /admin/*                       (no admin features on desktop)
 *  - /wallet/topup, /wallet/withdraw (real-money deposits/withdrawals are not offered on desktop)
 *  - /config                        (only carries top-up / withdrawal payment config)
 */
export const ALLOWED: Rule[] = [
  rule("GET", "/health"),
  rule("POST", "/auth/signup"),
  rule("POST", "/auth/login"),
  rule("POST", "/auth/logout"),
  rule("POST", "/auth/verify/request"),
  rule("POST", "/auth/verify/confirm"),
  rule("POST", "/auth/password/forgot"),
  rule("POST", "/auth/password/reset"),
  rule("POST", "/auth/password/change"),
  rule("POST", "/auth/delete"),
  rule("GET", "/me"),
  rule("PATCH", "/me"),
  rule("GET", "/home"),
  rule("GET", "/profile"),
  rule("GET", "/wallet"),
  rule("GET", "/wallet/transactions"),
  rule("GET", "/daily"),
  rule("POST", "/daily/claim"),
  rule("GET", "/games"),
  rule("GET", "/games/:id"),
  rule("GET", "/tournaments"),
  rule("GET", "/tournaments/:id"),
  rule("POST", "/tournaments/:id/register"),
  rule("POST", "/tournaments/:id/withdraw"), // leave a tournament (refunds entry coins) — not a cash withdrawal
  rule("GET", "/me/tournaments"),
  rule("GET", "/game-accounts"),
  rule("POST", "/game-accounts"),
  rule("PATCH", "/game-accounts/:id"),
  rule("DELETE", "/game-accounts/:id"),
  rule("GET", "/leaderboard"),
  rule("GET", "/notifications"),
  rule("POST", "/notifications/read-all"),
  rule("POST", "/notifications/:id/read"),
  rule("GET", "/support/faqs"),
  rule("GET", "/support/tickets"),
  rule("POST", "/support/tickets"),
  rule("GET", "/support/tickets/:id"),
  rule("POST", "/support/tickets/:id/messages"),
  rule("GET", "/support/reports"),
  rule("POST", "/support/reports"),
];

export function isAllowed(method: string, path: string): boolean {
  if (path.includes("..") || path.includes("//") || path.startsWith("/admin")) return false;
  return ALLOWED.some((r) => r.method === method && r.pattern.test(path));
}
