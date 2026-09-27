import type {
  HistoricalCandle,
  InstrumentMaster,
  InstitutionalActivityRecord,
  OptionChain,
  ProviderMarketStatus,
  Quote,
} from "@/src/domain/market-data/types";
import type { MarketDataProvider, ProviderDataEvent } from "@/src/server/market-data/provider";
/** Development-only technical adapter. It never self-registers and rejects fixtures not marked MOCK. */
export class MockMarketDataProvider implements MarketDataProvider {
  readonly name = "MOCK_DEVELOPMENT_ONLY";
  private connected = false;
  private listeners = new Set<(event: ProviderDataEvent) => void>();
  constructor(
    private readonly fixtures: {
      quotes?: Quote[];
      candles?: HistoricalCandle[];
      master?: InstrumentMaster;
      options?: OptionChain;
      institutional?: InstitutionalActivityRecord[];
    } = {},
  ) {
    for (const quote of fixtures.quotes ?? [])
      if (quote.source !== "MOCK")
        throw new Error("Mock provider fixtures must use the MOCK source");
  }
  async connect() {
    this.connected = true;
  }
  async disconnect() {
    this.connected = false;
  }
  private ready() {
    if (!this.connected) throw new Error("Mock provider is disconnected");
  }
  async getQuote(symbol: string, exchange: string) {
    this.ready();
    const value = (this.fixtures.quotes ?? []).find(
      (item) => item.symbol === symbol && item.exchange === exchange,
    );
    if (!value) throw new Error("Mock quote unavailable");
    return value;
  }
  async getQuotes(symbols: string[], exchange: string) {
    this.ready();
    return (this.fixtures.quotes ?? []).filter(
      (item) => symbols.includes(item.symbol) && item.exchange === exchange,
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
    return (this.fixtures.candles ?? []).filter(
      (item) =>
        item.symbol === symbol &&
        item.exchange === exchange &&
        item.timeframe === timeframe &&
        item.startsAt >= from &&
        item.startsAt <= to,
    );
  }
  async getOptionChain() {
    this.ready();
    if (!this.fixtures.options) throw new Error("Mock option chain unavailable");
    return this.fixtures.options;
  }
  async getInstrumentMaster() {
    this.ready();
    if (!this.fixtures.master) throw new Error("Mock instrument master unavailable");
    return this.fixtures.master;
  }
  async getInstitutionalActivity() {
    this.ready();
    return this.fixtures.institutional ?? [];
  }
  async getMarketStatus(exchange: string): Promise<ProviderMarketStatus> {
    this.ready();
    return {
      exchange,
      state: "CLOSED",
      asOf: new Date(),
      source: "MOCK",
      status: "DEVELOPMENT_DATA",
    };
  }
  async subscribe() {
    this.ready();
  }
  async unsubscribe() {
    this.ready();
  }
  onData(listener: (event: ProviderDataEvent) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  emit(event: ProviderDataEvent) {
    this.ready();
    this.listeners.forEach((listener) => listener(event));
  }
}
