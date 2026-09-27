import { DenseDataTable, type DenseTableColumn } from "@/src/components/ui/dense-data-table";
import { EmptyState } from "@/src/components/ui/data-states";

const columns: DenseTableColumn[] = [
  { key: "constituent", label: "Constituent" },
  { key: "weight", label: "Weight", align: "right" },
  { key: "priceChange", label: "Price change", align: "right" },
  { key: "pointContribution", label: "Point contribution", align: "right" },
  { key: "percentContribution", label: "% contribution", align: "right" },
  { key: "volume", label: "Volume", align: "right" },
  { key: "direction", label: "Direction", align: "right" },
];

export function IndexMoverBoundary() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-300">
            Market · index mover
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Index Mover
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Contribution analysis boundary for selected index constituents. No calculated
            contribution or market result is rendered until a licensed data source is connected.
          </p>
        </div>
        <span className="w-fit rounded border border-slate-700 bg-slate-800/70 px-3 py-2 text-xs text-slate-400">
          Index selection: not configured
        </span>
      </header>
      <DenseDataTable
        ariaLabel="Index mover contribution table"
        columns={columns}
        emptyContent={
          <EmptyState
            compact
            description="Contribution rows require index membership, weights, and normalized market quotes from the existing market-data foundation."
            title="No index contribution data"
          />
        }
        rows={[]}
      />
    </div>
  );
}
