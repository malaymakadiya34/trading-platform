import type { FreshnessState } from "@/src/server/market-data/freshness";

import {
  DataSourceBadge,
  FreshnessBadge,
  MarketStatusBadge,
  type DataSource,
  type MarketStatus,
} from "@/src/components/market/market-status-badge";
import { TickerPlaceholder } from "@/src/components/market/ticker-placeholder";

export type MarketTickerItemData = {
  id: string;
  name: string;
  value: number;
  absoluteChange: number;
  percentageChange: number;
  currency: "INR" | "USD";
  positive: boolean;
  marketStatus: MarketStatus;
  freshness: FreshnessState;
  source: DataSource;
};

type MarketTickerProps = {
  label: string;
  description: string;
  items: MarketTickerItemData[];
};

function formatValue(value: number, currency: MarketTickerItemData["currency"]) {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: currency === "USD" ? 2 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatChange(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

export function TickerItem({ item }: { item: MarketTickerItemData }) {
  const movementClass = item.positive ? "text-emerald-300" : "text-red-300";

  return (
    <article className="flex min-w-[220px] gap-3 border-r border-slate-800/80 px-4 py-2 last:border-r-0 sm:min-w-[245px]">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[11px] font-semibold tracking-[0.06em] text-slate-200">
            {item.name}
          </p>
          <DataSourceBadge source={item.source} />
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-mono text-sm font-semibold tabular-nums text-slate-100">
            {formatValue(item.value, item.currency)}
          </span>
          <span className={`font-mono text-[11px] font-medium tabular-nums ${movementClass}`}>
            {formatChange(item.absoluteChange)} ({formatChange(item.percentageChange)}%)
          </span>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <MarketStatusBadge status={item.marketStatus} />
          <FreshnessBadge freshness={item.freshness} />
        </div>
      </div>
    </article>
  );
}

export function MarketTicker({ description, items, label }: MarketTickerProps) {
  if (items.length === 0) return <TickerPlaceholder label={label} />;

  return (
    <section aria-label={`${label} ticker`} className="border-b border-slate-800/80 bg-[#0a1422]">
      <div className="flex items-stretch">
        <div className="hidden w-32 shrink-0 border-r border-slate-800 px-4 py-3 sm:block">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-300">
            {label}
          </p>
          <p className="mt-1 text-[10px] leading-4 text-slate-500">{description}</p>
        </div>
        <div className="min-w-0 flex-1 overflow-x-auto" role="region" tabIndex={0}>
          <div className="flex min-w-max divide-x divide-slate-800/80">
            {items.map((item) => (
              <TickerItem item={item} key={item.id} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
