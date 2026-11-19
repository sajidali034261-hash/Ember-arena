/**
 * Contract between the preload script and the renderer. The renderer only ever sees this
 * narrow surface: no Node APIs, no filesystem, and never the session token.
 */
export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export interface ApiRequest {
  method: HttpMethod;
  path: string;
  query?: Record<string, string | number | undefined | null>;
  body?: Record<string, unknown>;
}

export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; code: string; message: string };

export interface AppInfo {
  version: string;
  platform: string;
  arch: string;
  apiBase: string;
  secureStorage: boolean;
}

export interface EmberBridge {
  api: {
    request<T = unknown>(req: ApiRequest): Promise<ApiResult<T>>;
  };
  session: {
    hasToken(): Promise<boolean>;
    signOut(allDevices: boolean): Promise<void>;
    onExpired(cb: () => void): () => void;
  };
  app: {
    info(): Promise<AppInfo>;
  };
}

declare global {
  interface Window {
    ember: EmberBridge;
  }
}
