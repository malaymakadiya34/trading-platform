import { getPrismaClient } from "@/src/server/db/prisma";

export type InstrumentListFilter = {
  exchange?: string;
  kind?: "STOCK" | "INDEX" | "SECTOR";
  limit?: number;
};

export async function listInstruments(filter: InstrumentListFilter = {}) {
  const prisma = await getPrismaClient();

  return prisma.instrument.findMany({
    where: {
      active: true,
      ...(filter.exchange ? { exchange: { code: filter.exchange } } : {}),
      ...(filter.kind ? { kind: filter.kind } : {}),
    },
    select: {
      id: true,
      symbol: true,
      normalizedSymbol: true,
      displayName: true,
      kind: true,
      currency: true,
      isFnoEligible: true,
      exchange: { select: { code: true, name: true, timezone: true } },
    },
    take: Math.min(Math.max(filter.limit ?? 100, 1), 500),
  });
}
