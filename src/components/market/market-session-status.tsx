import type { IndiaMarketSession } from "@/src/server/market-session/service";

import { MarketStatusBadge } from "@/src/components/market/market-status-badge";

function stateDescription(session: IndiaMarketSession) {
  if (session.state === "OPEN") return "Continuous trading session is in progress.";
  if (session.state === "PRE_MARKET") return "The regular cash session has not opened yet.";
  if (session.state === "WEEKEND") return "The Indian cash market is closed for the weekend.";
  if (session.state === "HOLIDAY") return "The exchange calendar marks today as a holiday.";
  return "The regular Indian cash session is closed.";
}

export function MarketSessionStatus({ session }: { session: IndiaMarketSession }) {
  return (
    <section
      aria-label="Indian market session status"
      className="rounded-xl border border-slate-800 bg-[#0c1828] p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            NSE cash session
          </p>
          <p className="mt-1 text-sm font-medium text-slate-100">{stateDescription(session)}</p>
        </div>
        <MarketStatusBadge status={session.state} />
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{session.open} IST</span>
          <span className="font-mono tabular-nums">{session.progressPct.toFixed(0)}% elapsed</span>
          <span>{session.close} IST</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
          <div
            aria-label={`${session.progressPct}% of the cash session elapsed`}
            className="h-full rounded-full bg-blue-400 transition-[width] duration-500"
            style={{ width: `${session.progressPct}%` }}
          />
        </div>
      </div>
      <p className="mt-3 text-[11px] text-slate-500">
        {session.tradingDate} · {session.timezone} · Calendar-backed holiday support is available to
        the session service.
      </p>
    </section>
  );
}
