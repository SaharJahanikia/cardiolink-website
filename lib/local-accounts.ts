"use client";

/**
 * Demo accounts stored in the visitor's own browser (localStorage).
 *
 * This works on any host, including Vercel, with no database or secrets. The trade-off:
 * accounts exist only in the browser that created them, and anyone with access to that
 * browser can read or edit them. Passwords are hashed (PBKDF2) so they're never stored as
 * plain text, but this is not real security — move to a server database (e.g. Turso)
 * before CardioLink has real users.
 */

export type User = { name: string; email: string };
type StoredAccount = User & { salt: string; hash: string; createdAt: string };

const ACCOUNTS_KEY = "cardiolink.accounts";
const SESSION_KEY = "cardiolink.session";
const SESSION_DAYS = 7;

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD = 12;

/* ---------- storage (every access guarded: private mode or blocked storage can throw) ---------- */

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function remove(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* nothing to clear */
  }
}

const accounts = () => read<StoredAccount[]>(ACCOUNTS_KEY, []);
const findAccount = (email: string) => accounts().find((a) => a.email === email);

/* ---------- password hashing ---------- */

const toHex = (buf: ArrayBuffer | Uint8Array) =>
  Array.from(buf instanceof Uint8Array ? buf : new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
const fromHex = (hex: string): Uint8Array<ArrayBuffer> => new Uint8Array(hex.match(/../g)!.map((h) => parseInt(h, 16)));

async function derive(password: string, salt: Uint8Array<ArrayBuffer>) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 210_000 }, key, 256);
  return toHex(bits);
}

/* ---------- public API ---------- */

export type Result = { ok: true; user: User } | { ok: false; errors?: Record<string, string>; message?: string };

export async function signUp(input: { name: string; email: string; password: string; confirm: string }): Promise<Result> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = "Enter your full name.";
  if (!EMAIL.test(email)) errors.email = "Enter a valid work email.";
  if (input.password.length < MIN_PASSWORD) errors.password = `Use at least ${MIN_PASSWORD} characters.`;
  else if (input.password.length > 200) errors.password = "Use at most 200 characters.";
  if (input.confirm !== input.password) errors.confirm = "Passwords don’t match.";
  if (Object.keys(errors).length) return { ok: false, errors };

  if (findAccount(email)) return { ok: false, errors: { email: "An account with this email already exists. Sign in instead." } };

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const account: StoredAccount = { name, email, salt: toHex(salt), hash: await derive(input.password, salt), createdAt: new Date().toISOString() };
  if (!write(ACCOUNTS_KEY, [...accounts(), account])) {
    return { ok: false, message: "Your browser blocked saving the account. Turn off private browsing or allow site data, then try again." };
  }
  startSession(email);
  return { ok: true, user: { name, email } };
}

export async function signIn(input: { email: string; password: string }): Promise<Result> {
  const email = input.email.trim().toLowerCase();
  const errors: Record<string, string> = {};
  if (!EMAIL.test(email)) errors.email = "Enter a valid work email.";
  if (!input.password) errors.password = "Enter your password.";
  if (Object.keys(errors).length) return { ok: false, errors };

  const account = findAccount(email);
  const ok = account ? (await derive(input.password, fromHex(account.salt))) === account.hash : false;
  if (!account || !ok) return { ok: false, message: "That email and password don’t match an account on this browser." };

  startSession(email);
  return { ok: true, user: { name: account.name, email } };
}

function startSession(email: string) {
  write(SESSION_KEY, { email, expiresAt: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000 });
}

export function signOut() {
  remove(SESSION_KEY);
}

/** The signed-in user, or null if there's no unexpired session for an existing account. */
export function getCurrentUser(): User | null {
  const session = read<{ email?: string; expiresAt?: number } | null>(SESSION_KEY, null);
  if (!session?.email || !session.expiresAt || session.expiresAt < Date.now()) return null;
  const account = findAccount(session.email);
  return account ? { name: account.name, email: account.email } : null;
}

export function updateProfileName(name: string): { ok: boolean; error?: string } {
  const user = getCurrentUser();
  if (!user) return { ok: false, error: "Your session has ended. Sign in again." };
  const trimmed = name.trim();
  if (trimmed.length < 2) return { ok: false, error: "Enter your full name." };
  const next = accounts().map((a) => (a.email === user.email ? { ...a, name: trimmed.slice(0, 120) } : a));
  return write(ACCOUNTS_KEY, next) ? { ok: true } : { ok: false, error: "Your browser blocked saving the change." };
}
