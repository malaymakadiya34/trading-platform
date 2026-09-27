import { FreshnessBadge } from "@/src/components/market/market-status-badge";
import {
  DenseDataTable,
  type DenseTableColumn,
  type DenseTableRow,
} from "@/src/components/ui/dense-data-table";
import { ErrorState } from "@/src/components/ui/data-states";
import { getGlobalMarkets } from "@/src/server/market-data/repositories/market-context-repository";
const columns: DenseTableColumn[] = [
  { key: "market", label: "Market" },
  { key: "value", label: "Current value", align: "right" },
  { key: "change", label: "Change", align: "right" },
  { key: "freshness", label: "Freshness" },
  { key: "source", label: "Source" },
  { key: "timestamp", label: "Timestamp" },
];
const format = (value: number | null) =>
  value === null
    ? "Unavailable"
    : value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export async function GlobalMarketsBoundary() {
  let markets: Awaited<ReturnType<typeof getGlobalMarkets>> | null = null;
  try {
    markets = await getGlobalMarkets();
  } catch {
    /* canonical error below */
  }
  if (!markets)
    return (
      <ErrorState
        title="Global markets unavailable"
        description="Normalized global-market records could not be loaded. No values are substituted."
      />
    );
  const rows: DenseTableRow[] = markets.map((item) => ({
    id: item.symbol,
    cells: {
      market: <span className="font-medium text-slate-200">{item.name}</span>,
      value: <span className="font-mono">{format(item.value)}</span>,
      change:
        item.change === null || item.changePct === null ? (
          "Unavailable"
        ) : (
          <span className={`font-mono ${item.change >= 0 ? "text-emerald-300" : "text-red-300"}`}>
            {item.change >= 0 ? "+" : ""}
            {item.change.toFixed(2)} ({item.changePct >= 0 ? "+" : ""}
            {item.changePct.toFixed(2)}%)
          </span>
        ),
      freshness: <FreshnessBadge freshness={item.freshness} />,
      source: <span className="text-xs text-slate-400">{item.source}</span>,
      timestamp: item.asOf ? new Date(item.asOf).toLocaleString("en-IN") : "Unavailable",
    },
  }));
  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-blue-300">
          Markets · global context
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Global Markets</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">
          Required global instruments are resolved from the normalized instrument master.
          Unsupported provider coverage remains unavailable.
        </p>
      </header>
      <DenseDataTable ariaLabel="Global markets table" columns={columns} rows={rows} />
    </div>
  );
}
