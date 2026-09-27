import { getPrismaClient } from "@/src/server/db/prisma";
import {
  calculateBreadth,
  heatmapBlockSize,
  heatmapIntensity,
  intensityLabel,
  movementDirection,
  rankSectors,
  rankStocks,
  stockRelativeStrength,
  weightedSectorMovement,
} from "@/src/domain/market-data/market-movement.mjs";
import { getDataFreshness } from "@/src/server/market-data/freshness";

const REQUIRED_INDEX_SYMBOLS = ["NIFTY50", "NIFTYBANK", "FINNIFTY", "NIFTYMIDCAP", "NIFTYSMALLCAP"];

type RawQuote = {
  lastPrice: unknown;
  change: unknown;
  changePct: unknown;
  volume: unknown;
  openInterest: unknown;
  asOf: Date;
  source: string;
  isDelayed: boolean;
};
type QuoteView = {
  currentPrice: number;
  change: number | null;
  changePct: number | null;
  volume: number | null;
  openInterest: number | null;
  asOf: string;
  source: string;
  isDelayed: boolean;
  freshness: "FRESH" | "STALE" | "UNKNOWN";
};
export type MarketIndexView = {
  id: string;
  symbol: string;
  name: string;
  quote: QuoteView | null;
  constituentCount: number;
};
export type SectorMovementView = {
  id: string;
  symbol: string;
  name: string;
  changePct: number | null;
  direction: "UP" | "DOWN" | "NEUTRAL" | "UNAVAILABLE";
  intensity: number | null;
  intensityLabel: "NEUTRAL" | "MILD" | "MODERATE" | "STRONG" | "UNAVAILABLE";
  blockSize: number;
  breadth: ReturnType<typeof calculateBreadth>;
  quote: QuoteView | null;
  constituentCount: number;
};
export type StockMovementView = {
  id: string;
  symbol: string;
  normalizedSymbol: string;
  name: string;
  weight: number | null;
  quote: QuoteView | null;
  changePct: number | null;
  relativeStrength: number | null;
};
export type MarketMovementOverview = { indices: MarketIndexView[]; sectors: SectorMovementView[] };
export type SectorStocksView = {
  sector: {
    id: string;
    symbol: string;
    name: string;
    quote: QuoteView | null;
    breadth: ReturnType<typeof calculateBreadth>;
  };
  index: { symbol: string; name: string; changePct: number | null } | null;
  stocks: StockMovementView[];
};
export type StockDetailsView = {
  stock: { id: string; symbol: string; name: string; quote: QuoteView | null };
  ohlc: {
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number | null;
    openInterest: number | null;
    startsAt: string;
    source: string;
  } | null;
  sector: { symbol: string; name: string; changePct: number | null } | null;
  index: { symbol: string; name: string; changePct: number | null } | null;
  relativeStrength: number | null;
};

type IndexRecord = {
  id: string;
  symbol: string;
  displayName: string;
  quotes: RawQuote[];
  childLinks: Array<{ childId: string }>;
};
type SectorRecord = {
  id: string;
  symbol: string;
  displayName: string;
  quotes: RawQuote[];
  childLinks: Array<{ weight: unknown; child: { quotes: RawQuote[] } }>;
};
type SectorDetailRecord = {
  id: string;
  symbol: string;
  displayName: string;
  parentLinks: Array<{ parent: { symbol: string; displayName: string; quotes: RawQuote[] } }>;
  childLinks: Array<{
    weight: unknown;
    child: {
      id: string;
      symbol: string;
      normalizedSymbol: string;
      displayName: string;
      quotes: RawQuote[];
    };
  }>;
};
type StockDetailRecord = {
  id: string;
  symbol: string;
  displayName: string;
  quotes: RawQuote[];
  candles: Array<{
    open: unknown;
    high: unknown;
    low: unknown;
    close: unknown;
    volume: unknown;
    openInterest: unknown;
    startsAt: Date;
    source: string;
  }>;
  parentLinks: Array<{
    parent: { symbol: string; displayName: string; kind: "INDEX" | "SECTOR"; quotes: RawQuote[] };
  }>;
};

