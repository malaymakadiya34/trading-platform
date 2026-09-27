import type {
  CandleTimeframe,
  ContractDescriptor,
  HistoricalCandle,
  InstrumentDescriptor,
  InstrumentMaster,
  InstitutionalActivityRecord,
  MarketDataStatus,
  OptionChain,
  OptionType,
  ProviderMarketStatus,
  Quote,
} from "@/src/domain/market-data/types";
import {
  normalizeContract,
  normalizeInstrument,
  normalizeQuote,
  normalizeSymbol,
} from "../normalizer.ts";
import type { MarketDataProvider, ProviderDataEvent } from "../provider.ts";

const SOURCE = "UPSTOX";
type JsonObject = Record<string, unknown>;
export type UpstoxRequest = (path: string) => Promise<unknown>;
export type UpstoxFeed = {
  connect(
    onMessage: (message: unknown) => void,
    onFailure: (error: unknown) => void,
  ): Promise<void>;
  subscribe(instrumentKeys: string[]): Promise<void>;
  unsubscribe(instrumentKeys: string[]): Promise<void>;
  disconnect(): Promise<void>;
};
export type UpstoxProviderOptions = {
  token: string;
  request?: UpstoxRequest;
  feed?: UpstoxFeed;
  instrumentLoader: () => Promise<unknown>;
  now?: () => Date;
};

function object(value: unknown): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid Upstox response");
  return value as JsonObject;
}
function number(value: unknown, required = false): number | undefined {
  const result =
    typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (Number.isFinite(result)) return result;
  if (required) throw new Error("Upstox response is missing a numeric field");
}
function text(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim())
    throw new Error(`Upstox response is missing ${field}`);
  return value.trim();
}
function responseData(value: unknown): unknown {
  const root = object(value);
  if (root.status !== undefined && root.status !== "success")
    throw new Error("Upstox request failed");
  return root.data ?? root;
}
function dateValue(value: unknown, fallback: Date): Date {
  const date =
    value instanceof Date ? value : new Date(typeof value === "number" ? value : String(value));
  return Number.isNaN(date.getTime()) ? fallback : date;
}
function exchangeFromSegment(segment: string) {
  return segment.startsWith("NSE") ? "NSE" : segment.startsWith("BSE") ? "BSE" : segment;
}
function status(isDelayed = false): MarketDataStatus {
  return isDelayed ? "DELAYED" : "LIVE";
}

