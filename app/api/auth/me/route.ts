import { NextResponse } from "next/server";

import { getCurrentUser } from "@/src/server/auth/session";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  return NextResponse.json({ user });
}
