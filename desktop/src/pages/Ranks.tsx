import { useState } from "react";
import { Crown } from "lucide-react";
import { api } from "../lib/api";
import { useLoad, useNow } from "../lib/store";
import type { LeaderEntry } from "../lib/types";
import { fmt } from "../lib/format";
import { Avatar, Coin, Empty, ErrorState, Loading, PageHead, Tabs } from "../components/ui";
import { TournamentRowCard } from "../components/TournamentCards";

type Scope = "players" | "weekly" | "tournaments";

export function RanksPage() {
  const [scope, setScope] = useState<Scope>("players");
  const now = useNow();
  const lb = useLoad(() => api.leaderboard(scope), [scope]);

  return (
    <div className="page">
      <PageHead title="Leaderboard" subtitle="Show your skills. Rewards are virtual only.">
        <Tabs<Scope> value={scope} onChange={setScope} options={[{ id: "players", label: "All-time" }, { id: "weekly", label: "Weekly" }, { id: "tournaments", label: "Tournaments" }]} />
      </PageHead>
      {lb.loading && !lb.data ? <Loading /> : lb.error ? <ErrorState message={lb.error} onRetry={lb.reload} /> : (() => {
        const d = lb.data!;
        if (scope === "tournaments") {
          return d.tournaments.length === 0 ? <div className="card"><Empty title="No completed tournaments yet" /></div> : (
            <div className="grid g2">
              {d.tournaments.map((p) => (
                <div key={p.tournament.id} className="col" style={{ gap: 0 }}>
                  <TournamentRowCard t={p.tournament} now={now} footer={
                    <div style={{ padding: "8px 16px 12px", borderTop: "1px solid var(--border)" }}>
                      {p.podium.length === 0 ? <span className="small muted">Results pending</span> : p.podium.map((r) => (
                        <div key={r.placement + r.username} className="row" style={{ gap: 10, padding: "4px 0" }}>
                          <span className="num" style={{ width: 26, color: r.placement === 1 ? "var(--gold)" : r.placement === 2 ? "var(--silver)" : "var(--bronze)" }}>#{r.placement}</span>
                          <Avatar index={r.avatarIndex} size={24} />
                          <span className="grow ellipsis small" style={{ fontWeight: 600 }}>{r.username}</span>
                          <span className="small muted">{r.points} pts</span>
                        </div>
                      ))}
                    </div>
                  } />
                </div>
              ))}
            </div>
          );
        }
        const top = d.entries.slice(0, 3);
        return (
          <>
            {d.reward && <div className="card hot" style={{ marginBottom: 16 }}><div className="row"><Coin size={22} /><span className="selectable">{d.reward}</span></div></div>}
            {d.entries.length === 0 ? <div className="card"><Empty title="No ranked players yet" body="Play a tournament to get on the board." /></div> : (
              <>
                {top.length === 3 && (
                  <div className="podium" style={{ marginBottom: 18 }}>
                    <PodiumCard e={top[1]} place={2} />
                    <PodiumCard e={top[0]} place={1} />
                    <PodiumCard e={top[2]} place={3} />
                  </div>
                )}
                <div className="card flush">
                  <div className="rankrow head"><span>Rank</span><span>Player</span><span style={{ textAlign: "right" }}>Points</span><span style={{ textAlign: "right" }}>Wins</span><span style={{ textAlign: "right" }}>Matches</span><span style={{ textAlign: "right" }}>Kills</span></div>
                  {d.entries.map((e) => <Row key={e.userId} e={e} />)}
                  {d.me && !d.entries.some((e) => e.isMe) && (<><hr className="divider" /><Row e={{ ...d.me, isMe: true }} /></>)}
                </div>
              </>
            )}
          </>
        );
      })()}
    </div>
  );
}

function Row({ e }: { e: LeaderEntry }) {
  return (
    <div className={`rankrow ${e.isMe ? "me" : ""}`}>
      <span className="num" style={{ fontSize: 18, color: e.rank && e.rank <= 3 ? "var(--gold)" : "var(--muted)" }}>{e.rank ? `#${e.rank}` : "—"}</span>
      <span className="row" style={{ gap: 10, minWidth: 0 }}>
        <Avatar index={e.avatarIndex} size={32} />
        <span className="ellipsis" style={{ fontWeight: 600 }}>{e.username}{e.isMe && <span className="orange small"> (you)</span>}</span>
      </span>
      <span className="num orange" style={{ textAlign: "right" }}>{fmt(e.points)}</span>
      <span style={{ textAlign: "right" }}>{fmt(e.wins)}</span>
      <span style={{ textAlign: "right" }}>{fmt(e.matches)}</span>
      <span style={{ textAlign: "right" }}>{fmt(e.kills)}</span>
    </div>
  );
}

function PodiumCard({ e, place }: { e: LeaderEntry; place: number }) {
  const c = place === 1 ? "var(--gold)" : place === 2 ? "var(--silver)" : "var(--bronze)";
  return (
    <div style={{ borderColor: c, paddingTop: place === 1 ? 26 : 16, background: `linear-gradient(180deg, color-mix(in srgb, ${c} 14%, transparent), var(--surface))` }}>
      <Crown color={c} size={place === 1 ? 30 : 22} />
      <div style={{ margin: "6px auto", width: "fit-content" }}><Avatar index={e.avatarIndex} size={place === 1 ? 72 : 56} /></div>
      <div className="h3 ellipsis">{e.username}</div>
      <div className="num" style={{ color: c, fontSize: 20 }}>{fmt(e.points)} pts</div>
      <div className="small muted">{e.wins} wins · {e.matches} matches · {e.kills} kills</div>
    </div>
  );
}
