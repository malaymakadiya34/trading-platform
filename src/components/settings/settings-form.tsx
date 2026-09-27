"use client";

import { FormEvent, useState } from "react";

export function SettingsForm({
  initialName,
  initialTimezone,
  initialTheme,
}: {
  initialName: string;
  initialTimezone: string;
  initialTheme: string;
}) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setMessage(response.ok ? "Settings saved." : "Unable to save settings.");
    setPending(false);
  }

  return (
    <form className="max-w-lg space-y-4" onSubmit={onSubmit}>
      <label className="block text-sm text-slate-300">
        Display name
        <input
          className="auth-input"
          name="name"
          defaultValue={initialName}
          required
          minLength={2}
          maxLength={80}
        />
      </label>
      <label className="block text-sm text-slate-300">
        Timezone
        <input className="auth-input" name="timezone" defaultValue={initialTimezone} required />
      </label>
      <label className="block text-sm text-slate-300">
        Theme
        <select className="auth-input" name="theme" defaultValue={initialTheme}>
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </label>
      {message && <p className="text-sm text-slate-400">{message}</p>}
      <button
        className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
        disabled={pending}
        type="submit"
      >
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
