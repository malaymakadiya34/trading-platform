import { NextResponse } from "next/server";
import { authorizeApiRequest } from "@/src/server/auth/api-guard";
import { REALTIME_CHANNELS, REALTIME_VERSION } from "@/src/domain/realtime/protocol.mjs";
import { readProviderConfiguration } from "@/src/server/market-data/config";
export const runtime = "nodejs";
export async function GET() {
  const authorization = await authorizeApiRequest();
  if (!authorization.ok)
    return NextResponse.json({ error: authorization.error }, { status: authorization.status });
  const provider = readProviderConfiguration();
  return NextResponse.json({
    websocketPath: "/api/realtime",
    version: REALTIME_VERSION,
    channels: REALTIME_CHANNELS,
    provider: provider
      ? { state: "CONFIGURATION_READY", name: provider.providerName }
      : { state: "NOT_CONFIGURED", name: null },
    redis: process.env.REDIS_URL ? "CONFIGURED" : "OPTIONAL_NOT_CONFIGURED",
    mockDataIsLive: false,
    timestamp: new Date().toISOString(),
  });
}
