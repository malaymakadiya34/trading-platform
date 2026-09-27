type UserRecord = {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string;
  role: "USER" | "ADMIN";
  createdAt: Date;
  settings?: { timezone: string; theme: string } | null;
};

type PrismaClientLike = {
  exchange: {
    findUnique(args: { where: { code: string }; select?: unknown }): Promise<unknown>;
  };
  instrument: {
    findMany(args: { where?: unknown; select?: unknown; take?: number }): Promise<unknown[]>;
  };
  marketHoliday: {
    findMany(args: { where: unknown; select: unknown }): Promise<Array<{ tradingDate: Date }>>;
  };
  user: {
    findUnique(args: {
      where: { email: string } | { id: string };
      select?: unknown;
    }): Promise<UserRecord | null>;
    create(args: { data: unknown; select?: unknown }): Promise<{ id: string }>;
    update(args: { where: { id: string }; data: unknown }): Promise<unknown>;
  };
  session: {
    create(args: { data: unknown }): Promise<unknown>;
    findUnique(args: {
      where: { tokenHash: string };
      select: unknown;
    }): Promise<{ expiresAt: Date; user: UserRecord } | null>;
    deleteMany(args: { where: { tokenHash: string } }): Promise<unknown>;
  };
  userSettings: {
    upsert(args: {
      where: { userId: string };
      update: unknown;
      create: unknown;
      select: unknown;
    }): Promise<unknown>;
  };
  passwordResetToken: {
    deleteMany(args: { where: { userId: string } }): Promise<unknown>;
    create(args: { data: unknown }): Promise<unknown>;
  };
  $queryRaw: (query: TemplateStringsArray, ...values: unknown[]) => Promise<unknown>;
};

type PrismaGlobal = typeof globalThis & { prisma?: PrismaClientLike };
const globalForPrisma = globalThis as PrismaGlobal;

export async function getPrismaClient(): Promise<PrismaClientLike> {
  if (!globalForPrisma.prisma) {
    const { PrismaClient } = await import("@prisma/client");
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    }) as unknown as PrismaClientLike;
  }
  return globalForPrisma.prisma;
}
