import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("authentication schema contains secure user/session boundaries", async () => {
  const schema = await read("prisma/schema.prisma");
  assert.match(schema, /passwordHash\s+String/);
  assert.match(schema, /tokenHash\s+String/);
  assert.match(schema, /enum UserRole/);
  assert.match(schema, /onDelete: Cascade/);
});

test("protected routes require the session cookie before reaching the page", async () => {
  const middleware = await read("proxy.ts");
  const constants = await read("src/server/auth/constants.ts");
  assert.match(constants, /trading_platform_session/);
  assert.match(middleware, /NextResponse\.redirect/);
  assert.match(middleware, /\/dashboard\/:path\*/);
});

test("session cookies are HTTP-only and same-site", async () => {
  const session = await read("src/server/auth/session.ts");
  assert.match(session, /httpOnly: true/);
  assert.match(session, /sameSite: "lax"/);
  assert.match(session, /randomBytes\(32\)/);
  assert.match(session, /createHash\("sha256"\)/);
});

test("market-data contracts keep provider data behind an adapter", async () => {
  const provider = await read("src/server/market-data/provider.ts");
  const schema = await read("prisma/schema.prisma");
  assert.match(provider, /getQuote/);
  assert.match(provider, /getHistoricalCandles/);
  assert.match(provider, /getOptionChain/);
  assert.match(provider, /getInstrumentMaster/);
  assert.match(provider, /ProviderNotConfiguredError/);
  assert.match(schema, /model Contract/);
  assert.match(schema, /strike\s+Decimal\?/);
});

test("market session and freshness boundaries are explicit", async () => {
  const session = await read("src/server/market-session/service.ts");
  const freshness = await read("src/server/market-data/freshness.ts");
  assert.match(session, /Asia\/Kolkata/);
  assert.match(session, /09:15/);
  assert.match(session, /15:30/);
  assert.match(session, /HOLIDAY/);
  assert.match(freshness, /FRESH/);
  assert.match(freshness, /STALE/);
});
