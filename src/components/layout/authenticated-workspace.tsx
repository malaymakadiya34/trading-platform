import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { DashboardShell } from "@/src/components/layout/dashboard-shell";
import { getCurrentUser } from "@/src/server/auth/session";

type AuthenticatedWorkspaceProps = {
  children: ReactNode;
  nextPath: string;
};

export async function AuthenticatedWorkspace({ children, nextPath }: AuthenticatedWorkspaceProps) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
