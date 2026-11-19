import { app, safeStorage } from "electron";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Bearer token storage. The token lives only in the main process and is persisted encrypted with
 * Electron safeStorage (Windows DPAPI, bound to the signed-in Windows user). If OS encryption is
 * unavailable the token is kept in memory only and never written to disk in plain text.
 */
let token: string | null = null;
let loaded = false;

const file = () => join(app.getPath("userData"), "session.bin");

export function secureStorageAvailable(): boolean {
  try {
    return safeStorage.isEncryptionAvailable();
  } catch {
    return false;
  }
}

function load(): void {
  if (loaded) return;
  loaded = true;
  try {
    if (!secureStorageAvailable() || !existsSync(file())) return;
    const value = safeStorage.decryptString(readFileSync(file()));
    if (value.length >= 32 && value.length <= 128) token = value;
  } catch {
    token = null;
    safeDelete();
  }
}

function safeDelete(): void {
  try {
    rmSync(file(), { force: true });
  } catch {
    /* ignore */
  }
}

export function getToken(): string | null {
  load();
  return token;
}

export function saveToken(value: string): void {
  loaded = true;
  token = value;
  if (!secureStorageAvailable()) return;
  try {
    writeFileSync(file(), safeStorage.encryptString(value), { mode: 0o600 });
  } catch {
    /* keep the in-memory session */
  }
}

export function clearToken(): void {
  loaded = true;
  token = null;
  safeDelete();
}
