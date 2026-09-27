import { AuthenticatedWorkspace } from "@/src/components/layout/authenticated-workspace";
import { ModuleCard } from "@/src/components/dashboard/module-card";
import { EmptyState } from "@/src/components/ui/data-states";

const modules = [
  {
    name: "Market Movement / Sector Heatmap",
    description: "Market, index, sector, and constituent-stock drill-down boundary.",
    href: "/market-movement",
    icon: "MM",
    status: "UI BOUNDARY" as const,
  },
  {
    name: "BTST Scanner",
    description: "End-of-day F&O setup workflow boundary without scanner calculations.",
    href: "/btst-scanner",
    icon: "BT",
    status: "NOT CONFIGURED" as const,
  },
  {
    name: "Intraday Boosters",
    description: "Intraday mover and future option-context workflow boundary.",
    href: "/intraday-boosters",
    icon: "IB",
    status: "NOT CONFIGURED" as const,
  },
  {
    name: "15-Min Breakout",
    description: "Confirmed-breakout lifecycle boundary with no signal engine enabled.",
    href: "/breakout-15m",
    icon: "15",
    status: "NOT CONFIGURED" as const,
  },
  {
    name: "FII / DII",
    description: "Trading-day institutional activity table boundary and range plan.",
    href: "/fii-dii",
    icon: "FD",
    status: "NOT CONFIGURED" as const,
  },
  {
    name: "Index Mover",
    description: "Index contribution table boundary for future membership and weight data.",
    href: "/index-mover",
    icon: "IM",
    status: "UI BOUNDARY" as const,
  },
  {
    name: "Global Markets",
    description: "Global context table with explicit mock, session, and freshness labels.",
    href: "/global-markets",
    icon: "GM",
    status: "UI BOUNDARY" as const,
  },
];

export default function DashboardPage() {
  return (
    <AuthenticatedWorkspace nextPath="/dashboard">
      <div className="space-y-7">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-300">
              Authenticated workspace
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Market intelligence dashboard
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              A terminal-style workspace with Phase 3 market-data boundaries and Phase 4 navigation,
              status, table, and module presentation layers.
            </p>
          </div>
          <span className="w-fit rounded border border-blue-500/25 bg-blue-500/[0.08] px-3 py-2 text-xs font-medium text-blue-200">
            Phase 4 · UI boundary
          </span>
        </header>

        <section aria-labelledby="modules-heading">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Workspace modules
              </p>
              <h2 className="mt-1 text-base font-semibold text-slate-200" id="modules-heading">
                Market and scanner surfaces
              </h2>
            </div>
            <span className="text-xs text-slate-500">No scanner logic enabled</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {modules.map((module) => (
              <ModuleCard key={module.name} {...module} />
            ))}
          </div>
        </section>

        <section aria-labelledby="readiness-heading">
          <div className="mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Data readiness
            </p>
            <h2 className="mt-1 text-base font-semibold text-slate-200" id="readiness-heading">
              Provider-safe presentation state
            </h2>
          </div>
          <EmptyState
            description="The existing readiness endpoint and provider interface remain the data boundary. A licensed provider has not been connected, so this dashboard does not request or represent any production quote data."
            title="Production market data is not configured"
          />
        </section>
      </div>
    </AuthenticatedWorkspace>
  );
}
