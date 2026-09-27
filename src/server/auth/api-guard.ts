import { cookies, headers } from "next/headers";
import { SESSION_COOKIE } from "@/src/server/auth/constants";
import { authenticateSessionToken } from "@/src/server/auth/session-token";
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000;
const LIMIT = 120;
function consume(key: string, limit = LIMIT, now = Date.now()) {
  if (buckets.size > 10_000)
    for (const [id, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(id);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}
export async function checkPublicApiRateLimit(scope: string, limit = 10) {
  const headerStore = await headers();
  const address = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return consume(`${scope}:${address}`, limit);
}

export async function authorizeApiRequest() {
  const headerStore = await headers();
  const address = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!consume(address)) return { ok: false as const, status: 429, error: "Rate limit exceeded" };
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return { ok: false as const, status: 401, error: "Authentication required" };
  try {
    const user = await authenticateSessionToken(token);
    return user
      ? { ok: true as const, user }
      : { ok: false as const, status: 401, error: "Invalid or expired session" };
  } catch {
    return { ok: false as const, status: 503, error: "Authentication service unavailable" };
  }
}
