import Link from "next/link";
import { DenseDataTable } from "@/src/components/ui/dense-data-table";
import { EmptyState, ErrorState, StaleDataState } from "@/src/components/ui/data-states";
import type {
  getBreakoutScanner,
  getIntradayBoosters,
  getScannerOptions,
} from "@/src/server/scanners/intraday-scanner-repository";

type Boosters = Awaited<ReturnType<typeof getIntradayBoosters>>;
type Breakouts = Awaited<ReturnType<typeof getBreakoutScanner>>;
type Options = NonNullable<Awaited<ReturnType<typeof getScannerOptions>>>;
const format = (value: number | null | undefined, digits = 2) =>
  value === null || value === undefined
    ? "Unavailable"
    : value.toLocaleString("en-IN", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      });
const pct = (value: number | null | undefined) =>
  value === null || value === undefined
    ? "Unavailable"
    : `${value >= 0 ? "+" : ""}${format(value)}%`;
const tone = (direction: string) =>
  direction === "UP"
    ? "text-emerald-400"
    : direction === "DOWN"
      ? "text-red-400"
      : "text-slate-300";

export function ScannerHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className="mb-6">
      <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-blue-400">
        F&amp;O market intelligence · no order execution
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-50 sm:text-3xl">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{description}</p>
      <p className="mt-3 text-xs text-slate-500">
        Candidate results are deterministic filters, not guaranteed trading signals.
      </p>
    </header>
  );
}

export function ScannerUnavailable({
  error = false,
  reason,
}: {
  error?: boolean;
  reason?: string | null;
}) {
  const props = {
    title: error ? "Scanner data is unavailable" : "No scanner candidates",
    description:
      reason ??
      "No normalized F&O quote and candle data currently qualifies. No production values are fabricated.",
  };
  return error ? <ErrorState {...props} /> : <EmptyState {...props} />;
}

export function BoosterControls({
  threshold,
  direction,
  sortBy,
  maxDistance,
}: {
  threshold: number;
  direction: string;
  sortBy: string;
  maxDistance: string;
}) {
  return (
    <form
      className="grid gap-3 rounded-xl border border-slate-800 bg-[#0c1828] p-4 sm:grid-cols-4"
      method="get"
    >
      <label className="text-xs text-slate-400">
        View
        <select
          name="direction"
          defaultValue={direction}
          className="mt-2 block w-full rounded border border-slate-700 bg-[#081321] px-3 py-2 text-slate-100"
        >
          <option value="UP">Up Boosters</option>
          <option value="DOWN">Down Boosters</option>
        </select>
      </label>
      <label className="text-xs text-slate-400">
        Threshold
        <select
          name="threshold"
          defaultValue={threshold}
          className="mt-2 block w-full rounded border border-slate-700 bg-[#081321] px-3 py-2 text-slate-100"
        >
          <option value="3">±3%</option>
          <option value="4">±4%</option>
          <option value="5">±5%</option>
        </select>
      </label>
      <label className="text-xs text-slate-400">
        Sort
        <select
          name="sort"
          defaultValue={sortBy}
          className="mt-2 block w-full rounded border border-slate-700 bg-[#081321] px-3 py-2 text-slate-100"
        >
          <option value="MOVEMENT">Percentage movement</option>
          <option value="EXTREME_DISTANCE">Distance from extreme</option>
          <option value="RELATIVE_VOLUME">Relative volume</option>
        </select>
      </label>
      <label className="text-xs text-slate-400">
        Maximum extreme distance
        <select
          name="distance"
          defaultValue={maxDistance}
          className="mt-2 block w-full rounded border border-slate-700 bg-[#081321] px-3 py-2 text-slate-100"
        >
          <option value="">Any distance</option>
          <option value="0.5">Within 0.50%</option>
          <option value="1">Within 1.00%</option>
          <option value="2">Within 2.00%</option>
        </select>
      </label>
      <button
        className="rounded bg-blue-500 px-4 py-2 text-sm font-semibold text-white sm:col-span-4 sm:justify-self-end"
        type="submit"
      >
        Apply scanner filters
      </button>
    </form>
  );
}

