import Link from "next/link";

import { DenseDataTable } from "@/src/components/ui/dense-data-table";
import { EmptyState, ErrorState, StaleDataState } from "@/src/components/ui/data-states";
import type {
  getMarketMovementOverview,
  getSectorStocks,
} from "@/src/server/market-data/repositories/market-movement-repository";

type Overview = Awaited<ReturnType<typeof getMarketMovementOverview>>;
type SectorView = NonNullable<Awaited<ReturnType<typeof getSectorStocks>>>;

const number = (value: number | null | undefined, digits = 2) =>
  value === null || value === undefined
    ? "Unavailable"
    : value.toLocaleString("en-IN", {
        maximumFractionDigits: digits,
        minimumFractionDigits: digits,
      });
const pct = (value: number | null | undefined) =>
  value === null || value === undefined
    ? "Unavailable"
    : `${value >= 0 ? "+" : ""}${number(value)}%`;
const tone = (value: number | null | undefined) =>
  value === null || value === undefined
    ? "text-slate-500"
    : value > 0
      ? "text-emerald-400"
      : value < 0
        ? "text-red-400"
        : "text-slate-300";

export function MarketMovementHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="mb-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-400">
        Market intelligence · not a trade signal
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-50 sm:text-3xl">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{description}</p>
      <p className="mt-3 text-xs text-slate-500">Market → Index → Sector → Stock → Stock Details</p>
    </header>
  );
}

export function MarketMovementUnavailable({ error = false }: { error?: boolean }) {
  const props = {
    title: error ? "Market intelligence is unavailable" : "No market movement data is available",
    description:
      "No licensed live provider is connected and no normalized database records are available. Values are not fabricated; configure the existing market-data provider or ingest normalized quotes and memberships.",
  };
  return error ? <ErrorState {...props} /> : <EmptyState {...props} />;
}

