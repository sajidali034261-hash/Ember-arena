import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IdCard } from "lucide-react";
import { api } from "../lib/api";
import { useLoad, useNow } from "../lib/store";
import { safeColor } from "../lib/format";
import { Button, Empty, ErrorState, Loading, PageHead, Tabs } from "../components/ui";
import { bannerStyle, TournamentRowCard } from "../components/TournamentCards";

export function GamesPage() {
  const nav = useNavigate();
  const games = useLoad(() => api.games(), []);

  return (
    <div className="page">
      <PageHead title="Games" subtitle="Pick your battlefield. Every reward is virtual." />
      {games.loading && !games.data ? <Loading /> : games.error && !games.data ? <ErrorState message={games.error} onRetry={games.reload} /> : (
        games.data!.length === 0 ? <Empty title="No games yet" body="Games will appear here once the arena adds them." /> : (
          <div className="grid gauto">
            {games.data!.map((g) => (
              <div key={g.id} className="card flush click" onClick={() => nav(`/game/${g.id}`)} role="link" tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && nav(`/game/${g.id}`)}>
                <div className="banner" style={{ ...bannerStyle(g.bannerUrl), height: 150 }}>
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 20%, rgba(26,22,19,0.95))" }} />
                  <div style={{ position: "absolute", left: 16, bottom: 12, right: 16, zIndex: 1 }}>
                    <div className="label" style={{ color: safeColor(g.accent) }}>{g.category}</div>
                    <div className="h2">{g.name}</div>
                  </div>
                  {g.liveCount > 0 && <span className="pill live" style={{ position: "absolute", top: 12, right: 12, zIndex: 1 }}><span className="livedot" /> {g.liveCount} live</span>}
                </div>
                <div style={{ padding: "12px 16px 16px" }} className="row between">
                  <span className="muted">{g.upcomingCount} upcoming · {g.liveCount} live</span>
                  <span className="small dim">{g.accountIdLabel}</span>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

type GameTab = "upcoming" | "live" | "completed";

export function GameDetailPage() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const now = useNow();
  const [tab, setTab] = useState<GameTab>("upcoming");
  const detail = useLoad(() => api.game(id), [id]);

  if (detail.loading && !detail.data) return <Loading />;
  if (detail.error && !detail.data) return <div className="page"><PageHead title="Game" back /><ErrorState message={detail.error} onRetry={detail.reload} /></div>;
  const d = detail.data!;
  const list = d[tab];

  return (
    <div className="page">
      <PageHead title={d.game.name} subtitle={`${d.upcoming.length} upcoming · ${d.live.length} live`} back>
        <Button variant="ghost" onClick={() => nav("/accounts")}><IdCard size={16} /> My {d.game.shortName || d.game.name} IDs</Button>
      </PageHead>
      <div className="hero" style={{ ...bannerStyle(d.game.bannerUrl), minHeight: 160, marginBottom: 20 }}>
        <div style={{ padding: 24 }}>
          <div className="label" style={{ color: safeColor(d.game.accent) }}>{d.game.category}</div>
          <div className="h1">{d.game.name}</div>
          <div className="muted">Link your {d.game.accountIdLabel} to register for tournaments.</div>
        </div>
      </div>
      <Tabs<GameTab> value={tab} onChange={setTab} options={[
        { id: "upcoming", label: `Upcoming (${d.upcoming.length})` },
        { id: "live", label: `Live (${d.live.length})` },
        { id: "completed", label: `Completed (${d.completed.length})` },
      ]} />
      <div className="grid g2" style={{ marginTop: 16 }}>
        {list.length === 0 ? (
          <div className="card" style={{ gridColumn: "1 / -1" }}><Empty title={`No ${tab} tournaments`} body="Check back soon — new events are posted regularly." image={null} /></div>
        ) : list.map((t) => <TournamentRowCard key={t.id} t={t} now={now} />)}
      </div>
    </div>
  );
}
