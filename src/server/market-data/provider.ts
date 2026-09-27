import type {
  HistoricalCandle,
  InstrumentMaster,
  OptionChain,
  Quote,
} from "@/src/domain/market-data/types";

export type MarketDataProvider = {
  readonly name: string;
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
  subscribe(symbols: string[], exchange: string): Promise<void>;
  unsubscribe(symbols: string[], exchange: string): Promise<void>;
};

export class ProviderNotConfiguredError extends Error {
  constructor() {
    super("No licensed market-data provider is configured");
    this.name = "ProviderNotConfiguredError";
  }
}

export function getMarketDataProvider(): MarketDataProvider {
  throw new ProviderNotConfiguredError();
}
