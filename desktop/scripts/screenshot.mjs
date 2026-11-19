// Visual smoke test: serves dist/ and screenshots key screens with a MOCK bridge (no network, no real data).
// Usage: bun run build:renderer && bun scripts/screenshot.mjs /tmp/ember-shots
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { join, extname } from "node:path";

const out = process.argv[2] ?? "/tmp/ember-shots";
mkdirSync(out, { recursive: true });
const dist = process.env.DIST ?? join(import.meta.dirname, "..", "dist");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".webp": "image/webp", ".png": "image/png", ".ttf": "font/ttf" };
const server = createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p === "/") p = "/index.html";
  const f = join(dist, p);
  if (!f.startsWith(dist) || !existsSync(f)) return res.writeHead(404).end();
  res.writeHead(200, { "Content-Type": types[extname(f)] ?? "application/octet-stream" }).end(readFileSync(f));
}).listen(4789);

const mock = () => {
  const now = Date.now();
  const H = 3600e3;
  const user = { id: "u1", username: "BlazeRunner", email: "blaze@example.com", verified: true, avatarIndex: 2, createdAt: now - 90 * 24 * H };
  const wallet = { balance: 1850, earned: 3200, spent: 1350 };
  const card = (i, status, extra = {}) => ({ id: "t" + i, title: ["Inferno Cup", "Night Squad Clash", "Solo Sniper Duel", "Weekend Warzone"][i % 4], gameId: "pubg", gameName: "PUBG Mobile", gameShortName: "PUBG", bannerUrl: null, accent: "#FFB020", mode: "Squad", perspective: "TPP", map: "Erangel", startsAt: now + (i + 1) * 5 * H, slots: 100, registered: 40 + i * 9, entryFee: i % 2 ? 50 : 0, prizePool: 2000 + i * 500, status, featured: i < 2, ...extra });
  const stats = { points: 1240, wins: 7, matches: 31, kills: 112, podiums: 12, rank: 18, tournamentsJoined: 14 };
  const daily = { canClaim: true, claimedToday: false, requiresVerification: false, currentStreak: 3, nextDay: 4, nextAmount: 40, todayAmount: 0, schedule: [10, 20, 30, 40, 50, 75, 150], nextClaimAt: now + 6 * H, serverTime: now, history: [{ date: "2026-10-25", streakDay: 3, amount: 30 }, { date: "2026-10-24", streakDay: 2, amount: 20 }] };
  const entries = Array.from({ length: 12 }, (_, i) => ({ rank: i + 1, userId: "p" + i, username: ["ViperX", "Kairo", "NovaFang", "BlazeRunner", "Zed", "Mira", "Orion", "Hex", "Talon", "Rook", "Sable", "Juno"][i], avatarIndex: i % 4, points: 3000 - i * 170, wins: 20 - i, matches: 40 - i, kills: 300 - i * 15, podiums: 15 - i, isMe: i === 3 }));
  const data = {
    "/me": { user, wallet, unreadNotifications: 3 },
    "/home": { user, wallet, daily, stats, unreadNotifications: 3, featured: [card(0, "upcoming"), card(1, "live")], upcoming: [card(2, "upcoming"), card(3, "upcoming")], recent: [card(4, "completed")], games: [{ id: "pubg", name: "PUBG Mobile", shortName: "PUBG", accent: "#FFB020" }, { id: "ff", name: "Free Fire", shortName: "FF", accent: "#FF5A1F" }], serverTime: now },
    "/daily": daily,
    "/leaderboard": { scope: "players", entries, me: entries[3], tournaments: [], reward: "Top 3 each week earn bonus coins." },
    "/profile": { user, wallet, stats, accounts: [{ id: "a1", gameId: "pubg", inGameName: "Blaze", inGameId: "5123456789", level: 64, verified: true, createdAt: now }], achievements: [{ id: "x1", title: "First Blood", description: "Play your first tournament", unlocked: true, progress: 1, target: 1 }, { id: "x2", title: "Podium Hunter", description: "Finish top 3 ten times", unlocked: false, progress: 7, target: 10 }, { id: "x3", title: "Streaker", description: "7 day daily streak", unlocked: false, progress: 3, target: 7 }, { id: "x4", title: "Champion", description: "Win a tournament", unlocked: true, progress: 1, target: 1 }], history: [{ tournament: card(5, "completed"), result: { placement: 2, kills: 6, points: 80, prize: 300 } }] },
    "/wallet/transactions": { items: [{ id: "w1", amount: 30, type: "daily", description: "Daily reward · Day 3", balanceAfter: 1850, createdAt: now - H }, { id: "w2", amount: -50, type: "entry", description: "Entry · Night Squad Clash", balanceAfter: 1820, createdAt: now - 20 * H }], nextCursor: null, wallet },
    "/notifications": { items: [{ id: "n1", type: "result", title: "Results are in", body: "You placed 2nd in Inferno Cup (+300 coins).", refType: "tournament", refId: "t0", read: false, createdAt: now - 2 * H }, { id: "ann:1", type: "announcement", title: "Season 3 starts Friday", body: "New maps and bigger reward pools.", read: true, createdAt: now - 30 * H }], unreadCount: 1 },
    "/support/tickets": { items: [{ id: "k1", subject: "Room ID not shown", category: "tournament", status: "answered", createdAt: now - 50 * H, updatedAt: now - 3 * H, lastMessage: "Fixed, sorry about that!", lastSender: "support" }] },
    "/support/reports": { items: [] },
    "/support/faqs": { items: [{ id: "f1", question: "Can I withdraw coins?", answer: "Not from the desktop app. Coins are virtual." }] },
    "/tournaments/t0": { ...card(0, "upcoming"), subtitle: "Erangel squads", format: "4 matches, points system", rules: ["No emulators", "Be in lobby 10 min early"], prizes: [1000, 600, 400], minLevel: 30, registrationClosesAt: now + 4 * H, requirements: [{ key: "game_account", label: "PUBG account linked", met: true }, { key: "coins", label: "Enough coins", met: true }], eligible: true, accounts: [{ id: "a1", gameId: "pubg", inGameName: "Blaze", inGameId: "5123456789", level: 64, verified: true, createdAt: now }], accountIdLabel: "Character ID", registration: null, room: null, roomRevealAt: now + 4.5 * H, myResult: null, results: [], serverTime: now },
  };
  window.ember = {
    api: { request: async (r) => { const d = data[r.path]; return d ? { ok: true, status: 200, data: d } : { ok: false, status: 404, code: "NOT_FOUND", message: "Mock: " + r.path }; } },
    session: { hasToken: async () => !location.search.includes("out"), signOut: async () => {}, onExpired: () => () => {} },
    app: { info: async () => ({ version: "1.0.0", platform: "win32", arch: "x64", apiBase: "mock", secureStorage: true }) },
  };
};

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/usr/bin/chromium" });
const page = await browser.newPage({ viewport: { width: 1366, height: 820 } });
await page.addInitScript(mock);
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const shots = [["login", "?out#/login"], ["home", "#/"], ["tournament", "#/tournament/t0"], ["ranks", "#/ranks"], ["profile", "#/profile"], ["daily", "#/daily"], ["wallet", "#/wallet"], ["notifications", "#/notifications"], ["support", "#/support"], ["settings", "#/settings"]];
for (const [name, path] of shots) {
  await page.goto(`http://localhost:4789/${path}`);
  await page.waitForTimeout(700);
  await page.screenshot({ path: join(out, `${name}.png`) });
}
console.log(errors.length ? "Page errors:\n" + errors.join("\n") : "No page errors");
await browser.close();
server.close();
