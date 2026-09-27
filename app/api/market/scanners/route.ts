import { NextResponse } from "next/server";
import { getBtstScanner } from "@/src/server/scanners/btst-scanner-repository";
import {
  getBreakoutScanner,
  getIntradayBoosters,
  getScannerOptions,
} from "@/src/server/scanners/intraday-scanner-repository";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const scanner = params.get("scanner");
  try {
    if (scanner === "btst") return NextResponse.json(await getBtstScanner());
    if (scanner === "boosters") {
      const threshold = Number(params.get("threshold") ?? 3);
      if (![3, 4, 5].includes(threshold))
        return NextResponse.json({ error: "Invalid threshold" }, { status: 400 });
      const direction = params.get("direction") === "DOWN" ? "DOWN" : "UP";
      return NextResponse.json(await getIntradayBoosters({ threshold, direction }));
    }
    if (scanner === "breakout") {
      const near = Number(params.get("near") ?? 0.25);
      if (![0.1, 0.25, 0.5, 1].includes(near))
        return NextResponse.json({ error: "Invalid near threshold" }, { status: 400 });
      return NextResponse.json(await getBreakoutScanner(near));
    }
    if (scanner === "options") {
      const symbol = params.get("symbol");
      if (!symbol) return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
      const direction = params.get("direction") === "DOWN" ? "DOWN" : "UP";
      const data = await getScannerOptions(symbol, direction);
      return data
        ? NextResponse.json(data)
        : NextResponse.json({ error: "Instrument not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Unknown scanner" }, { status: 400 });
  } catch {
    return NextResponse.json(
      { error: "Scanner data is unavailable", code: "DATA_STORE_UNAVAILABLE" },
      { status: 503 },
    );
  }
}
