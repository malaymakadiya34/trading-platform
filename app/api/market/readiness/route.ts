import { NextResponse } from "next/server";
import { authorizeApiRequest } from "@/src/server/auth/api-guard";

import {
  getMarketDataProvider,
  ProviderNotConfiguredError,
} from "@/src/server/market-data/provider";
import { getPrismaClient } from "@/src/server/db/prisma";

export const runtime = "nodejs";

export async function GET() {
  const authorization = await authorizeApiRequest();
  if (!authorization.ok)
    return NextResponse.json({ error: authorization.error }, { status: authorization.status });
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

  const ready = database === "ready" && provider === "configured";
  return NextResponse.json(
    {
      status: ready ? "ready" : "degraded",
      database,
      provider,
      redis: process.env.REDIS_URL ? "configured" : "optional_not_configured",
      liveData: provider === "configured",
      timestamp: new Date().toISOString(),
    },
    { status: ready ? 200 : 503 },
  );
}
