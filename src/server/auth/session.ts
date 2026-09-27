import { randomBytes } from "node:crypto";
// Token hashing is centralized in session-token.ts using createHash("sha256").
import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/src/server/auth/constants";
import { authenticateSessionToken, hashToken } from "@/src/server/auth/session-token";
import { getPrismaClient } from "@/src/server/db/prisma";
export { authenticateSessionToken, hashToken } from "@/src/server/auth/session-token";
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  const prisma = await getPrismaClient();
  await prisma.session.create({ data: { tokenHash: hashToken(token), userId, expiresAt } });
  return { token, expiresAt };
}
export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
export async function deleteSession(token: string) {
  const prisma = await getPrismaClient();
  await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
}
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return token ? authenticateSessionToken(token) : null;
}
