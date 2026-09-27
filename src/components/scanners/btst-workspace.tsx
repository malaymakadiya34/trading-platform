import Link from "next/link";
import { DenseDataTable } from "@/src/components/ui/dense-data-table";
import { EmptyState, ErrorState } from "@/src/components/ui/data-states";
import type { getBtstScanner } from "@/src/server/scanners/btst-scanner-repository";
type Data = Awaited<ReturnType<typeof getBtstScanner>>;
type Setup = keyof Data["results"]["bySetup"] | "TOP";
const labels: Record<Setup, string> = {
  TOP: "Top BTST",
  BULLISH_REVERSAL: "Bullish Reversal → CE",
  BULLISH_MOMENTUM: "Bullish Momentum → CE",
  BEARISH_REVERSAL: "Bearish Reversal → PE",
  BEARISH_MOMENTUM: "Bearish Momentum → PE",
};
export function BtstHeader() {
  return (
    <header>
      <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-blue-400">
        F&amp;O end-of-day intelligence · no order execution
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-50">BTST Scanner</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
        Independent reversal and momentum setups use price structure, closing strength and available
        volume, sector, market and derivative context. Ranking scores are not certainty.
      </p>
    </header>
  );
}
export function BtstTabs({ active }: { active: Setup }) {
  return (
    <nav className="flex flex-wrap gap-2" aria-label="BTST setups">
      {Object.entries(labels).map(([key, label]) => (
        <Link
          key={key}
          href={`/btst-scanner?setup=${key}`}
          className={`rounded-lg border px-3 py-2 text-xs font-medium ${active === key ? "border-blue-400 bg-blue-500/15 text-blue-200" : "border-slate-700 text-slate-400 hover:text-slate-200"}`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
export function BtstTable({ data, setup }: { data: Data; setup: Setup }) {
  const results = setup === "TOP" ? data.results.top : data.results.bySetup[setup];
  if (!results.length)
    return (
      <EmptyState
        title="No qualifying BTST setups"
        description="No F&O stock has enough independent confirmation for this setup. Green or red movement alone is not classified as a result."
      />
    );
  const rows = results.map((item, index) => ({
    id: `${item.symbol}-${item.setup}-${index}`,
    cells: {
      stock: (
        <Link
          className="font-medium text-blue-300"
          href={`/btst-scanner/options/${encodeURIComponent(item.symbol)}?direction=${item.direction === "BULLISH" ? "UP" : "DOWN"}`}
        >
          {item.symbol}
          <span className="ml-2 text-xs text-slate-500">{item.name}</span>
        </Link>
      ),
      setup: labels[item.setup],
      direction: (
        <span className={item.direction === "BULLISH" ? "text-emerald-400" : "text-red-400"}>
          {item.direction} · {item.optionType}
        </span>
      ),
      price: (
        <span className="font-mono">
          {item.currentPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      ),
      score: (
        <span title={item.scoreLabel} className="font-mono">
          {item.score}/100
        </span>
      ),
      factors: `${item.supportingMetrics.matchedFactors}/${item.supportingMetrics.availableFactors}`,
      freshness: item.dataFreshness,
      time: new Date(item.timestamp).toLocaleString("en-IN"),
    },
  }));
  return (
    <>
      <p className="mb-3 text-xs text-slate-500">
        Sorted by configurable evidence score. The score ranks qualifying candidates and does not
        express probability or certainty.
      </p>
      <DenseDataTable
        ariaLabel={labels[setup]}
        columns={[
          { key: "stock", label: "Stock" },
          { key: "setup", label: "Setup" },
          { key: "direction", label: "Direction / option" },
          { key: "price", label: "CTP", align: "right" },
          { key: "score", label: "Ranking score", align: "right" },
          { key: "factors", label: "Evidence", align: "right" },
          { key: "freshness", label: "Freshness" },
          { key: "time", label: "Timestamp" },
        ]}
        rows={rows}
      />
    </>
  );
}
export function BtstUnavailable() {
  return (
    <ErrorState
      title="BTST scanner unavailable"
      description="Normalized F&O quote and candle records could not be loaded. No scanner result is fabricated."
    />
  );
}