export function BoosterTable({ data }: { data: Boosters }) {
  if (!data.results.length) return <ScannerUnavailable reason={data.unavailableReason} />;
  const stale = data.results.some((item) => item.dataFreshness === "STALE");
  const rows = data.results.map((item) => ({
    id: item.symbol,
    cells: {
      stock: (
        <Link
          className="font-medium text-blue-300"
          href={`/intraday-boosters/options/${encodeURIComponent(item.symbol)}?direction=${item.direction}`}
        >
          {item.symbol}
          <span className="ml-2 text-xs text-slate-500">{item.name}</span>
        </Link>
      ),
      ctp: <span className="font-mono">{format(item.currentPrice)}</span>,
      change: <span className={`font-mono ${tone(item.direction)}`}>{pct(item.changePct)}</span>,
      high: format(item.dayHigh),
      low: format(item.dayLow),
      distance: `${format(item.distanceFromExtremePct)}%`,
      volume: format(item.volume, 0),
      rvol: item.relativeVolume === null ? "Unavailable" : `${format(item.relativeVolume)}×`,
      context: item.sectorContext ?? item.marketContext ?? "Unavailable",
      freshness: `${item.dataFreshness} · ${item.source ?? "Unavailable"}`,
    },
  }));
  return (
    <>
      {stale ? (
        <div className="mb-4">
          <StaleDataState />
        </div>
      ) : null}
      <DenseDataTable
        ariaLabel="Intraday booster candidates"
        columns={[
          { key: "stock", label: "Stock" },
          { key: "ctp", label: "CTP", align: "right" },
          { key: "change", label: "Move", align: "right" },
          { key: "high", label: "Day high", align: "right" },
          { key: "low", label: "Day low", align: "right" },
          { key: "distance", label: "Extreme distance", align: "right" },
          { key: "volume", label: "Volume", align: "right" },
          { key: "rvol", label: "Rel. volume", align: "right" },
          { key: "context", label: "Context" },
          { key: "freshness", label: "Freshness / source" },
        ]}
        rows={rows}
      />
    </>
  );
}

