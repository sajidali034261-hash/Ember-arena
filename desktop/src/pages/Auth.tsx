import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import { useStore } from "../lib/store";
import { CODE_RE, passwordError, signupError } from "../lib/validation";
import { TitleBar } from "../components/Shell";
import { Alert, Button, Disclaimer, Field, PageHead, PasswordInput, TextInput, useToast } from "../components/ui";

function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app">
      <TitleBar />
      <div className="auth">
        <div className="art">
          <div>
            <img src="/img/img_logo.webp" alt="Ember Arena" style={{ height: 70, marginBottom: 18, borderRadius: 16 }} draggable={false} />
            <div className="h1" style={{ fontSize: 46 }}>Enter the arena.<br /><span className="orange">Climb the ranks.</span></div>
            <p className="muted" style={{ maxWidth: 440, fontSize: 15 }}>
              Join tournaments, track your matches and collect daily rewards with the same account you use on Android.
            </p>
          </div>
        </div>
        <div className="formside">{children}</div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { signedIn } = useStore();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) return setError("Enter your username/email and password.");
    setBusy(true);
    setError(null);
    try {
      const res = await api.login(identifier.trim(), password);
      await signedIn(res.user);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={submit} noValidate>
        <div>
          <h1 className="h1">Welcome back</h1>
          <div className="muted">Sign in to continue to the arena.</div>
        </div>
        {error && <Alert>{error}</Alert>}
        <Field label="Username or email">
          <TextInput autoFocus autoComplete="username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} maxLength={120} />
        </Field>
        <Field label="Password">
          <PasswordInput autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} maxLength={128} />
        </Field>
        <div style={{ textAlign: "right", marginTop: -4 }}>
          <Link to="/forgot" className="small" style={{ fontWeight: 600 }}>Forgot password?</Link>
        </div>
        <Button type="submit" block loading={busy}>Sign in</Button>
        <div className="muted" style={{ textAlign: "center" }}>
          New to the arena? <Link to="/signup" style={{ fontWeight: 700 }}>Create account</Link>
        </div>
        <Disclaimer />
      </form>
    </AuthLayout>
  );
}

export function SignupPage() {
  const { signedIn } = useStore();
  const toast = useToast();
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [channel, setChannel] = useState<"email" | "phone">("email");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const err = signupError(username, contact, password, confirm, accepted, channel);
    if (err) return setError(err);
    setBusy(true);
    setError(null);
    try {
      const res = await api.signup(username.trim(), contact.trim(), password, channel);
      await signedIn(res.user);
      if (res.bonus && res.bonus > 0) toast(`Welcome! ${res.bonus} bonus coins added.`);
      nav(res.user.verified ? "/" : "/verify", { replace: true });
    } catch (err2) {
      setError(errorMessage(err2));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={submit} noValidate>
        <div>
          <h1 className="h1">Create account</h1>
          <div className="muted">One account for Android and desktop.</div>
        </div>
        {error && <Alert>{error}</Alert>}
        <Field label="Username">
          <TextInput autoFocus autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} maxLength={20} placeholder="3–20 letters, numbers, _ or ." />
        </Field>
        <div>
          <div className="field"><span>Sign up with</span></div>
          <div className="chipbar">
            <button type="button" className={`chipbtn ${channel === "email" ? "active" : ""}`} onClick={() => setChannel("email")}>Email</button>
            <button type="button" className={`chipbtn ${channel === "phone" ? "active" : ""}`} onClick={() => setChannel("phone")}>Phone</button>
          </div>
        </div>
        {channel === "email" ? (
          <Field label="Email">
            <TextInput type="email" autoComplete="email" value={contact} onChange={(e) => setContact(e.target.value)} maxLength={120} placeholder="you@example.com" />
          </Field>
        ) : (
          <Field label="Phone number">
            <TextInput type="tel" autoComplete="tel" inputMode="tel" value={contact}
              onChange={(e) => setContact(e.target.value.replace(/[^0-9+\s()-]/g, "").slice(0, 20))}
              placeholder="+92 300 1234567" />
          </Field>
        )}
        <div className="grid g2" style={{ gap: 12 }}>
          <Field label="Password">
            <PasswordInput autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} maxLength={128} />
          </Field>
          <Field label="Confirm password">
            <PasswordInput autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} maxLength={128} />
          </Field>
        </div>
        <div className="dim small" style={{ marginTop: -6 }}>8+ characters with at least one letter and one number.</div>
        <label className="check">
          <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
          <span>I'm 13 or older and agree to play fair. I understand coins are virtual, have no cash value and can't be withdrawn from the desktop app.</span>
        </label>
        <Button type="submit" block loading={busy}>Create account</Button>
        <div className="muted" style={{ textAlign: "center" }}>
          Already have an account? <Link to="/login" style={{ fontWeight: 700 }}>Sign in</Link>
        </div>
      </form>
    </AuthLayout>
  );
}

