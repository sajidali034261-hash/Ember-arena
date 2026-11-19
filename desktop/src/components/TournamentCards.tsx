import type { ReactNode } from "react";
import { Clock, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { TournamentCard } from "../lib/types";
import { countdown, dateTime, fmt, safeColor, startsLabel } from "../lib/format";
import { Coin, Progress } from "./ui";

export function bannerStyle(url?: string | null) {
  // Admin-provided banners are remote https images; fall back to the bundled hero art.
  const safe = url && /^https:\/\/[^\s"'()\\]+$/.test(url) ? url : "/img/img_hero.webp";
  return { backgroundImage: `url("${safe}")` };
}

export function StatusPill({ t, now }: { t: Pick<TournamentCard, "status" | "startsAt">; now: number }) {
  if (t.status === "live") return <span className="pill live"><span className="livedot" /> Live</span>;
  if (t.status === "completed") return <span className="pill muted">Completed</span>;
  if (t.status === "cancelled") return <span className="pill muted">Cancelled</span>;
  return <span className="pill orange">{t.startsAt - now <= 0 ? "Starting" : countdown(t.startsAt - now)}</span>;
}

export function FeaturedTournamentCard({ t, now }: { t: TournamentCard; now: number }) {
  const nav = useNavigate();
  return (
    <div className="card flush click fcard" onClick={() => nav(`/tournament/${t.id}`)} role="link" tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && nav(`/tournament/${t.id}`)}>
      <div className="banner" style={bannerStyle(t.bannerUrl)}>
        <span className="pill tag" style={{ color: safeColor(t.accent), borderColor: "transparent" }}>{t.gameShortName || t.gameName}</span>
        <span className="status"><StatusPill t={t} now={now} /></span>
      </div>
      <div style={{ padding: "12px 16px 16px" }}>
        <div className="h3 ellipsis">{t.title}</div>
        <div className="ministats">
          <div>
            <Clock size={17} color="var(--muted)" />
            <span><b className="orange">{t.status === "live" ? "Live now" : countdown(t.startsAt - now)}</b><small>{t.status === "live" ? "Status" : "Starts in"}</small></span>
          </div>
          <div>
            <Users size={17} color="var(--muted)" />
            <span><b>{t.registered}/{t.slots}</b><small>players</small></span>
          </div>
          <div>
            <Coin size={15} />
            <span><b className="gold">{fmt(t.prizePool)}</b><small>coins pool</small></span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TournamentRowCard({ t, now, trailing, footer }: { t: TournamentCard; now: number; trailing?: ReactNode; footer?: ReactNode }) {
  const nav = useNavigate();
  return (
    <div className="card flush click" onClick={() => nav(`/tournament/${t.id}`)} role="link" tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && nav(`/tournament/${t.id}`)}>
      <div className="rcard">
        <div className="banner" style={bannerStyle(t.bannerUrl)} />
        <div className="body2">
          <div className="row" style={{ gap: 8 }}>
            <span className="label grow ellipsis" style={{ color: safeColor(t.accent) }}>{t.gameName}</span>
            {t.status === "live" && <span className="row" style={{ gap: 5 }}><span className="livedot" /><span className="label" style={{ color: "var(--live)" }}>Live</span></span>}
          </div>
          <div className="h3 ellipsis">{t.title}</div>
          <div className="muted small ellipsis">
            {[t.mode, t.perspective, t.status === "upcoming" ? startsLabel(t.startsAt, now) : dateTime(t.startsAt)].filter(Boolean).join(" · ")}
          </div>
          <div className="row" style={{ gap: 12 }}>
            <Coin amount={t.prizePool} size={14} />
            <span className="small" style={{ color: t.entryFee === 0 ? "var(--success)" : "var(--muted)", fontWeight: 600 }}>
              {t.entryFee === 0 ? "Free entry" : `${fmt(t.entryFee)} entry`}
            </span>
            <span className="grow" />
            {trailing}
          </div>
        </div>
      </div>
      {t.status === "upcoming" && !footer && <Progress value={t.slots === 0 ? 0 : t.registered / t.slots} />}
      {footer}
    </div>
  );
}
