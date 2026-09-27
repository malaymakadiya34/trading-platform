import { getPrismaClient } from "@/src/server/db/prisma";
import { getDataFreshness } from "@/src/server/market-data/freshness";
import { loadExchangeHolidayCalendar } from "@/src/server/market-session/calendar";
import { getIndiaMarketSession } from "@/src/server/market-session/service";
import {
  evaluateBreakout,
  scanIntradayBoosters,
  selectAtmAndItmContracts,
} from "@/src/domain/scanners/intraday-scanners.mjs";

const asNumber = (value: unknown) => (value === null || value === undefined ? null : Number(value));
const metadataNumber = (metadata: unknown, key: string) =>
  typeof metadata === "object" && metadata !== null && key in metadata
    ? asNumber((metadata as Record<string, unknown>)[key])
    : null;
const latestQuote = { orderBy: { asOf: "desc" as const }, take: 1 };
type RawQuote = {
  lastPrice: unknown;
  changePct: unknown;
  volume: unknown;
  openInterest: unknown;
  asOf: Date;
  source: string;
};
type RawCandle = {
  startsAt: Date;
  open: unknown;
  high: unknown;
  low: unknown;
  close: unknown;
  volume: unknown;
  openInterest: unknown;
};
type BoosterStock = {
  symbol: string;
  displayName: string;
  isFnoEligible: boolean;
  quotes: RawQuote[];
  candles: RawCandle[];
  parentLinks: Array<{ parent: { displayName: string; quotes: RawQuote[] } }>;
};
type BreakoutStock = {
  symbol: string;
  quotes: RawQuote[];
  candles: RawCandle[];
  parentLinks: Array<{ parent: { quotes: RawQuote[] } }>;
  contracts: Array<{ quotes: RawQuote[] }>;
};
type RawOptionContract = {
  id: string;
  kind: "OPTION";
  optionType: "CE" | "PE";
  contractSymbol: string;
  strike: number | undefined;
  expiry: Date;
  lotSize: number | null;
  metadata: unknown;
  quotes: RawQuote[];
  candles: RawCandle[];
};
type OptionInstrument = {
  symbol: string;
  quotes: RawQuote[];
  contracts: Array<Omit<RawOptionContract, "strike"> & { strike: unknown }>;
};
export type ScannerOptionView = {
  id: string;
  contractSymbol: string;
  moneyness: string;
  optionType: "CE" | "PE";
  strike: number | null;
  ltp: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  volume: number | null;
  openInterest: number | null;
  openInterestChange: number | null;
  impliedVolatility: number | null;
  bid: number | null;
  ask: number | null;
  spread: number | null;
  expiry: string;
  lotSize: number | null;
  source: string;
  freshness: "FRESH" | "STALE" | "UNKNOWN";
};
export type ScannerOptionsView = {
  symbol: string;
  direction: "UP" | "DOWN";
  spotPrice: number;
  asOf: string;
  source: string;
  contracts: ScannerOptionView[];
};

async function getScannerSession() {
  const now = new Date();
  const preliminary = getIndiaMarketSession(now);
  const calendar = await loadExchangeHolidayCalendar(
    "NSE",
    Number(preliminary.tradingDate.slice(0, 4)),
  );
  return getIndiaMarketSession(now, calendar);
}

export type ScannerQuery = {
  threshold?: number;
  direction?: "UP" | "DOWN" | "ALL";
  sortBy?: "MOVEMENT" | "EXTREME_DISTANCE" | "RELATIVE_VOLUME";
  maxDistancePct?: number;
};

