import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { Gamepad2, Pencil, Plus, Trash2 } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import { useLoad } from "../lib/store";
import type { Game, GameAccount } from "../lib/types";
import { safeColor } from "../lib/format";
import { gameAccountError } from "../lib/validation";
import { Alert, Button, Confirm, Empty, ErrorState, Field, Loading, Modal, PageHead, TextInput, useToast } from "../components/ui";

type Editing = { account: GameAccount | null; gameId?: string };

export function AccountsPage() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const data = useLoad(async () => {
    const [accounts, games] = await Promise.all([api.accounts(), api.games()]);
    return { accounts, games };
  }, []);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [deleting, setDeleting] = useState<GameAccount | null>(null);
  const [busy, setBusy] = useState(false);

  // `?game=<id>` (from tournament "Link game ID" fix) opens the add dialog preselected.
  useEffect(() => {
    const g = params.get("game");
    if (g && data.data) {
      setEditing({ account: null, gameId: g });
      setParams({}, { replace: true });
    }
  }, [params, data.data, setParams]);

  const remove = async () => {
    if (!deleting || !data.data) return;
    setBusy(true);
    try {
      await api.removeAccount(deleting.id);
      data.setData({ ...data.data, accounts: data.data.accounts.filter((a) => a.id !== deleting.id) });
      toast("Game ID removed");
      setDeleting(null);
    } catch (e) {
      toast(errorMessage(e), "error");
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page narrow">
      <PageHead title="Game IDs" back subtitle="Link the in-game accounts you'll play with. Admins use these IDs to verify results, and tournaments may require a minimum level.">
        <Button onClick={() => setEditing({ account: null })} disabled={!data.data}><Plus size={16} /> Link account</Button>
      </PageHead>
      {data.loading && !data.data ? <Loading /> : data.error && !data.data ? <ErrorState message={data.error} onRetry={data.reload} /> : (() => {
        const { accounts, games } = data.data!;
        if (accounts.length === 0) return <div className="card"><Empty title="No game IDs yet" body="Link your PUBG Mobile, Free Fire or other game account to start joining tournaments." action={<Button onClick={() => setEditing({ account: null })}><Plus size={16} /> Link account</Button>} /></div>;
        const known = new Set(games.map((g) => g.id));
        const groups: { game: Pick<Game, "id" | "name" | "accent" | "accountIdLabel">; items: GameAccount[] }[] = games
          .map((g) => ({ game: g, items: accounts.filter((a) => a.gameId === g.id) }))
          .filter((x) => x.items.length > 0);
        const orphans = accounts.filter((a) => !known.has(a.gameId));
        if (orphans.length) groups.push({ game: { id: "other", name: "Other", accent: "#9A8F88", accountIdLabel: "ID" }, items: orphans });
        return (
          <div className="col" style={{ gap: 18 }}>
            {groups.map(({ game, items }) => (
              <div key={game.id}>
                <div className="label" style={{ color: safeColor(game.accent), marginBottom: 8 }}>{game.name}</div>
                <div className="card flush">
                  {items.map((a) => (
                    <div key={a.id} className="listrow">
                      <Gamepad2 size={20} color={safeColor(game.accent)} />
                      <div className="grow">
                        <div className="row" style={{ gap: 8 }}>
                          <b>{a.inGameName}</b>
                          <span className={`pill ${a.verified ? "success" : "muted"}`}>{a.verified ? "Verified" : "Unverified"}</span>
                        </div>
                        <div className="small muted selectable">{game.accountIdLabel} {a.inGameId} · Level {a.level}</div>
                      </div>
                      <button className="iconbtn" title={`Edit ${a.inGameName}`} onClick={() => setEditing({ account: a })}><Pencil size={16} /></button>
                      <button className="iconbtn" title={`Remove ${a.inGameName}`} style={{ color: "var(--danger)" }} onClick={() => setDeleting(a)}><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {editing && data.data && (
        <AccountDialog editing={editing} games={data.data.games} onClose={() => setEditing(null)} onSaved={(acc) => {
          const list = data.data!.accounts;
          const exists = list.some((a) => a.id === acc.id);
          data.setData({ ...data.data!, accounts: exists ? list.map((a) => (a.id === acc.id ? acc : a)) : [...list, acc] });
          toast(exists ? "Game ID updated" : "Game ID linked");
          setEditing(null);
        }} />
      )}
      <Confirm open={!!deleting} title={`Remove ${deleting?.inGameName ?? ""}?`} danger busy={busy} confirmLabel="Remove"
        body="You can link it again later. Accounts registered in active tournaments can't be removed."
        onClose={() => setDeleting(null)} onConfirm={remove} />
    </div>
  );
}

function AccountDialog({ editing, games, onClose, onSaved }: { editing: Editing; games: Game[]; onClose: () => void; onSaved: (a: GameAccount) => void }) {
  const existing = editing.account;
  const initialGame = existing?.gameId ?? (games.some((g) => g.id === editing.gameId) ? editing.gameId! : games[0]?.id ?? "");
  const [gameId, setGameId] = useState(initialGame);
  const [name, setName] = useState(existing?.inGameName ?? "");
  const [gid, setGid] = useState(existing?.inGameId ?? "");
  const [level, setLevel] = useState(existing ? String(existing.level) : "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const label = games.find((g) => g.id === gameId)?.accountIdLabel ?? "Player ID";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const lv = Number(level);
    const err = !gameId ? "Choose a game." : gameAccountError(name, existing ? null : gid, lv);
    if (err) return setError(err);
    setBusy(true);
    setError(null);
    try {
      const acc = existing ? await api.updateAccount(existing.id, name.trim(), lv) : await api.addAccount(gameId, name.trim(), gid.trim(), lv);
      onSaved(acc);
    } catch (e2) {
      setError(errorMessage(e2));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} width={520}>
      <form className="col" onSubmit={submit} noValidate>
        <h2 className="h2">{existing ? "Edit game account" : "Link game account"}</h2>
        {!existing && (
          <div className="chipbar" style={{ flexWrap: "wrap" }}>
            {games.map((g) => (
              <button type="button" key={g.id} className={`chipbtn ${gameId === g.id ? "active" : ""}`} onClick={() => setGameId(g.id)}>
                <i style={{ background: safeColor(g.accent) }} />{g.name}
              </button>
            ))}
          </div>
        )}
        <Field label="In-game name"><TextInput value={name} onChange={(e) => setName(e.target.value.slice(0, 24))} autoFocus /></Field>
        {!existing && (
          <Field label={label}>
            <TextInput value={gid} onChange={(e) => setGid(e.target.value.replace(/\s/g, "").slice(0, 32))} />
          </Field>
        )}
        {!existing && <div className="dim small" style={{ marginTop: -6 }}>Exactly as shown in your game profile.</div>}
        <Field label="Account level"><TextInput inputMode="numeric" value={level} onChange={(e) => setLevel(e.target.value.replace(/\D/g, "").slice(0, 3))} /></Field>
        {error && <Alert>{error}</Alert>}
        <div className="actions" style={{ marginTop: 4 }}>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={busy}>{existing ? "Save changes" : "Link account"}</Button>
        </div>
      </form>
    </Modal>
  );
}
