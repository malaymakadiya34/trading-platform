import type { NormalizedTick, TickPersistence } from "@/src/server/market-data/ingestion";
import { getPrismaClient } from "@/src/server/db/prisma";
type Client = {
  instrument: { findFirst(args: unknown): Promise<{ id: string } | null> };
  contract: { findFirst(args: unknown): Promise<{ id: string } | null> };
  marketQuote: { create(args: unknown): Promise<unknown> };
};
export class PostgresTickPersistence implements TickPersistence {
  async persistSnapshot(tick: NormalizedTick) {
    const prisma = await getPrismaClient();
    const client = prisma as unknown as Client;
    const isContract = tick.instrumentType === "OPTION" || tick.instrumentType === "FUTURE";
    const target = isContract
      ? await client.contract.findFirst({
          where: {
            normalizedSymbol: tick.normalizedSymbol,
            exchange: { code: tick.exchange },
            active: true,
          },
          select: { id: true },
        })
      : await client.instrument.findFirst({
          where: {
            normalizedSymbol: tick.normalizedSymbol,
            exchange: { code: tick.exchange },
            active: true,
          },
          select: { id: true },
        });
    if (!target) throw new Error("Normalized tick references an unknown active instrument");
    await client.marketQuote.create({
      data: {
        instrumentId: isContract ? null : target.id,
        contractId: isContract ? target.id : null,
        lastPrice: tick.price,
        change: tick.previousClose === undefined ? null : tick.price - tick.previousClose,
        changePct:
          tick.previousClose === undefined
            ? null
            : ((tick.price - tick.previousClose) / tick.previousClose) * 100,
        previousClose: tick.previousClose,
        dayOpen: tick.open,
        dayHigh: tick.high,
        dayLow: tick.low,
        volume: tick.volume,
        openInterest: tick.openInterest,
        openInterestChange: tick.openInterestChange,
        bid: tick.bid,
        ask: tick.ask,
        impliedVolatility: tick.impliedVolatility,
        asOf: tick.timestamp,
        source: tick.source,
        isDelayed: tick.isDelayed,
      },
    });
  }
}
