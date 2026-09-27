import { redirect } from "next/navigation";

import { DashboardShell } from "@/src/components/layout/dashboard-shell";
import { SettingsForm } from "@/src/components/settings/settings-form";
import { getCurrentUser } from "@/src/server/auth/session";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/profile");

  return (
    <DashboardShell user={user}>
      <div className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-300">
          Settings · profile
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Account settings
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          {user.email} · {user.role.toLowerCase()}
        </p>
        <section
          className="mt-8 rounded-xl border border-slate-800 bg-[#0c1828] p-5 sm:p-6"
          id="settings"
        >
          <SettingsForm
            initialName={user.name ?? ""}
            initialTheme={user.settings?.theme ?? "dark"}
            initialTimezone={user.settings?.timezone ?? "Asia/Kolkata"}
          />
        </section>
      </div>
    </DashboardShell>
  );
}
