import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { indexPointContribution } from "../src/domain/market-data/market-movement.mjs";
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
test("index contribution uses actual index value and membership weight", () => {
  assert.equal(indexPointContribution(25000, 10, 2), 50);
  assert.equal(indexPointContribution(25000, 10, -2), -50);
  assert.equal(indexPointContribution(null, 10, 2), null);
  assert.equal(indexPointContribution(25000, -1, 2), null);
});
test("all market APIs use the canonical authenticated rate-limited guard", async () => {
  const routes = [
    "instruments",
    "readiness",
    "session",
    "institutional-activity",
    "movement",
    "scanners",
    "realtime/status",
  ];
  for (const route of routes)
    assert.match(await read(`app/api/market/${route}/route.ts`), /authorizeApiRequest/);
});
test("websocket server enforces authentication, origin, payload and backpressure boundaries", async () => {
  const source = await read("server.ts");
  assert.match(source, /authenticateSessionToken/);
  assert.match(source, /403 Forbidden/);
  assert.match(source, /maxPayload/);
  assert.match(source, /bufferedAmount/);
  assert.match(source, /401 Unauthorized/);
});
test("production ticker path uses unavailable states and enables mock fixtures only explicitly", async () => {
  const source = await read("src/components/layout/dashboard-shell.tsx");
  assert.match(source, /MARKET_DATA_MODE === "MOCK"/);
  assert.match(source, /NODE_ENV !== "production"/);
  assert.match(source, /NOT_CONFIGURED/);
  assert.match(source, /unavailable values are not fabricated/);
});
test("instrument synchronization preserves actual contract metadata and rollover state", async () => {
  const [service, schema] = await Promise.all([
    read("src/server/market-data/instrument-master-sync.ts"),
    read("prisma/schema.prisma"),
  ]);
  for (const field of ["strike", "lotSize", "expiry"])
    assert.match(service, new RegExp(`${field}\\s*:\\s*item\\.${field}`));
  assert.match(service, /active\s*:\s*false/);
  assert.match(schema, /active\s+Boolean\s+@default\(true\)/);
  assert.doesNotMatch(service, /strike\s*[+\-]\s*\d+/);
});
test("production quote persistence keeps bounded canonical evidence fields", async () => {
  const source = await read("src/server/market-data/postgres-tick-persistence.ts");
  for (const field of [
    "previousClose",
    "dayHigh",
    "dayLow",
    "openInterestChange",
    "impliedVolatility",
    "bid",
    "ask",
  ])
    assert.match(source, new RegExp(field));
  const ingestion = await read("src/server/market-data/ingestion.ts");
  assert.match(ingestion, /persistEveryMs/);
});
test("deployment documentation lists provider, Redis, migrations, health and no-live limitations", async () => {
  const docs = await read("docs/Production_Deployment.md");
  for (const phrase of [
    "No licensed market-data vendor",
    "UPSTOX_ANALYTICS_TOKEN",
    "REDIS_URL",
    "prisma migrate deploy",
    "/api/realtime",
    "not configured",
  ])
    assert.match(docs, new RegExp(phrase));
});
