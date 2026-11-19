import { useEffect, type ReactNode } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Bell, CalendarCheck, Gamepad2, Home, LifeBuoy, LogOut, Settings, Swords, Trophy, User as UserIcon, Wallet } from "lucide-react";
import { useStore } from "../lib/store";
import { Avatar, Coin } from "./ui";

const PRIMARY = [
  { to: "/", label: "Home", icon: Home, key: "1" },
  { to: "/games", label: "Games", icon: Gamepad2, key: "2" },
  { to: "/matches", label: "My Matches", icon: Swords, key: "3" },
  { to: "/ranks", label: "Ranks", icon: Trophy, key: "4" },
  { to: "/profile", label: "Profile", icon: UserIcon, key: "5" },
];

export function TitleBar({ right }: { right?: ReactNode }) {
  return (
    <div className="titlebar">
      <img src="/img/app-icon.png" alt="" draggable={false} />
      <span className="brand">Ember <b>Arena</b></span>
      <span className="spacer" />
      {right}
    </div>
  );
}

export function Shell() {
  const { user, wallet, unread, signOut } = useStore();
  const nav = useNavigate();
  const loc = useLocation();

  // Windows-style keyboard shortcuts.
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.ctrlKey && !e.shiftKey && !e.altKey && /^[1-5]$/.test(e.key)) {
        e.preventDefault();
        nav(PRIMARY[Number(e.key) - 1].to);
      } else if (e.key === "F5" || (e.ctrlKey && e.key.toLowerCase() === "r")) {
        e.preventDefault();
        window.dispatchEvent(new Event("ember:refresh"));
      } else if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault();
        nav(-1);
      } else if (e.altKey && e.key === "ArrowRight") {
        e.preventDefault();
        nav(1);
      } else if (e.ctrlKey && e.key === ",") {
        e.preventDefault();
        nav("/settings");
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [nav]);

  useEffect(() => {
    document.getElementById("main")?.scrollTo({ top: 0 });
  }, [loc.pathname]);

  const isActive = (to: string) => (to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(to));

  return (
    <div className="app">
      <TitleBar
        right={
          <div className="row chip" style={{ gap: 10 }}>
            <button className="iconbtn" style={{ width: "auto", padding: "0 12px", height: 30 }} onClick={() => nav("/wallet")} title="Coin balance (virtual)">
              <Coin amount={wallet.balance} size={16} />
            </button>
            <button className="iconbtn" style={{ width: 30, height: 30 }} onClick={() => nav("/notifications")} title="Notifications">
              <Bell size={16} />
              {unread > 0 && <span className="badge">{unread > 99 ? "99+" : unread}</span>}
            </button>
          </div>
        }
      />
      <div className="body">
        <nav className="sidebar" aria-label="Main">
          {PRIMARY.map((n) => (
            <NavLink key={n.to} to={n.to} className={() => `navlink ${isActive(n.to) ? "active" : ""}`} end={n.to === "/"}>
              <n.icon size={19} />
              {n.label}
              <span className="kbd">Ctrl+{n.key}</span>
            </NavLink>
          ))}
          <div className="label group">Rewards & more</div>
          <NavLink to="/daily" className={() => `navlink ${isActive("/daily") ? "active" : ""}`}>
            <CalendarCheck size={19} /> Daily Reward
          </NavLink>
          <NavLink to="/wallet" className={() => `navlink ${isActive("/wallet") ? "active" : ""}`}>
            <Wallet size={19} /> Coins
          </NavLink>
          <NavLink to="/notifications" className={() => `navlink ${isActive("/notifications") ? "active" : ""}`}>
            <Bell size={19} /> Notifications
            {unread > 0 && <span className="badge">{unread > 99 ? "99+" : unread}</span>}
          </NavLink>
          <NavLink to="/support" className={() => `navlink ${isActive("/support") ? "active" : ""}`}>
            <LifeBuoy size={19} /> Support
          </NavLink>
          <NavLink to="/settings" className={() => `navlink ${isActive("/settings") || isActive("/accounts") ? "active" : ""}`}>
            <Settings size={19} /> Settings
          </NavLink>
          <div className="foot">
            {user && (
              <div className="row" style={{ gap: 10 }}>
                <Avatar index={user.avatarIndex} size={38} />
                <div className="grow">
                  <div className="ellipsis" style={{ fontWeight: 700 }}>{user.username}</div>
                  <div className="small" style={{ color: user.verified ? "var(--success)" : "var(--gold)" }}>{user.verified ? "Verified" : "Not verified"}</div>
                </div>
                <button className="iconbtn" title="Sign out" onClick={() => void signOut(false)}>
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>
        </nav>
        <main className="main" id="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
