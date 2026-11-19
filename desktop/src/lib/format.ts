// Port of android-emberarena/.../ui/common/Format.kt

const nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export const fmt = (n: number) => nf.format(n);
export const signed = (n: number) => (n > 0 ? `+${fmt(n)}` : n < 0 ? `-${fmt(-n)}` : "0");

const pad = (n: number) => String(n).padStart(2, "0");

/** "02:14:09" under a day, "2d 04h" beyond. */
export function countdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const total = Math.floor(ms / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return d > 0 ? `${d}d ${pad(h)}h` : `${pad(h)}:${pad(m)}:${pad(s)}`;
}

const dtf = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(undefined, o);
export const dateTime = (ms: number) =>
  `${dtf({ month: "short", day: "numeric" }).format(ms)} · ${dtf({ hour: "numeric", minute: "2-digit" }).format(ms)}`;
export const timeOnly = (ms: number) => dtf({ hour: "numeric", minute: "2-digit" }).format(ms);
export const shortDate = (ms: number) => dtf({ month: "short", day: "numeric" }).format(ms);
export const monthYear = (ms: number) => dtf({ month: "long", year: "numeric" }).format(ms);

export function isoDateLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return Number.isNaN(d.getTime()) ? iso : shortDate(d.getTime());
}

export function relative(ms: number, now: number): string {
  const diff = Math.max(0, now - ms) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d ago`;
  return shortDate(ms);
}

export function ordinal(n: number): string {
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th";
  return `${n}${suffix}`;
}

export function safeColor(hex: string | undefined | null, fallback = "#FF5A1F"): string {
  return hex && /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(hex) ? hex : fallback;
}

export function startsLabel(startsAt: number, now: number): string {
  const ms = startsAt - now;
  if (ms <= 0) return "Starting";
  if (ms < 86400_000) return `in ${countdown(ms)}`;
  return dateTime(startsAt);
}

export const titleCase = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
