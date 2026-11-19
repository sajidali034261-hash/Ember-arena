// UI test for email + phone signup flows against the MOCK bridge (no production accounts, no network).
// Usage: cd desktop && bun run build:renderer && DIST=dist node scripts/signup-test.mjs
// (playwright must be resolvable — see README or run inside a folder that has it installed)
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { join, extname } from "node:path";

const out = process.env.OUT ?? "/tmp/ember-signup";
mkdirSync(out, { recursive: true });
const dist = process.env.DIST ?? join(import.meta.dirname, "..", "dist");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".webp": "image/webp", ".png": "image/png", ".ttf": "font/ttf" };
const server = createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p === "/") p = "/index.html";
  const f = join(dist, p);
  if (!f.startsWith(dist) || !existsSync(f)) return res.writeHead(404).end();
  res.writeHead(200, { "Content-Type": types[extname(f)] ?? "application/octet-stream" }).end(readFileSync(f));
}).listen(4791);

/** Injected into the page before app code runs: a fake window.ember bridge with signup/verify endpoints. */
function pageMock() {
  const now = Date.now();
  let last = { username: "TestPilot", email: null, phone: null };
  const mkUser = (b, verified) => ({
    id: "u-new", username: b?.username ?? last.username,
    email: b?.email ?? last.email, phone: b?.phone ?? last.phone,
    verified, avatarIndex: 0, createdAt: now,
  });
  window.ember = {
    api: {
      request: async (r) => {
        if (r.path === "/auth/signup" && r.method === "POST") {
          const b = r.body;
          if (!b.email && !b.phone) return { ok: false, status: 400, code: "VALIDATION", message: "Enter an email address or phone number." };
          last = { username: b.username, email: b.email ?? null, phone: b.phone ?? null };
          return {
            ok: true, status: 200,
            data: { user: mkUser(b, false), bonus: 500, verification: { channel: b.phone ? "phone" : "email", devCode: null } },
          };
        }
        if (r.path === "/auth/verify/request") return { ok: true, status: 200, data: { sent: true, channel: r.body?.channel ?? "email", devCode: null } };
        if (r.path === "/auth/verify/confirm") return { ok: true, status: 200, data: { user: mkUser(null, true), bonus: 0, wallet: { balance: 500, earned: 500, spent: 0 } } };
        if (r.path === "/me") return { ok: true, status: 200, data: { user: mkUser(null, false), wallet: { balance: 500, earned: 500, spent: 0 }, unreadNotifications: 0 } };
        return { ok: false, status: 404, code: "NOT_FOUND", message: "Mock: " + r.path };
      },
    },
    session: { hasToken: async () => false, signOut: async () => {}, onExpired: () => () => {} },
    app: { info: async () => ({ version: "1.0.0", platform: "win32", arch: "x64", apiBase: "mock", secureStorage: true }) },
  };
}

const results = [];
const check = (name, cond) => results.push(`${cond ? "PASS" : "FAIL"}  ${name}`);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/usr/bin/chromium" });
const page = await browser.newPage({ viewport: { width: 1366, height: 820 } });
await page.addInitScript(pageMock);
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://localhost:4791/?out#/signup");
await page.waitForTimeout(500);

// --- Email flow (default channel) ---
check("email channel selected by default", (await page.locator(".chipbtn.active").innerText()) === "Email");
check("email field shown", await page.getByPlaceholder("you@example.com").isVisible());
await page.getByPlaceholder("3–20 letters").fill("TestPilot");
await page.getByPlaceholder("you@example.com").fill("pilot@example.com");
await page.locator("input[type=password]").nth(0).fill("passw0rd1");
await page.locator("input[type=password]").nth(1).fill("passw0rd1");
await page.locator("input[type=checkbox]").check();
await page.getByRole("button", { name: "Create account" }).click();
await page.waitForTimeout(400);
check("email signup reaches verify step", page.url().includes("/verify"));
await page.screenshot({ path: join(out, "signup-email-verify.png") });

// --- Phone flow ---
await page.reload(); // reset the mock session so the signed-out signup form renders again
await page.goto("http://localhost:4791/?out#/signup"); // hash change only applies once signed out
await page.waitForTimeout(500);
await page.locator(".chipbtn", { hasText: "Phone" }).click();
check("phone field shown after switching channel", await page.getByPlaceholder("+92 300 1234567").isVisible());
check("email placeholder gone", (await page.getByPlaceholder("you@example.com").count()) === 0);
await page.getByPlaceholder("3–20 letters").fill("TestPilot");
// Invalid phone → client-side block, nothing leaves the app.
await page.getByPlaceholder("+92 300 1234567").fill("300123");
await page.locator("input[type=password]").nth(0).fill("passw0rd1");
await page.locator("input[type=password]").nth(1).fill("passw0rd1");
await page.locator("input[type=checkbox]").check();
await page.getByRole("button", { name: "Create account" }).click();
await page.waitForTimeout(300);
check("invalid phone blocked client-side", await page.getByText("Enter a valid phone number with country code.").isVisible());
await page.screenshot({ path: join(out, "signup-phone-invalid.png") });
// Valid phone with separators → backend-style normalization must accept it.
await page.getByPlaceholder("+92 300 1234567").fill("+92 300 1234567");
await page.getByRole("button", { name: "Create account" }).click();
await page.waitForTimeout(400);
check("valid phone signup reaches verify step", page.url().includes("/verify"));
check("verify page is phone-aware", await page.getByText("Verify your phone").isVisible());
await page.screenshot({ path: join(out, "signup-phone-verify.png") });

console.log(results.join("\n"));
console.log(errors.length ? "Page errors:\n" + errors.join("\n") : "No page errors");
await browser.close();
server.close();
