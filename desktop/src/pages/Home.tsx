import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarCheck, ChevronRight, Flame, Medal, Swords, Target, Trophy } from "lucide-react";
import { api } from "../lib/api";
import { useLoad, useNow, useStore } from "../lib/store";
import { countdown, fmt, safeColor } from "../lib/format";
import { Avatar, Button, Coin, Disclaimer, Empty, ErrorState, Loading } from "../components/ui";
import { FeaturedTournamentCard, TournamentRowCard } from "../components/TournamentCards";

export function HomePage() {
  const store = useStore();
  const nav = useNavigate();
  const now = useNow();
  const home = useLoad(async () => {
    const h = await api.home();
    store.syncClock(h.serverTime);
    store.setUser(h.user);
    store.setWallet(h.wallet);
    store.setUnread(h.unreadNotifications);
    return h;
  }, []);

  if (home.loading && !home.data) return <Loading />;
  if (home.error && !home.data) return <div className="page"><ErrorState message={home.error} onRetry={home.reload} /></div>;
  const h = home.data!;
  const d = h.daily;

  return (
    <div className="page">
      <div className="hero" style={{ backgroundImage: "url(/img/img_hero.webp)", backgroundPosition: "right center" }}>
        <div style={{ padding: "28px 30px", display: "flex", gap: 22, alignItems: "center" }}>
          <Avatar index={h.user.avatarIndex} size={74} />
          <div className="grow">
            <div className="label">Welcome back</div>
            <div className="h1" style={{ fontSize: 40 }}>{h.user.username}</div>
            <div className="row" style={{ marginTop: 10, gap: 22 }}>
              <HeroStat icon={<Trophy size={16} />} value={h.stats.rank ? `#${h.stats.rank}` : "—"} label="Rank" />
              <HeroStat icon={<Target size={16} />} value={fmt(h.stats.points)} label="Points" />
              <HeroStat icon={<Medal size={16} />} value={fmt(h.stats.wins)} label="Wins" />
              <HeroStat icon={<Swords size={16} />} value={fmt(h.stats.matches)} label="Matches" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid g3 section" style={{ marginTop: 18 }}>
        <div className="card click" onClick={() => nav("/wallet")}>
          <div className="label">Coin balance</div>
          <div className="row" style={{ marginTop: 8 }}>
            <Coin amount={h.wallet.balance} size={30} className="big" />
          </div>
          <div className="row small muted" style={{ marginTop: 10, gap: 16 }}>
            <span>Earned <b className="success">{fmt(h.wallet.earned)}</b></span>
            <span>Spent <b style={{ color: "var(--text)" }}>{fmt(h.wallet.spent)}</b></span>
          </div>
        </div>

        <div className={`card click ${d.canClaim ? "hot" : ""}`} onClick={() => nav("/daily")}>
          <div className="row">
            <img src="/img/img_chest.webp" width={58} height={58} alt="" draggable={false} />
            <div className="grow">
              <div className="label">Daily reward · Day {d.canClaim ? d.nextDay : Math.max(d.currentStreak, 1)}</div>
              <div className="h3" style={{ marginTop: 4 }}>
                {d.requiresVerification ? "Verify to start collecting" : d.canClaim ? <>Claim <span className="gold">{fmt(d.nextAmount)}</span> coins</> : <>Next in <span className="orange">{countdown(d.nextClaimAt - now)}</span></>}
              </div>
              <div className="small muted"><Flame size={13} style={{ verticalAlign: -2 }} color="var(--orange)" /> {d.currentStreak}-day streak</div>
            </div>
            <CalendarCheck color={d.canClaim ? "var(--orange)" : "var(--dim)"} />
          </div>
        </div>

        <div className="card">
          <div className="label">Your arena</div>
          <div className="grid g3" style={{ marginTop: 10, gap: 8 }}>
            <div className="stat"><span className="v">{fmt(h.stats.tournamentsJoined)}</span><span className="k">Joined</span></div>
            <div className="stat"><span className="v gold">{fmt(h.stats.podiums)}</span><span className="k">Podiums</span></div>
            <div className="stat"><span className="v">{fmt(h.stats.kills)}</span><span className="k">Kills</span></div>
          </div>
        </div>
      </div>

      {h.games.length > 0 && (
        <div className="section">
          <div className="sechead"><h2 className="h2">Games</h2><Button variant="text" onClick={() => nav("/games")}>All games <ChevronRight size={16} /></Button></div>
          <div className="chipbar">
            {h.games.map((g) => (
              <button key={g.id} className="chipbtn" onClick={() => nav(`/game/${g.id}`)}>
                <i style={{ background: safeColor(g.accent) }} /> {g.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="section">
        <div className="sechead"><h2 className="h2">Featured tournaments</h2></div>
        {h.featured.length === 0 ? (
          <div className="card"><Empty title="No featured tournaments right now" body="New events are posted regularly — check back soon." /></div>
        ) : (
          <div className="scroller">{h.featured.map((t) => <FeaturedTournamentCard key={t.id} t={t} now={now} />)}</div>
        )}
      </div>

      <div className="grid g2 section">
        <div>
          <div className="sechead"><h2 className="h2">Upcoming</h2><Button variant="text" onClick={() => nav("/games")}>Browse <ChevronRight size={16} /></Button></div>
          <div className="col">
            {h.upcoming.length === 0 ? <div className="card"><Empty title="Nothing scheduled yet" image={null} /></div> : h.upcoming.map((t) => <TournamentRowCard key={t.id} t={t} now={now} />)}
          </div>
        </div>
        <div>
          <div className="sechead"><h2 className="h2">Recent results</h2><Button variant="text" onClick={() => nav("/ranks")}>Ranks <ChevronRight size={16} /></Button></div>
          <div className="col">
            {h.recent.length === 0 ? <div className="card"><Empty title="No results yet" image={null} /></div> : h.recent.map((t) => <TournamentRowCard key={t.id} t={t} now={now} />)}
          </div>
        </div>
      </div>

      <div className="section"><Disclaimer /></div>
    </div>
  );
}

function HeroStat({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="row" style={{ gap: 8 }}>
      <span className="orange">{icon}</span>
      <span><b className="num" style={{ fontSize: 20 }}>{value}</b> <span className="small muted">{label}</span></span>
    </div>
  );
}
