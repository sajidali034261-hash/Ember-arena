import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CalendarClock, CheckCircle2, ChevronDown, Copy, Flag, Info, LifeBuoy, Lock, Medal, PartyPopper, ShieldCheck, Users, XCircle } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import { useLoad, useNow, useStore } from "../lib/store";
import type { TournamentDetail } from "../lib/types";
import { countdown, dateTime, fmt, ordinal, safeColor } from "../lib/format";
import { Alert, Avatar, Button, Coin, Confirm, Disclaimer, ErrorState, Loading, Modal, PageHead, Progress, useToast } from "../components/ui";
import { bannerStyle, StatusPill } from "../components/TournamentCards";

const placeColor = (p: number) => (p === 1 ? "var(--gold)" : p === 2 ? "var(--silver)" : p === 3 ? "var(--bronze)" : "var(--orange)");

export function TournamentPage() {
  const { id = "" } = useParams();
  const store = useStore();
  const toast = useToast();
  const nav = useNavigate();
  const now = useNow();
  const detail = useLoad(async () => {
    const t = await api.tournament(id);
    store.syncClock(t.serverTime);
    return t;
  }, [id]);
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [joined, setJoined] = useState(false);

  if (detail.loading && !detail.data) return <Loading />;
  if (detail.error && !detail.data) return <div className="page"><PageHead title="Tournament" back /><ErrorState message={detail.error} onRetry={detail.reload} /></div>;
  const t = detail.data!;

  const register = async (accountId: string) => {
    setBusy(true);
    setRegisterError(null);
    try {
      const res = await api.register(t.id, accountId);
      store.setWallet(res.wallet);
      detail.setData(res.tournament);
      setRegistering(false);
      setJoined(true);
    } catch (e) {
      setRegisterError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const leave = async () => {
    setBusy(true);
    try {
      const res = await api.leave(t.id);
      store.setWallet(res.wallet);
      detail.setData(res.tournament);
      toast(t.registration?.entryPaid ? `You left the tournament. ${fmt(t.registration.entryPaid)} coins refunded.` : "You left the tournament.");
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
      setConfirmLeave(false);
    }
  };

  const fix = (key: string) => {
    if (key === "game_account" || key === "level") nav(`/accounts?game=${encodeURIComponent(t.gameId)}`);
    else if (key === "verified_profile") nav("/verify");
    else nav("/daily");
  };

  return (
    <div className="page">
      <PageHead title={t.title} subtitle={t.subtitle || `${t.gameName} · ${t.mode}`} back />
      <div className="split">
        <div className="col" style={{ gap: 18 }}>
          <div className="hero" style={{ ...bannerStyle(t.bannerUrl), minHeight: 230 }}>
            <div style={{ padding: 24, display: "flex", flexDirection: "column", height: "100%", minHeight: 230, justifyContent: "space-between" }}>
              <div className="row">
                <span className="pill" style={{ color: safeColor(t.accent) }}>{t.gameShortName || t.gameName}</span>
                <StatusPill t={t} now={now} />
              </div>
              <div>
                <div className="label">{t.status === "upcoming" ? "Starts in" : t.status === "live" ? "Started" : "Played"}</div>
                <div className="display" style={{ fontSize: 44, color: t.status === "upcoming" ? "var(--orange)" : "var(--text)" }}>
                  {t.status === "upcoming" ? countdown(t.startsAt - now) : dateTime(t.startsAt)}
                </div>
                <div className="muted">{dateTime(t.startsAt)} · {[t.mode, t.perspective, t.map].filter(Boolean).join(" · ")}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="row between">
              <span className="row" style={{ gap: 8 }}><Users size={18} color="var(--muted)" /><span className="h3">{Math.max(0, t.slots - t.registered)} slots left</span></span>
              <span className="num muted">{t.registered}/{t.slots}</span>
            </div>
            <div style={{ marginTop: 12 }}><Progress value={t.slots ? t.registered / t.slots : 0} /></div>
          </div>

          {t.registration && <RegisteredCard t={t} now={now} />}
          {t.myResult && <MyResultCard t={t} />}

          <div className="card">
            <div className="row between"><h2 className="h2">Reward Pool</h2><span className="small muted">Virtual coins only</span></div>
            <div className="row" style={{ marginTop: 8 }}><Coin amount={t.prizePool} size={24} className="display" /><span className="muted">total pool</span></div>
            {t.prizes.length > 0 && (
              <div className="grid g3" style={{ marginTop: 14, gap: 10 }}>
                {t.prizes.map((p, i) => (
                  <div key={i} className="card" style={{ padding: 12, borderColor: i < 3 ? placeColor(i + 1) : undefined }}>
                    <div className="label" style={{ color: placeColor(i + 1) }}>{ordinal(i + 1)} place</div>
                    <div className="num" style={{ fontSize: 18, color: placeColor(i + 1) }}>{fmt(p)} coins</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="h2">Format</h2>
            <div className="grid g2" style={{ marginTop: 12, gap: "10px 24px" }}>
              <FormatRow k="Entry" v={t.entryFee === 0 ? "Free" : `${fmt(t.entryFee)} coins`} />
              <FormatRow k="Mode" v={t.mode} />
              <FormatRow k="Perspective" v={t.perspective} />
              <FormatRow k="Map" v={t.map} />
              <FormatRow k="Format" v={t.format} />
              <FormatRow k="Min level" v={t.minLevel > 0 ? String(t.minLevel) : "Any"} />
              <FormatRow k="Starts" v={dateTime(t.startsAt)} />
              <FormatRow k="Reg. closes" v={t.registrationClosesAt ? dateTime(t.registrationClosesAt) : "—"} />
            </div>
          </div>

          {t.rules.length > 0 && (
            <div className="card flush">
              <details className="accordion" style={{ borderTop: 0 }} open>
                <summary><span className="h3">Rules</span><ChevronDown className="chev" size={18} /></summary>
                <ol className="ans selectable" style={{ margin: 0, paddingLeft: 38 }}>
                  {t.rules.map((r, i) => <li key={i} style={{ marginBottom: 6 }}>{r}</li>)}
                </ol>
              </details>
            </div>
          )}

          {t.results.length > 0 && (
            <div className="card flush">
              <div style={{ padding: "16px 18px 6px" }}><h2 className="h2">Final standings</h2></div>
              {t.results.map((r) => (
                <div key={`${r.placement}-${r.username}`} className="listrow">
                  <span className="num" style={{ width: 36, fontSize: 18, color: r.placement <= 3 ? "var(--gold)" : "var(--muted)" }}>#{r.placement}</span>
                  <Avatar index={r.avatarIndex} size={34} />
                  <span className="grow ellipsis" style={{ fontWeight: 600 }}>{r.username}</span>
                  <span className="small muted">{r.kills}K · {r.points} pts</span>
                  {r.prize > 0 && <Coin amount={r.prize} size={14} />}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="col" style={{ position: "sticky", top: 0, gap: 14 }}>
          <div className="card hot">
            <div className="row between">
              <div>
                <div className="label">Entry fee</div>
                <div className="num" style={{ fontSize: 26, color: t.entryFee === 0 ? "var(--success)" : "var(--gold)" }}>{t.entryFee === 0 ? "FREE" : `${fmt(t.entryFee)} coins`}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="label">Your balance</div>
                <Coin amount={store.wallet.balance} size={18} />
              </div>
            </div>
            {t.status === "upcoming" && t.registrationClosesAt > 0 && (
              <div className="small muted row" style={{ marginTop: 10, gap: 6 }}>
                <CalendarClock size={14} /> {now >= t.registrationClosesAt ? "Registration closed" : `Registration closes in ${countdown(t.registrationClosesAt - now)}`}
              </div>
            )}
            <div style={{ marginTop: 14 }}>
              <Action t={t} now={now} busy={busy} onJoin={() => { setRegisterError(null); setRegistering(true); }} onLeave={() => setConfirmLeave(true)} onFix={fix} />
            </div>
          </div>

          {t.requirements.length > 0 && (
            <div className="card">
              <div className="label" style={{ marginBottom: 10 }}>Requirements</div>
              <div className="col" style={{ gap: 10 }}>
                {t.requirements.map((r) => (
                  <div key={r.key} className="row" style={{ alignItems: "flex-start", gap: 10 }}>
                    {r.met ? <CheckCircle2 size={18} color="var(--success)" /> : <XCircle size={18} color="var(--danger)" />}
                    <div className="grow">
                      <div style={{ fontWeight: 600 }}>{r.label}</div>
                      {r.hint && !r.met && <div className="small muted">{r.hint}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card flush">
            <div className="listrow click" onClick={() => nav(`/support/report?tournamentId=${encodeURIComponent(t.id)}`)}><Flag size={17} color="var(--orange)" /> Report an issue</div>
            <div className="listrow click" onClick={() => nav(`/support/new?tournamentId=${encodeURIComponent(t.id)}`)}><LifeBuoy size={17} color="var(--orange)" /> Contact support</div>
          </div>
          <Disclaimer>Virtual coins only. No real money is ever charged and prizes have no cash value on desktop.</Disclaimer>
        </div>
      </div>

      {registering && (
        <RegisterModal t={t} balance={store.wallet.balance} busy={busy} error={registerError}
          onClose={() => setRegistering(false)}
          onAddAccount={() => nav(`/accounts?game=${encodeURIComponent(t.gameId)}`)}
          onConfirm={register} />
      )}
      <Confirm open={confirmLeave} title="Leave tournament?" busy={busy}
        body={t.registration?.entryPaid ? `Your ${fmt(t.registration.entryPaid)} entry coins will be refunded. You can rejoin while registration is open and slots remain.` : "You can rejoin while registration is open and slots remain."}
        confirmLabel="Leave" danger onConfirm={leave} onClose={() => setConfirmLeave(false)} />
      <Modal open={joined} onClose={() => setJoined(false)}>
        <div style={{ textAlign: "center" }}>
          <PartyPopper size={46} color="var(--orange)" />
          <h2 className="h1" style={{ marginTop: 8 }}>You're in!</h2>
          <p className="muted">You're registered for <b style={{ color: "var(--text)" }}>{t.title}</b>. Room ID and password appear here before the match starts.</p>
          <Button onClick={() => setJoined(false)}>Let's go</Button>
        </div>
      </Modal>
    </div>
  );
}

function FormatRow({ k, v }: { k: string; v: string }) {
  if (!v) return null;
  return (
    <div className="row" style={{ gap: 10 }}>
      <span className="muted" style={{ width: 92, flex: "none" }}>{k}</span>
      <span style={{ fontWeight: 600 }} className="selectable">{v}</span>
    </div>
  );
}

function Action({ t, now, busy, onJoin, onLeave, onFix }: { t: TournamentDetail; now: number; busy: boolean; onJoin: () => void; onLeave: () => void; onFix: (k: string) => void }) {
  const reg = t.registration;
  const closed = now >= t.registrationClosesAt || t.status !== "upcoming";
  if (t.status === "completed") return <Button block disabled>Tournament completed</Button>;
  if (t.status === "cancelled") return <Button block disabled>Tournament cancelled</Button>;
  if (reg && !closed) return <Button block variant="ghost" disabled={busy} onClick={onLeave}>Registered · Leave tournament</Button>;
  if (reg) return <Button block disabled>{t.status === "live" ? "You're in · Good luck!" : "Registered · Starting soon"}</Button>;
  if (closed) return <Button block disabled>Registration closed</Button>;
  const blocking = t.requirements.find((r) => !r.met);
  if (!blocking) return <Button block loading={busy} onClick={onJoin}>{t.entryFee === 0 ? "Join Tournament · Free" : `Join · ${fmt(t.entryFee)} coins`}</Button>;
  const fixLabels: Record<string, string> = {
    game_account: `Link ${t.gameName} ID to join`,
    level: "Update account level to join",
    verified_profile: "Verify account to join",
    coins: "Earn more coins to join",
  };
  if (fixLabels[blocking.key]) return <Button block onClick={() => onFix(blocking.key)}>{fixLabels[blocking.key]}</Button>;
  return <Button block disabled>{blocking.label}</Button>;
}

function RegisteredCard({ t, now }: { t: TournamentDetail; now: number }) {
  const toast = useToast();
  const account = t.accounts.find((a) => a.id === t.registration?.gameAccountId);
  const room = t.room;
  const until = t.roomRevealAt - now;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`Room ${room?.id ?? ""} / ${room?.password ?? ""}`);
      toast("Room details copied");
    } catch {
      toast("Couldn't copy — select the text instead.", "error");
    }
  };
  return (
    <div className="card" style={{ borderColor: "rgba(61,220,132,0.5)", background: "linear-gradient(180deg, #12241A, var(--surface))" }}>
      <div className="row"><CheckCircle2 color="var(--success)" /><h2 className="h2">You're registered</h2></div>
      <div className="muted" style={{ marginTop: 4 }}>
        Playing as {account?.inGameName ?? "your linked account"}{account ? ` · ID ${account.inGameId}` : ""}
      </div>
      {room?.id ? (
        <div className="row" style={{ marginTop: 12, background: "var(--raised)", borderRadius: 12, padding: 14 }}>
          <div className="grow selectable">
            <div className="h3">Room ID: {room.id}</div>
            <div className="num gold">Password: {room.password ?? "—"}</div>
          </div>
          <Button variant="ghost" small onClick={copy}><Copy size={15} /> Copy</Button>
        </div>
      ) : (
        <div className="small gold row" style={{ marginTop: 10, gap: 6 }}>
          <Lock size={14} /> {until > 0 ? `Room ID & password unlock in ${countdown(until)}` : "Room details will appear as soon as the admins publish them."}
        </div>
      )}
    </div>
  );
}

function MyResultCard({ t }: { t: TournamentDetail }) {
  const r = t.myResult!;
  const c = placeColor(r.placement);
  return (
    <div className="card" style={{ borderColor: c }}>
      <div className="row">
        <Medal size={44} color={c} />
        <div className="grow">
          <div className="h2">You finished {ordinal(r.placement)}</div>
          <div className="muted">{r.kills} kills · +{r.points} leaderboard pts</div>
        </div>
        {r.prize > 0 && <Coin amount={`+${fmt(r.prize)}`} size={22} className="display" />}
      </div>
    </div>
  );
}

function RegisterModal({ t, balance, busy, error, onClose, onAddAccount, onConfirm }: {
  t: TournamentDetail; balance: number; busy: boolean; error: string | null;
  onClose: () => void; onAddAccount: () => void; onConfirm: (accountId: string) => void;
}) {
  const eligible = t.accounts.filter((a) => a.level >= t.minLevel);
  const [selected, setSelected] = useState<string | null>(eligible[0]?.id ?? t.accounts[0]?.id ?? null);
  const after = balance - t.entryFee;
  const sel = t.accounts.find((a) => a.id === selected);
  const canConfirm = !!sel && sel.level >= t.minLevel && after >= 0;
  return (
    <Modal open onClose={onClose} width={560}>
      <h2 className="h1" style={{ fontSize: 28 }}>Confirm registration</h2>
      <div className="muted">{t.title}</div>
      <div className="label" style={{ marginTop: 18, marginBottom: 8 }}>Play as</div>
      <div className="col" style={{ gap: 8 }}>
        {t.accounts.length === 0 && <Alert kind="info">Link a {t.gameName} account first.</Alert>}
        {t.accounts.map((a) => {
          const ok = a.level >= t.minLevel;
          return (
            <label key={a.id} className="card" style={{ padding: 12, cursor: ok ? "pointer" : "not-allowed", opacity: ok ? 1 : 0.55, borderColor: selected === a.id ? "var(--orange)" : undefined }}>
              <div className="row">
                <input type="radio" name="acct" disabled={!ok} checked={selected === a.id} onChange={() => setSelected(a.id)} style={{ accentColor: "var(--orange)" }} />
                <div className="grow">
                  <div style={{ fontWeight: 700 }}>{a.inGameName} {a.verified && <ShieldCheck size={14} color="var(--success)" style={{ verticalAlign: -2 }} />}</div>
                  <div className="small muted">{t.accountIdLabel} {a.inGameId} · Level {a.level}{!ok ? ` · needs level ${t.minLevel}+` : ""}</div>
                </div>
              </div>
            </label>
          );
        })}
      </div>
      <Button variant="text" onClick={onAddAccount} style={{ marginTop: 6 }}>+ Link another {t.gameName} account</Button>
      <div className="card" style={{ marginTop: 12, padding: 14 }}>
        <div className="row between"><span className="muted">Entry fee</span><span className="num">{t.entryFee === 0 ? "Free" : `${fmt(t.entryFee)} coins`}</span></div>
        <div className="row between" style={{ marginTop: 6 }}><span className="muted">Your balance</span><span className="num">{fmt(balance)} coins</span></div>
        <hr className="divider" style={{ margin: "10px 0" }} />
        <div className="row between"><span className="muted">After joining</span><span className="num" style={{ color: after < 0 ? "var(--danger)" : "var(--gold)" }}>{fmt(after)} coins</span></div>
      </div>
      {after < 0 && <div style={{ marginTop: 10 }}><Alert>Not enough coins. Collect your daily reward or win tournaments to earn more.</Alert></div>}
      {error && <div style={{ marginTop: 10 }}><Alert>{error}</Alert></div>}
      <div className="small dim row" style={{ marginTop: 10, gap: 6 }}><Info size={13} /> Virtual coins only. No real money is ever charged.</div>
      <div className="actions">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button loading={busy} disabled={!canConfirm} onClick={() => selected && onConfirm(selected)}>Confirm & join</Button>
      </div>
    </Modal>
  );
}
