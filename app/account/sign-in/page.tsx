import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountShell } from "@/components/account/AccountShell";
import { SignInForm } from "@/components/account/AccountForms";
import styles from "@/components/account/account.module.css";
import ws from "@/components/workspace/workspace.module.css";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Clinician sign in – CardioLink" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  if (await getCurrentUser()) redirect("/workspace/patients");
  const { next } = await searchParams;
  return (
    <AccountShell>
      <h1 className={styles.title}>Clinician sign in</h1>
      <p className={ws.muted13}>Your care workspace, securely in one place.</p>
      <SignInForm next={typeof next === "string" ? next : ""} />
    </AccountShell>
  );
}
