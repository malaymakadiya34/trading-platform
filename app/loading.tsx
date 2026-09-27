export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07111f] px-6 text-slate-300">
      <div className="flex items-center gap-3 text-sm">
        <span className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
        Loading workspace…
      </div>
    </main>
  );
}
