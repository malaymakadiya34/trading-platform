import { NextResponse } from "next/server";
import { authorizeApiRequest } from "@/src/server/auth/api-guard";
import type { InstitutionalPreset } from "@/src/domain/institutional-activity/ranges.mjs";
import { getInstitutionalActivity } from "@/src/server/institutional-activity/repository";
export const runtime = "nodejs";
const presets = ["10D", "1M", "3M", "6M", "CUSTOM"];
export async function GET(request: Request) {
  const authorization = await authorizeApiRequest();
  if (!authorization.ok)
    return NextResponse.json({ error: authorization.error }, { status: authorization.status });
  const params = new URL(request.url).searchParams;
  const value = params.get("range") ?? "10D";
  if (!presets.includes(value))
    return NextResponse.json({ error: "Invalid range" }, { status: 400 });
  const preset = value as InstitutionalPreset;
  const from = params.get("from") ?? undefined,
    to = params.get("to") ?? undefined;
  if (preset === "CUSTOM" && (!from || !to || from > to))
    return NextResponse.json({ error: "Invalid custom range" }, { status: 400 });
  try {
    return NextResponse.json(await getInstitutionalActivity({ preset, from, to }));
  } catch {
    return NextResponse.json(
      { error: "Institutional activity unavailable", code: "DATA_STORE_UNAVAILABLE" },
      { status: 503 },
    );
  }
}
