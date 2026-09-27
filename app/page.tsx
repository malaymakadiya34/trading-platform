import { ModuleCard } from "@/src/components/dashboard/module-card";
import { MobileHeader } from "@/src/components/navigation/mobile-header";
import { Sidebar } from "@/src/components/navigation/sidebar";
import { TickerPlaceholder } from "@/src/components/market/ticker-placeholder";

const modules = [
  {
    name: "Market Movement / Sector Heatmap",
    description: "Market, index, sector and constituent-stock intelligence.",
  },
  {
    name: "BTST Scanner",
    description: "Independent end-of-day F&O scanner foundation.",
  },
  {
    name: "Intraday Boosters",
    description: "F&O movement and options-context scanner foundation.",
  },
  {
    name: "15-Min Breakout",
    description: "Breakout lifecycle and confirmation workflow foundation.",
  },
  {
    name: "FII / DII",
    description: "Institutional activity and trading-day range foundation.",
  },
  {
    name: "Index Mover",
    description: "Index contribution and constituent context foundation.",
  },
  {
    name: "Global Markets",
    description: "Global index and market-status context foundation.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#07111f] text-slate-100">
      <MobileHeader />
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="min-w-0 flex-1">
          <TickerPlaceholder />
          <div className="mx-auto max-w-[1500px] p-5 sm:p-8">
            <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                  Workspace
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Market intelligence dashboard
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  The platform foundation is ready for phased market-data and scanner development.
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-[#0d1a2b] px-4 py-3 text-xs text-slate-400">
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-slate-500" />
                Data connection not configured
              </div>
            </header>

            <section aria-labelledby="modules-heading">
              <div className="mb-4 flex items-center justify-between">
                <h2 id="modules-heading" className="text-sm font-semibold text-slate-200">
                  Platform modules
                </h2>
                <span className="text-xs text-slate-500">Phase 1 foundation</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {modules.map((module) => (
                  <ModuleCard key={module.name} {...module} />
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
