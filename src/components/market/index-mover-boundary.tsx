import Link from "next/link";
import { DenseDataTable, type DenseTableColumn } from "@/src/components/ui/dense-data-table";
import { EmptyState, ErrorState } from "@/src/components/ui/data-states";
import { getIndexMovers } from "@/src/server/market-data/repositories/market-context-repository";
const columns: DenseTableColumn[] = [
  { key: "constituent", label: "Constituent" },
  { key: "weight", label: "Weight", align: "right" },
  { key: "priceChange", label: "Price change", align: "right" },
  { key: "pointContribution", label: "Point contribution", align: "right" },
  { key: "percentContribution", label: "% contribution", align: "right" },
  { key: "volume", label: "Volume", align: "right" },
  { key: "direction", label: "Direction" },
  { key: "freshness", label: "Freshness / source" },
];
const value = (input: number | null, digits = 2) =>
  input === null
    ? "Unavailable"
    : input.toLocaleString("en-IN", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      });
export async function IndexMoverBoundary({ indexSymbol = "NIFTY50" }: { indexSymbol?: string }) {
  let data: Awaited<ReturnType<typeof getIndexMovers>> | null | undefined;
  try {
    data = await getIndexMovers(indexSymbol);
  } catch {
    data = undefined;
  }
  if (data === undefined)
    return (
      <ErrorState
        title="Index contribution unavailable"
        description="The normalized index membership store could not be loaded."
      />
    );
  if (data === null)
    return (
      <EmptyState
        title="Index not configured"
        description="The selected index is unavailable in the instrument master."
      />
    );
  const rows = data.rows.map((item) => ({
    id: item.id,
    cells: {
      constituent: (
        <Link
          className="font-medium text-blue-300"
          href={`/market-movement/stocks/${encodeURIComponent(item.symbol)}`}
        >
          {item.symbol}
          <span className="ml-2 text-xs text-slate-500">{item.name}</span>
        </Link>
      ),
      weight: `${value(item.weightPct)}%`,
      priceChange: (
        <span className={item.changePct >= 0 ? "text-emerald-300" : "text-red-300"}>
          {item.changePct >= 0 ? "+" : ""}
          {value(item.changePct)}%
        </span>
      ),
      pointContribution: value(item.pointContribution),
      percentContribution:
        item.percentContribution === null
          ? "Unavailable"
          : `${value(item.percentContribution, 4)}%`,
      volume: value(item.volume, 0),
      direction: item.direction,
      freshness: `${item.freshness} · ${item.source}`,
    },
  }));
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-blue-300">
            Market · index mover
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Index Mover</h1>
          <p className="mt-2 text-sm text-slate-400">
            Point contribution uses current instrument-master weights and normalized quotes; missing
            weights are not estimated.
          </p>
        </div>
        <form method="get">
          <label className="text-xs text-slate-400">
            Index
            <input
              name="index"
              defaultValue={indexSymbol}
              className="ml-2 rounded border border-slate-700 bg-[#081321] px-3 py-2 text-slate-100"
            />
          </label>
        </form>
      </header>
      <DenseDataTable
        ariaLabel="Index mover contribution table"
        columns={columns}
        rows={rows}
        emptyContent={
          <EmptyState
            compact
            title="No index contribution data"
            description="Current quotes and actual index weights are required."
          />
        }
      />
    </div>
  );
}
