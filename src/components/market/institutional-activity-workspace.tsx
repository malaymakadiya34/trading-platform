import { DenseDataTable } from "@/src/components/ui/dense-data-table";
import { EmptyState, ErrorState } from "@/src/components/ui/data-states";
import type { getInstitutionalActivity } from "@/src/server/institutional-activity/repository";
type Data = Awaited<ReturnType<typeof getInstitutionalActivity>>;
const money = (value: number) =>
  value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const tone = (value: number) =>
  value > 0 ? "text-emerald-400" : value < 0 ? "text-red-400" : "text-slate-300";
export function InstitutionalHeader() {
  return (
    <header>
      <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-blue-400">
        Institutional cash-market activity
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-50">FII / DII</h1>
      <p className="mt-2 text-sm text-slate-400">
        Daily persisted records only. The default view requests the latest 10 trading-day records
        and never fabricates missing dates.
      </p>
    </header>
  );
}
export function InstitutionalFilters({
  preset,
  from,
  to,
}: {
  preset: string;
  from?: string;
  to?: string;
}) {
  return (
    <form
      method="get"
      className="grid gap-3 rounded-xl border border-slate-800 bg-[#0c1828] p-4 sm:grid-cols-4"
    >
      <label className="text-xs text-slate-400">
        Range
        <select
          name="range"
          defaultValue={preset}
          className="mt-2 block w-full rounded border border-slate-700 bg-[#081321] px-3 py-2 text-slate-100"
        >
          <option value="10D">10 Trading Days</option>
          <option value="1M">1 Month</option>
          <option value="3M">3 Months</option>
          <option value="6M">6 Months</option>
          <option value="CUSTOM">Custom</option>
        </select>
      </label>
      <label className="text-xs text-slate-400">
        Custom from
        <input
          type="date"
          name="from"
          defaultValue={from}
          className="mt-2 block w-full rounded border border-slate-700 bg-[#081321] px-3 py-2 text-slate-100"
        />
      </label>
      <label className="text-xs text-slate-400">
        Custom to
        <input
          type="date"
          name="to"
          defaultValue={to}
          className="mt-2 block w-full rounded border border-slate-700 bg-[#081321] px-3 py-2 text-slate-100"
        />
      </label>
      <button
        className="self-end rounded bg-blue-500 px-4 py-2 text-sm font-semibold text-white"
        type="submit"
      >
        Load selected range
      </button>
    </form>
  );
}
export function InstitutionalTable({ data }: { data: Data }) {
  if (!data.records.length)
    return (
      <EmptyState
        title="No FII / DII records available"
        description="No persisted institutional activity exists for the selected trading-day range. Missing records are not estimated."
      />
    );
  const rows = data.records.map((item) => ({
    id: item.id,
    cells: {
      date: item.date,
      fiiBuy: money(item.fiiBuy),
      fiiSell: money(item.fiiSell),
      fiiNet: <span className={tone(item.fiiNet)}>{money(item.fiiNet)}</span>,
      market: money(item.inMarket),
      diiNet: <span className={tone(item.diiNet)}>{money(item.diiNet)}</span>,
      diiBuy: money(item.diiBuy),
      diiSell: money(item.diiSell),
      source: `${item.source} · ${item.freshness}`,
    },
  }));
  return (
    <DenseDataTable
      ariaLabel="FII and DII daily activity"
      columns={[
        { key: "date", label: "Date" },
        { key: "fiiBuy", label: "FII Buy", align: "right" },
        { key: "fiiSell", label: "FII Sell", align: "right" },
        { key: "fiiNet", label: "FII Net", align: "right" },
        { key: "market", label: "IN MARKET", align: "right" },
        { key: "diiNet", label: "DII Net", align: "right" },
        { key: "diiBuy", label: "DII Buy", align: "right" },
        { key: "diiSell", label: "DII Sell", align: "right" },
        { key: "source", label: "Source / freshness" },
      ]}
      rows={rows}
    />
  );
}
export function InstitutionalUnavailable({ invalid = false }: { invalid?: boolean }) {
  return (
    <ErrorState
      title={invalid ? "Invalid date range" : "FII / DII data unavailable"}
      description={
        invalid
          ? "Choose both custom dates and ensure the start is not after the end."
          : "The institutional activity store could not be loaded. No records are fabricated."
      }
    />
  );
}
