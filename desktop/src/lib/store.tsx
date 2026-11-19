import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { api, ApiError, errorMessage } from "./api";
import type { User, Wallet } from "./types";

type Phase = "boot" | "signedOut" | "signedIn";

interface Store {
  phase: Phase;
  bootError: string | null;
  user: User | null;
  wallet: Wallet;
  unread: number;
  /** Server-synced clock; countdowns use server time like Android's ArenaRepository.now(). */
  now: () => number;
  syncClock: (serverTime: number) => void;
  setUser: (u: User) => void;
  setWallet: (w: Wallet) => void;
  setUnread: (n: number | ((n: number) => number)) => void;
  refreshMe: () => Promise<void>;
  signedIn: (u: User) => Promise<void>;
  signOut: (allDevices?: boolean) => Promise<void>;
  retryBoot: () => void;
}

const Ctx = createContext<Store | null>(null);
const EMPTY_WALLET: Wallet = { balance: 0, earned: 0, spent: 0 };

export function StoreProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>("boot");
  const [bootError, setBootError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet>(EMPTY_WALLET);
  const [unread, setUnread] = useState(0);
  const skew = useRef(0);
  const [bootKey, setBootKey] = useState(0);

  const now = useCallback(() => Date.now() + skew.current, []);
  const syncClock = useCallback((serverTime: number) => {
    if (serverTime > 0) skew.current = serverTime - Date.now();
  }, []);

  const clearLocal = useCallback(() => {
    setUser(null);
    setWallet(EMPTY_WALLET);
    setUnread(0);
    setPhase("signedOut");
  }, []);

  const refreshMe = useCallback(async () => {
    const me = await api.me();
    setUser(me.user);
    setWallet(me.wallet);
    setUnread(me.unreadNotifications);
  }, []);

  // Restore a stored session on launch (Android: ArenaRepository.restore()).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBootError(null);
      try {
        const has = await window.ember.session.hasToken();
        if (!has) return !cancelled && setPhase("signedOut");
        await refreshMe();
        if (!cancelled) setPhase("signedIn");
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 401) clearLocal();
        else setBootError(errorMessage(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bootKey, refreshMe, clearLocal]);

  useEffect(() => window.ember?.session.onExpired(() => clearLocal()), [clearLocal]);

  // Keep the unread badge and balance fresh while the app is open.
  useEffect(() => {
    if (phase !== "signedIn") return;
    const t = setInterval(() => {
      if (document.visibilityState === "visible") refreshMe().catch(() => undefined);
    }, 60_000);
    return () => clearInterval(t);
  }, [phase, refreshMe]);

  const signedIn = useCallback(async (u: User) => {
    setUser(u);
    await refreshMe().catch(() => undefined);
    setPhase("signedIn");
  }, [refreshMe]);

  const signOut = useCallback(async (allDevices = false) => {
    await window.ember.session.signOut(allDevices);
    clearLocal();
  }, [clearLocal]);

  const value = useMemo<Store>(() => ({
    phase, bootError, user, wallet, unread, now, syncClock,
    setUser, setWallet, setUnread, refreshMe, signedIn, signOut,
    retryBoot: () => setBootKey((k) => k + 1),
  }), [phase, bootError, user, wallet, unread, now, syncClock, refreshMe, signedIn, signOut]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("StoreProvider missing");
  return s;
}

/** Ticking server-synced clock (Android rememberNow). */
export function useNow(intervalMs = 1000): number {
  const { now } = useStore();
  const [t, setT] = useState(now());
  useEffect(() => {
    const id = setInterval(() => setT(now()), intervalMs);
    return () => clearInterval(id);
  }, [now, intervalMs]);
  return t;
}

export interface Loadable<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
  setData: (d: T) => void;
}

/** Fetches on mount / when deps change; also refetches on the global "ember:refresh" (F5 / Ctrl+R) event. */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[]): Loadable<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fnRef.current()
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(errorMessage(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ...deps]);

  useEffect(() => {
    const h = () => setKey((k) => k + 1);
    window.addEventListener("ember:refresh", h);
    return () => window.removeEventListener("ember:refresh", h);
  }, []);

  return { data, error, loading, reload: () => setKey((k) => k + 1), setData };
}
