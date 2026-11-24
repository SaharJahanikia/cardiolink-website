import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

/** The clinician demo is only for signed-in accounts, like /workspace. */
export default async function ClinicianDemoLayout({ children }: { children: ReactNode }) {
  if (!(await getCurrentUser())) redirect("/account/sign-in?next=/demo/clinician");
  return children;
}
