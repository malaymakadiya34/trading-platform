import Link from "next/link";

import { AuthForm } from "@/src/components/auth/auth-form";

type AuthPageProps = { mode: "login" | "register" };

export function AuthPage({ mode }: AuthPageProps) {
  const isLogin = mode === "login";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07111f] px-5 py-12 text-slate-100">
      <div className="w-full max-w-md">
        <Link className="mb-8 block text-center text-sm font-semibold text-blue-300" href="/">
          Trading Platform
        </Link>
        <section className="rounded-2xl border border-slate-800 bg-[#0d1a2b] p-6 shadow-2xl sm:p-8">
          <h1 className="text-2xl font-semibold">
            {isLogin ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 mb-6 text-sm leading-6 text-slate-400">
            {isLogin
              ? "Sign in to access your protected workspace."
              : "Start with a secure platform account."}
          </p>
          <AuthForm mode={mode} />
          {isLogin && (
            <p className="mt-5 text-center text-xs text-slate-500">
              Password reset delivery will be enabled after an email provider is configured.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
