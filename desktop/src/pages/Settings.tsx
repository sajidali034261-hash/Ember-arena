import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Gamepad2, HelpCircle, Laptop, Lock, LogOut, MonitorSmartphone, Trash2, User as UserIcon, ShieldCheck } from "lucide-react";
import type { AppInfo } from "../../electron/bridge";
import { api, errorMessage } from "../lib/api";
import { useStore } from "../lib/store";
import { passwordError, USERNAME_RE } from "../lib/validation";
import { Alert, AVATARS, Button, Confirm, Disclaimer, Field, PageHead, PasswordInput, TextInput, useToast } from "../components/ui";

function SettingRow({ icon, title, subtitle, tint = "var(--orange)", onClick }: { icon: ReactNode; title: string; subtitle?: string | null; tint?: string; onClick: () => void }) {
  return (
    <div className="listrow click" onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onClick()}>
      <span style={{ color: tint, display: "grid" }}>{icon}</span>
      <div className="grow">
        <div style={{ fontWeight: 600, color: tint === "var(--danger)" ? "var(--danger)" : undefined }}>{title}</div>
        {subtitle && <div className="small muted">{subtitle}</div>}
      </div>
      <ChevronRight size={17} color="var(--muted)" />
    </div>
  );
}

export function SettingsPage() {
  const { user, signOut } = useStore();
  const nav = useNavigate();
  const [confirmAll, setConfirmAll] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deletePw, setDeletePw] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<AppInfo | null>(null);

  useEffect(() => {
    window.ember.app.info().then(setInfo).catch(() => undefined);
  }, []);

  const doDelete = async () => {
    if (!deletePw) return setDeleteError("Enter your password to confirm.");
    setBusy(true);
    setDeleteError(null);
    try {
      await api.deleteAccount(deletePw);
      await signOut(false);
    } catch (e) {
      setDeleteError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const verified = user?.verified === true;
  return (
    <div className="page narrow">
      <PageHead title="Account settings" />
      <div className="col" style={{ gap: 14 }}>
        <div className="card flush">
          <SettingRow icon={<UserIcon size={19} />} title="Edit profile" subtitle="Username and avatar" onClick={() => nav("/settings/profile")} />
          <SettingRow icon={<Gamepad2 size={19} />} title="Game IDs" onClick={() => nav("/accounts")} />
          <SettingRow icon={<ShieldCheck size={19} />} title={verified ? "Verified" : "Verify email"} subtitle={user?.email} tint={verified ? "var(--success)" : "var(--gold)"} onClick={() => !verified && nav("/verify")} />
        </div>
        <div className="label">Security</div>
        <div className="card flush">
          <SettingRow icon={<Lock size={19} />} title="Change password" onClick={() => nav("/settings/password")} />
          <SettingRow icon={<MonitorSmartphone size={19} />} title="Sign out of all devices" subtitle="Ends sessions on Android and desktop" onClick={() => setConfirmAll(true)} />
        </div>
        <div className="card flush">
          <SettingRow icon={<HelpCircle size={19} />} title="Help & support" onClick={() => nav("/support")} />
          <SettingRow icon={<LogOut size={19} />} title="Sign out" tint="var(--text)" onClick={() => void signOut(false)} />
          <SettingRow icon={<Trash2 size={19} />} title="Delete account" subtitle="Permanently remove your account and data" tint="var(--danger)" onClick={() => { setDeletePw(""); setDeleteError(null); setShowDelete(true); }} />
        </div>

        <div className="label">About this app</div>
        <div className="card">
          <div className="row" style={{ gap: 10 }}><Laptop size={18} color="var(--orange)" /><b>Ember Arena for Windows</b>{info && <span className="muted small">v{info.version} · {info.platform}/{info.arch}</span>}</div>
          <ul className="small muted" style={{ margin: "10px 0 0", paddingLeft: 18, lineHeight: 1.7 }}>
            <li>Uses the same account, coins, tournaments and leaderboard as the Android app.</li>
            <li>Coin top-ups and coin withdrawals are not available on desktop. Coins here are virtual and non-redeemable.</li>
            <li>No push notifications: unread notifications refresh every minute while the app is open.</li>
            <li>{info?.secureStorage === false ? "Secure storage is unavailable on this PC, so you'll need to sign in each time the app starts." : "Your sign-in is stored encrypted with Windows data protection for your user account."}</li>
          </ul>
        </div>
        <Disclaimer>Ember Arena is a non-cash tournament platform on desktop. Coins and badges are virtual, have no monetary value and can't be bought, withdrawn or exchanged in this app.</Disclaimer>
      </div>

      <Confirm open={confirmAll} title="Sign out everywhere?" body="All sessions on every device will end, including this one." confirmLabel="Sign out all" busy={busy}
        onClose={() => setConfirmAll(false)} onConfirm={async () => { setBusy(true); await signOut(true); setBusy(false); }} />
      <Confirm open={showDelete} title="Delete account" danger busy={busy} confirmLabel="Delete forever"
        body="This removes your profile, game IDs and upcoming registrations. Coins are forfeited. This can't be undone."
        onClose={() => setShowDelete(false)} onConfirm={doDelete}>
        <div className="col" style={{ marginTop: 14 }}>
          <Field label="Password"><PasswordInput value={deletePw} onChange={(e) => setDeletePw(e.target.value)} autoFocus /></Field>
          {deleteError && <Alert>{deleteError}</Alert>}
        </div>
      </Confirm>
    </div>
  );
}

export function EditProfilePage() {
  const { user, setUser } = useStore();
  const toast = useToast();
  const nav = useNavigate();
  const [username, setUsername] = useState(user?.username ?? "");
  const [avatar, setAvatar] = useState(user?.avatarIndex ?? 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!USERNAME_RE.test(username.trim())) return setError("Username must be 3–20 letters, numbers, _ or .");
    setBusy(true);
    setError(null);
    try {
      const patch: { username?: string; avatarIndex?: number } = {};
      if (username.trim() !== user?.username) patch.username = username.trim();
      if (avatar !== user?.avatarIndex) patch.avatarIndex = avatar;
      if (Object.keys(patch).length) {
        const res = await api.updateProfile(patch);
        setUser(res.user);
      }
      toast("Profile saved");
      nav(-1);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page narrow">
      <PageHead title="Edit profile" back />
      <form className="card col" style={{ gap: 18 }} onSubmit={save} noValidate>
        <div>
          <div className="h3" style={{ marginBottom: 12 }}>Avatar</div>
          <div className="row" style={{ gap: 16 }}>
            {AVATARS.map((src, i) => (
              <button key={src} type="button" onClick={() => setAvatar(i)} aria-pressed={avatar === i}
                style={{ padding: 3, borderRadius: "50%", border: `3px solid ${avatar === i ? "var(--orange)" : "transparent"}`, background: "transparent", cursor: "pointer", boxShadow: avatar === i ? "0 0 24px -6px var(--orange)" : undefined }}>
                <img src={src} width={84} height={84} style={{ borderRadius: "50%", display: "block" }} alt={`Avatar ${i + 1}`} draggable={false} />
              </button>
            ))}
          </div>
        </div>
        <Field label="Username">
          <TextInput value={username} onChange={(e) => setUsername(e.target.value)} maxLength={20} />
        </Field>
        {error && <Alert>{error}</Alert>}
        <div><Button type="submit" loading={busy}>Save changes</Button></div>
      </form>
    </div>
  );
}

export function ChangePasswordPage() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const err = !current ? "Enter your current password." : passwordError(next) ?? (next !== confirm ? "Passwords don't match." : null);
    if (err) return setError(err);
    setBusy(true);
    setError(null);
    try {
      await api.changePassword(current, next);
      setDone(true);
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err2) {
      setError(errorMessage(err2));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page narrow">
      <PageHead title="Change password" back />
      <form className="card col" onSubmit={submit} noValidate style={{ maxWidth: 520 }}>
        <Field label="Current password"><PasswordInput autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} /></Field>
        <Field label="New password"><PasswordInput autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} maxLength={128} /></Field>
        <Field label="Confirm new password"><PasswordInput autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} maxLength={128} /></Field>
        <div className="dim small">8+ characters with at least one letter and one number.</div>
        {error && <Alert>{error}</Alert>}
        {done && <Alert kind="ok">Password updated. Other devices were signed out.</Alert>}
        <div><Button type="submit" loading={busy}>Update password</Button></div>
      </form>
    </div>
  );
}
