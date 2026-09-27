import { readFile } from "node:fs/promises";
import type {
  HistoricalCandle,
  InstrumentMaster,
  InstitutionalActivityRecord,
  OptionChain,
  ProviderMarketStatus,
  Quote,
} from "@/src/domain/market-data/types";
import type { MarketDataProvider, ProviderDataEvent } from "../provider.ts";

export const DEVELOPMENT_SOURCE = "DEVELOPMENT_DATA";

export type DevelopmentDataset = {
  /** Human-readable origin and usage note; never interpreted as a live-data entitlement. */
  provenance: string;
  asOf: string;
  quotes?: Quote[];
  candles?: HistoricalCandle[];
  instrumentMaster?: InstrumentMaster;
  optionChains?: OptionChain[];
  institutionalActivity?: InstitutionalActivityRecord[];
};

function assertDevelopmentRecord(record: { source: string; status: string }) {
  if (record.source !== DEVELOPMENT_SOURCE || record.status !== "DEVELOPMENT_DATA")
    throw new Error("Development records must be explicitly labelled DEVELOPMENT_DATA");
}

/**
 * Offline, non-production provider for approved EOD/reference files and deterministic fixtures.
 * It performs no network requests and cannot emit a live stream.
 */
export class DevelopmentMarketDataProvider implements MarketDataProvider {
  readonly name = DEVELOPMENT_SOURCE;
  private connected = false;
  private readonly listeners = new Set<(event: ProviderDataEvent) => void>();
  private readonly dataset: DevelopmentDataset;

  constructor(dataset: DevelopmentDataset) {
    this.dataset = dataset;
    if (!dataset.provenance.trim() || Number.isNaN(Date.parse(dataset.asOf)))
      throw new Error("Development dataset requires provenance and a valid asOf timestamp");
    for (const record of [
      ...(dataset.quotes ?? []),
      ...(dataset.candles ?? []),
      ...(dataset.optionChains ?? []),
      ...(dataset.institutionalActivity ?? []),
    ])
      assertDevelopmentRecord(record);
    if (dataset.instrumentMaster) assertDevelopmentRecord(dataset.instrumentMaster);
  }

  async connect() {
    if (process.env.NODE_ENV === "production")
      throw new Error("Development data provider is disabled in production");
    this.connected = true;
  }
  async disconnect() {
    this.connected = false;
  }
  private ready() {
    if (!this.connected) throw new Error("Development data provider is disconnected");
  }
  async getQuote(symbol: string, exchange: string) {
    this.ready();
    const quote = (this.dataset.quotes ?? []).find(
      (item) => item.symbol === symbol && item.exchange === exchange,
    );
    if (!quote) throw new Error("Development quote unavailable");
    return quote;
  }
  async getQuotes(symbols: string[], exchange: string) {
    this.ready();
    return (this.dataset.quotes ?? []).filter(
      (item) => item.exchange === exchange && symbols.includes(item.symbol),
    );
  }
  async getHistoricalCandles(
    symbol: string,
    exchange: string,
    timeframe: HistoricalCandle["timeframe"],
    from: Date,
    to: Date,
  ) {
    this.ready();
    return (this.dataset.candles ?? []).filter(
      (item) =>
        item.symbol === symbol &&
        item.exchange === exchange &&
        item.timeframe === timeframe &&
        item.startsAt >= from &&
        item.startsAt <= to,
    );
  }
  async getOptionChain(symbol: string, exchange: string) {
    this.ready();
    const chain = (this.dataset.optionChains ?? []).find(
      (item) => item.underlyingSymbol === symbol && item.exchange === exchange,
    );
    if (!chain) throw new Error("Development option chain unavailable");
    return chain;
  }
  async getInstrumentMaster() {
    this.ready();
    if (!this.dataset.instrumentMaster)
      throw new Error("Development instrument master unavailable");
    return this.dataset.instrumentMaster;
  }
  async getInstitutionalActivity(from: Date, to: Date) {
    this.ready();
    return (this.dataset.institutionalActivity ?? []).filter((item) => {
      const date = new Date(`${item.tradingDate}T00:00:00Z`);
      return date >= from && date <= to;
    });
  }
  async getMarketStatus(exchange: string): Promise<ProviderMarketStatus> {
    this.ready();
    return {
      exchange,
      state: "CLOSED",
      asOf: new Date(this.dataset.asOf),
      source: DEVELOPMENT_SOURCE,
      status: "DEVELOPMENT_DATA",
    };
  }
  async subscribe() {
    this.ready();
    throw new Error("Development data has no realtime subscriptions");
  }
  async unsubscribe() {
    this.ready();
  }
  onData(listener: (event: ProviderDataEvent) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export async function loadDevelopmentDataset(path: string): Promise<DevelopmentDataset> {
  if (!path.trim()) throw new Error("DEVELOPMENT_DATASET_PATH is required");
  const parsed = JSON.parse(await readFile(path, "utf8")) as DevelopmentDataset;
  const date = (value: unknown) => new Date(String(value));
  return {
    ...parsed,
    quotes: parsed.quotes?.map((item) => ({ ...item, asOf: date(item.asOf) })),
    candles: parsed.candles?.map((item) => ({ ...item, startsAt: date(item.startsAt) })),
    instrumentMaster: parsed.instrumentMaster
      ? {
          ...parsed.instrumentMaster,
          asOf: date(parsed.instrumentMaster.asOf),
          contracts: parsed.instrumentMaster.contracts.map((item) => ({
            ...item,
            expiry: date(item.expiry),
          })),
        }
      : undefined,
    optionChains: parsed.optionChains?.map((chain) => ({
      ...chain,
      asOf: date(chain.asOf),
      contracts: chain.contracts.map((item) => ({ ...item, expiry: date(item.expiry) })),
    })),
    institutionalActivity: parsed.institutionalActivity?.map((item) => ({
      ...item,
      asOf: date(item.asOf),
    })),
  };
}
