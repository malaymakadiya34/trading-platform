import type { PrismaClient } from "@prisma/client";

type PrismaGlobal = typeof globalThis & { prisma?: PrismaClient };
const globalForPrisma = globalThis as PrismaGlobal;

export async function getPrismaClient(): Promise<PrismaClient> {
  if (!globalForPrisma.prisma) {
    const { PrismaClient: Client } = await import("@prisma/client");
    globalForPrisma.prisma = new Client({
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  }
  return globalForPrisma.prisma;
}
