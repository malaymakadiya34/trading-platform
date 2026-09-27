import type { FreshnessState } from "@/src/server/market-data/freshness";
import type { IndiaSessionState } from "@/src/server/market-session/service";

type MarketStatus = IndiaSessionState | "UNKNOWN";
type DataSource = "DEMO" | "DELAYED" | "LIVE" | "MOCK" | "NOT_CONFIGURED";

const marketStatusLabels: Record<MarketStatus, string> = {
  OPEN: "Open",
  PRE_MARKET: "Pre-market",
  CLOSED: "Closed",
  WEEKEND: "Weekend",
  HOLIDAY: "Holiday",
  UNKNOWN: "Status unavailable",
};

const marketStatusStyles: Record<MarketStatus, string> = {
  OPEN: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  PRE_MARKET: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  CLOSED: "border-slate-700 bg-slate-800/80 text-slate-400",
  WEEKEND: "border-slate-700 bg-slate-800/80 text-slate-400",
  HOLIDAY: "border-slate-700 bg-slate-800/80 text-slate-400",
  UNKNOWN: "border-slate-700 bg-slate-800/80 text-slate-500",
};

const freshnessLabels: Record<FreshnessState, string> = {
  FRESH: "Fresh",
  STALE: "Stale",
  UNKNOWN: "Freshness unavailable",
};

const freshnessStyles: Record<FreshnessState, string> = {
  FRESH: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  STALE: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  UNKNOWN: "border-slate-700 bg-slate-800/80 text-slate-500",
};

const sourceStyles: Record<DataSource, string> = {
  LIVE: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  DELAYED: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  DEMO: "border-violet-500/30 bg-violet-500/10 text-violet-200",
  MOCK: "border-blue-500/30 bg-blue-500/10 text-blue-200",
  NOT_CONFIGURED: "border-slate-700 bg-slate-800/80 text-slate-500",
};

function Badge({ children, className }: { children: string; className: string }) {
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] ${className}`}
    >
      {children}
    </span>
  );
}

export function MarketStatusBadge({ status }: { status: MarketStatus }) {
  return <Badge className={marketStatusStyles[status]}>{marketStatusLabels[status]}</Badge>;
}

export function FreshnessBadge({ freshness }: { freshness: FreshnessState }) {
  return <Badge className={freshnessStyles[freshness]}>{freshnessLabels[freshness]}</Badge>;
}

export function DataSourceBadge({ source }: { source: DataSource }) {
  return <Badge className={sourceStyles[source]}>{source}</Badge>;
}

export type { DataSource, MarketStatus };
