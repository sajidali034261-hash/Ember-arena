import type { ApiRequest, ApiResult, HttpMethod } from "./bridge";
import { DEVICE_LABEL, PRODUCTION_API_BASE, isAllowed } from "./config";
import { clearToken, getToken, saveToken } from "./session";

const METHODS: HttpMethod[] = ["GET", "POST", "PATCH", "DELETE"];
const MAX_BODY_BYTES = 64 * 1024;
const TIMEOUT_MS = 20_000;

let onExpired: () => void = () => {};
export function setExpiredListener(fn: () => void): void {
  onExpired = fn;
}

export function apiBase(): string {
  return PRODUCTION_API_BASE;
}

const fail = (status: number, code: string, message: string): ApiResult<never> => ({ ok: false, status, code, message });

function validate(raw: unknown): ApiRequest | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.method !== "string" || !METHODS.includes(r.method as HttpMethod)) return null;
  if (typeof r.path !== "string" || r.path.length > 200 || !r.path.startsWith("/")) return null;
  if (r.query !== undefined && (typeof r.query !== "object" || r.query === null || Array.isArray(r.query))) return null;
  if (r.body !== undefined && (typeof r.body !== "object" || r.body === null || Array.isArray(r.body))) return null;
  return { method: r.method as HttpMethod, path: r.path, query: r.query as ApiRequest["query"], body: r.body as ApiRequest["body"] };
}

/**
 * Every backend call from the renderer passes through here. Requests are made from the main process,
 * so they carry no browser Origin and the session token never enters the renderer.
 */
export async function handleApiRequest(raw: unknown): Promise<ApiResult<unknown>> {
  const req = validate(raw);
  if (!req) return fail(400, "BAD_REQUEST", "Invalid request.");
  if (!isAllowed(req.method, req.path)) return fail(403, "NOT_AVAILABLE_ON_DESKTOP", "This feature isn't available in the desktop app.");

  const url = new URL(apiBase() + req.path);
  for (const [k, v] of Object.entries(req.query ?? {})) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Device": DEVICE_LABEL,
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let body: string | undefined;
  if (req.method !== "GET") {
    body = JSON.stringify(req.body ?? {});
    if (Buffer.byteLength(body) > MAX_BODY_BYTES) return fail(413, "TOO_LARGE", "That message is too long.");
    headers["Content-Type"] = "application/json";
  }

  let res: Response;
  try {
    res = await fetch(url, { method: req.method, headers, body, signal: AbortSignal.timeout(TIMEOUT_MS), redirect: "error" });
  } catch {
    return fail(0, "NETWORK", "Can't reach the arena. Check your internet connection and try again.");
  }

  let data: unknown = null;
  try {
    const text = await res.text();
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const err = (data as { error?: { code?: string; message?: string } } | null)?.error;
    const isAuthAttempt = req.path === "/auth/login" || req.path === "/auth/signup";
    if (res.status === 401 && token && !isAuthAttempt) {
      clearToken();
      onExpired();
    }
    return fail(res.status, err?.code ?? "HTTP_" + res.status, err?.message ?? "Something went wrong. Please try again.");
  }

  // Capture the session token and strip it before handing the payload to the renderer.
  if ((req.path === "/auth/login" || req.path === "/auth/signup") && data && typeof data === "object") {
    const { token: newToken, ...rest } = data as { token?: unknown };
    if (typeof newToken === "string" && newToken.length >= 32 && newToken.length <= 128) saveToken(newToken);
    data = rest;
  }
  if (req.path === "/auth/delete") clearToken();

  return { ok: true, status: res.status, data };
}

/** Ends the session server-side (best effort) and always forgets it locally, like Android's logout(). */
export async function signOut(allDevices: boolean): Promise<void> {
  if (getToken()) {
    await handleApiRequest({ method: "POST", path: "/auth/logout", body: { all: allDevices === true } }).catch(() => undefined);
  }
  clearToken();
}
