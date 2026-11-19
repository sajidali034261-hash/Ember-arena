import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { StoreProvider, useStore } from "./lib/store";
import { Button, Spinner, ToastProvider } from "./components/ui";
import { Shell, TitleBar } from "./components/Shell";
import { ForgotPage, LoginPage, SignupPage, VerifyPage } from "./pages/Auth";
import { HomePage } from "./pages/Home";
import { GameDetailPage, GamesPage } from "./pages/Games";
import { TournamentPage } from "./pages/Tournament";
import { MatchesPage } from "./pages/Matches";
import { RanksPage } from "./pages/Ranks";
import { ProfilePage } from "./pages/Profile";
import { ChangePasswordPage, EditProfilePage, SettingsPage } from "./pages/Settings";
import { AccountsPage } from "./pages/Accounts";
import { NotificationsPage } from "./pages/Notifications";
import { DailyPage } from "./pages/Daily";
import { WalletPage } from "./pages/Wallet";
import { NewTicketPage, ReportPage, SupportPage, TicketPage } from "./pages/Support";

function Boot() {
  const { bootError, retryBoot, signOut } = useStore();
  return (
    <div className="app">
      <TitleBar />
      <div className="splash">
        <img src="/img/img_logo.webp" alt="Ember Arena" draggable={false} />
        {bootError ? (
          <>
            <div className="h3">Can't reach Ember Arena</div>
            <div className="muted selectable" style={{ maxWidth: 420, textAlign: "center" }}>{bootError}</div>
            <div className="row" style={{ gap: 10 }}>
              <Button onClick={retryBoot}><RefreshCw size={16} /> Try again</Button>
              <Button variant="ghost" onClick={() => void signOut(false)}>Sign out</Button>
            </div>
          </>
        ) : <Spinner />}
      </div>
    </div>
  );
}

function AppRoutes() {
  const { phase } = useStore();
  if (phase === "boot") return <Boot />;
  if (phase === "signedOut") {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot" element={<ForgotPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/games" element={<GamesPage />} />
        <Route path="/game/:id" element={<GameDetailPage />} />
        <Route path="/tournament/:id" element={<TournamentPage />} />
        <Route path="/matches" element={<MatchesPage />} />
        <Route path="/ranks" element={<RanksPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/profile" element={<EditProfilePage />} />
        <Route path="/settings/password" element={<ChangePasswordPage />} />
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/daily" element={<DailyPage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/support/new" element={<NewTicketPage />} />
        <Route path="/support/report" element={<ReportPage />} />
        <Route path="/support/ticket/:id" element={<TicketPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <StoreProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </StoreProvider>
    </HashRouter>
  );
}
