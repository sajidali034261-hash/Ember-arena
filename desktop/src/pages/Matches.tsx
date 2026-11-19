import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Medal } from "lucide-react";
import { api } from "../lib/api";
import { useLoad, useNow } from "../lib/store";
import { fmt, ordinal } from "../lib/format";
import { Button, Coin, Empty, ErrorState, Loading, PageHead, Tabs } from "../components/ui";
import { TournamentRowCard } from "../components/TournamentCards";

type Tab = "upcoming" | "live" | "completed";

const EMPTY: Record<Tab, [string, string]> = {
  upcoming: ["No upcoming matches", "Join a tournament and it will show up here with a countdown."],
  live: ["Nothing live right now", "When one of your tournaments starts, its room details appear here."],
  completed: ["No completed matches yet", "Your results will appear here once tournaments finish."],
};

export function MatchesPage() {
  const [tab, setTab] = useState<Tab>("upcoming");
  const nav = useNavigate();
  const now = useNow();
  const list = useLoad(() => api.myTournaments(tab), [tab]);

  return (
    <div className="page">
      <PageHead title="My Matches" subtitle="Your registrations, live rooms and results.">
        <Tabs<Tab> value={tab} onChange={setTab} options={[{ id: "upcoming", label: "Upcoming" }, { id: "live", label: "Live" }, { id: "completed", label: "Completed" }]} />
      </PageHead>
      {list.loading && !list.data ? <Loading /> : list.error ? <ErrorState message={list.error} onRetry={list.reload} /> : list.data!.length === 0 ? (
        <div className="card"><Empty title={EMPTY[tab][0]} body={EMPTY[tab][1]} action={<Button variant="ghost" onClick={() => nav("/games")}>Browse tournaments</Button>} /></div>
      ) : (
        <div className="grid g2">
          {list.data!.map((m) => {
            const t = m.tournament;
            const trailing = t.status === "live" ? (m.roomReady ? <span className="pill success">Room ready</span> : <span className="pill live"><span className="livedot" /> Live</span>)
              : t.status === "upcoming" ? <span className="pill orange">Registered</span>
              : t.status === "cancelled" ? <span className="pill muted">Cancelled</span> : null;
            const footer = m.result || t.status === "completed" ? (
              <div className="row" style={{ padding: "10px 16px", borderTop: "1px solid var(--border)", gap: 10 }}>
                {m.result ? (
                  <>
                    <Medal size={18} color={m.result.placement <= 3 ? "var(--gold)" : "var(--orange)"} />
                    <span className="small grow" style={{ fontWeight: 600 }}>{ordinal(m.result.placement)} place · {m.result.kills} kills · +{m.result.points} pts</span>
                    {m.result.prize > 0 && <Coin amount={`+${fmt(m.result.prize)}`} size={14} />}
                  </>
                ) : (
                  <span className="small muted">Played as {m.inGameName ?? "—"} · results published</span>
                )}
              </div>
            ) : undefined;
            return <TournamentRowCard key={t.id} t={t} now={now} trailing={trailing} footer={footer} />;
          })}
        </div>
      )}
    </div>
  );
}
