import type { InstrumentMaster } from "@/src/domain/market-data/types";
import { normalizeContract, normalizeInstrument } from "@/src/server/market-data/normalizer";
import { getPrismaClient } from "@/src/server/db/prisma";
type Client = {
  exchange: { upsert(args: unknown): Promise<{ id: string }> };
  instrument: {
    upsert(args: unknown): Promise<{ id: string; normalizedSymbol: string }>;
    updateMany(args: unknown): Promise<unknown>;
  };
  contract: {
    upsert(args: unknown): Promise<unknown>;
    updateMany(args: unknown): Promise<unknown>;
  };
};
export async function synchronizeInstrumentMaster(master: InstrumentMaster) {
  if (!master.source.trim() || Number.isNaN(master.asOf.getTime()))
    throw new Error("Invalid instrument master metadata");
  const prisma = await getPrismaClient();
  const client = prisma as unknown as Client;
  const exchanges = new Map<string, string>();
  for (const code of new Set([
    ...master.instruments.map((item) => item.exchange),
    ...master.contracts.map((item) => item.exchange),
  ])) {
    const normalized = code.trim().toUpperCase();
    const exchange = await client.exchange.upsert({
      where: { code: normalized },
      update: {},
      create: {
        code: normalized,
        name: normalized,
        timezone: normalized === "GLOBAL" ? "UTC" : "Asia/Kolkata",
        marketOpen: normalized === "GLOBAL" ? "00:00" : "09:15",
        marketClose: normalized === "GLOBAL" ? "23:59" : "15:30",
      },
      select: { id: true },
    });
    exchanges.set(normalized, exchange.id);
  }
  const instruments = new Map<string, string>();
  for (const raw of master.instruments) {
    const item = normalizeInstrument(raw);
    const exchangeId = exchanges.get(item.exchange);
    if (!exchangeId) continue;
    const record = await client.instrument.upsert({
      where: {
        exchangeId_normalizedSymbol: { exchangeId, normalizedSymbol: item.normalizedSymbol },
      },
      update: {
        symbol: item.symbol,
        displayName: item.displayName,
        kind: item.kind,
        currency: item.currency,
        isin: item.isin,
        isFnoEligible: item.isFnoEligible,
        metadata: item.metadata,
        active: true,
      },
      create: {
        exchangeId,
        kind: item.kind,
        symbol: item.symbol,
        normalizedSymbol: item.normalizedSymbol,
        displayName: item.displayName,
        currency: item.currency,
        isin: item.isin,
        isFnoEligible: item.isFnoEligible,
        metadata: item.metadata,
        active: true,
      },
      select: { id: true, normalizedSymbol: true },
    });
    instruments.set(`${item.exchange}:${item.normalizedSymbol}`, record.id);
  }
  const activeContracts: string[] = [];
  for (const raw of master.contracts) {
    const item = normalizeContract(raw);
    const exchangeId = exchanges.get(item.exchange);
    const underlyingId =
      instruments.get(
        `${item.exchange}:${item.underlyingSymbol.replace(/\s+/g, "").toUpperCase()}`,
      ) ??
      [...instruments.entries()].find(([key]) =>
        key.endsWith(`:${item.underlyingSymbol.replace(/\s+/g, "").toUpperCase()}`),
      )?.[1];
    if (!exchangeId || !underlyingId) continue;
    activeContracts.push(item.normalizedSymbol);
    await client.contract.upsert({
      where: {
        exchangeId_normalizedSymbol: { exchangeId, normalizedSymbol: item.normalizedSymbol },
      },
      update: {
        underlyingId,
        kind: item.kind,
        optionType: item.optionType,
        contractSymbol: item.contractSymbol,
        expiry: item.expiry,
        strike: item.strike,
        lotSize: item.lotSize,
        tickSize: item.tickSize,
        metadata: item.metadata,
        active: true,
      },
      create: {
        exchangeId,
        underlyingId,
        kind: item.kind,
        optionType: item.optionType,
        contractSymbol: item.contractSymbol,
        normalizedSymbol: item.normalizedSymbol,
        expiry: item.expiry,
        strike: item.strike,
        lotSize: item.lotSize,
        tickSize: item.tickSize,
        metadata: item.metadata,
        active: true,
      },
    });
  }
  if (activeContracts.length)
    await client.contract.updateMany({
      where: { normalizedSymbol: { notIn: activeContracts }, expiry: { lt: master.asOf } },
      data: { active: false },
    });
  return {
    instruments: instruments.size,
    contracts: activeContracts.length,
    source: master.source,
    asOf: master.asOf,
  };
}
