import { createHash, randomBytes } from "node:crypto";

import { getPrismaClient } from "@/src/server/db/prisma";

const RESET_TOKEN_TTL_MS = 1000 * 60 * 30;

/**
 * Creates a single-use reset token for a future email-delivery adapter.
 * The raw token must only be passed to a trusted delivery provider and is
 * never persisted or returned from an HTTP handler in this phase.
 */
export async function issuePasswordResetToken(email: string) {
  const prisma = await getPrismaClient();
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });

  if (!user) return null;

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
  await prisma.passwordResetToken.create({
    data: { tokenHash, userId: user.id, expiresAt },
  });

  return { rawToken, expiresAt };
}

// Email delivery and token-consuming reset endpoints are intentionally deferred
// until an external email provider and delivery policy are approved.
