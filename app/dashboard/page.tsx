import { redirect } from "next/navigation";

import { LogoutButton } from "@/src/components/auth/logout-button";
import { getCurrentUser } from "@/src/server/auth/session";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");

  return (
    <main className="min-h-screen bg-[#07111f] px-5 py-8 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
              Protected workspace
            </p>
            <h1 className="mt-2 text-2xl font-semibold">
              Welcome{user.name ? `, ${user.name}` : ""}
            </h1>
            <p className="mt-2 text-sm text-slate-400">{user.email}</p>
          </div>
          <LogoutButton />
        </header>
        <section className="mt-8 rounded-xl border border-slate-800 bg-[#111f32] p-6">
          <p className="text-sm font-medium text-slate-200">Authenticated successfully</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            The dashboard modules remain in their Phase 1 foundation state. Market data and scanner
            functionality are intentionally not connected yet.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-xs text-slate-400">
            <span className="rounded-full border border-slate-700 px-3 py-1">
              Role: {user.role.toLowerCase()}
            </span>
            <span className="rounded-full border border-slate-700 px-3 py-1">
              Timezone: {user.settings?.timezone ?? "Asia/Kolkata"}
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}