const numberOrNull = (value: unknown) =>
  value === null || value === undefined ? null : Number(value);

function quoteView(quote: RawQuote | null): QuoteView | null {
  if (!quote) return null;
  const freshness = getDataFreshness(quote.asOf);
  return {
    currentPrice: Number(quote.lastPrice),
    change: numberOrNull(quote.change),
    changePct: numberOrNull(quote.changePct),
    volume: numberOrNull(quote.volume),
    openInterest: numberOrNull(quote.openInterest),
    asOf: quote.asOf.toISOString(),
    source: quote.source,
    isDelayed: quote.isDelayed,
    freshness: freshness.state,
  };
}

const latestQuoteSelect = {
  orderBy: { asOf: "desc" as const },
  take: 1,
  select: {
    lastPrice: true,
    change: true,
    changePct: true,
    volume: true,
    openInterest: true,
    asOf: true,
    source: true,
    isDelayed: true,
  },
};

export async function getMarketMovementOverview(): Promise<MarketMovementOverview> {
  const prisma = await getPrismaClient();
  const [indices, sectors] = (await Promise.all([
    prisma.instrument.findMany({
      where: {
        active: true,
        kind: "INDEX",
        exchange: { code: "NSE" },
        OR: [
          { normalizedSymbol: { in: REQUIRED_INDEX_SYMBOLS } },
          { metadata: { path: ["isMajorSectorIndex"], equals: true } },
        ],
      },
      include: {
        quotes: latestQuoteSelect,
        childLinks: { where: { effectiveTo: null }, select: { childId: true } },
      },
      orderBy: { displayName: "asc" },
    }),
    prisma.instrument.findMany({
      where: { active: true, kind: "SECTOR", exchange: { code: "NSE" } },
      include: {
        quotes: latestQuoteSelect,
        childLinks: {
          where: { effectiveTo: null, child: { active: true, kind: "STOCK" } },
          select: {
            weight: true,
            child: { select: { quotes: latestQuoteSelect } },
          },
        },
      },
      orderBy: { displayName: "asc" },
    }),
  ])) as [IndexRecord[], SectorRecord[]];

  const sectorViews: SectorMovementView[] = sectors.map((sector) => {
    const childChanges = sector.childLinks.map((link) =>
      numberOrNull(link.child.quotes[0]?.changePct),
    );
    const weightedChange = weightedSectorMovement(
      sector.childLinks.map((link) => ({
        changePct: numberOrNull(link.child.quotes[0]?.changePct),
        weight: numberOrNull(link.weight) ?? 1,
      })),
    );
    const quote = quoteView(sector.quotes[0] ?? null);
    const changePct = quote?.changePct ?? weightedChange;
    const activity = Math.min(1, sector.childLinks.length / 20);
    return {
      id: sector.id,
      symbol: sector.symbol,
      name: sector.displayName,
      changePct,
      direction: movementDirection(changePct),
      intensity: heatmapIntensity(changePct),
      intensityLabel: intensityLabel(changePct),
      blockSize: heatmapBlockSize(activity),
      breadth: calculateBreadth(childChanges),
      quote,
      constituentCount: sector.childLinks.length,
    };
  });

  return {
    indices: indices.map((index) => ({
      id: index.id,
      symbol: index.symbol,
      name: index.displayName,
      quote: quoteView(index.quotes[0] ?? null),
      constituentCount: index.childLinks.length,
    })),
    sectors: rankSectors(sectorViews),
  };
}

