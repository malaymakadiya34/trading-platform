import { createHash } from "node:crypto";
import { getPrismaClient } from "@/src/server/db/prisma";
export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
export async function authenticateSessionToken(token: string) {
  const prisma = await getPrismaClient();
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      expiresAt: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          settings: { select: { timezone: true, theme: true } },
        },
      },
    },
  });
  if (!session || session.expiresAt <= new Date()) {
    if (session) await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
    return null;
  }
  return session.user;
}
