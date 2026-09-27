import type { MarketDataProvider } from "@/src/server/market-data/provider";
import { ProviderLifecycle } from "@/src/server/market-data/provider-lifecycle";
import type { MarketDataIngestionService } from "@/src/server/market-data/ingestion";
import { buildFifteenMinuteCandles } from "@/src/domain/scanners/intraday-scanners.mjs";
export type WorkerJob =
  | "market-data-ingestion"
  | "candle-aggregation"
  | "scanner-refresh"
  | "historical-persistence"
  | "institutional-ingestion"
  | "retention-cleanup";
export type WorkerTasks = {
  refreshScanners(): Promise<void>;
  persistHistory(): Promise<void>;
  ingestInstitutionalActivity(): Promise<void>;
  cleanupRetention(): Promise<void>;
  persistCandles(candles: ReturnType<typeof buildFifteenMinuteCandles>): Promise<void>;
};
export class MarketDataWorker {
  readonly lifecycle: ProviderLifecycle;
  private stopData: (() => void) | null = null;
  private timers = new Set<ReturnType<typeof setInterval>>();
  constructor(
    private readonly provider: MarketDataProvider,
    private readonly ingestion: MarketDataIngestionService,
    private readonly tasks: WorkerTasks,
  ) {
    this.lifecycle = new ProviderLifecycle(provider);
  }
  async start() {
    await this.lifecycle.connect();
    this.stopData = this.provider.onData((event) => {
      if (event.type === "quote")
        void this.ingestion.ingest(event.payload).catch((error) => this.lifecycle.fail(error));
      if (event.type === "candle" && Array.isArray(event.payload))
        void this.tasks
          .persistCandles(buildFifteenMinuteCandles(event.payload))
          .catch((error) => this.lifecycle.fail(error));
    });
    this.schedule(() => this.tasks.refreshScanners(), 15_000);
    this.schedule(() => this.tasks.persistHistory(), 60_000);
    this.schedule(() => this.tasks.ingestInstitutionalActivity(), 60 * 60_000);
    this.schedule(() => this.tasks.cleanupRetention(), 24 * 60 * 60_000);
  }
  private schedule(task: () => Promise<void>, interval: number) {
    const timer = setInterval(
      () => void task().catch((error) => this.lifecycle.fail(error)),
      interval,
    );
    timer.unref();
    this.timers.add(timer);
  }
  async stop() {
    this.stopData?.();
    for (const timer of this.timers) clearInterval(timer);
    this.timers.clear();
    await this.lifecycle.disconnect();
  }
}
