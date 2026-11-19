// Client-side rules mirrored from Android (AuthViewModel.kt, Settings/Accounts screens) and backend validators.
// The backend remains authoritative; these only give faster, friendlier feedback.

export const USERNAME_RE = /^[A-Za-z0-9_.]{3,20}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const CODE_RE = /^[0-9]{6}$/;
export const GAME_ID_RE = /^[A-Za-z0-9#_.-]{4,32}$/;
/** Backend contract (functions/src/http.ts PHONE_RE): optional +, then 8–15 digits after separator stripping. */
export const PHONE_RE = /^\+?[0-9]{8,15}$/;
/** Same normalization the backend applies before its PHONE_RE test. */
export const normalizePhone = (v: string) => v.replace(/[\s()-]/g, "");

export function passwordError(pw: string): string | null {
  if (pw.length < 8 || !/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return "Password needs 8+ characters with a letter and a number.";
  if (pw.length > 128) return "Password is too long.";
  return null;
}

export function signupError(
  username: string,
  contact: string,
  password: string,
  confirm: string,
  accepted: boolean,
  channel: "email" | "phone" = "email",
): string | null {
  if (!USERNAME_RE.test(username.trim())) return "Username must be 3–20 letters, numbers, _ or .";
  if (!contact.trim()) return channel === "email" ? "Enter your email." : "Enter your phone number.";
  if (channel === "email") {
    if (!EMAIL_RE.test(contact.trim())) return "Enter a valid email address.";
  } else {
    // Error text matches the backend's exactly (functions/src/services/auth.ts).
    if (!PHONE_RE.test(normalizePhone(contact.trim()))) return "Enter a valid phone number with country code.";
  }
  const pw = passwordError(password);
  if (pw) return pw;
  if (password !== confirm) return "Passwords don't match.";
  if (!accepted) return "Please accept the terms to continue.";
  return null;
}

export function gameAccountError(name: string, inGameId: string | null, level: number): string | null {
  const n = name.trim();
  if (n.length < 2 || n.length > 24) return "In-game name must be 2–24 characters.";
  if (inGameId !== null && !GAME_ID_RE.test(inGameId.trim())) return "Game ID must be 4–32 letters, numbers or # _ . -";
  if (!Number.isInteger(level) || level < 1 || level > 100) return "Level must be between 1 and 100.";
  return null;
}

export const TICKET_CATEGORIES = [
  { id: "account", label: "Account" },
  { id: "tournament", label: "Tournament" },
  { id: "coins", label: "Coins" },
  { id: "bug", label: "Bug" },
  { id: "other", label: "Other" },
];

export const REPORT_CATEGORIES = [
  { id: "cheating", label: "Cheating" },
  { id: "abuse", label: "Abuse" },
  { id: "wrong_result", label: "Wrong result" },
  { id: "no_room_details", label: "No room details" },
  { id: "other", label: "Other" },
];

export function ticketError(subject: string, message: string): string | null {
  if (subject.trim().length < 4 || subject.trim().length > 100) return "Subject must be 4–100 characters.";
  if (message.trim().length < 10 || message.trim().length > 2000) return "Message must be 10–2000 characters.";
  return null;
}

export function reportError(description: string): string | null {
  if (description.trim().length < 10 || description.trim().length > 2000) return "Description must be 10–2000 characters.";
  return null;
}
