"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { EMAIL, getCurrentUser, signIn, signUp } from "@/lib/local-accounts";
import { Button, ButtonLink, Confirmation, Field } from "../workspace/ui";
import ws from "../workspace/workspace.module.css";
import styles from "./account.module.css";


/** The patient portal (430 px designs) isn't built yet, so this card explains instead of linking. */
export function PatientSignInNote() {
  const [shown, setShown] = useState(false);
  return (
    <button
      type="button"
      className={styles.role}
      style={{ background: "#fff", textAlign: "left", font: "inherit", cursor: "pointer" }}
      onClick={() => setShown(true)}
      aria-expanded={shown}
    >
      <span className={ws.h3}>I’m a patient</span>
      <span className={ws.muted12}>Complete check-ins and stay connected to your team.</span>
      {shown ? (
        <span className={ws.muted12} role="status" style={{ color: "var(--navy)" }}>
          The patient portal isn’t available in this demo yet.
        </span>
      ) : (
        <span className={styles.link}>Patient sign in ›</span>
      )}
    </button>
  );
}

function useFakeRequest() {
  const [busy, setBusy] = useState(false);
  const run = (after: () => void) => {
    if (busy) return;
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      after();
    }, 500);
  };
  return { busy, run };
}

type FormState = { errors?: Record<string, string>; message?: string; values?: Record<string, string> } | undefined;

const field = (form: FormData, key: string) => String(form.get(key) ?? "");

/** Only follow same-site paths after sign-in, never an absolute URL. */
function safeNext(value: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/workspace/patients";
}

/** Someone already signed in on this browser skips the account forms. */
function useRedirectIfSignedIn() {
  const router = useRouter();

  useEffect(() => {
    if (getCurrentUser()) {
      const next = new URLSearchParams(window.location.search).get("next");
      const destination =
        next && next.startsWith("/") && !next.startsWith("//")
          ? next
          : "/workspace/patients";

      router.replace(destination);
    }
  }, [router]);
}

function FormMessage({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <p role="alert" className={ws.error} style={{ margin: 0 }}>
      {text}
    </p>
  );
}

export function SignInForm() {
  const router = useRouter();
  useRedirectIfSignedIn();
  const [state, action, pending] = useActionState(async (_prev: FormState, form: FormData): Promise<FormState> => {
    const email = field(form, "email");
    const result = await signIn({ email, password: field(form, "password") });
    if (result.ok) {
      router.push(safeNext(new URLSearchParams(window.location.search).get("next") ?? ""));
      return undefined;
    }
    return { errors: result.errors, message: result.message, values: { email } };
  }, undefined);
  const [show, setShow] = useState(false);
  const errors = state?.errors ?? {};

  return (
    <form className={ws.stack16} action={action} noValidate>
      <FormMessage text={state?.message} />
      <Field
        label="Work email"
        name="email"
        type="email"
        autoComplete="username"
        defaultValue={state?.values?.email ?? ""}
        error={errors.email}
      />
      <Field
        label="Password"
        name="password"
        type={show ? "text" : "password"}
        autoComplete="current-password"
        error={errors.password}
      />
      <button type="button" className={styles.showPassword} onClick={() => setShow((s) => !s)} aria-pressed={show}>
        {show ? "Hide password" : "Show password"}
      </button>
      <Link href="/account/forgot-password" className={styles.link}>
        Forgot password?
      </Link>
      <Button type="submit" className={styles.full} disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <p className={ws.muted11}>By signing in you agree to the Terms of service and Privacy notice.</p>
      <Link href="/account/sign-up" className={styles.link}>
        New to CardioLink? Create an account
      </Link>
      <Link href="/account" className={styles.link}>
        Not a clinician? Switch account type
      </Link>
    </form>
  );
}

