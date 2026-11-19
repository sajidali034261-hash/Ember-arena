import { useNavigate } from "react-router-dom";
import { Award, ChevronRight, Lock, Pencil, Settings, ShieldCheck } from "lucide-react";
import { api } from "../lib/api";
import { useLoad, useNow, useStore } from "../lib/store";
import { fmt, monthYear, ordinal } from "../lib/format";
import { Avatar, Button, Coin, Empty, ErrorState, Loading, PageHead, Progress } from "../components/ui";
import { TournamentRowCard } from "../components/TournamentCards";

export function ProfilePage() {
  const store = useStore();
  const nav = useNavigate();
  const now = useNow();
  const p = useLoad(async () => {
    const d = await api.profile();
    store.setUser(d.user);
    store.setWallet(d.wallet);
    return d;
  }, []);

  if (p.loading && !p.data) return <Loading />;
  if (p.error && !p.data) return <div className="page"><ErrorState message={p.error} onRetry={p.reload} /></div>;
  const d = p.data!;
  const unlocked = d.achievements.filter((a) => a.unlocked).length;

  return (
    <div className="page">
      <PageHead title="Profile">
        <Button variant="ghost" onClick={() => nav("/settings")}><Settings size={16} /> Settings</Button>
      </PageHead>

      <div className="grid" style={{ gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)" }}>
        <div className="card hot">
          <div className="row" style={{ gap: 18 }}>
            <Avatar index={d.user.avatarIndex} size={88} />
            <div className="grow">
              <div className="h1">{d.user.username}</div>
              <div className="row small" style={{ gap: 10, marginTop: 4 }}>
                {d.user.verified ? <span className="pill success"><ShieldCheck size={13} /> Verified</span> : <button className="pill" style={{ cursor: "pointer", color: "var(--gold)" }} onClick={() => nav("/verify")}>Verify email</button>}
                <span className="muted">Member since {monthYear(d.user.createdAt)}</span>
              </div>
            </div>
            <Button variant="ghost" small onClick={() => nav("/settings/profile")}><Pencil size={14} /> Edit</Button>
          </div>
          <div className="grid g4" style={{ marginTop: 22 }}>
            <Stat v={d.stats.rank ? `#${d.stats.rank}` : "—"} k="Global rank" accent />
            <Stat v={fmt(d.stats.points)} k="Points" />
            <Stat v={fmt(d.stats.wins)} k="Wins" />
            <Stat v={fmt(d.stats.podiums)} k="Podiums" />
            <Stat v={fmt(d.stats.matches)} k="Matches" />
            <Stat v={fmt(d.stats.kills)} k="Kills" />
            <Stat v={fmt(d.stats.tournamentsJoined)} k="Tournaments" />
            <Stat v={d.stats.matches ? `${Math.round((d.stats.wins / d.stats.matches) * 100)}%` : "—"} k="Win rate" />
          </div>
        </div>

        <div className="col">
          <div className="card click" onClick={() => nav("/wallet")}>
            <div className="label">Coins (virtual)</div>
            <div style={{ marginTop: 8 }}><Coin amount={d.wallet.balance} size={28} className="big" /></div>
            <div className="row small muted" style={{ marginTop: 8, gap: 16 }}>
              <span>Earned <b className="success">{fmt(d.wallet.earned)}</b></span>
              <span>Spent <b style={{ color: "var(--text)" }}>{fmt(d.wallet.spent)}</b></span>
            </div>
          </div>
          <div className="card flush">
            <div className="row between" style={{ padding: "14px 18px 8px" }}>
              <span className="h3">Game IDs</span>
              <Button variant="text" onClick={() => nav("/accounts")}>Manage <ChevronRight size={15} /></Button>
            </div>
            {d.accounts.length === 0 ? <div style={{ padding: "0 18px 16px" }} className="muted small">No game accounts linked yet.</div> : d.accounts.map((a) => (
              <div key={a.id} className="listrow">
                <div className="grow">
                  <div style={{ fontWeight: 700 }}>{a.inGameName} {a.verified && <ShieldCheck size={13} color="var(--success)" style={{ verticalAlign: -2 }} />}</div>
                  <div className="small muted">ID {a.inGameId} · Lv {a.level}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section">
        <div className="sechead"><h2 className="h2">Achievements</h2><span className="muted">{unlocked}/{d.achievements.length} unlocked</span></div>
        <div className="grid g4">
          {d.achievements.map((a) => (
            <div key={a.id} className="card" style={{ opacity: a.unlocked ? 1 : 0.8, borderColor: a.unlocked ? "var(--hot)" : undefined }}>
              <div className="row" style={{ gap: 10 }}>
                {a.unlocked ? <Award color="var(--gold)" /> : <Lock color="var(--dim)" size={20} />}
                <div className="h3 grow ellipsis">{a.title}</div>
              </div>
              <div className="small muted" style={{ margin: "6px 0 10px", minHeight: 36 }}>{a.description}</div>
              <Progress value={a.target ? a.progress / a.target : 0} />
              <div className="small dim" style={{ marginTop: 4 }}>{a.progress}/{a.target}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="sechead"><h2 className="h2">Match history</h2></div>
        {d.history.length === 0 ? <div className="card"><Empty title="No matches played yet" body="Join a tournament to start building your history." /></div> : (
          <div className="grid g2">
            {d.history.map((h) => (
              <TournamentRowCard key={h.tournament.id} t={h.tournament} now={now} trailing={h.result ? (
                <span className="pill" style={{ color: h.result.placement <= 3 ? "var(--gold)" : "var(--muted)" }}>{ordinal(h.result.placement)} · {h.result.points} pts</span>
              ) : undefined} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ v, k, accent }: { v: string; k: string; accent?: boolean }) {
  return (
    <div className="stat">
      <span className="v" style={accent ? { color: "var(--orange)" } : undefined}>{v}</span>
      <span className="k">{k}</span>
    </div>
  );
}