export async function getIntradayBoosters(query: ScannerQuery = {}) {
  const session = await getScannerSession();
  if (session.state !== "OPEN")
    return {
      session,
      results: [],
      unavailableReason: `Scanner is inactive while the market is ${session.state.toLowerCase()}`,
    };
  const prisma = await getPrismaClient();
  const stocks = (await prisma.instrument.findMany({
    where: { active: true, kind: "STOCK", isFnoEligible: true, exchange: { code: "NSE" } },
    include: {
      quotes: latestQuote,
      candles: { where: { timeframe: "DAILY" }, orderBy: { startsAt: "desc" }, take: 21 },
      parentLinks: {
        where: { effectiveTo: null, parent: { kind: "SECTOR" } },
        select: { parent: { select: { displayName: true, quotes: latestQuote } } },
        take: 1,
      },
    },
  })) as BoosterStock[];
  const candidates = stocks.flatMap((stock) => {
    const quote = stock.quotes[0];
    const today = stock.candles[0];
    if (!quote || quote.changePct === null || !today) return [];
    const previousVolumes = stock.candles
      .slice(1)
      .map((candle) => asNumber(candle.volume))
      .filter((value): value is number => value !== null && value > 0);
    const averageVolume = previousVolumes.length
      ? previousVolumes.reduce((sum, value) => sum + value, 0) / previousVolumes.length
      : null;
    const volume = asNumber(quote.volume) ?? asNumber(today.volume);
    const sector = stock.parentLinks[0]?.parent;
    const freshness = getDataFreshness(quote.asOf).state;
    return [
      {
        symbol: stock.symbol,
        name: stock.displayName,
        isFnoEligible: stock.isFnoEligible,
        currentPrice: Number(quote.lastPrice),
        changePct: Number(quote.changePct),
        dayHigh: Number(today.high),
        dayLow: Number(today.low),
        volume,
        relativeVolume: volume !== null && averageVolume ? volume / averageVolume : null,
        timestamp: quote.asOf,
        dataFreshness: freshness,
        sectorContext: sector
          ? `${sector.displayName}${sector.quotes[0]?.changePct === null || sector.quotes[0]?.changePct === undefined ? "" : ` ${Number(sector.quotes[0].changePct).toFixed(2)}%`}`
          : null,
        marketContext: session.state,
        source: quote.source,
      },
    ];
  });
  return { session, results: scanIntradayBoosters(candidates, query), unavailableReason: null };
}

export async function getBreakoutScanner(nearThresholdPct = 0.25) {
  const session = await getScannerSession();
  if (session.state !== "OPEN")
    return {
      session,
      results: [],
      unavailableReason: `Scanner is inactive while the market is ${session.state.toLowerCase()}`,
    };
  const prisma = await getPrismaClient();
  const stocks = (await prisma.instrument.findMany({
    where: { active: true, kind: "STOCK", isFnoEligible: true, exchange: { code: "NSE" } },
    include: {
      quotes: latestQuote,
      candles: { where: { timeframe: "MINUTE_15" }, orderBy: { startsAt: "desc" }, take: 3 },
      parentLinks: {
        where: { effectiveTo: null, parent: { kind: "SECTOR" } },
        select: { parent: { select: { quotes: latestQuote } } },
        take: 1,
      },
      contracts: {
        where: { kind: "OPTION", expiry: { gte: new Date() } },
        select: { quotes: latestQuote },
        take: 20,
      },
    },
  })) as BreakoutStock[];
  const results = stocks.flatMap((stock) => {
    const quote = stock.quotes[0];
    if (!quote || !stock.candles.length) return [];
    const previous = stock.candles.find(
      (candle) => candle.startsAt.getTime() + 15 * 60_000 <= quote.asOf.getTime(),
    );
    if (!previous) return [];
    const current = stock.candles.find(
      (candle) =>
        candle.startsAt.getTime() <= quote.asOf.getTime() &&
        candle.startsAt.getTime() + 15 * 60_000 > quote.asOf.getTime(),
    ) ?? {
      startsAt: quote.asOf,
      open: quote.lastPrice,
      high: quote.lastPrice,
      low: quote.lastPrice,
      close: quote.lastPrice,
      volume: null,
      openInterest: quote.openInterest,
    };
    const currentVolume = asNumber(current.volume);
    const previousVolume = asNumber(previous.volume);
    const relativeVolume =
      currentVolume !== null && previousVolume ? currentVolume / previousVolume : null;
    const bodyRatio =
      Number(current.high) === Number(current.low)
        ? 0
        : Math.abs(Number(current.close) - Number(current.open)) /
          (Number(current.high) - Number(current.low));
    const sectorChange = asNumber(stock.parentLinks[0]?.parent.quotes[0]?.changePct);
    const liquidOption = stock.contracts.some((contract) =>
      contract.quotes.some((item) => asNumber(item.volume) !== null),
    );
    const common = {
      symbol: stock.symbol,
      previousCandle: {
        symbol: stock.symbol,
        startsAt: previous.startsAt,
        endsAt: new Date(previous.startsAt.getTime() + 15 * 60_000),
        open: Number(previous.open),
        high: Number(previous.high),
        low: Number(previous.low),
        close: Number(previous.close),
        volume: previousVolume,
        openInterest: asNumber(previous.openInterest),
      },
      currentPrice: Number(quote.lastPrice),
      timestamp: quote.asOf,
      crossedAt: current.startsAt,
      confirmations: {
        volume: relativeVolume !== null ? relativeVolume >= 1 : null,
        candleBody: bodyRatio >= 0.5,
        sector:
          sectorChange !== null
            ? Number(quote.changePct ?? 0) >= 0
              ? sectorChange > 0
              : sectorChange < 0
            : null,
        openInterest:
          current.openInterest !== null && previous.openInterest !== null
            ? Number(current.openInterest) !== Number(previous.openInterest)
            : null,
        optionLiquidity: liquidOption,
      },
      supportingMetrics: {
        relativeVolume,
        candleBodyStrength: bodyRatio,
        sectorChangePct: sectorChange,
        currentCandleHigh: Number(current.high),
        currentCandleLow: Number(current.low),
        source: quote.source,
      },
      dataFreshness: getDataFreshness(quote.asOf).state,
    } as const;
    return (["UP", "DOWN"] as const)
      .map((direction) =>
        evaluateBreakout(
          {
            ...common,
            direction,
            hadCrossed:
              direction === "UP"
                ? Number(current.high) > Number(previous.high)
                : Number(current.low) < Number(previous.low),
          },
          { nearThresholdPct },
        ),
      )
      .filter((result) => result.status !== "OUTSIDE");
  });
  return { session, results, unavailableReason: null };
}