export function SignUpForm() {
  const router = useRouter();
  useRedirectIfSignedIn();
  const [state, action, pending] = useActionState(async (_prev: FormState, form: FormData): Promise<FormState> => {
    const name = field(form, "name");
    const email = field(form, "email");
    const result = await signUp({ name, email, password: field(form, "password"), confirm: field(form, "confirm") });
    if (result.ok) {
      router.push("/workspace/patients");
      return undefined;
    }
    return { errors: result.errors, message: result.message, values: { name, email } };
  }, undefined);
  const [show, setShow] = useState(false);
  const errors = state?.errors ?? {};

  return (
    <form className={ws.stack16} action={action} noValidate>
      <FormMessage text={state?.message} />
      <Field label="Full name" name="name" autoComplete="name" defaultValue={state?.values?.name ?? ""} error={errors.name} />
      <Field
        label="Work email"
        name="email"
        type="email"
        autoComplete="username"
        defaultValue={state?.values?.email ?? ""}
        error={errors.email}
      />
      <Field
        label="Password"
        name="password"
        type={show ? "text" : "password"}
        autoComplete="new-password"
        error={errors.password}
        hint="At least 12 characters."
      />
      <Field
        label="Confirm password"
        name="confirm"
        type={show ? "text" : "password"}
        autoComplete="new-password"
        error={errors.confirm}
      />
      <button type="button" className={styles.showPassword} onClick={() => setShow((s) => !s)} aria-pressed={show}>
        {show ? "Hide passwords" : "Show passwords"}
      </button>
      <Button type="submit" className={styles.full} disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
      <p className={ws.muted11}>By creating an account you agree to the Terms of service and Privacy notice.</p>
      <Link href="/account/sign-in" className={styles.link}>
        Already have an account? Sign in
      </Link>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const { busy, run } = useFakeRequest();

  if (sent) {
    return (
      <Confirmation title="Check your email" action={<ButtonLink href="/account/sign-in">Back to sign in</ButtonLink>}>
        If an account exists for the entered email, you’ll receive a single-use reset link shortly. It expires after 30
        minutes. Check your spam folder too.
      </Confirmation>
    );
  }

  return (
    <>
      <h1 className={styles.title}>Forgot password</h1>
      <p className={ws.muted13}>Enter your work email and I’ll help you reset it.</p>
      <form
        className={ws.stack16}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (!EMAIL.test(email)) return setError("Enter a valid email address.");
          setError("");
          run(() => setSent(true));
        }}
      >
        <Field label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} />
        <Button type="submit" className={styles.full} disabled={busy}>
          {busy ? "Sending…" : "Send reset link"}
        </Button>
      </form>
      <p className={ws.muted11}>If an account exists, a reset link will arrive shortly. Check your spam folder too.</p>
      <Link href="/account/sign-in" className={styles.link}>
        Back to sign in
      </Link>
    </>
  );
}

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const { busy, run } = useFakeRequest();

  if (done) {
    return (
      <Confirmation title="Password updated" action={<ButtonLink href="/account/sign-in">Back to sign in</ButtonLink>}>
        You can now sign in using your new password. Existing sessions are signed out for security.
      </Confirmation>
    );
  }

  return (
    <>
      <h1 className={styles.title}>Reset your password</h1>
      <p className={ws.muted13}>Create a new password for your account.</p>
      <form
        className={ws.stack16}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const next: Record<string, string> = {};
          if (password.length < 12) next.password = "Use at least 12 characters.";
          if (confirm !== password) next.confirm = "Passwords don’t match.";
          setErrors(next);
          if (Object.keys(next).length === 0) run(() => setDone(true));
        }}
      >
        <Field
          label="New password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          hint="At least 12 characters."
        />
        <Field
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
        />
        <Button type="submit" className={styles.full} disabled={busy}>
          {busy ? "Updating…" : "Update password"}
        </Button>
      </form>
      <p className={ws.muted11}>Your reset link is single-use and expires after 30 minutes.</p>
    </>
  );
}
