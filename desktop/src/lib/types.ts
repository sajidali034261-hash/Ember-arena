// Mirrors android-emberarena/.../data/Models.kt (player-facing DTOs only).

export interface User {
  id: string;
  username: string;
  email?: string | null;
  phone?: string | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  verified: boolean;
  role?: string;
  avatarIndex: number;
  createdAt: number;
}

/** Virtual coins only — no monetary value. Always server-authoritative. */
export interface Wallet {
  balance: number;
  earned: number;
  spent: number;
}

export interface DailyClaim {
  date: string;
  streakDay: number;
  amount: number;
  createdAt?: number;
}

export interface DailyStatus {
  canClaim: boolean;
  claimedToday: boolean;
  requiresVerification: boolean;
  currentStreak: number;
  nextDay: number;
  nextAmount: number;
  todayAmount: number;
  schedule: number[];
  nextClaimAt: number;
  serverTime: number;
  history?: DailyClaim[];
}

export interface Stats {
  points: number;
  wins: number;
  matches: number;
  kills: number;
  podiums: number;
  rank: number | null;
  tournamentsJoined: number;
}

export type TournamentStatus = "upcoming" | "live" | "completed" | "cancelled" | string;

export interface TournamentCard {
  id: string;
  title: string;
  gameId: string;
  gameName: string;
  gameShortName: string;
  bannerUrl?: string | null;
  accent: string;
  mode: string;
  perspective: string;
  map: string;
  startsAt: number;
  slots: number;
  registered: number;
  entryFee: number;
  prizePool: number;
  status: TournamentStatus;
  featured: boolean;
}

export interface GameChip {
  id: string;
  name: string;
  shortName: string;
  accent: string;
}

export interface HomeData {
  user: User;
  wallet: Wallet;
  daily: DailyStatus;
  stats: Stats;
  unreadNotifications: number;
  featured: TournamentCard[];
  upcoming: TournamentCard[];
  recent: TournamentCard[];
  games: GameChip[];
  serverTime: number;
}

export interface Game {
  id: string;
  name: string;
  shortName: string;
  category: string;
  bannerUrl: string;
  accent: string;
  accountIdLabel: string;
  upcomingCount: number;
  liveCount: number;
  next: TournamentCard[];
}

export interface GameDetailResponse {
  game: Game;
  live: TournamentCard[];
  upcoming: TournamentCard[];
  completed: TournamentCard[];
}

export interface Requirement {
  key: string;
  label: string;
  met: boolean;
  hint?: string | null;
}

export interface GameAccount {
  id: string;
  gameId: string;
  inGameName: string;
  inGameId: string;
  level: number;
  verified: boolean;
  createdAt: number;
}

export interface Registration {
  id: string;
  gameAccountId: string;
  status: string;
  registeredAt: number;
  entryPaid: number;
}

export interface Room {
  id?: string | null;
  password?: string | null;
}

export interface MyResult {
  placement: number;
  kills: number;
  points: number;
  prize: number;
}

export interface ResultEntry {
  username: string;
  avatarIndex: number;
  placement: number;
  kills: number;
  points: number;
  prize: number;
}

export interface TournamentDetail extends TournamentCard {
  subtitle: string;
  format: string;
  rules: string[];
  prizes: number[];
  minLevel: number;
  registrationClosesAt: number;
  requirements: Requirement[];
  eligible: boolean;
  accounts: GameAccount[];
  accountIdLabel: string;
  registration?: Registration | null;
  room?: Room | null;
  roomRevealAt: number;
  myResult?: MyResult | null;
  results: ResultEntry[];
  serverTime: number;
}

export interface RegisterResponse {
  registrationId: string;
  wallet: Wallet;
  tournament: TournamentDetail;
}

export interface LeaveResponse {
  ok: boolean;
  wallet: Wallet;
  tournament: TournamentDetail;
}

export interface MyTournament {
  tournament: TournamentCard;
  participantStatus: string;
  inGameName?: string | null;
  result?: MyResult | null;
  roomReady: boolean;
}

export interface LeaderEntry {
  rank: number | null;
  userId: string;
  username: string;
  avatarIndex: number;
  points: number;
  wins: number;
  matches: number;
  kills: number;
  podiums: number;
  isMe: boolean;
}

export interface TournamentPodium {
  tournament: TournamentCard;
  podium: ResultEntry[];
}

export interface LeaderboardResponse {
  scope: string;
  entries: LeaderEntry[];
  me?: LeaderEntry | null;
  tournaments: TournamentPodium[];
  reward: string;
}

export interface CoinTransaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  balanceAfter: number;
  referenceId?: string | null;
  createdAt: number;
}

export interface TransactionsResponse {
  items: CoinTransaction[];
  nextCursor: number | null;
  wallet: Wallet;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  refType?: string | null;
  refId?: string | null;
  read: boolean;
  createdAt: number;
}

export interface NotificationsResponse {
  items: AppNotification[];
  unreadCount: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress: number;
  target: number;
}

export interface HistoryItem {
  tournament: TournamentCard;
  result?: MyResult | null;
}

export interface ProfileData {
  user: User;
  wallet: Wallet;
  stats: Stats;
  accounts: GameAccount[];
  achievements: Achievement[];
  history: HistoryItem[];
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
}

export interface TicketSummary {
  id: string;
  subject: string;
  category: string;
  status: string;
  createdAt: number;
  updatedAt: number;
  lastMessage?: string | null;
  lastSender?: string | null;
}

export interface TicketMessage {
  id: string;
  sender: string;
  body: string;
  createdAt: number;
}

export interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: string;
  tournamentId?: string | null;
  createdAt: number;
  updatedAt: number;
  messages: TicketMessage[];
}

export interface Report {
  id: string;
  tournamentId?: string | null;
  tournamentTitle?: string | null;
  category: string;
  reportedPlayer?: string | null;
  description: string;
  status: string;
  adminResponse?: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface AuthResponse {
  user: User;
  bonus?: number;
  verification?: { channel: string; devCode?: string | null } | null;
}

export interface MeResponse {
  user: User;
  wallet: Wallet;
  unreadNotifications: number;
}

export interface VerifyConfirmResponse {
  user: User;
  bonus: number;
  wallet: Wallet;
}

export interface SendCodeResponse {
  sent: boolean;
  channel?: string | null;
  devCode?: string | null;
}

export interface ClaimResponse {
  claimed: { day: number; amount: number; date: string };
  wallet: Wallet;
  daily: DailyStatus;
}
