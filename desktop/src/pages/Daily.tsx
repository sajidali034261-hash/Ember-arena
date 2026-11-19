import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ShieldCheck } from "lucide-react";
import { api, ApiError, errorMessage } from "../lib/api";
import { useLoad, useNow, useStore } from "../lib/store";
import { countdown, fmt, isoDateLabel } from "../lib/format";
import { Button, Coin, Disclaimer, ErrorState, Loading, Modal, PageHead, useToast } from "../components/ui";

export function DailyPage() {
  const nav = useNavigate();
  const toast = useToast();
  const now = useNow();
  const { setWallet, syncClock } = useStore();
  const daily = useLoad(async () => {
    const d = await api.daily();
    syncClock(d.serverTime);
    return d;
  }, []);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState<number | null>(null);

  const claim = async () => {
    setClaiming(true);
    try {
      const r = await api.claimDaily();
      setWallet(r.wallet);
      daily.setData(r.daily);
      setClaimed(r.claimed.amount);
    } catch (e) {
      if (e instanceof ApiError && e.code === "VERIFICATION_REQUIRED") nav("/verify");
      else toast(errorMessage(e), "error");
      daily.reload();
    } finally {
      setClaiming(false);
    }
  };

  if (daily.loading && !daily.data) return <Loading />;
  if (daily.error && !daily.data) return <div className="page"><ErrorState message={daily.error} onRetry={daily.reload} /></div>;
  const d = daily.data!;
  const day = d.claimedToday ? d.currentStreak : d.nextDay;
  const amount = d.claimedToday ? d.todayAmount : d.nextAmount;
  const history = d.history ?? [];

  return (
    <div className="page narrow">
      <PageHead title="Daily reward" subtitle="Come back every day to grow the streak — missing a day resets it." />
      <div className="card hot dailyhero" style={{ textAlign: "center", position: "relative", overflow: "hidden", paddingTop: 10 }}>
        <div className="dailyglow" />
        <img src="/img/img_chest.webp" alt="Reward chest" className="dailychest" draggable={false} style={{ opacity: d.claimedToday ? 0.8 : 1 }} />
        <div className="display" style={{ fontSize: 44, lineHeight: 1 }}><span className="orange">Day {day}</span> of 7</div>
        <div style={{ marginTop: 8, display: "flex", justifyContent: "center" }}><Coin amount={`+${fmt(amount)} coins`} size={22} className="gold h3" /></div>

        <div className="daygrid" style={{ margin: "22px auto 0", maxWidth: 640 }}>
          {Array.from({ length: 7 }, (_, k) => k + 1).map((i) => {
            const done = i <= d.currentStreak;
            const next = !d.claimedToday && i === d.nextDay;
            return (
              <div key={i} className={`day ${done ? "done" : ""} ${next ? "next" : ""}`}>
                <span className="label">Day {i}</span>
                {done ? <Check color="var(--success)" size={22} /> : <Coin size={22} />}
                <b className={next ? "gold" : done ? "" : "muted"}>{fmt(d.schedule[i - 1] ?? 0)}</b>
              </div>
            );
          })}
        </div>

        <div style={{ margin: "24px auto 6px", maxWidth: 380 }}>
          {d.requiresVerification ? (
            <>
              <Button block onClick={() => nav("/verify")}><ShieldCheck size={17} /> Verify account to claim</Button>
              <div className="small muted" style={{ marginTop: 8 }}>Daily rewards unlock once your email is verified.</div>
            </>
          ) : d.claimedToday ? (
            <Button block disabled>Next reward in {countdown(d.nextClaimAt - now)}</Button>
          ) : (
            <Button block loading={claiming} onClick={claim}>Claim today's reward</Button>
          )}
        </div>
      </div>

      <div className="section">
        <div className="sechead"><h2 className="h2">Claim history</h2></div>
        {history.length === 0 ? (
          <div className="card muted">Your claims will appear here. Come back every day to grow the streak — missing a day resets it.</div>
        ) : (
          <div className="card flush">
            {history.map((h) => (
              <div key={h.date} className="listrow">
                <Coin size={28} />
                <span className="muted" style={{ fontWeight: 600 }}>{isoDateLabel(h.date)}</span>
                <b className="gold grow">+{fmt(h.amount)} coins</b>
                <span className="label">Day {h.streakDay}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ marginTop: 18 }}><Disclaimer /></div>

      <Modal open={claimed !== null} onClose={() => setClaimed(null)} width={420}>
        <div style={{ textAlign: "center" }}>
          <img src="/img/img_chest.webp" alt="" width={160} draggable={false} />
          <div className="display gold" style={{ fontSize: 56, lineHeight: 1 }}>+{fmt(claimed ?? 0)}</div>
          <div className="h3" style={{ marginTop: 6 }}>coins added to your wallet</div>
          <div className="small muted" style={{ marginTop: 6 }}>Virtual coins — no cash value.</div>
          <div style={{ marginTop: 18 }}><Button block onClick={() => setClaimed(null)}>Awesome</Button></div>
        </div>
      </Modal>
    </div>
  );
}
