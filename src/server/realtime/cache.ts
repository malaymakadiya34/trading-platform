import { createClient, type RedisClientType } from "redis";
import type { NormalizedTick, TickCache } from "@/src/server/market-data/ingestion";
export class MemoryRealtimeCache implements TickCache {
  private values = new Map<string, { value: NormalizedTick; expiresAt: number }>();
  async setLatest(key: string, value: NormalizedTick, ttlSeconds: number) {
    this.values.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }
  getLatest(key: string) {
    const item = this.values.get(key);
    if (!item || item.expiresAt < Date.now()) {
      this.values.delete(key);
      return null;
    }
    return item.value;
  }
}
export class ResilientRealtimeCache implements TickCache {
  private client: RedisClientType | null = null;
  readonly fallback = new MemoryRealtimeCache();
  state: "DISABLED" | "CONNECTING" | "READY" | "UNAVAILABLE" = "DISABLED";
  constructor(private readonly redisUrl = process.env.REDIS_URL) {
    if (redisUrl) this.state = "CONNECTING";
  }
  private async redis() {
    if (!this.redisUrl) return null;
    if (this.client?.isReady) return this.client;
    try {
      this.client = createClient({
        url: this.redisUrl,
        socket: {
          connectTimeout: 2000,
          reconnectStrategy: (retries) => (retries > 3 ? false : Math.min(retries * 200, 1000)),
        },
      });
      this.client.on("error", () => {
        this.state = "UNAVAILABLE";
      });
      await this.client.connect();
      this.state = "READY";
      return this.client;
    } catch {
      this.state = "UNAVAILABLE";
      return null;
    }
  }
  async setLatest(key: string, value: NormalizedTick, ttlSeconds: number) {
    await this.fallback.setLatest(key, value, ttlSeconds);
    const client = await this.redis();
    if (client)
      try {
        await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
      } catch {
        this.state = "UNAVAILABLE";
      }
  }
  async disconnect() {
    if (this.client?.isOpen) await this.client.quit();
  }
}
