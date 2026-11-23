"use server";

import { redirect } from "next/navigation";
import {
  createUser,
  endSession,
  findUserByEmail,
  getCurrentUser,
  getDummyHash,
  hashPassword,
  startSession,
  updateUserName,
  verifyPassword,
} from "@/lib/auth";

export type FormState = { errors?: Record<string, string>; message?: string; values?: Record<string, string> } | undefined;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 12;

const str = (form: FormData, key: string) => String(form.get(key) ?? "");

/** Only follow same-site paths after sign-in, never an absolute URL. */
function safeNext(value: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/workspace/patients";
}

export async function signUp(_prev: FormState, form: FormData): Promise<FormState> {
  const name = str(form, "name").trim();
  const email = str(form, "email").trim().toLowerCase();
  const password = str(form, "password");
  const confirm = str(form, "confirm");

  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = "Enter your full name.";
  if (!EMAIL.test(email)) errors.email = "Enter a valid work email.";
  if (password.length < MIN_PASSWORD) errors.password = `Use at least ${MIN_PASSWORD} characters.`;
  else if (password.length > 200) errors.password = "Use at most 200 characters.";
  if (confirm !== password) errors.confirm = "Passwords don’t match.";
  if (Object.keys(errors).length) return { errors, values: { name, email } };

  if (findUserByEmail(email)) {
    return { errors: { email: "An account with this email already exists. Sign in instead." }, values: { name, email } };
  }

  let user;
  try {
    user = createUser(name, email, await hashPassword(password));
  } catch {
    // Unique constraint if two sign-ups race for the same email.
    return { errors: { email: "An account with this email already exists. Sign in instead." }, values: { name, email } };
  }
  await startSession(user.id);
  redirect("/workspace/patients");
}

export async function signIn(_prev: FormState, form: FormData): Promise<FormState> {
  const email = str(form, "email").trim().toLowerCase();
  const password = str(form, "password");

  const errors: Record<string, string> = {};
  if (!EMAIL.test(email)) errors.email = "Enter a valid work email.";
  if (!password) errors.password = "Enter your password.";
  if (Object.keys(errors).length) return { errors, values: { email } };

  const user = findUserByEmail(email);
  const ok = await verifyPassword(password, user?.password_hash ?? (await getDummyHash()));
  if (!user || !ok) return { message: "That email and password don’t match an account.", values: { email } };

  await startSession(user.id);
  redirect(safeNext(str(form, "next")));
}

export async function signOut() {
  await endSession();
  redirect("/account/signed-out");
}

export async function updateProfileName(name: string): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Your session has ended. Sign in again." };
  const trimmed = name.trim();
  if (trimmed.length < 2) return { ok: false, error: "Enter your full name." };
  updateUserName(user.id, trimmed.slice(0, 120));
  return { ok: true };
}
