import { NextResponse } from "next/server";

import { verifyPassword } from "@/src/server/auth/password";
import { createSession, setSessionCookie } from "@/src/server/auth/session";
import { loginSchema } from "@/src/server/auth/validation";
import { getPrismaClient } from "@/src/server/db/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const result = loginSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });
  }

  const prisma = await getPrismaClient();
  const user = await prisma.user.findUnique({ where: { email: result.data.email } });
  const valid = user ? await verifyPassword(result.data.password, user.passwordHash) : false;

  if (!user || !valid) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const session = await createSession(user.id);
  await setSessionCookie(session.token, session.expiresAt);

  return NextResponse.json({ ok: true });
}
