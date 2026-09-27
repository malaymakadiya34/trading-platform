import { z } from "zod";
import { normalizeSymbol } from "./normalizer.ts";
import {
  createRealtimeEvent,
  realtimeFreshness,
  type RealtimeChannel,
  type RealtimeEvent,
} from "../../domain/realtime/protocol.mjs";

const finite = z.number().finite();
export const providerQuoteSchema = z
  .object({
    symbol: z.string().trim().min(1),
    exchange: z.string().trim().min(1),
    instrumentIdentifier: z.string().trim().min(1).optional(),
    instrumentType: z.enum(["INDEX", "SECTOR", "STOCK", "FUTURE", "OPTION"]),
    timestamp: z.coerce.date(),
    price: finite.positive(),
    open: finite.optional(),
    high: finite.optional(),
    low: finite.optional(),
    close: finite.optional(),
    previousClose: finite.positive().optional(),
    volume: finite.nonnegative().optional(),
    openInterest: finite.nonnegative().optional(),
    openInterestChange: finite.optional(),
    strike: finite.positive().optional(),
    optionType: z.enum(["CE", "PE"]).optional(),
    expiry: z.coerce.date().optional(),
    lotSize: z.number().int().positive().optional(),
    bid: finite.nonnegative().optional(),
    ask: finite.nonnegative().optional(),
    impliedVolatility: finite.nonnegative().optional(),
    source: z.string().trim().min(1),
    marketStatus: z.enum(["PRE_MARKET", "OPEN", "CLOSED", "WEEKEND", "HOLIDAY"]).optional(),
    isDelayed: z.boolean().default(false),
  })
  .superRefine((value, ctx) => {
    if (
      value.instrumentType === "OPTION" &&
      (!value.optionType || !value.expiry || value.strike === undefined)
    )
      ctx.addIssue({ code: "custom", message: "Options require type, expiry and strike" });
    if (value.bid !== undefined && value.ask !== undefined && value.ask < value.bid)
      ctx.addIssue({ code: "custom", message: "Ask cannot be below bid" });
  });
export type NormalizedTick = z.infer<typeof providerQuoteSchema> & {
  normalizedSymbol: string;
  receivedAt: Date;
};
export function normalizeProviderTick(input: unknown, receivedAt = new Date()): NormalizedTick {
  const value = providerQuoteSchema.parse(input);
  return {
    ...value,
    symbol: value.symbol.trim(),
    normalizedSymbol: normalizeSymbol(value.symbol),
    exchange: value.exchange.trim().toUpperCase(),
    receivedAt,
  };
}
const channelFor = (type: NormalizedTick["instrumentType"]): RealtimeChannel =>
  type === "INDEX"
    ? "index"
    : type === "SECTOR"
      ? "sector"
      : type === "OPTION"
        ? "option"
        : "stock";
export type TickCache = {
  setLatest(key: string, value: NormalizedTick, ttlSeconds: number): Promise<void>;
};
export type TickPersistence = { persistSnapshot(value: NormalizedTick): Promise<void> };
export type RealtimePublisher = { publish(event: RealtimeEvent): Promise<void> | void };
export class MarketDataIngestionService {
  private readonly cache: TickCache;
  private readonly persistence: TickPersistence;
  private readonly publisher: RealtimePublisher;
  private readonly options: { cacheTtlSeconds: number; persistEveryMs: number };
  private persistedAt = new Map<string, number>();
  constructor(
    cache: TickCache,
    persistence: TickPersistence,
    publisher: RealtimePublisher,
    options = { cacheTtlSeconds: 120, persistEveryMs: 60000 },
  ) {
    this.cache = cache;
    this.persistence = persistence;
    this.publisher = publisher;
    this.options = options;
  }
  async ingest(input: unknown, marketState = "OPEN", receivedAt = new Date()) {
    const tick = normalizeProviderTick(input, receivedAt);
    const key = `quote:${tick.exchange}:${tick.normalizedSymbol}`;
    await this.cache.setLatest(key, tick, this.options.cacheTtlSeconds);
    const last = this.persistedAt.get(key) ?? 0;
    if (receivedAt.getTime() - last >= this.options.persistEveryMs) {
      await this.persistence.persistSnapshot(tick);
      this.persistedAt.set(key, receivedAt.getTime());
    }
    const freshness = realtimeFreshness(tick.timestamp, {
      now: receivedAt,
      isDelayed: tick.isDelayed,
      marketState,
    });
    const event = createRealtimeEvent(channelFor(tick.instrumentType), "quote.updated", tick, {
      timestamp: receivedAt,
      source: tick.source,
      freshness,
    });
    await this.publisher.publish(event);
    return event;
  }
}
