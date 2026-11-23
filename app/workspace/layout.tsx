import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { WorkspaceDialogs } from "@/components/workspace/Dialogs";
import { WorkspaceNav } from "@/components/workspace/WorkspaceNav";
import { WorkspaceProvider } from "@/components/workspace/WorkspaceProvider";
import styles from "@/components/workspace/workspace.module.css";
import { getCurrentUser } from "@/lib/auth";

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/account/sign-in");

  return (
    <WorkspaceProvider user={{ name: user.name, email: user.email }}>
      <div className={styles.page}>
        <WorkspaceNav />
        {children}
        <p className={styles.footerNote}>CardioLink · Fictional patients and illustrative data only · Not for clinical decision-making</p>
        <WorkspaceDialogs />
      </div>
    </WorkspaceProvider>
  );
}
