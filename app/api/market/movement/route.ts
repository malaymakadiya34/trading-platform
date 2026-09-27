import { NextResponse } from "next/server";
import {
  getMarketMovementOverview,
  getSectorStocks,
  getStockDetails,
} from "@/src/server/market-data/repositories/market-movement-repository";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sector = searchParams.get("sector")?.trim();
  const stock = searchParams.get("stock")?.trim();
  if (sector && stock)
    return NextResponse.json({ error: "Choose either sector or stock" }, { status: 400 });
  try {
    const data = stock
      ? await getStockDetails(stock)
      : sector
        ? await getSectorStocks(sector)
        : await getMarketMovementOverview();
    if (!data) return NextResponse.json({ error: "Market instrument not found" }, { status: 404 });
    return NextResponse.json({ data, liveData: false, generatedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json(
      { error: "Market movement data is unavailable", code: "DATA_STORE_UNAVAILABLE" },
      { status: 503 },
    );
  }
}
