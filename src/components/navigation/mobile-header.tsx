export function MobileHeader() {
  return (
    <header className="flex items-center justify-between border-b border-slate-800/80 bg-[#0a1322] px-5 py-4 lg:hidden">
      <div>
        <p className="text-sm font-semibold text-white">Trading Platform</p>
        <p className="text-xs text-slate-500">Market intelligence</p>
      </div>
      <button
        aria-label="Open navigation"
        className="rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-300"
        type="button"
      >
        Menu
      </button>
    </header>
  );
}
