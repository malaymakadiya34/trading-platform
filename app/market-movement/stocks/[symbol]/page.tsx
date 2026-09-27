import Link from "next/link";
import { notFound } from "next/navigation";

import { AuthenticatedWorkspace } from "@/src/components/layout/authenticated-workspace";
import {
  MarketMovementHeader,
  MarketMovementUnavailable,
} from "@/src/components/market/market-movement-workspace";
import { getStockDetails } from "@/src/server/market-data/repositories/market-movement-repository";

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

export default async function StockDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ sector?: string }>;
}) {
  const { symbol } = await params;
  const { sector } = await searchParams;
  return (
    <AuthenticatedWorkspace nextPath={`/market-movement/stocks/${encodeURIComponent(symbol)}`}>
      <StockContent symbol={symbol} sector={sector} />
    </AuthenticatedWorkspace>
  );
}

async function StockContent({ symbol, sector }: { symbol: string; sector?: string }) {
  let details;
  try {
    details = await getStockDetails(symbol);
  } catch {
    return (
      <>
        <MarketMovementHeader
          title="Stock Details"
          description="Normalized quote and market context."
        />
        <MarketMovementUnavailable error />
      </>
    );
  }
  if (!details) notFound();
  const { stock, ohlc } = details;
  const metrics = [
    ["Current price", format(stock.quote?.currentPrice)],
    ["Change", pct(stock.quote?.changePct)],
    ["Volume", format(stock.quote?.volume, 0)],
    ["Open interest", format(stock.quote?.openInterest, 0)],
    ["Open", format(ohlc?.open)],
    ["High", format(ohlc?.high)],
    ["Low", format(ohlc?.low)],
    ["Close", format(ohlc?.close)],
    ["Relative strength", pct(details.relativeStrength)],
  ];
  return (
    <div className="space-y-6">
      <MarketMovementHeader
        title={`${stock.name} · ${stock.symbol}`}
        description="Quote, daily OHLC and relative market context. This intelligence view does not place broker orders or provide an automatic trade signal."
      />
      <nav className="text-xs text-slate-500">
        <Link className="text-blue-400" href="/market-movement">
          Market
        </Link>{" "}
        → {details.index?.name ?? "Index unavailable"} →{" "}
        {sector ? (
          <Link
            className="text-blue-400"
            href={`/sector-heatmap?sector=${encodeURIComponent(sector)}`}
          >
            {details.sector?.name ?? sector}
          </Link>
        ) : (
          (details.sector?.name ?? "Sector unavailable")
        )}{" "}
        → {stock.symbol}
      </nav>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map(([label, value]) => (
          <article className="rounded-xl border border-slate-800 bg-[#0c1828] p-4" key={label}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {label}
            </p>
            <p className="mt-2 font-mono text-lg tabular-nums text-slate-100">{value}</p>
          </article>
        ))}
      </section>
      <section className="rounded-xl border border-slate-800 bg-[#0c1828] p-5">
        <h2 className="text-sm font-semibold text-slate-100">Data context</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Sector context</dt>
            <dd className="mt-1 text-slate-200">
              {details.sector
                ? `${details.sector.name} · ${pct(details.sector.changePct)}`
                : "Unavailable"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Index context</dt>
            <dd className="mt-1 text-slate-200">
              {details.index
                ? `${details.index.name} · ${pct(details.index.changePct)}`
                : "Unavailable"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Source</dt>
            <dd className="mt-1 text-slate-200">
              {stock.quote?.source ?? ohlc?.source ?? "Unavailable"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Freshness / timestamp</dt>
            <dd className="mt-1 text-slate-200">
              {stock.quote ? `${stock.quote.freshness} · ${stock.quote.asOf}` : "Unavailable"}
            </dd>
          </div>
        </dl>
        <p className="mt-5 text-xs text-slate-500">
          Momentum and relative volume are omitted because the current normalized schema does not
          provide sufficient inputs. They are not fabricated.
        </p>
      </section>
    </div>
  );
}
