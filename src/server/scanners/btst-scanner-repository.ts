import { scanBtst } from "@/src/domain/scanners/btst-scanner.mjs";
import { getPrismaClient } from "@/src/server/db/prisma";
import { getDataFreshness } from "@/src/server/market-data/freshness";

type Quote = {
  lastPrice: unknown;
  changePct: unknown;
  volume: unknown;
  openInterest: unknown;
  asOf: Date;
  source: string;
};
type Candle = {
  open: unknown;
  high: unknown;
  low: unknown;
  close: unknown;
  volume: unknown;
  openInterest: unknown;
  startsAt: Date;
};
type Stock = {
  symbol: string;
  displayName: string;
  quotes: Quote[];
  candles: Candle[];
  parentLinks: Array<{ parent: { quotes: Quote[] } }>;
  contracts: Array<{ quotes: Quote[]; candles: Candle[] }>;
};
const number = (value: unknown) => (value === null || value === undefined ? null : Number(value));
const pct = (value: number, reference: number) =>
  reference === 0 ? null : ((value - reference) / Math.abs(reference)) * 100;
const latestQuote = { orderBy: { asOf: "desc" as const }, take: 1 };

export async function getBtstScanner() {
  const prisma = await getPrismaClient();
  const [rawStocks, marketQuote] = await Promise.all([
    prisma.instrument.findMany({
      where: { active: true, kind: "STOCK", isFnoEligible: true, exchange: { code: "NSE" } },
      include: {
        quotes: latestQuote,
        candles: { where: { timeframe: "DAILY" }, orderBy: { startsAt: "desc" }, take: 21 },
        parentLinks: {
          where: { effectiveTo: null, parent: { kind: "SECTOR" } },
          select: { parent: { select: { quotes: latestQuote } } },
          take: 1,
        },
        contracts: {
          where: { kind: "FUTURE", expiry: { gte: new Date() } },
          orderBy: { expiry: "asc" },
          take: 1,
          select: {
            quotes: latestQuote,
            candles: { where: { timeframe: "DAILY" }, orderBy: { startsAt: "desc" }, take: 2 },
          },
        },
      },
    }),
    prisma.marketQuote.findFirst({
      where: { instrument: { normalizedSymbol: "NIFTY50" } },
      orderBy: { asOf: "desc" },
    }),
  ]);
  const stocks = rawStocks as Stock[];
  const marketChange = number(marketQuote?.changePct);
  const candidates = stocks.flatMap((stock) => {
    const quote = stock.quotes[0],
      today = stock.candles[0];
    if (!quote || !today || stock.candles.length < 2 || quote.changePct === null) return [];
    const history = stock.candles.slice(1);
    const support = Math.min(...history.map((item) => Number(item.low)));
    const resistance = Math.max(...history.map((item) => Number(item.high)));
    const high = Number(today.high),
      low = Number(today.low),
      open = Number(today.open),
      currentPrice = Number(quote.lastPrice),
      range = high - low;
    const previousVolumes = history
      .map((item) => number(item.volume))
      .filter((value): value is number => value !== null && value > 0);
    const averageVolume = previousVolumes.length
      ? previousVolumes.reduce((sum, value) => sum + value, 0) / previousVolumes.length
      : null;
    const volume = number(quote.volume) ?? number(today.volume);
    const future = stock.contracts[0];
    const currentOi =
      number(future?.quotes[0]?.openInterest) ?? number(future?.candles[0]?.openInterest);
    const priorOi = number(future?.candles[1]?.openInterest);
    return [
      {
        symbol: stock.symbol,
        name: stock.displayName,
        currentPrice,
        open,
        high,
        low,
        changePct: Number(quote.changePct),
        support,
        resistance,
        closingPosition: range > 0 ? (currentPrice - low) / range : null,
        recoveryFromLowPct: pct(currentPrice, low),
        retreatFromHighPct: pct(high, currentPrice),
        distanceFromHighPct: pct(high, currentPrice),
        relativeVolume: volume !== null && averageVolume ? volume / averageVolume : null,
        sectorChangePct: number(stock.parentLinks[0]?.parent.quotes[0]?.changePct),
        marketChangePct: marketChange,
        futuresOiChangePct: currentOi !== null && priorOi !== null ? pct(currentOi, priorOi) : null,
        timestamp: quote.asOf,
        dataFreshness: getDataFreshness(quote.asOf).state,
      },
    ];
  });
  return { generatedAt: new Date().toISOString(), results: scanBtst(candidates) };
}
