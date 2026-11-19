import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Info } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import { useStore } from "../lib/store";
import type { CoinTransaction } from "../lib/types";
import { dateTime, fmt, signed } from "../lib/format";
import { Button, Coin, Disclaimer, Empty, ErrorState, Loading, PageHead } from "../components/ui";

type Filter = "all" | "earned" | "spent";

export function WalletPage() {
  const { wallet, setWallet } = useStore();
  const [filter, setFilter] = useState<Filter>("all");
  const [items, setItems] = useState<CoinTransaction[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.transactions(filter === "all" ? null : filter, null)
      .then((r) => {
        if (cancelled) return;
        setItems(r.items);
        setCursor(r.nextCursor);
        setWallet(r.wallet);
      })
      .catch((e) => !cancelled && setError(errorMessage(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [filter, key, setWallet]);

  useEffect(() => {
    const h = () => setKey((k) => k + 1);
    window.addEventListener("ember:refresh", h);
    return () => window.removeEventListener("ember:refresh", h);
  }, []);

  const loadMore = async () => {
    if (cursor === null) return;
    setMore(true);
    try {
      const r = await api.transactions(filter === "all" ? null : filter, cursor);
      setItems((xs) => [...xs, ...r.items.filter((t) => !xs.some((x) => x.id === t.id))]);
      setCursor(r.nextCursor);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setMore(false);
    }
  };

  return (
    <div className="page narrow">
      <PageHead title="Coin wallet" subtitle="Virtual coins for tournament entry and rewards." />
      <div className="card hot" style={{ position: "relative", overflow: "hidden" }}>
        <img src="/img/img_coin.webp" alt="" draggable={false} style={{ position: "absolute", right: -30, top: -30, width: 200, opacity: 0.16, transform: "rotate(-14deg)" }} />
        <div className="label">Current balance</div>
        <div className="row" style={{ gap: 12, marginTop: 6 }}>
          <Coin size={40} />
          <span className="display" style={{ fontSize: 52, lineHeight: 1 }}>{fmt(wallet.balance)}</span>
          <span className="h3 muted">coins</span>
        </div>
        <div className="grid g2" style={{ marginTop: 18, maxWidth: 440 }}>
          <div className="stat"><span className="v success">{fmt(wallet.earned)}</span><span className="k">Total earned</span></div>
          <div className="stat"><span className="v">{fmt(wallet.spent)}</span><span className="k">Total spent</span></div>
        </div>
      </div>

      <div className="alert info" style={{ marginTop: 14 }}>
        <Info size={16} style={{ flex: "none", marginTop: 1 }} />
        <div>Coin top-ups and withdrawals aren't available in the desktop app. Earn coins from daily rewards and tournament placements.</div>
      </div>

      <div className="section">
        <div className="sechead">
          <h2 className="h2">Transaction history</h2>
          <div className="chipbar">
            {(["all", "earned", "spent"] as Filter[]).map((f) => (
              <button key={f} className={`chipbtn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>{f === "all" ? "All" : f === "earned" ? "Earned" : "Spent"}</button>
            ))}
          </div>
        </div>
        {loading ? <Loading /> : error && items.length === 0 ? <ErrorState message={error} onRetry={() => setKey((k) => k + 1)} /> : items.length === 0 ? (
          <div className="card"><Empty title="No transactions yet" body="Claim your daily reward or join a tournament to get started." /></div>
        ) : (
          <>
            <div className="card flush">
              {items.map((t) => (
                <div key={t.id} className="listrow">
                  <span style={{ width: 34, height: 34, borderRadius: 10, display: "grid", placeItems: "center", flex: "none", background: t.amount >= 0 ? "rgba(61,220,132,0.12)" : "rgba(255,90,31,0.12)" }}>
                    {t.amount >= 0 ? <ArrowDownLeft size={17} color="var(--success)" /> : <ArrowUpRight size={17} color="var(--orange)" />}
                  </span>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="ellipsis" style={{ fontWeight: 600 }}>{t.description}</div>
                    <div className="small dim">{dateTime(t.createdAt)}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="num" style={{ color: t.amount >= 0 ? "var(--success)" : "var(--text)" }}>{signed(t.amount)}</div>
                    <div className="small dim">bal {fmt(t.balanceAfter)}</div>
                  </div>
                </div>
              ))}
            </div>
            {cursor !== null && <div style={{ textAlign: "center", marginTop: 14 }}><Button variant="ghost" loading={more} onClick={loadMore}>Load more</Button></div>}
          </>
        )}
      </div>
      <div style={{ marginTop: 18 }}><Disclaimer /></div>
    </div>
  );
}
