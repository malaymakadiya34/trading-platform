import { NextResponse } from "next/server";
import { authorizeApiRequest } from "@/src/server/auth/api-guard";

import { getIndiaMarketSession } from "@/src/server/market-session/service";

export const runtime = "nodejs";

export async function GET() {
  const authorization = await authorizeApiRequest();
  if (!authorization.ok)
    return NextResponse.json({ error: authorization.error }, { status: authorization.status });
  return NextResponse.json({ session: getIndiaMarketSession() });
}