/** Server-only default REST transport. It never logs or exposes the bearer token. */
export function createUpstoxRequest(
  token: string,
  baseUrl = "https://api.upstox.com",
): UpstoxRequest {
  if (!token.trim()) throw new Error("UPSTOX_ANALYTICS_TOKEN is required");
  return async (path) => {
    const response = await fetch(new URL(path, baseUrl), {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Upstox request failed (${response.status})`);
    return response.json();
  };
}

export class UpstoxMarketDataProvider implements MarketDataProvider {
  readonly name = SOURCE;
  private connected = false;
  private readonly request: UpstoxRequest;
  private readonly listeners = new Set<(event: ProviderDataEvent) => void>();
  private readonly instrumentKeys = new Map<string, string>();
  private master: InstrumentMaster | null = null;
  private readonly now: () => Date;
  private readonly options: UpstoxProviderOptions;

  constructor(options: UpstoxProviderOptions) {
    this.options = options;
    if (!options.token.trim()) throw new Error("UPSTOX_ANALYTICS_TOKEN is required");
    this.request = options.request ?? createUpstoxRequest(options.token);
    this.now = options.now ?? (() => new Date());
  }
  async connect() {
    await this.ensureMaster();
    if (this.options.feed)
      await this.options.feed.connect(
        (message) => this.handleFeed(message),
        () =>
          this.emit({ type: "status", payload: { state: "UNAVAILABLE" }, receivedAt: this.now() }),
      );
    this.connected = true;
  }
  async disconnect() {
    await this.options.feed?.disconnect();
    this.connected = false;
  }
  private ready() {
    if (!this.connected) throw new Error("Upstox provider is disconnected");
  }
  private key(symbol: string, exchange: string) {
    const key = this.instrumentKeys.get(`${exchange.toUpperCase()}:${normalizeSymbol(symbol)}`);
    if (!key) throw new Error("Upstox instrument is unavailable in the current master");
    return key;
  }
  private async ensureMaster() {
    if (this.master) return this.master;
    const rows = responseData(await this.options.instrumentLoader());
    if (!Array.isArray(rows)) throw new Error("Invalid Upstox instrument master");
    const instruments: InstrumentDescriptor[] = [];
    const contracts: ContractDescriptor[] = [];
    for (const raw of rows) {
      const row = object(raw);
      const instrumentKey = text(row.instrument_key, "instrument_key");
      const tradingSymbol = text(row.trading_symbol, "trading_symbol");
      const segment = text(row.segment ?? row.exchange, "segment").toUpperCase();
      const exchange =
        String(row.exchange ?? "").toUpperCase() === "GLOBAL"
          ? "GLOBAL"
          : exchangeFromSegment(segment);
      const instrumentType = String(row.instrument_type ?? "").toUpperCase();
      const isOption = ["CE", "PE"].includes(instrumentType);
      const isFuture = instrumentType.includes("FUT");
      const underlying = String(row.underlying_symbol ?? row.name ?? tradingSymbol).trim();
      if (isOption || isFuture) {
        contracts.push(
          normalizeContract({
            exchange,
            underlyingSymbol: underlying,
            kind: isOption ? "OPTION" : "FUTURE",
            contractSymbol: tradingSymbol,
            normalizedSymbol: tradingSymbol,
            optionType: isOption ? (instrumentType as OptionType) : undefined,
            expiry: dateValue(row.expiry, new Date(NaN)),
            strike: number(row.strike_price),
            lotSize: number(row.lot_size),
            tickSize: number(row.tick_size),
            metadata: { instrumentKey, segment },
          }),
        );
      } else {
        const kind =
          instrumentType.includes("INDEX") || segment.includes("INDEX") ? "INDEX" : "STOCK";
        const instrument = normalizeInstrument({
          exchange,
          symbol: tradingSymbol,
          normalizedSymbol: tradingSymbol,
          displayName: String(row.name ?? tradingSymbol),
          kind,
          currency: String(row.currency ?? (exchange === "GLOBAL" ? "UNSPECIFIED" : "INR")),
          isin: typeof row.isin === "string" ? row.isin : undefined,
          isFnoEligible: Boolean(row.underlying_key),
          metadata: {
            instrumentKey,
            segment,
            latency: row.latency,
            country: row.country,
            startTime: row.start_time,
            endTime: row.end_time,
            weekDays: row.week_days,
          },
        });
        instruments.push(instrument);
      }
      this.instrumentKeys.set(`${exchange}:${normalizeSymbol(tradingSymbol)}`, instrumentKey);
    }
    this.master = {
      instruments,
      contracts: contracts.filter((item) => !Number.isNaN(item.expiry.getTime())),
      asOf: this.now(),
      source: SOURCE,
      status: "LIVE",
    };
    return this.master;
  }
  private mapQuote(raw: unknown, symbol: string, exchange: string): Quote {
    const row = object(raw);
    const ohlc = row.ohlc && typeof row.ohlc === "object" ? object(row.ohlc) : {};
    const depth = row.depth && typeof row.depth === "object" ? object(row.depth) : {};
    const buy = Array.isArray(depth.buy) ? object(depth.buy[0] ?? {}) : {};
    const sell = Array.isArray(depth.sell) ? object(depth.sell[0] ?? {}) : {};
    const delayed = Boolean(row.is_delayed);
    return normalizeQuote({
      symbol,
      exchange,
      lastPrice: number(row.last_price ?? row.ltp, true)!,
      change: number(row.net_change),
      changePct: number(row.change_percentage),
      open: number(ohlc.open ?? row.open),
      high: number(ohlc.high ?? row.high),
      low: number(ohlc.low ?? row.low),
      close: number(ohlc.close ?? row.close),
      volume: number(row.volume),
      openInterest: number(row.oi),
      openInterestChange: number(row.oi_day_change),
      bid: number(buy.price ?? row.bid_price),
      ask: number(sell.price ?? row.ask_price),
      impliedVolatility: number(row.iv),
      asOf: dateValue(row.last_trade_time ?? row.timestamp, this.now()),
      source: SOURCE,
      isDelayed: delayed,
      status: status(delayed),
    });
  }
  async getQuotes(symbols: string[], exchange: string) {
    this.ready();
    const pairs = symbols.map((symbol) => ({ symbol, key: this.key(symbol, exchange) }));
    const payload = responseData(
      await this.request(
        `/v2/market-quote/quotes?instrument_key=${encodeURIComponent(pairs.map((x) => x.key).join(","))}`,
      ),
    );
    const data = object(payload);
    return pairs.map(({ symbol, key }) => {
      const quote = this.mapQuote(data[key] ?? data[key.replace("|", ":")], symbol, exchange);
      const latency = this.master?.instruments.find(
        (item) => item.exchange === exchange && item.normalizedSymbol === normalizeSymbol(symbol),
      )?.metadata?.latency;
      if (typeof latency === "string" && latency !== "0 Seconds")
        return { ...quote, isDelayed: true, status: "DELAYED" as const };
      return quote;
    });
  }
  async getQuote(symbol: string, exchange: string) {
    return (await this.getQuotes([symbol], exchange))[0];
  }
  async getHistoricalCandles(
    symbol: string,
    exchange: string,
    timeframe: CandleTimeframe,
    from: Date,
    to: Date,
  ): Promise<HistoricalCandle[]> {
    this.ready();
    const interval = timeframe === "1d" ? ["days", "1"] : ["minutes", timeframe.slice(0, -1)];
    const iso = (value: Date) => value.toISOString().slice(0, 10);
    const payload = responseData(
      await this.request(
        `/v3/historical-candle/${encodeURIComponent(this.key(symbol, exchange))}/${interval[0]}/${interval[1]}/${iso(to)}/${iso(from)}`,
      ),
    );
    const candles = object(payload).candles;
    if (!Array.isArray(candles)) throw new Error("Invalid Upstox candle response");
    return candles.map((value) => {
      if (!Array.isArray(value)) throw new Error("Invalid Upstox candle");
      return {
        symbol,
        exchange,
        timeframe,
        startsAt: dateValue(value[0], new Date(NaN)),
        open: number(value[1], true)!,
        high: number(value[2], true)!,
        low: number(value[3], true)!,
        close: number(value[4], true)!,
        volume: number(value[5]),
        openInterest: number(value[6]),
        source: SOURCE,
        status: "LIVE",
      };
    });
  }
  async getOptionChain(symbol: string, exchange: string): Promise<OptionChain> {
    this.ready();
    const master = await this.ensureMaster();
    const contracts = master.contracts.filter(
      (item) =>
        item.kind === "OPTION" &&
        normalizeSymbol(item.underlyingSymbol) === normalizeSymbol(symbol),
    );
    if (!contracts.length) throw new Error("Upstox option chain unavailable");
    const expiry = contracts
      .map((item) => item.expiry)
      .sort((a, b) => a.getTime() - b.getTime())[0];
    const payload = responseData(
      await this.request(
        `/v2/option/chain?instrument_key=${encodeURIComponent(this.key(symbol, exchange))}&expiry_date=${expiry.toISOString().slice(0, 10)}`,
      ),
    );
    const rows = Array.isArray(payload) ? payload : [];
    const evidence = new Map<string, unknown>();
    for (const raw of rows) {
      const row = object(raw);
      for (const side of ["call_options", "put_options"])
        if (row[side] && typeof row[side] === "object") {
          const option = object(row[side]);
          const key = String(option.instrument_key ?? "");
          if (key) evidence.set(key, option);
        }
    }
    return {
      underlyingSymbol: symbol,
      exchange,
      asOf: this.now(),
      contracts: contracts
        .filter((item) => item.expiry.getTime() === expiry.getTime())
        .map((item) => ({
          ...item,
          metadata: { ...item.metadata, chain: evidence.get(String(item.metadata?.instrumentKey)) },
        })),
      source: SOURCE,
      isDelayed: false,
      status: "LIVE",
    };
  }
  async getInstrumentMaster() {
    this.ready();
    return this.ensureMaster();
  }
  async getInstitutionalActivity(): Promise<InstitutionalActivityRecord[]> {
    this.ready();
    // The canonical shape is ready; endpoint mapping is activated only after entitlement validation.
    return [];
  }
  async getMarketStatus(exchange: string): Promise<ProviderMarketStatus> {
    this.ready();
    const payload = responseData(
      await this.request(`/v2/market/status/${encodeURIComponent(exchange)}`),
    );
    const row = object(payload);
    const raw = String(row.status ?? row.market_status ?? "CLOSED").toUpperCase();
    const state = ["PRE_MARKET", "OPEN", "CLOSED", "WEEKEND", "HOLIDAY"].includes(raw)
      ? (raw as ProviderMarketStatus["state"])
      : "CLOSED";
    return {
      exchange,
      state,
      asOf: this.now(),
      source: SOURCE,
      status: state === "OPEN" ? "LIVE" : "MARKET_CLOSED",
    };
  }
  async subscribe(symbols: string[], exchange: string) {
    this.ready();
    if (!this.options.feed) throw new Error("Upstox WebSocket feed is not configured");
    await this.options.feed.subscribe(symbols.map((symbol) => this.key(symbol, exchange)));
  }
  async unsubscribe(symbols: string[], exchange: string) {
    this.ready();
    if (this.options.feed)
      await this.options.feed.unsubscribe(symbols.map((symbol) => this.key(symbol, exchange)));
  }
  onData(listener: (event: ProviderDataEvent) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  private emit(event: ProviderDataEvent) {
    for (const listener of this.listeners) listener(event);
  }
  private handleFeed(payload: unknown) {
    // Protobuf decoding and authorization stay in the feed transport; only decoded provider payloads enter here.
    const message = object(payload);
    const symbol = text(message.symbol, "symbol");
    const exchange = text(message.exchange, "exchange");
    const quote = this.mapQuote(message, symbol, exchange);
    const descriptor = this.master?.instruments.find(
      (item) => item.exchange === exchange && item.normalizedSymbol === normalizeSymbol(symbol),
    );
    const contract = this.master?.contracts.find(
      (item) => item.exchange === exchange && item.normalizedSymbol === normalizeSymbol(symbol),
    );
    this.emit({
      type: "quote",
      payload: {
        symbol: quote.symbol,
        exchange: quote.exchange,
        instrumentIdentifier: this.instrumentKeys.get(`${exchange}:${normalizeSymbol(symbol)}`),
        instrumentType: contract?.kind ?? descriptor?.kind ?? "STOCK",
        timestamp: quote.asOf,
        price: quote.lastPrice,
        open: quote.open,
        high: quote.high,
        low: quote.low,
        close: quote.close,
        volume: quote.volume,
        openInterest: quote.openInterest,
        openInterestChange: quote.openInterestChange,
        strike: contract?.strike,
        optionType: contract?.optionType,
        expiry: contract?.expiry,
        lotSize: contract?.lotSize,
        bid: quote.bid,
        ask: quote.ask,
        impliedVolatility: quote.impliedVolatility,
        source: SOURCE,
        status: quote.status,
        isDelayed: quote.isDelayed,
      },
      receivedAt: this.now(),
    });
  }
}
