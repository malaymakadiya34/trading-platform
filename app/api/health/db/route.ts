import { NextResponse } from "next/server";

import { getPrismaClient } from "@/src/server/db/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const prisma = await getPrismaClient();
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      service: "postgresql",
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        service: "postgresql",
        status: "unavailable",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
