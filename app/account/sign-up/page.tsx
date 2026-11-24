import type { Metadata } from "next";
import { AccountShell } from "@/components/account/AccountShell";
import { SignUpForm } from "@/components/account/AccountForms";
import styles from "@/components/account/account.module.css";
import ws from "@/components/workspace/workspace.module.css";

export const metadata: Metadata = { title: "Create clinician account – CardioLink" };

export default function SignUpPage() {
  return (
    <AccountShell>
      <h1 className={styles.title}>Create your clinician account</h1>
      <p className={ws.muted13}>Set up your care workspace in a minute.</p>
      <SignUpForm />
    </AccountShell>
  );
}
