import { mockGlobalTickerItems } from "@/src/demo/market-ticker";
import {
  DataSourceBadge,
  FreshnessBadge,
  MarketStatusBadge,
} from "@/src/components/market/market-status-badge";
import {
  DenseDataTable,
  type DenseTableColumn,
  type DenseTableRow,
} from "@/src/components/ui/dense-data-table";
import { StaleDataState } from "@/src/components/ui/data-states";

const columns: DenseTableColumn[] = [
  { key: "market", label: "Market" },
  { key: "value", label: "Current value", align: "right" },
  { key: "change", label: "Change", align: "right" },
  { key: "marketStatus", label: "Market status", align: "right" },
  { key: "freshness", label: "Freshness", align: "right" },
  { key: "source", label: "Source", align: "right" },
];

const number = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const rows: DenseTableRow[] = mockGlobalTickerItems.map((item) => ({
  id: item.id,
  cells: {
    market: <span className="font-medium text-slate-200">{item.name}</span>,
    value: <span className="font-mono tabular-nums">{number.format(item.value)}</span>,
    change: (
      <span
        className={`font-mono tabular-nums ${item.positive ? "text-emerald-300" : "text-red-300"}`}
      >
        {item.absoluteChange >= 0 ? "+" : ""}
        {item.absoluteChange.toFixed(2)} ({item.percentageChange >= 0 ? "+" : ""}
        {item.percentageChange.toFixed(2)}%)
      </span>
    ),
    marketStatus: <MarketStatusBadge status={item.marketStatus} />,
    freshness: <FreshnessBadge freshness={item.freshness} />,
    source: <DataSourceBadge source={item.source} />,
  },
}));

export function GlobalMarketsBoundary() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-300">
          Markets · global context
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Global Markets
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          A reusable global-market table boundary with source, session, and freshness status. The
          displayed values are development fixtures, not live or delayed production market data.
        </p>
      </header>
      <DenseDataTable ariaLabel="Global markets table" columns={columns} rows={rows} />
      <StaleDataState description="A future provider response with an expired timestamp will replace its freshness badge with STALE and retain a clear warning instead of being presented as realtime." />
    </div>
  );
}
