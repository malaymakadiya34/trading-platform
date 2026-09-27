import { indexPointContribution } from "@/src/domain/market-data/market-movement.mjs";
import { getPrismaClient } from "@/src/server/db/prisma";
import { getDataFreshness } from "@/src/server/market-data/freshness";
const latestQuote = { orderBy: { asOf: "desc" as const }, take: 1 };
export const GLOBAL_MARKETS = [
  { symbol: "DJI", name: "Dow Jones" },
  { symbol: "SPX", name: "S&P 500" },
  { symbol: "IXIC", name: "Nasdaq" },
  { symbol: "FTSE", name: "FTSE London" },
  { symbol: "DAX", name: "DAX" },
  { symbol: "GIFTNIFTY", name: "GIFT NIFTY" },
  { symbol: "N225", name: "Nikkei 225" },
  { symbol: "HSI", name: "Hang Seng" },
  { symbol: "BTCUSD", name: "BTC/USD" },
] as const;
type Quote = {
  lastPrice: unknown;
  change: unknown;
  changePct: unknown;
  volume: unknown;
  asOf: Date;
  source: string;
  isDelayed: boolean;
};
type Instrument = { normalizedSymbol: string; quotes: Quote[] };
export async function getGlobalMarkets() {
  const prisma = await getPrismaClient();
  const found = (await prisma.instrument.findMany({
    where: { active: true, normalizedSymbol: { in: GLOBAL_MARKETS.map((item) => item.symbol) } },
    select: { normalizedSymbol: true, quotes: latestQuote },
  })) as Instrument[];
  const bySymbol = new Map(found.map((item) => [item.normalizedSymbol, item.quotes[0]]));
  return GLOBAL_MARKETS.map((market) => {
    const quote = bySymbol.get(market.symbol);
    return {
      symbol: market.symbol,
      name: market.name,
      value: quote ? Number(quote.lastPrice) : null,
      change: quote?.change === null || quote?.change === undefined ? null : Number(quote.change),
      changePct:
        quote?.changePct === null || quote?.changePct === undefined
          ? null
          : Number(quote.changePct),
      status: quote ? "AVAILABLE" : "UNAVAILABLE",
      freshness: quote ? getDataFreshness(quote.asOf).state : "UNKNOWN",
      source: quote?.source ?? "NOT_CONFIGURED",
      asOf: quote?.asOf.toISOString() ?? null,
      isDelayed: quote?.isDelayed ?? false,
    };
  });
}
type IndexRecord = {
  id: string;
  symbol: string;
  displayName: string;
  quotes: Quote[];
  childLinks: Array<{
    weight: unknown;
    child: { id: string; symbol: string; displayName: string; quotes: Quote[] };
  }>;
};
export async function getIndexMovers(indexSymbol: string) {
  const prisma = await getPrismaClient();
  const index = (await prisma.instrument.findFirst({
    where: { active: true, kind: "INDEX", normalizedSymbol: indexSymbol.toUpperCase() },
    include: {
      quotes: latestQuote,
      childLinks: {
        where: { effectiveTo: null, weight: { not: null }, child: { active: true, kind: "STOCK" } },
        select: {
          weight: true,
          child: { select: { id: true, symbol: true, displayName: true, quotes: latestQuote } },
        },
      },
    },
  })) as IndexRecord | null;
  if (!index) return null;
  const indexValue = index.quotes[0] ? Number(index.quotes[0].lastPrice) : null;
  return {
    index: {
      symbol: index.symbol,
      name: index.displayName,
      value: indexValue,
      source: index.quotes[0]?.source ?? "NOT_CONFIGURED",
      asOf: index.quotes[0]?.asOf.toISOString() ?? null,
    },
    rows: index.childLinks
      .flatMap(({ weight, child }) => {
        const quote = child.quotes[0];
        if (
          !quote ||
          quote.changePct === null ||
          quote.changePct === undefined ||
          indexValue === null
        )
          return [];
        const weightPct = Number(weight),
          changePct = Number(quote.changePct),
          pointContribution = indexPointContribution(indexValue, weightPct, changePct);
        if (pointContribution === null) return [];
        return [
          {
            id: child.id,
            symbol: child.symbol,
            name: child.displayName,
            weightPct,
            changePct,
            pointContribution,
            percentContribution: indexValue ? (pointContribution / indexValue) * 100 : null,
            volume:
              quote.volume === null || quote.volume === undefined ? null : Number(quote.volume),
            direction: pointContribution > 0 ? "UP" : pointContribution < 0 ? "DOWN" : "NEUTRAL",
            source: quote.source,
            freshness: getDataFreshness(quote.asOf).state,
            asOf: quote.asOf.toISOString(),
          },
        ];
      })
      .sort((a, b) => Math.abs(b.pointContribution) - Math.abs(a.pointContribution)),
  };
}
