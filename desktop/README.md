# Ember Arena for Windows

Electron desktop player app for Windows 10/11 x64. It uses the same production backend, database and accounts as the Android app. It has no admin features, no real-money top-ups and no withdrawals. Coins are virtual and can't be redeemed.

See [PARITY.md](./PARITY.md) for the feature-by-feature comparison with Android.

## Develop
```bash
cd desktop
bun install
bun run build:renderer          # build the UI into dist/
bun run dev                     # compile electron/ and launch the app
```
Hot reload: run `bun run dev:renderer` in one terminal. In another, start Electron with `VITE_DEV_SERVER_URL=http://localhost:5173` (unpackaged builds only).

Checks:
```bash
bun run typecheck
bun run build
```

## Build the Windows installer
- **On Windows:** run `bun run dist:win`. The installer is written to `release/EmberArena-Setup-<version>-x64.exe`.
- **GitHub Actions:** run the **Build Windows desktop app** workflow (`.github/workflows/build-windows.yml`, manual trigger). It builds on `windows-latest` and uploads the `.exe` as a workflow artifact. It never publishes a release and uses no secrets.

The installer isn't code-signed, so SmartScreen shows a warning on first run. To sign it, add a certificate through electron-builder's `CSC_LINK` / `CSC_KEY_PASSWORD` secrets.

## Security model
- The renderer runs with `contextIsolation`, `sandbox` and no Node integration.
- The UI is served from a custom `app://ember` protocol with a strict CSP.
- Navigation, new windows, webviews and all permissions are blocked. The one exception is clipboard text write, used for copying room IDs.
- All API calls go through the main process (`electron/api.ts`). They're limited to a player-only allowlist (`electron/config.ts`). Admin, top-up, withdrawal and payment-config routes are rejected before any network call.
- The session token is stored encrypted with Electron `safeStorage` (Windows DPAPI) in the user's app data folder and never reaches the renderer. If encryption isn't available, the token stays in memory only.
- The app contains no admin keys, API secrets or private keys.

## Known limitations
- No push notifications. The unread badge refreshes every minute while the app is open.
- Password-reset emails depend on the backend mail sender (`MAIL_FROM`) being configured.
- Coin top-up and withdrawal are intentionally unavailable on desktop.