export function BreakoutControls({ threshold }: { threshold: number }) {
  return (
    <form
      className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-800 bg-[#0c1828] p-4"
      method="get"
    >
      <label className="text-xs text-slate-400">
        Near-breakout distance
        <select
          name="near"
          defaultValue={threshold}
          className="mt-2 block rounded border border-slate-700 bg-[#081321] px-3 py-2 text-slate-100"
        >
          <option value="0.1">0.10%</option>
          <option value="0.25">0.25%</option>
          <option value="0.5">0.50%</option>
          <option value="1">1.00%</option>
        </select>
      </label>
      <button
        className="rounded bg-blue-500 px-4 py-2 text-sm font-semibold text-white"
        type="submit"
      >
        Apply threshold
      </button>
    </form>
  );
}

export function BreakoutTable({ data }: { data: Breakouts }) {
  if (!data.results.length) return <ScannerUnavailable reason={data.unavailableReason} />;
  const rows = data.results.map((item, index) => {
    const metrics = item.supportingMetrics as Record<string, unknown>;
    const actionable = item.status === "CONFIRMED";
    return {
      id: `${item.symbol}-${item.direction}-${index}`,
      cells: {
        stock: actionable ? (
          <Link
            className="font-medium text-blue-300"
            href={`/breakout-15m/options/${encodeURIComponent(item.symbol)}?direction=${item.direction}`}
          >
            {item.symbol}
          </Link>
        ) : (
          <span className="font-medium">{item.symbol}</span>
        ),
        direction: <span className={tone(item.direction)}>{item.direction}</span>,
        status: (
          <span
            className={`rounded border px-2 py-1 text-[10px] font-semibold ${item.status === "CONFIRMED" ? "border-emerald-500/30 text-emerald-300" : item.status === "INVALIDATED" ? "border-red-500/30 text-red-300" : "border-amber-500/30 text-amber-300"}`}
          >
            {item.status}
          </span>
        ),
        current: format(item.currentPrice),
        level: format(item.triggerLevel),
        distance: pct(typeof metrics.distancePct === "number" ? metrics.distancePct : null),
        volume:
          typeof metrics.relativeVolume === "number"
            ? `${format(metrics.relativeVolume)}×`
            : "Unavailable",
        body:
          typeof metrics.candleBodyStrength === "number"
            ? pct(metrics.candleBodyStrength * 100)
            : "Unavailable",
        freshness: item.dataFreshness,
        reason: item.invalidationReason ?? "—",
      },
    };
  });
  return (
    <DenseDataTable
      ariaLabel="15-minute breakout candidates"
      columns={[
        { key: "stock", label: "Stock" },
        { key: "direction", label: "Direction" },
        { key: "status", label: "Status" },
        { key: "current", label: "CTP", align: "right" },
        { key: "level", label: "Prior level", align: "right" },
        { key: "distance", label: "Distance", align: "right" },
        { key: "volume", label: "Rel. volume", align: "right" },
        { key: "body", label: "Body strength", align: "right" },
        { key: "freshness", label: "Freshness" },
        { key: "reason", label: "Invalidation" },
      ]}
      rows={rows}
    />
  );
}

export function OptionContractTable({ data, returnHref }: { data: Options; returnHref: string }) {
  const rows = data.contracts.map((contract) => ({
    id: contract.id,
    cells: {
      moneyness: <span className="font-semibold text-blue-300">{contract.moneyness}</span>,
      contract: contract.contractSymbol,
      strike: format(contract.strike),
      ltp: format(contract.ltp),
      high: format(contract.dayHigh),
      low: format(contract.dayLow),
      volume: format(contract.volume, 0),
      oi: format(contract.openInterest, 0),
      oiChange: format(contract.openInterestChange, 0),
      iv: contract.impliedVolatility === null ? "Unavailable" : pct(contract.impliedVolatility),
      bid: format(contract.bid),
      ask: format(contract.ask),
      spread: format(contract.spread),
      expiry: new Date(contract.expiry).toLocaleDateString("en-IN"),
      lot: format(contract.lotSize, 0),
      freshness: `${contract.freshness} · ${contract.source}`,
    },
  }));
  return (
    <div className="space-y-5">
      <Link href={returnHref} className="text-xs text-blue-400">
        ← Back to scanner
      </Link>
      <div>
        <h2 className="text-xl font-semibold text-slate-100">
          {data.symbol} · {data.direction === "UP" ? "CE" : "PE"} contracts
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Spot {format(data.spotPrice)} · ATM/ITM selections use available contract strikes for the
          nearest expiry. No strike interval is assumed.
        </p>
      </div>
      {rows.length ? (
        <DenseDataTable
          ariaLabel={`${data.symbol} option contracts`}
          columns={[
            { key: "moneyness", label: "Selection" },
            { key: "contract", label: "Contract" },
            { key: "strike", label: "Strike", align: "right" },
            { key: "ltp", label: "LTP", align: "right" },
            { key: "high", label: "Day high", align: "right" },
            { key: "low", label: "Day low", align: "right" },
            { key: "volume", label: "Volume", align: "right" },
            { key: "oi", label: "OI", align: "right" },
            { key: "oiChange", label: "OI change", align: "right" },
            { key: "iv", label: "IV", align: "right" },
            { key: "bid", label: "Bid", align: "right" },
            { key: "ask", label: "Ask", align: "right" },
            { key: "spread", label: "Spread", align: "right" },
            { key: "expiry", label: "Expiry" },
            { key: "lot", label: "Lot", align: "right" },
            { key: "freshness", label: "Freshness / source" },
          ]}
          rows={rows}
        />
      ) : (
        <ScannerUnavailable reason="No eligible contracts with actual strike metadata are available for the nearest expiry." />
      )}
      <p className="text-xs text-slate-500">
        Analytics only. Automatic broker order placement is not available.
      </p>
    </div>
  );
}