export function ForgotPage() {
  const nav = useNavigate();
  const [step, setStep] = useState<"request" | "reset" | "done">("request");
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = async (e: FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return setError("Enter your email or username.");
    setBusy(true);
    setError(null);
    try {
      await api.forgotPassword(identifier.trim());
      setStep("reset");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const reset = async (e: FormEvent) => {
    e.preventDefault();
    const err = !CODE_RE.test(code) ? "Enter the 6-digit code." : passwordError(password) ?? (password !== confirm ? "Passwords don't match." : null);
    if (err) return setError(err);
    setBusy(true);
    setError(null);
    try {
      await api.resetPassword(identifier.trim(), code, password);
      setStep("done");
    } catch (err2) {
      setError(errorMessage(err2));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      {step === "request" && (
        <form onSubmit={request} noValidate>
          <div>
            <h1 className="h1">Reset password</h1>
            <div className="muted">We'll email a 6-digit code to the address on your account.</div>
          </div>
          {error && <Alert>{error}</Alert>}
          <Field label="Email or username">
            <TextInput autoFocus value={identifier} onChange={(e) => setIdentifier(e.target.value)} maxLength={120} />
          </Field>
          <Button type="submit" block loading={busy}>Send code</Button>
          <Link to="/login" className="small" style={{ textAlign: "center", fontWeight: 600 }}>Back to sign in</Link>
        </form>
      )}
      {step === "reset" && (
        <form onSubmit={reset} noValidate>
          <div>
            <h1 className="h1">Enter code</h1>
            <div className="muted">If an account matches, a code is on its way. It may take a minute — check spam too.</div>
          </div>
          {error && <Alert>{error}</Alert>}
          <Field label="6-digit code">
            <TextInput autoFocus inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} style={{ letterSpacing: "0.4em", fontWeight: 700 }} />
          </Field>
          <Field label="New password">
            <PasswordInput autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} maxLength={128} />
          </Field>
          <Field label="Confirm new password">
            <PasswordInput autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} maxLength={128} />
          </Field>
          <Button type="submit" block loading={busy}>Update password</Button>
          <Button type="button" variant="text" onClick={() => setStep("request")}>Use a different email</Button>
        </form>
      )}
      {step === "done" && (
        <form onSubmit={(e) => { e.preventDefault(); nav("/login", { replace: true }); }}>
          <Alert kind="ok">Password updated. Sign in with your new password.</Alert>
          <Button type="submit" block>Back to sign in</Button>
        </form>
      )}
    </AuthLayout>
  );
}

/** Email verification for accounts created before auto-verification (Android VerifyScreen). */
export function VerifyPage() {
  const { user, setUser, setWallet } = useStore();
  const toast = useToast();
  const nav = useNavigate();
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user?.verified) {
    return (
      <div className="page narrow">
        <PageHead title="Verified" back />
        <Alert kind="ok">Your account is verified.</Alert>
      </div>
    );
  }

  // Same target pick as Android: email when present, otherwise phone.
  const isPhone = !user?.email && !!user?.phone;

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.requestVerification(isPhone ? "phone" : "email");
      setSent(true);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const confirm = async (e: FormEvent) => {
    e.preventDefault();
    if (!CODE_RE.test(code)) return setError("Enter the 6-digit code.");
    setBusy(true);
    setError(null);
    try {
      const res = await api.confirmVerification(code);
      setUser(res.user);
      setWallet(res.wallet);
      toast(res.bonus > 0 ? `Verified! ${res.bonus} coins added.` : "Account verified.");
      nav(-1);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page narrow">
      <PageHead title={isPhone ? "Verify your phone" : "Verify your email"} subtitle={user?.email ?? user?.phone ?? undefined} back />
      <div className="card" style={{ maxWidth: 520 }}>
        <form onSubmit={confirm} className="col" noValidate>
          <div className="row"><MailCheck color="var(--orange)" /><span className="muted">Verified accounts can collect daily rewards and join tournaments that require verification.</span></div>
          {error && <Alert>{error}</Alert>}
          {sent && <Alert kind="info">Code sent to {isPhone ? "your phone" : "your email"}. It may take a minute{isPhone ? "" : " — check spam too"}.</Alert>}
          <Field label="6-digit code">
            <TextInput inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} style={{ letterSpacing: "0.4em", fontWeight: 700 }} />
          </Field>
          <div className="row">
            <Button type="submit" loading={busy} disabled={!sent && code.length < 6}>Verify</Button>
            <Button type="button" variant="ghost" onClick={send} disabled={busy}>{sent ? "Resend code" : "Send code"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
