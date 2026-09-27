import { NextResponse } from "next/server";

import { checkPublicApiRateLimit } from "@/src/server/auth/api-guard";

import { createSession, setSessionCookie } from "@/src/server/auth/session";
import { hashPassword } from "@/src/server/auth/password";
import { registerSchema } from "@/src/server/auth/validation";
import { getPrismaClient } from "@/src/server/db/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await checkPublicApiRateLimit("auth-register")))
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const body = await request.json().catch(() => null);
  const result = registerSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: "Invalid registration details" }, { status: 400 });
  }

  const { email, name, password } = result.data;
  const prisma = await getPrismaClient();
  const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });

  if (existingUser) {
    return NextResponse.json(
      { error: "Unable to create account with these details" },
      { status: 409 },
    );
  }

  const user = await prisma.user.create({
    data: {
      email,
      name: name || null,
      passwordHash: await hashPassword(password),
      settings: { create: {} },
    },
    select: { id: true },
  });

  const session = await createSession(user.id);
  await setSessionCookie(session.token, session.expiresAt);

  return NextResponse.json({ ok: true }, { status: 201 });
}
