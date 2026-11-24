import type { ReactNode } from "react";
import { AuthGate } from "@/components/workspace/AuthGate";
import { WorkspaceDialogs } from "@/components/workspace/Dialogs";
import { WorkspaceNav } from "@/components/workspace/WorkspaceNav";
import styles from "@/components/workspace/workspace.module.css";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <div className={styles.page}>
        <WorkspaceNav />
        {children}
        <p className={styles.footerNote}>CardioLink · Fictional patients and illustrative data only · Not for clinical decision-making</p>
        <WorkspaceDialogs />
      </div>
    </AuthGate>
  );
}
