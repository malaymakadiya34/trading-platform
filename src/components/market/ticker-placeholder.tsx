export function TickerPlaceholder({ label = "Market ticker" }: { label?: string }) {
  return (
    <section
      aria-label={`${label} unavailable`}
      className="border-b border-slate-800/80 bg-[#0a1422] px-5 py-3"
    >
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="font-medium text-slate-300">{label}</span>
        <span className="rounded border border-slate-700 bg-slate-800/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          Not configured
        </span>
        <span className="text-slate-500">No provider data is available for this ticker row.</span>
      </div>
    </section>
  );
}
