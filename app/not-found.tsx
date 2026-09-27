import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#06101c] px-6 text-center text-slate-100">
      <div>
        <p className="text-5xl font-semibold text-blue-400">404</p>
        <h1 className="mt-4 text-2xl font-semibold">Page not found</h1>
        <p className="mt-3 text-sm text-slate-400">This workspace route does not exist.</p>
        <Link
          className="mt-6 inline-flex rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition-colors hover:border-slate-500"
          href="/dashboard"
        >
          Return to dashboard
        </Link>
      </div>
    </main>
  );
}
