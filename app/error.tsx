"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07111f] px-6 text-center text-slate-100">
      <div className="max-w-md">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-400">
          Application error
        </p>
        <h1 className="mt-3 text-2xl font-semibold">The workspace could not be loaded</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Please try again. No market data or scanner output is available from this fallback state.
        </p>
        <button
          className="mt-6 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-blue-400"
          onClick={() => reset()}
          type="button"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
