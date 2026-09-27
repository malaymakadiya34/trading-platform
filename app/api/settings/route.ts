import { NextResponse } from "next/server";

import { getCurrentUser } from "@/src/server/auth/session";
import { settingsSchema } from "@/src/server/auth/validation";
import { getPrismaClient } from "@/src/server/db/prisma";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const result = settingsSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Invalid settings" }, { status: 400 });

  const prisma = await getPrismaClient();
  const settings = await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: result.data,
    create: { userId: user.id, ...result.data },
    select: { timezone: true, theme: true },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { name: result.data.name || null },
  });

  return NextResponse.json({ settings });
}
