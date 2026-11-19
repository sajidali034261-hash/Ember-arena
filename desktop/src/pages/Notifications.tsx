import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Gift, Megaphone, ShieldAlert, Timer, Trophy, UserCheck, Headset } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import { useLoad, useNow, useStore } from "../lib/store";
import type { AppNotification } from "../lib/types";
import { relative } from "../lib/format";
import { Button, Empty, ErrorState, Loading, PageHead, useToast } from "../components/ui";

const FILTERS: { id: string | null; label: string }[] = [
  { id: null, label: "All" }, { id: "tournament", label: "Reminders" }, { id: "registration", label: "Registrations" },
  { id: "result", label: "Results" }, { id: "reward", label: "Rewards" }, { id: "announcement", label: "News" },
  { id: "admin", label: "Admin" }, { id: "support", label: "Support" },
];

function style(type: string): [LucideIcon, string] {
  switch (type) {
    case "tournament": return [Timer, "var(--orange)"];
    case "registration": return [UserCheck, "var(--success)"];
    case "result": return [Trophy, "var(--gold)"];
    case "reward": return [Gift, "var(--gold)"];
    case "announcement": return [Megaphone, "var(--info)"];
    case "admin": return [ShieldAlert, "var(--info)"];
    case "support": return [Headset, "var(--success)"];
    default: return [Bell, "var(--muted)"];
  }
}

export function NotificationsPage() {
  const nav = useNavigate();
  const toast = useToast();
  const now = useNow(30_000);
  const { setUnread } = useStore();
  const [filter, setFilter] = useState<string | null>(null);
  const list = useLoad(api.notifications, []);
  const { reload } = list;

  useEffect(() => {
    if (list.data) setUnread(list.data.unreadCount);
  }, [list.data, setUnread]);

  // Poll like Android so admin results/announcements/replies arrive while open.
  useEffect(() => {
    const t = setInterval(() => document.visibilityState === "visible" && reload(), 30_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markLocal = (pred: (n: AppNotification) => boolean) => {
    if (!list.data) return;
    const items = list.data.items.map((n) => (pred(n) ? { ...n, read: true } : n));
    const unreadCount = items.filter((n) => !n.read).length;
    list.setData({ items, unreadCount });
  };

  const open = (n: AppNotification) => {
    if (!n.read) {
      markLocal((x) => x.id === n.id);
      api.markRead(n.id).catch(() => undefined);
    }
    if (n.refType === "tournament" && n.refId) nav(`/tournament/${n.refId}`);
    else if (n.refType === "ticket" && n.refId) nav(`/support/ticket/${n.refId}`);
    else if (n.refType === "report") nav("/support");
    else if (n.refType === "daily") nav("/daily");
  };

  const markAll = async () => {
    try {
      await api.markAllRead();
      markLocal(() => true);
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  };

  return (
    <div className="page narrow">
      <PageHead title="Notifications" subtitle={list.data ? `${list.data.unreadCount} unread` : undefined}>
        <Button variant="ghost" onClick={markAll} disabled={!list.data?.unreadCount}><CheckCheck size={16} /> Mark all read</Button>
      </PageHead>
      <div className="chipbar" style={{ flexWrap: "wrap", marginBottom: 16 }}>
        {FILTERS.map((f) => (
          <button key={f.label} className={`chipbtn ${filter === f.id ? "active" : ""}`} onClick={() => setFilter(f.id)}>{f.label}</button>
        ))}
      </div>
      {list.loading && !list.data ? <Loading /> : list.error && !list.data ? <ErrorState message={list.error} onRetry={reload} /> : (() => {
        const items = list.data!.items.filter((n) => filter === null || n.type === filter);
        if (items.length === 0) return <div className="card"><Empty title="All caught up" body="Tournament reminders, results, rewards and admin messages show up here." /></div>;
        return (
          <div className="col" style={{ gap: 10 }}>
            {items.map((n) => {
              const [Icon, tint] = style(n.type);
              const clickable = !!n.refType && (n.refType === "report" || n.refType === "daily" || !!n.refId);
              return (
                <div key={n.id} className={`card ${clickable || !n.read ? "click" : ""}`} onClick={() => open(n)} role="button" tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && open(n)}
                  style={{ padding: "14px 16px", borderColor: n.read ? undefined : "var(--hot)", background: n.read ? undefined : "linear-gradient(90deg, rgba(255,90,31,0.07), var(--surface) 40%)" }}>
                  <div className="row" style={{ gap: 14, alignItems: "flex-start" }}>
                    <span style={{ width: 38, height: 38, borderRadius: 12, display: "grid", placeItems: "center", background: `color-mix(in srgb, ${tint} 14%, transparent)`, flex: "none" }}>
                      <Icon size={19} color={tint} />
                    </span>
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div className="row" style={{ gap: 8 }}>
                        <b className="grow ellipsis">{n.title}</b>
                        <span className="small dim" style={{ flex: "none" }}>{relative(n.createdAt, now)}</span>
                        {!n.read && <span className="badge" style={{ width: 8, height: 8, minWidth: 8, padding: 0 }} />}
                      </div>
                      <div className="muted small selectable" style={{ marginTop: 3, whiteSpace: "pre-wrap" }}>{n.body}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}
