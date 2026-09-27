const navigationGroups = [
  {
    label: "Workspace",
    items: ["Home", "Watchlist", "Alerts", "Trading Journal"],
  },
  {
    label: "Market",
    items: ["Market Movement", "Sector Heatmap", "Index Mover"],
  },
  {
    label: "Scanners",
    items: ["BTST Scanner", "Intraday Boosters", "15-Min Breakout"],
  },
  {
    label: "Markets",
    items: ["FII / DII", "Global Markets"],
  },
];

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-800/80 bg-[#0a1322] p-5 lg:block">
      <div className="mb-10 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500 font-bold text-slate-950">
          T
        </div>
        <div>
          <p className="text-sm font-semibold tracking-wide text-white">Trading Platform</p>
          <p className="text-xs text-slate-500">Market intelligence</p>
        </div>
      </div>

      <nav aria-label="Primary navigation" className="space-y-7">
        {navigationGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {group.label}
            </p>
            <ul className="space-y-1">
              {group.items.map((item, index) => (
                <li key={item}>
                  <button
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      group.label === "Workspace" && index === 0
                        ? "bg-blue-500/10 font-medium text-blue-300"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                    }`}
                    type="button"
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
