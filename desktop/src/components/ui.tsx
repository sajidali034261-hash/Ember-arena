import { createContext, useCallback, useContext, useEffect, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, Info, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fmt } from "../lib/format";

export const AVATARS = ["/img/img_avatar_0.webp", "/img/img_avatar_1.webp", "/img/img_avatar_2.webp", "/img/img_avatar_3.webp"];
export const avatarSrc = (i: number) => AVATARS[Math.min(Math.max(i, 0), 3)] ?? AVATARS[0];

export function Avatar({ index, size = 44 }: { index: number; size?: number }) {
  return <img className="avatar" src={avatarSrc(index)} width={size} height={size} alt="" draggable={false} />;
}

export function Coin({ amount, size = 16, className = "" }: { amount?: number | string; size?: number; className?: string }) {
  return (
    <span className={`coin ${className}`}>
      <img src="/img/img_coin.webp" width={size} height={size} alt="" draggable={false} />
      {amount !== undefined && <span>{typeof amount === "number" ? fmt(amount) : amount}</span>}
    </span>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" | "text"; loading?: boolean; block?: boolean; small?: boolean };
export function Button({ variant = "primary", loading, block, small, className = "", children, disabled, ...rest }: BtnProps) {
  const v = variant === "primary" ? "" : variant;
  return (
    <button className={`btn ${v} ${block ? "block" : ""} ${small ? "sm" : ""} ${className}`} disabled={disabled || loading} {...rest}>
      {loading ? <span className="spinner sm" /> : children}
    </button>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="input" spellCheck={false} {...props} />;
}

export function PasswordInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <div className="pwwrap">
      <input className="input" type={show ? "text" : "password"} spellCheck={false} {...props} />
      <button type="button" tabIndex={-1} onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"}>
        {show ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}

export function Alert({ kind = "error", children }: { kind?: "error" | "ok" | "info"; children: ReactNode }) {
  const Icon = kind === "error" ? AlertCircle : kind === "ok" ? CheckCircle2 : Info;
  return (
    <div className={`alert ${kind}`} role={kind === "error" ? "alert" : "status"}>
      <Icon size={16} style={{ flex: "none", marginTop: 1 }} />
      <div className="selectable">{children}</div>
    </div>
  );
}

export function Spinner({ small }: { small?: boolean }) {
  return <span className={`spinner ${small ? "sm" : ""}`} />;
}

export function Loading() {
  return (
    <div className="center">
      <Spinner />
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="empty">
      <AlertCircle size={34} color="var(--danger)" />
      <div className="h3">Couldn't load this</div>
      <div className="muted selectable">{message}</div>
      {onRetry && (
        <Button variant="ghost" small onClick={onRetry}>
          <RefreshCw size={15} /> Try again
        </Button>
      )}
    </div>
  );
}

export function Empty({ title, body, image = "/img/img_chest.webp", action }: { title: string; body?: string; image?: string | null; action?: ReactNode }) {
  return (
    <div className="empty">
      {image && <img src={image} alt="" draggable={false} />}
      <div className="h3" style={{ color: "var(--text)" }}>{title}</div>
      {body && <div className="muted" style={{ maxWidth: 420 }}>{body}</div>}
      {action}
    </div>
  );
}

export function PageHead({ title, subtitle, back, children }: { title: ReactNode; subtitle?: ReactNode; back?: boolean; children?: ReactNode }) {
  const nav = useNavigate();
  return (
    <div className="pagehead">
      {back && (
        <button className="back" onClick={() => nav(-1)} aria-label="Back" title="Back (Alt+←)">
          <ArrowLeft size={18} />
        </button>
      )}
      <div className="grow">
        <h1 className="h1">{title}</h1>
        {subtitle && <div className="muted" style={{ marginTop: 4 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

export function Tabs<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="tabs" role="tablist">
      {options.map((o) => (
        <button key={o.id} role="tab" aria-selected={value === o.id} className={`tab ${value === o.id ? "active" : ""}`} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Modal({ open, onClose, children, width }: { open: boolean; onClose: () => void; children: ReactNode; width?: number }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", h, true);
    return () => window.removeEventListener("keydown", h, true);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" style={width ? { width: `min(${width}px, calc(100vw - 48px))` } : undefined}>
        {children}
      </div>
    </div>
  );
}

export function Confirm({ open, title, body, confirmLabel, danger, busy, onConfirm, onClose, children }: {
  open: boolean; title: string; body?: ReactNode; confirmLabel: string; danger?: boolean; busy?: boolean;
  onConfirm: () => void; onClose: () => void; children?: ReactNode;
}) {
  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="h2">{title}</h2>
      {body && <div className="muted" style={{ marginTop: 8 }}>{body}</div>}
      {children}
      <div className="actions">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant={danger ? "danger" : "primary"} loading={busy} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}

export function Disclaimer({ children }: { children?: ReactNode }) {
  return (
    <div className="disclaimer">
      <Info size={15} style={{ flex: "none", marginTop: 1 }} />
      <span>{children ?? "Coins are Ember Arena's virtual currency. They have no cash value and can't be redeemed, withdrawn or transferred in the desktop app."}</span>
    </div>
  );
}

export function Progress({ value }: { value: number }) {
  return (
    <div className="progress">
      <i style={{ width: `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%` }} />
    </div>
  );
}

export function StatusPill({ status, label }: { status: string; label?: string }) {
  const s = status.toLowerCase();
  const cls = s === "answered" || s === "resolved" || s === "verified" ? "success"
    : s === "closed" || s === "rejected" || s === "cancelled" ? "muted"
    : s === "reviewing" ? "info" : "orange";
  return <span className={`pill ${cls}`}>{label ?? s.replace(/_/g, " ")}</span>;
}

// ---------- Toasts ----------
type Toast = { id: number; kind: "ok" | "error" | "info"; text: string };
const ToastCtx = createContext<(text: string, kind?: Toast["kind"]) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((text: string, kind: Toast["kind"] = "ok") => {
    const id = Date.now() + Math.random();
    setItems((xs) => [...xs.slice(-3), { id, kind, text }]);
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 3800);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`}>
            {t.kind === "error" ? <AlertCircle size={17} color="var(--danger)" /> : t.kind === "ok" ? <CheckCircle2 size={17} color="var(--success)" /> : <Info size={17} color="var(--info)" />}
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
