import { NextResponse } from "next/server";

import {
  getMarketDataProvider,
  ProviderNotConfiguredError,
} from "@/src/server/market-data/provider";
import { getPrismaClient } from "@/src/server/db/prisma";

export const runtime = "nodejs";

export async function GET() {
  let database: "ready" | "unavailable" = "ready";
  let provider: "configured" | "not_configured" = "configured";

  try {
    const prisma = await getPrismaClient();
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = "unavailable";
  }

  try {
    getMarketDataProvider();
  } catch (error) {
    if (error instanceof ProviderNotConfiguredError) provider = "not_configured";
    else provider = "not_configured";
  }

  const ready = database === "ready";
  return NextResponse.json(
    {
      status: ready ? "ready" : "degraded",
      database,
      provider,
      liveData: false,
      timestamp: new Date().toISOString(),
    },
    { status: ready ? 200 : 503 },
  );
}
