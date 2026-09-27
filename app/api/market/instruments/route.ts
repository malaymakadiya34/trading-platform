import { NextResponse } from "next/server";
import { authorizeApiRequest } from "@/src/server/auth/api-guard";
import { z } from "zod";

import { listInstruments } from "@/src/server/market-data/repositories/instrument-repository";

export const runtime = "nodejs";

const querySchema = z.object({
  exchange: z.string().trim().toUpperCase().optional(),
  kind: z.enum(["STOCK", "INDEX", "SECTOR"]).optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
});

export async function GET(request: Request) {
  const authorization = await authorizeApiRequest();
  if (!authorization.ok)
    return NextResponse.json({ error: authorization.error }, { status: authorization.status });
  const url = new URL(request.url);
  const query = querySchema.safeParse({
    exchange: url.searchParams.get("exchange") || undefined,
    kind: url.searchParams.get("kind") || undefined,
    limit: url.searchParams.get("limit") || undefined,
  });

  if (!query.success) {
    return NextResponse.json({ error: "Invalid instrument query" }, { status: 400 });
  }

  try {
    const instruments = await listInstruments(query.data);
    return NextResponse.json({ instruments, count: instruments.length });
  } catch {
    return NextResponse.json(
      { error: "Instrument service is unavailable", code: "DATA_STORE_UNAVAILABLE" },
      { status: 503 },
    );
  }
}
