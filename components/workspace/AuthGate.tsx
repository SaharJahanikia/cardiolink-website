"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { getCurrentUser, type User } from "@/lib/local-accounts";
import { WorkspaceProvider } from "./WorkspaceProvider";

/**
 * Accounts live in the browser, so the server can't tell who's signed in.
 * This checks on the client and sends signed-out visitors to sign-in,
 * returning them to the page they asked for afterwards.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const current = getCurrentUser();
    setUser(current);
    if (!current) router.replace(`/account/sign-in?next=${encodeURIComponent(pathname)}`);
  }, [router, pathname]);

  if (!user) return null;
  return <WorkspaceProvider user={user}>{children}</WorkspaceProvider>;
}
