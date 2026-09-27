export function TickerPlaceholder() {
  return (
    <div className="border-b border-slate-800/80 bg-[#0d1a2b] px-5 py-3">
      <div className="flex items-center gap-3 overflow-x-auto">
        <span className="whitespace-nowrap text-xs font-medium text-slate-300">Market feed</span>
        <span className="whitespace-nowrap rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
          Provider not connected
        </span>
        <span className="whitespace-nowrap text-xs text-slate-500">
          Live, delayed and mock states will be shown explicitly when configured.
        </span>
      </div>
    </div>
  );
}
