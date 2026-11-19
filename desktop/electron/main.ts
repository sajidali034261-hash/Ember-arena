import { app, BrowserWindow, ipcMain, Menu, net, protocol, session, shell } from "electron";
import { existsSync, statSync } from "node:fs";
import { extname, join, normalize, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { apiBase, handleApiRequest, setExpiredListener, signOut } from "./api";
import { getToken, secureStorageAvailable } from "./session";
import { loadWindowState, trackWindowState } from "./windowState";

const APP_SCHEME = "app";
const APP_HOST = "ember";
const APP_URL = `${APP_SCHEME}://${APP_HOST}/index.html`;
const DEV_URL = !app.isPackaged ? process.env.VITE_DEV_SERVER_URL : undefined;
const DIST = join(__dirname, "..", "dist");

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  "connect-src 'self'",
  "media-src 'none'",
  "object-src 'none'",
  "frame-src 'none'",
  "worker-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join("; ");

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
};

protocol.registerSchemesAsPrivileged([
  { scheme: APP_SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true, codeCache: true } },
]);

if (process.platform === "win32") app.setAppUserModelId("app.rork.emberarena.desktop");

let mainWindow: BrowserWindow | null = null;

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });
  app.whenReady().then(start);
}

function serveApp(): void {
  protocol.handle(APP_SCHEME, async (request) => {
    const url = new URL(request.url);
    if (url.host !== APP_HOST) return new Response("Not found", { status: 404 });
    let rel = decodeURIComponent(url.pathname);
    if (rel === "/" || rel === "") rel = "/index.html";
    const target = normalize(join(DIST, rel));
    // Block path traversal outside the bundled renderer.
    const inside = target === DIST || target.startsWith(DIST + sep);
    const file = inside && existsSync(target) && statSync(target).isFile() ? target : join(DIST, "index.html");
    const res = await net.fetch(pathToFileURL(file).toString());
    return new Response(res.body, {
      status: 200,
      headers: {
        "Content-Type": MIME[extname(file).toLowerCase()] ?? "application/octet-stream",
        "Content-Security-Policy": CSP,
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
      },
    });
  });
}

function hardenSession(): void {
  const s = session.defaultSession;
  // Deny everything except writing plain text to the clipboard ("Copy room ID").
  s.setPermissionRequestHandler((_wc, perm, cb) => cb(perm === "clipboard-sanitized-write"));
  s.setPermissionCheckHandler((_wc, perm) => perm === "clipboard-sanitized-write");
  // Remote banner images must not set cookies or leak a referrer.
  s.webRequest.onBeforeSendHeaders((details, cb) => {
    const headers = { ...details.requestHeaders };
    delete headers.Referer;
    delete headers.Cookie;
    cb({ requestHeaders: headers });
  });
}

function registerIpc(): void {
  ipcMain.handle("api:request", (event, req: unknown) => {
    if (!isTrustedSender(event.senderFrame?.url)) return { ok: false, status: 403, code: "FORBIDDEN", message: "Forbidden" };
    return handleApiRequest(req);
  });
  ipcMain.handle("session:has", (event) => isTrustedSender(event.senderFrame?.url) && getToken() !== null);
  ipcMain.handle("session:signOut", async (event, all: unknown) => {
    if (!isTrustedSender(event.senderFrame?.url)) return;
    await signOut(all === true);
  });
  ipcMain.handle("app:info", () => ({
    version: app.getVersion(),
    platform: process.platform,
    arch: process.arch,
    apiBase: apiBase(),
    secureStorage: secureStorageAvailable(),
  }));
  setExpiredListener(() => mainWindow?.webContents.send("session:expired"));
}

function isTrustedSender(url: string | undefined): boolean {
  if (!url) return false;
  if (url.startsWith(`${APP_SCHEME}://${APP_HOST}/`)) return true;
  return !!DEV_URL && url.startsWith(DEV_URL);
}

function createWindow(): void {
  const state = loadWindowState();
  mainWindow = new BrowserWindow({
    ...state.bounds,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    backgroundColor: "#0D0B0A",
    title: "Ember Arena",
    icon: join(__dirname, "..", "build", "icon.ico"),
    titleBarStyle: "hidden",
    titleBarOverlay: { color: "#0D0B0A", symbolColor: "#F5EFEA", height: 40 },
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      webviewTag: false,
      spellcheck: true,
      devTools: !app.isPackaged,
    },
  });
  if (state.maximized) mainWindow.maximize();
  trackWindowState(mainWindow);

  const wc = mainWindow.webContents;
  wc.setWindowOpenHandler(({ url }) => {
    // Only well-formed https links open, and only in the user's browser.
    if (url.startsWith("https://")) void shell.openExternal(url);
    return { action: "deny" };
  });
  wc.on("will-navigate", (e, url) => {
    if (!isTrustedSender(url)) e.preventDefault();
  });
  wc.on("will-attach-webview", (e) => e.preventDefault());
  wc.on("before-input-event", (e, input) => {
    if (!app.isPackaged && input.type === "keyDown" && input.key === "F12") {
      wc.toggleDevTools();
      e.preventDefault();
    }
  });

  mainWindow.once("ready-to-show", () => mainWindow?.show());
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  void mainWindow.loadURL(DEV_URL ?? APP_URL);
}

function start(): void {
  Menu.setApplicationMenu(null);
  hardenSession();
  serveApp();
  registerIpc();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}

app.on("web-contents-created", (_e, contents) => {
  contents.on("will-attach-webview", (e) => e.preventDefault());
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
