import type {
  HistoricalCandle,
  InstrumentMaster,
  InstitutionalActivityRecord,
  OptionChain,
  ProviderMarketStatus,
  Quote,
} from "@/src/domain/market-data/types";
import type { ProviderLifecycleAdapter } from "@/src/server/market-data/provider-lifecycle";

export type ProviderDataEvent = {
  type: "quote" | "candle" | "instrument" | "institutional" | "status";
  payload: unknown;
  receivedAt: Date;
};
export type MarketDataProvider = ProviderLifecycleAdapter & {
  getQuote(symbol: string, exchange: string): Promise<Quote>;
  getQuotes(symbols: string[], exchange: string): Promise<Quote[]>;
  getHistoricalCandles(
    symbol: string,
    exchange: string,
    timeframe: HistoricalCandle["timeframe"],
    from: Date,
    to: Date,
  ): Promise<HistoricalCandle[]>;
  getOptionChain(symbol: string, exchange: string): Promise<OptionChain>;
  getInstrumentMaster(): Promise<InstrumentMaster>;
  getInstitutionalActivity(from: Date, to: Date): Promise<InstitutionalActivityRecord[]>;
  getMarketStatus(exchange: string): Promise<ProviderMarketStatus>;
  subscribe(symbols: string[], exchange: string): Promise<void>;
  unsubscribe(symbols: string[], exchange: string): Promise<void>;
  onData(listener: (event: ProviderDataEvent) => void): () => void;
};
export class ProviderNotConfiguredError extends Error {
  constructor() {
    super("No licensed market-data provider is configured");
    this.name = "ProviderNotConfiguredError";
  }
}
let configuredProvider: MarketDataProvider | null = null;
export function registerMarketDataProvider(provider: MarketDataProvider) {
  if (configuredProvider && configuredProvider !== provider)
    throw new Error("A canonical market-data provider is already registered");
  configuredProvider = provider;
}
export function clearMarketDataProvider() {
  configuredProvider = null;
}
export function getMarketDataProvider(): MarketDataProvider {
  if (!configuredProvider) throw new ProviderNotConfiguredError();
  return configuredProvider;
}
