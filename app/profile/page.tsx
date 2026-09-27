import { redirect } from "next/navigation";

import { getCurrentUser } from "@/src/server/auth/session";
import { SettingsForm } from "@/src/components/settings/settings-form";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/profile");

  return (
    <main className="min-h-screen bg-[#07111f] px-5 py-8 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
          Profile and settings
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Account settings</h1>
        <p className="mt-2 text-sm text-slate-400">
          {user.email} · {user.role.toLowerCase()}
        </p>
        <section className="mt-8 rounded-xl border border-slate-800 bg-[#111f32] p-6">
          <SettingsForm
            initialName={user.name ?? ""}
            initialTimezone={user.settings?.timezone ?? "Asia/Kolkata"}
            initialTheme={user.settings?.theme ?? "dark"}
          />
        </section>
      </div>
    </main>
  );
}