export function IndexGrid({ indices }: { indices: Overview["indices"] }) {
  if (!indices.length)
    return (
      <EmptyState
        compact
        title="No configured indices"
        description="NIFTY 50, BANK NIFTY, FINNIFTY, NIFTY MIDCAP, NIFTY SMALLCAP and configured sector indices will appear from instrument master data."
      />
    );
  return (
    <section aria-labelledby="indices-heading">
      <h2 id="indices-heading" className="mb-3 text-sm font-semibold text-slate-100">
        Market / index overview
      </h2>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {indices.map(({ id, name, symbol, quote, constituentCount }) => (
          <article className="rounded-xl border border-slate-800 bg-[#0c1828] p-4" key={id}>
            <div className="flex justify-between gap-3">
              <div>
                <p className="font-medium text-slate-100">{name}</p>
                <p className="text-xs text-slate-500">
                  {symbol} · {constituentCount} constituents
                </p>
              </div>
              <span className="text-[10px] uppercase text-slate-500">
                {quote?.freshness ?? "UNKNOWN"}
              </span>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <p className="font-mono text-xl tabular-nums text-slate-100">
                {number(quote?.currentPrice)}
              </p>
              <div
                className={`text-right font-mono text-sm tabular-nums ${tone(quote?.changePct)}`}
              >
                <p>
                  {quote?.change === null || quote?.change === undefined
                    ? "Unavailable"
                    : `${quote.change >= 0 ? "+" : ""}${number(quote.change)}`}
                </p>
                <p>{pct(quote?.changePct)}</p>
              </div>
            </div>
            <p className="mt-3 text-[10px] text-slate-500">
              Source: {quote?.source ?? "Unavailable"}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function StrengthDistribution({ sectors }: { sectors: Overview["sectors"] }) {
  const weak = sectors.filter((item) => item.direction === "DOWN").reverse();
  const strong = sectors.filter((item) => item.direction === "UP");
  const neutral = sectors.filter((item) => item.direction === "NEUTRAL");
  return (
    <section
      className="rounded-xl border border-slate-800 bg-[#0c1828] p-4"
      aria-labelledby="strength-heading"
    >
      <div className="flex items-center justify-between">
        <h2 id="strength-heading" className="text-sm font-semibold text-slate-100">
          Strength / weakness distribution
        </h2>
        <span className="text-[10px] uppercase tracking-wider text-slate-500">Zero centered</span>
      </div>
      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-stretch gap-3">
        <div className="flex flex-wrap content-start justify-end gap-2" aria-label="Weak sectors">
          {weak.map((sector) => (
            <SectorPill key={sector.id} sector={sector} />
          ))}
          {!weak.length && <span className="text-xs text-slate-600">No weak sectors</span>}
        </div>
        <div className="flex w-14 flex-col items-center">
          <span className="text-[10px] text-slate-500">WEAK</span>
          <div className="my-2 h-full w-px bg-slate-600" />
          <span className="rounded border border-slate-700 px-2 py-1 font-mono text-xs">0</span>
          <div className="my-2 h-full w-px bg-slate-600" />
          <span className="text-[10px] text-slate-500">STRONG</span>
        </div>
        <div className="flex flex-wrap content-start gap-2" aria-label="Strong sectors">
          {strong.map((sector) => (
            <SectorPill key={sector.id} sector={sector} />
          ))}
          {!strong.length && <span className="text-xs text-slate-600">No strong sectors</span>}
        </div>
      </div>
      {neutral.length ? (
        <p className="mt-4 text-center text-xs text-slate-500">
          Neutral: {neutral.map((item) => item.name).join(", ")}
        </p>
      ) : null}
      <p className="mt-4 text-xs text-slate-500">
        Breadth and movement describe current market context only; they are not BUY or SELL
        recommendations.
      </p>
    </section>
  );
}

function SectorPill({ sector }: { sector: Overview["sectors"][number] }) {
  return (
    <Link
      href={`/sector-heatmap?sector=${encodeURIComponent(sector.symbol)}`}
      className={`rounded-lg border px-3 py-2 text-xs ${sector.direction === "UP" ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300" : "border-red-500/25 bg-red-500/10 text-red-300"}`}
    >
      <span className="font-medium">{sector.name}</span>{" "}
      <span className="font-mono">{pct(sector.changePct)}</span>
    </Link>
  );
}

export function SectorHeatmap({ sectors }: { sectors: Overview["sectors"] }) {
  if (!sectors.length)
    return (
      <EmptyState
        title="No sector heatmap data"
        description="Sector blocks require active sector instruments, current memberships and normalized quotes. No demo values are shown in this production data surface."
      />
    );
  return (
    <section aria-labelledby="heatmap-heading">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 id="heatmap-heading" className="text-sm font-semibold text-slate-100">
            Sector heatmap
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Block sizing uses centralized constituent activity configuration.
          </p>
        </div>
        <span className="text-[10px] uppercase text-slate-500">Red · neutral · green</span>
      </div>
      <div className="grid auto-rows-[112px] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {sectors.map((sector) => {
          const alpha = sector.intensity === null ? 0.03 : 0.08 + sector.intensity * 0.22;
          const positive = sector.direction === "UP";
          const negative = sector.direction === "DOWN";
          return (
            <Link
              aria-label={`Open ${sector.name} constituents`}
              className={`overflow-hidden rounded-xl border p-4 transition hover:border-blue-400/60 ${sector.blockSize === 3 ? "lg:col-span-3" : sector.blockSize === 2 ? "lg:col-span-2" : "lg:col-span-1"}`}
              href={`/sector-heatmap?sector=${encodeURIComponent(sector.symbol)}`}
              key={sector.id}
              style={{
                backgroundColor: positive
                  ? `rgb(16 185 129 / ${alpha})`
                  : negative
                    ? `rgb(239 68 68 / ${alpha})`
                    : "rgb(51 65 85 / 0.22)",
                borderColor: positive
                  ? "rgb(16 185 129 / .3)"
                  : negative
                    ? "rgb(239 68 68 / .3)"
                    : "rgb(51 65 85)",
              }}
            >
              <div className="flex justify-between gap-2">
                <p className="truncate font-medium text-slate-50">{sector.name}</p>
                <span className={`font-mono text-sm ${tone(sector.changePct)}`}>
                  {pct(sector.changePct)}
                </span>
              </div>
              <p className="mt-3 text-[10px] uppercase tracking-wider text-slate-300/70">
                {sector.intensityLabel} · size {sector.blockSize}
              </p>
              <p className="mt-2 text-xs text-slate-300">
                A {sector.breadth.advancing} · D {sector.breadth.declining} · U{" "}
                {sector.breadth.unchanged}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function SectorStockTable({ data }: { data: SectorView }) {
  const stale = data.stocks.some((stock) => stock.quote?.freshness === "STALE");
  const rows = data.stocks.map((stock) => ({
    id: stock.id,
    cells: {
      stock: (
        <Link
          className="font-medium text-blue-300 hover:text-blue-200"
          href={`/market-movement/stocks/${encodeURIComponent(stock.normalizedSymbol)}?sector=${encodeURIComponent(data.sector.symbol)}`}
        >
          {stock.symbol}
          <span className="ml-2 text-xs font-normal text-slate-500">{stock.name}</span>
        </Link>
      ),
      price: <span className="font-mono tabular-nums">{number(stock.quote?.currentPrice)}</span>,
      movement: (
        <span className={`font-mono ${tone(stock.quote?.changePct)}`}>
          {pct(stock.quote?.changePct)}
        </span>
      ),
      volume: number(stock.quote?.volume, 0),
      oi: number(stock.quote?.openInterest, 0),
      strength: (
        <span className={`font-mono ${tone(stock.relativeStrength)}`}>
          {pct(stock.relativeStrength)}
        </span>
      ),
      freshness: stock.quote?.freshness ?? "UNKNOWN",
      source: stock.quote?.source ?? "Unavailable",
    },
  }));
  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link className="text-xs text-blue-400" href="/sector-heatmap">
            ← All sectors
          </Link>
          <h2 className="mt-2 text-xl font-semibold text-slate-100">
            {data.sector.name} constituents
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Breadth A {data.sector.breadth.advancing} · D {data.sector.breadth.declining} · U{" "}
            {data.sector.breadth.unchanged}
            {data.index ? ` · Index context: ${data.index.name} ${pct(data.index.changePct)}` : ""}
          </p>
        </div>
        <span className={`font-mono ${tone(data.sector.quote?.changePct)}`}>
          {pct(data.sector.quote?.changePct)}
        </span>
      </div>
      {stale ? (
        <div className="mb-4">
          <StaleDataState />
        </div>
      ) : null}
      <DenseDataTable
        ariaLabel={`${data.sector.name} constituent stocks`}
        columns={[
          { key: "stock", label: "Stock" },
          { key: "price", label: "CTP", align: "right" },
          { key: "movement", label: "Change", align: "right" },
          { key: "volume", label: "Volume", align: "right" },
          { key: "oi", label: "OI", align: "right" },
          { key: "strength", label: "Relative strength", align: "right" },
          { key: "freshness", label: "Freshness" },
          { key: "source", label: "Source" },
        ]}
        rows={rows}
        emptyContent={
          <EmptyState
            compact
            title="No constituents available"
            description="Instrument master membership contains no active stock constituents for this sector."
          />
        }
      />
    </section>
  );
}
