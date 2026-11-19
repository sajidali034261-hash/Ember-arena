import type { ApiRequest, HttpMethod } from "../../electron/bridge";
import type {
  AuthResponse, ClaimResponse, DailyStatus, Faq, GameAccount, Game, GameDetailResponse, HomeData, LeaderboardResponse,
  LeaveResponse, MeResponse, MyTournament, NotificationsResponse, ProfileData, RegisterResponse, Report, SendCodeResponse,
  Ticket, TicketSummary, TournamentCard, TournamentDetail, TransactionsResponse, User, VerifyConfirmResponse,
} from "./types";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

async function call<T>(method: HttpMethod, path: string, opts: Pick<ApiRequest, "query" | "body"> = {}): Promise<T> {
  if (!window.ember) throw new ApiError(0, "NO_BRIDGE", "Desktop bridge unavailable. Please restart Ember Arena.");
  const res = await window.ember.api.request<T>({ method, path, ...opts });
  if (!res.ok) throw new ApiError(res.status, res.code, res.message);
  return res.data;
}

const enc = encodeURIComponent;

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  return "Something went wrong. Please try again.";
}

export const api = {
  // ---------- Auth ----------
  login: (identifier: string, password: string) => call<AuthResponse>("POST", "/auth/login", { body: { identifier, password } }),
  // signup accepts either channel; the backend stores email and phone on the same user row.
  signup: (username: string, contact: string, password: string, channel: "email" | "phone" = "email") =>
    call<AuthResponse>("POST", "/auth/signup", {
      body: {
        username,
        email: channel === "email" ? contact : null,
        phone: channel === "phone" ? contact : null,
        password,
      },
    }),
  requestVerification: (channel: string | null = null) => call<SendCodeResponse>("POST", "/auth/verify/request", { body: { channel } }),
  confirmVerification: (code: string) => call<VerifyConfirmResponse>("POST", "/auth/verify/confirm", { body: { code } }),
  forgotPassword: (identifier: string) => call<SendCodeResponse>("POST", "/auth/password/forgot", { body: { identifier } }),
  resetPassword: (identifier: string, code: string, password: string) =>
    call<{ ok: boolean }>("POST", "/auth/password/reset", { body: { identifier, code, password } }),
  changePassword: (currentPassword: string, newPassword: string) =>
    call<{ ok: boolean }>("POST", "/auth/password/change", { body: { currentPassword, newPassword } }),
  deleteAccount: (password: string) => call<{ ok: boolean }>("POST", "/auth/delete", { body: { password } }),

  // ---------- Me ----------
  me: () => call<MeResponse>("GET", "/me"),
  updateProfile: (patch: { username?: string; avatarIndex?: number }) => call<{ user: User }>("PATCH", "/me", { body: patch }),
  home: () => call<HomeData>("GET", "/home"),
  profile: () => call<ProfileData>("GET", "/profile"),

  // ---------- Wallet & daily (virtual coins, read-only history) ----------
  transactions: (filter: string | null, before: number | null) =>
    call<TransactionsResponse>("GET", "/wallet/transactions", { query: { filter, before, limit: 30 } }),
  daily: () => call<DailyStatus>("GET", "/daily"),
  claimDaily: () => call<ClaimResponse>("POST", "/daily/claim"),

  // ---------- Games & tournaments ----------
  games: () => call<{ items: Game[] }>("GET", "/games").then((r) => r.items),
  game: (id: string) => call<GameDetailResponse>("GET", `/games/${enc(id)}`),
  tournaments: (status: string, game?: string | null) =>
    call<{ items: TournamentCard[] }>("GET", "/tournaments", { query: { status, game, limit: 50 } }).then((r) => r.items),
  tournament: (id: string) => call<TournamentDetail>("GET", `/tournaments/${enc(id)}`),
  register: (id: string, gameAccountId: string) =>
    call<RegisterResponse>("POST", `/tournaments/${enc(id)}/register`, { body: { gameAccountId } }),
  leave: (id: string) => call<LeaveResponse>("POST", `/tournaments/${enc(id)}/withdraw`),
  myTournaments: (tab: string) => call<{ items: MyTournament[] }>("GET", "/me/tournaments", { query: { tab } }).then((r) => r.items),

  // ---------- Game IDs ----------
  accounts: () => call<{ items: GameAccount[] }>("GET", "/game-accounts").then((r) => r.items),
  addAccount: (gameId: string, inGameName: string, inGameId: string, level: number) =>
    call<{ account: GameAccount }>("POST", "/game-accounts", { body: { gameId, inGameName, inGameId, level } }).then((r) => r.account),
  updateAccount: (id: string, inGameName: string, level: number) =>
    call<{ account: GameAccount }>("PATCH", `/game-accounts/${enc(id)}`, { body: { inGameName, level } }).then((r) => r.account),
  removeAccount: (id: string) => call<{ ok: boolean }>("DELETE", `/game-accounts/${enc(id)}`),

  // ---------- Leaderboard ----------
  leaderboard: (scope: string) => call<LeaderboardResponse>("GET", "/leaderboard", { query: { scope, limit: 50 } }),

  // ---------- Notifications & announcements ----------
  notifications: () => call<NotificationsResponse>("GET", "/notifications"),
  markRead: (id: string) => call<{ ok: boolean }>("POST", `/notifications/${enc(id)}/read`),
  markAllRead: () => call<{ ok: boolean }>("POST", "/notifications/read-all"),

  // ---------- Support ----------
  faqs: () => call<{ items: Faq[] }>("GET", "/support/faqs").then((r) => r.items),
  tickets: () => call<{ items: TicketSummary[] }>("GET", "/support/tickets").then((r) => r.items),
  ticket: (id: string) => call<{ ticket: Ticket }>("GET", `/support/tickets/${enc(id)}`).then((r) => r.ticket),
  createTicket: (category: string, subject: string, message: string, tournamentId: string | null) =>
    call<{ ticket: Ticket }>("POST", "/support/tickets", { body: { category, subject, message, tournamentId } }).then((r) => r.ticket),
  replyTicket: (id: string, message: string) =>
    call<{ ticket: Ticket }>("POST", `/support/tickets/${enc(id)}/messages`, { body: { message } }).then((r) => r.ticket),
  reports: () => call<{ items: Report[] }>("GET", "/support/reports").then((r) => r.items),
  createReport: (category: string, description: string, tournamentId: string | null, reportedPlayer: string | null) =>
    call<{ report: Report }>("POST", "/support/reports", { body: { category, description, tournamentId, reportedPlayer } }).then((r) => r.report),
};
