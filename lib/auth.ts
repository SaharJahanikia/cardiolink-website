import "server-only";
import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "./db";

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export const SESSION_COOKIE = "cardiolink_session";
const SESSION_DAYS = 7;

export type User = { id: number; name: string; email: string };

/* ---------- passwords ---------- */

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, saltHex, keyHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !keyHex) return false;
  const expected = Buffer.from(keyHex, "hex");
  const actual = await scryptAsync(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}

// Compared against when the email is unknown, so a miss takes as long as a wrong password.
let dummyHash: Promise<string> | undefined;
export function getDummyHash() {
  return (dummyHash ??= hashPassword("not-a-real-password"));
}

/* ---------- users ---------- */

export function findUserByEmail(email: string) {
  return db.prepare("SELECT id, name, email, password_hash FROM users WHERE email = ?").get(email) as
    | (User & { password_hash: string })
    | undefined;
}

export function createUser(name: string, email: string, passwordHash: string): User {
  const row = db
    .prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?) RETURNING id, name, email")
    .get(name, email, passwordHash) as User;
  return row;
}

export function updateUserName(id: number, name: string) {
  db.prepare("UPDATE users SET name = ? WHERE id = ?").run(name, id);
}

/* ---------- sessions ---------- */

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/** Creates a session row and sets the cookie. Only the token's hash is stored. */
export async function startSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(Date.now());
  db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)").run(sha256(token), userId, expires);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expires),
  });
}

export async function endSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(sha256(token));
  store.delete(SESSION_COOKIE);
}

/** The signed-in user for this request, or null. Cached per request. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT u.id, u.name, u.email FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ?`,
    )
    .get(sha256(token), Date.now()) as User | undefined;
  return row ? { id: row.id, name: row.name, email: row.email } : null;
});
