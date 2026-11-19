import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronDown, Flag, Headset, MessageSquare, Send } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import { useLoad, useNow } from "../lib/store";
import { dateTime, relative, titleCase } from "../lib/format";
import { REPORT_CATEGORIES, reportError, TICKET_CATEGORIES, ticketError } from "../lib/validation";
import { Alert, Button, Empty, ErrorState, Field, Loading, PageHead, StatusPill, TextInput, useToast } from "../components/ui";

export function SupportPage() {
  const nav = useNavigate();
  const now = useNow(60_000);
  const data = useLoad(async () => {
    const [tickets, reports, faqs] = await Promise.all([api.tickets(), api.reports(), api.faqs()]);
    return { tickets, reports, faqs };
  }, []);

  return (
    <div className="page narrow">
      <PageHead title="Help & support" subtitle="Our team usually replies within 24 hours." />
      <div className="grid g2">
        <div className="card hot click" onClick={() => nav("/support/new")} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && nav("/support/new")}>
          <Headset size={30} color="var(--orange)" />
          <div className="h3" style={{ marginTop: 10 }}>Contact support</div>
          <div className="small muted">Account, coins, bugs</div>
        </div>
        <div className="card hot click" onClick={() => nav("/support/report")} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && nav("/support/report")}>
          <Flag size={30} color="var(--orange)" />
          <div className="h3" style={{ marginTop: 10 }}>Report a problem</div>
          <div className="small muted">Cheaters, results, rooms</div>
        </div>
      </div>

      {data.loading && !data.data ? <Loading /> : data.error && !data.data ? <ErrorState message={data.error} onRetry={data.reload} /> : (() => {
        const { tickets, reports, faqs } = data.data!;
        return (
          <>
            <div className="section">
              <div className="sechead"><h2 className="h2">My tickets</h2></div>
              {tickets.length === 0 ? <div className="card muted">No tickets yet. Our team usually replies within 24 hours.</div> : (
                <div className="card flush">
                  {tickets.map((t) => (
                    <div key={t.id} className="listrow click" role="button" tabIndex={0} onClick={() => nav(`/support/ticket/${t.id}`)} onKeyDown={(e) => e.key === "Enter" && nav(`/support/ticket/${t.id}`)}>
                      <MessageSquare size={19} color="var(--orange)" />
                      <div className="grow" style={{ minWidth: 0 }}>
                        <div className="ellipsis" style={{ fontWeight: 700 }}>{t.subject}</div>
                        <div className="small muted ellipsis">{(t.lastSender === "support" ? "Support: " : "You: ") + (t.lastMessage ?? "")}</div>
                        <div className="small dim">{relative(t.updatedAt, now)}</div>
                      </div>
                      <StatusPill status={t.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {reports.length > 0 && (
              <div className="section">
                <div className="sechead"><h2 className="h2">My reports</h2></div>
                <div className="col" style={{ gap: 10 }}>
                  {reports.map((r) => (
                    <div key={r.id} className="card" style={{ padding: 14 }}>
                      <div className="row"><b className="grow">{titleCase(r.category)}</b><StatusPill status={r.status} /></div>
                      {r.tournamentTitle && <div className="small orange">{r.tournamentTitle}</div>}
                      <div className="small muted selectable" style={{ marginTop: 4 }}>{r.description}</div>
                      {r.adminResponse && <div className="small success selectable" style={{ marginTop: 6 }}>Admin: {r.adminResponse}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="section">
              <div className="sechead"><h2 className="h2">FAQ</h2></div>
              {faqs.length === 0 ? <div className="card muted">No FAQs yet.</div> : (
                <div className="card flush" style={{ overflow: "hidden" }}>
                  {faqs.map((f) => (
                    <details key={f.id} className="accordion">
                      <summary>{f.question}<ChevronDown size={17} className="chev" /></summary>
                      <div className="ans selectable">{f.answer}</div>
                    </details>
                  ))}
                </div>
              )}
            </div>
          </>
        );
      })()}
    </div>
  );
}

function ChipPicker({ options, value, onChange }: { options: { id: string; label: string }[]; value: string | null; onChange: (v: string) => void }) {
  return (
    <div className="chipbar" style={{ flexWrap: "wrap" }}>
      {options.map((o) => (
        <button type="button" key={o.id} className={`chipbtn ${value === o.id ? "active" : ""}`} onClick={() => onChange(o.id)}>{o.label}</button>
      ))}
    </div>
  );
}

export function NewTicketPage() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const tournamentId = params.get("tournamentId");
  const [category, setCategory] = useState(tournamentId ? "tournament" : "account");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const err = ticketError(subject, body);
    if (err) return setError(err);
    setBusy(true);
    setError(null);
    try {
      const t = await api.createTicket(category, subject.trim(), body.trim(), tournamentId);
      nav(`/support/ticket/${t.id}`, { replace: true });
    } catch (e2) {
      setError(errorMessage(e2));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page narrow">
      <PageHead title="Contact support" back />
      <form className="card col" onSubmit={submit} noValidate>
        <div className="h3">What's it about?</div>
        <ChipPicker options={TICKET_CATEGORIES} value={category} onChange={setCategory} />
        {tournamentId && <span className="pill info" style={{ alignSelf: "flex-start" }}>Linked to this tournament</span>}
        <Field label="Subject"><TextInput value={subject} onChange={(e) => setSubject(e.target.value.slice(0, 100))} autoFocus /></Field>
        <Field label="Describe the issue">
          <textarea className="input" rows={6} value={body} onChange={(e) => setBody(e.target.value.slice(0, 2000))} />
        </Field>
        <div className="small dim" style={{ marginTop: -6, textAlign: "right" }}>{body.length}/2000</div>
        {error && <Alert>{error}</Alert>}
        <div><Button type="submit" loading={busy}>Send to support</Button></div>
      </form>
    </div>
  );
}

export function ReportPage() {
  const nav = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  const tournamentId = params.get("tournamentId");
  const [category, setCategory] = useState<string | null>(null);
  const [player, setPlayer] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const err = !category ? "Pick what went wrong." : reportError(body);
    if (err) return setError(err);
    setBusy(true);
    setError(null);
    try {
      await api.createReport(category!, body.trim(), tournamentId, player.trim() || null);
      toast("Report submitted. Our admins will review it.");
      nav(-1);
    } catch (e2) {
      setError(errorMessage(e2));
      setBusy(false);
    }
  };

  return (
    <div className="page narrow">
      <PageHead title={tournamentId ? "Report tournament issue" : "Report a problem"} back />
      <form className="card col" onSubmit={submit} noValidate>
        <div className="h3">What went wrong?</div>
        <ChipPicker options={REPORT_CATEGORIES} value={category} onChange={setCategory} />
        {tournamentId && <span className="pill info" style={{ alignSelf: "flex-start" }}>About this tournament</span>}
        <Field label="Player in-game name (optional)"><TextInput value={player} onChange={(e) => setPlayer(e.target.value.slice(0, 40))} /></Field>
        <Field label="What happened?">
          <textarea className="input" rows={6} value={body} onChange={(e) => setBody(e.target.value.slice(0, 2000))} />
        </Field>
        <div className="small dim" style={{ marginTop: -6 }}>Include times, round numbers or anything that helps.</div>
        {error && <Alert>{error}</Alert>}
        <div><Button type="submit" loading={busy}>Submit report</Button></div>
      </form>
    </div>
  );
}

export function TicketPage() {
  const { id = "" } = useParams();
  const toast = useToast();
  const ticket = useLoad(() => api.ticket(id), [id]);
  const { reload } = ticket;
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const count = ticket.data?.messages.length ?? 0;

  useEffect(() => {
    const t = setInterval(() => document.visibilityState === "visible" && reload(), 20_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [count]);

  const send = async () => {
    const msg = draft.trim();
    if (!msg || sending) return;
    setSending(true);
    try {
      const t = await api.replyTicket(id, msg);
      ticket.setData(t);
      setDraft("");
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setSending(false);
    }
  };

  if (ticket.loading && !ticket.data) return <Loading />;
  if (ticket.error && !ticket.data) return <div className="page narrow"><PageHead title="Support ticket" back /><ErrorState message={ticket.error} onRetry={reload} /></div>;
  const t = ticket.data!;
  const closed = t.status === "closed";

  return (
    <div className="page narrow">
      <PageHead title={<span className="selectable">{t.subject}</span>} back subtitle={
        <span className="row" style={{ gap: 8 }}><StatusPill status={t.status} /><span className="small dim">{titleCase(t.category)} · Opened {dateTime(t.createdAt)}</span></span>
      } />
      <div className="card col" style={{ gap: 10, minHeight: 260 }}>
        {t.messages.length === 0 && <Empty title="No messages" image={null} />}
        {t.messages.map((m) => {
          const mine = m.sender === "user";
          return (
            <div key={m.id} className={`bubble ${mine ? "me" : "them"}`}>
              <div className="label" style={{ color: mine ? "var(--orange)" : "var(--success)", marginBottom: 2 }}>{mine ? "You" : "Ember Support"}</div>
              <div className="selectable">{m.body}</div>
              <div className="small dim" style={{ marginTop: 4 }}>{dateTime(m.createdAt)}</div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      {closed ? (
        <div className="muted small" style={{ marginTop: 14 }}>This ticket is closed. Open a new one if you still need help.</div>
      ) : (
        <div className="card" style={{ marginTop: 14, padding: 12 }}>
          <div className="row" style={{ gap: 10, alignItems: "flex-end" }}>
            <textarea className="input grow" rows={2} style={{ minHeight: 56 }} placeholder="Write a reply… (Ctrl+Enter to send)" value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, 2000))}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void send(); } }} />
            <Button onClick={send} loading={sending} disabled={!draft.trim()} title="Send (Ctrl+Enter)"><Send size={16} /> Send</Button>
          </div>
        </div>
      )}
    </div>
  );
}
