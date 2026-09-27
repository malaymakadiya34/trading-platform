import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { SESSION_COOKIE } from "@/src/server/auth/constants";
import { clearSessionCookie, deleteSession } from "@/src/server/auth/session";

export const runtime = "nodejs";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await deleteSession(token);
  }
  await clearSessionCookie();

  return NextResponse.json({ ok: true });
}
