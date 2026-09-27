"use client";

import { ErrorState } from "@/src/components/ui/data-states";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#06101c] px-6 text-slate-100">
      <div className="w-full max-w-xl">
        <ErrorState
          action={
            <button
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-blue-400"
              onClick={() => reset()}
              type="button"
            >
              Try again
            </button>
          }
          description="Please try again. No market data, scanner output, or inferred result is displayed from this fallback state."
          title="The workspace could not be loaded"
        />
      </div>
    </main>
  );
}