export async function getSectorStocks(sectorSymbol: string): Promise<SectorStocksView | null> {
  const prisma = await getPrismaClient();
  const sector = (await prisma.instrument.findFirst({
    where: { normalizedSymbol: sectorSymbol.toUpperCase(), kind: "SECTOR", active: true },
    include: {
      parentLinks: {
        where: { effectiveTo: null },
        select: {
          parent: { select: { symbol: true, displayName: true, quotes: latestQuoteSelect } },
        },
      },
      childLinks: {
        where: { effectiveTo: null, child: { active: true, kind: "STOCK" } },
        select: {
          weight: true,
          child: {
            select: {
              id: true,
              symbol: true,
              normalizedSymbol: true,
              displayName: true,
              quotes: latestQuoteSelect,
            },
          },
        },
      },
    },
  })) as SectorDetailRecord | null;
  if (!sector) return null;
  const sectorQuote = await prisma.marketQuote.findFirst({
    where: { instrumentId: sector.id },
    orderBy: { asOf: "desc" },
  });
  const sectorChange = numberOrNull(sectorQuote?.changePct);
  const parent = sector.parentLinks[0]?.parent;
  const indexChange = numberOrNull(parent?.quotes[0]?.changePct);
  const stocks = sector.childLinks.map(({ child, weight }) => {
    const quote = quoteView(child.quotes[0] ?? null);
    return {
      id: child.id,
      symbol: child.symbol,
      normalizedSymbol: child.normalizedSymbol,
      name: child.displayName,
      weight: numberOrNull(weight),
      quote,
      relativeStrength: stockRelativeStrength(quote?.changePct, sectorChange, indexChange),
    };
  });
  return {
    sector: {
      id: sector.id,
      symbol: sector.symbol,
      name: sector.displayName,
      quote: quoteView(sectorQuote),
      breadth: calculateBreadth(stocks.map((stock) => stock.quote?.changePct)),
    },
    index: parent
      ? { symbol: parent.symbol, name: parent.displayName, changePct: indexChange }
      : null,
    stocks: rankStocks(
      stocks.map((stock) => ({ ...stock, changePct: stock.quote?.changePct ?? null })),
    ),
  };
}

export async function getStockDetails(symbol: string): Promise<StockDetailsView | null> {
  const prisma = await getPrismaClient();
  const stock = (await prisma.instrument.findFirst({
    where: { normalizedSymbol: symbol.toUpperCase(), kind: "STOCK", active: true },
    include: {
      quotes: latestQuoteSelect,
      candles: { where: { timeframe: "DAILY" }, orderBy: { startsAt: "desc" }, take: 1 },
      parentLinks: {
        where: { effectiveTo: null },
        select: {
          parent: {
            select: { symbol: true, displayName: true, kind: true, quotes: latestQuoteSelect },
          },
        },
      },
    },
  })) as StockDetailRecord | null;
  if (!stock) return null;
  const sector = stock.parentLinks.find(({ parent }) => parent.kind === "SECTOR")?.parent;
  const index = stock.parentLinks.find(({ parent }) => parent.kind === "INDEX")?.parent;
  const quote = quoteView(stock.quotes[0] ?? null);
  return {
    stock: { id: stock.id, symbol: stock.symbol, name: stock.displayName, quote },
    ohlc: stock.candles[0]
      ? {
          open: Number(stock.candles[0].open),
          high: Number(stock.candles[0].high),
          low: Number(stock.candles[0].low),
          close: Number(stock.candles[0].close),
          volume: numberOrNull(stock.candles[0].volume),
          openInterest: numberOrNull(stock.candles[0].openInterest),
          startsAt: stock.candles[0].startsAt.toISOString(),
          source: stock.candles[0].source,
        }
      : null,
    sector: sector
      ? {
          symbol: sector.symbol,
          name: sector.displayName,
          changePct: numberOrNull(sector.quotes[0]?.changePct),
        }
      : null,
    index: index
      ? {
          symbol: index.symbol,
          name: index.displayName,
          changePct: numberOrNull(index.quotes[0]?.changePct),
        }
      : null,
    relativeStrength: stockRelativeStrength(
      quote?.changePct,
      numberOrNull(sector?.quotes[0]?.changePct),
      numberOrNull(index?.quotes[0]?.changePct),
    ),
  };
}
