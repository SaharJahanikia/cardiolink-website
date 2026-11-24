#!/usr/bin/env node
// Issue demo logins without the person signing up themselves. Accounts live in data/cardiolink.db (see lib/db.ts).
//
//   npm run demo-account -- add jane@clinic.org "Dr. Jane Smith"   (prints a generated password once)
//   npm run demo-account -- list
//   npm run demo-account -- remove jane@clinic.org
//
// Hash format must match hashPassword() in lib/auth.ts: scrypt$<salt hex>$<64-byte key hex>.
import { randomBytes, scryptSync } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const dbPath = path.join(process.cwd(), "data", "cardiolink.db");
if (!existsSync(dbPath)) {
  console.error("No account database yet. Start the app once (npm run dev) and open a page so it creates data/cardiolink.db.");
  process.exit(1);
}
const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys = ON");

const [command, rawEmail, name] = process.argv.slice(2);
const email = rawEmail?.trim().toLowerCase();

if (command === "add" && email) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("That doesn't look like an email address.");
    process.exit(1);
  }
  // Readable but strong: 4 groups of 4 characters, without look-alikes (0/O, 1/l/I).
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const password = Array.from(randomBytes(16), (b, i) => (i && i % 4 === 0 ? "-" : "") + alphabet[b % alphabet.length]).join("");
  const salt = randomBytes(16);
  const hash = `scrypt$${salt.toString("hex")}$${scryptSync(password, salt, 64).toString("hex")}`;
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    db.prepare("UPDATE users SET password_hash = ?, name = COALESCE(?, name) WHERE id = ?").run(hash, name ?? null, existing.id);
    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(existing.id);
  } else {
    db.prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)").run(name || email, email, hash);
  }
  console.log(`${existing ? "Reset" : "Created"} demo login for ${email}`);
  console.log(`Password: ${password}`);
  console.log("Share it privately; it isn't stored anywhere in plain text.");
} else if (command === "remove" && email) {
  const { changes } = db.prepare("DELETE FROM users WHERE email = ?").run(email);
  if (!changes) {
    console.error(`No account for ${email}.`);
    process.exit(1);
  }
  console.log(`Removed ${email}.`);
} else if (command === "list") {
  const rows = db.prepare("SELECT email, name, created_at FROM users ORDER BY created_at").all();
  if (rows.length === 0) console.log("No accounts yet.");
  for (const r of rows) console.log(`${r.email}\t${r.name}\tcreated ${r.created_at}`);
} else {
  console.log('Usage: npm run demo-account -- add <email> "<name>" | list | remove <email>');
  process.exit(command ? 1 : 0);
}