export async function getScannerOptions(
  symbol: string,
  direction: "UP" | "DOWN",
): Promise<ScannerOptionsView | null> {
  const prisma = await getPrismaClient();
  const instrument = (await prisma.instrument.findFirst({
    where: {
      normalizedSymbol: symbol.toUpperCase(),
      kind: "STOCK",
      active: true,
      isFnoEligible: true,
    },
    include: {
      quotes: latestQuote,
      contracts: {
        where: {
          kind: "OPTION",
          expiry: { gte: new Date() },
          optionType: direction === "UP" ? "CE" : "PE",
        },
        orderBy: [{ expiry: "asc" }, { strike: "asc" }],
        include: {
          quotes: latestQuote,
          candles: { where: { timeframe: "DAILY" }, orderBy: { startsAt: "desc" }, take: 1 },
        },
      },
    },
  })) as OptionInstrument | null;
  if (!instrument || !instrument.quotes[0]) return null;
  const firstExpiry = instrument.contracts[0]?.expiry;
  const contracts = firstExpiry
    ? instrument.contracts
        .filter((contract) => contract.expiry.getTime() === firstExpiry.getTime())
        .map((contract) => ({ ...contract, strike: asNumber(contract.strike) ?? undefined }))
    : [];
  const selected = selectAtmAndItmContracts(
    contracts,
    Number(instrument.quotes[0].lastPrice),
    direction,
  );
  return {
    symbol: instrument.symbol,
    direction,
    spotPrice: Number(instrument.quotes[0].lastPrice),
    asOf: instrument.quotes[0].asOf.toISOString(),
    source: instrument.quotes[0].source,
    contracts: selected.map((contract) => {
      const quote = contract.quotes[0];
      const candle = contract.candles[0];
      const bid = metadataNumber(contract.metadata, "bid");
      const ask = metadataNumber(contract.metadata, "ask");
      return {
        id: contract.id,
        contractSymbol: contract.contractSymbol,
        moneyness: contract.moneyness,
        optionType: contract.optionType,
        strike: contract.strike ?? null,
        ltp: quote ? Number(quote.lastPrice) : null,
        dayHigh: candle ? Number(candle.high) : null,
        dayLow: candle ? Number(candle.low) : null,
        volume: asNumber(quote?.volume),
        openInterest: asNumber(quote?.openInterest),
        openInterestChange: metadataNumber(contract.metadata, "openInterestChange"),
        impliedVolatility: metadataNumber(contract.metadata, "impliedVolatility"),
        bid,
        ask,
        spread: bid !== null && ask !== null ? ask - bid : null,
        expiry: contract.expiry.toISOString(),
        lotSize: contract.lotSize,
        source: quote?.source ?? instrument.quotes[0].source,
        freshness: getDataFreshness(quote?.asOf ?? null).state,
      };
    }),
  };
}
