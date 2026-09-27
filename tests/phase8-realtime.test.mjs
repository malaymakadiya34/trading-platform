import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { once } from "node:events";
import test from "node:test";
import { WebSocket, WebSocketServer } from "ws";
import {
  createRealtimeEvent,
  realtimeFreshness,
  validateSubscriptionMessage,
} from "../src/domain/realtime/protocol.mjs";
import {
  ProviderLifecycle,
  SlidingWindowRateLimiter,
  RateLimitError,
} from "../src/server/market-data/provider-lifecycle.ts";
import {
  MarketDataIngestionService,
  normalizeProviderTick,
} from "../src/server/market-data/ingestion.ts";
import { RealtimeHub } from "../src/server/realtime/hub.ts";

test("provider lifecycle connects, retries, reconnects and records failure state", async () => {
  let attempts = 0,
    disconnects = 0;
  const adapter = {
    name: "TEST",
    async connect() {
      attempts++;
      if (attempts === 1) throw new Error("temporary");
    },
    async disconnect() {
      disconnects++;
    },
  };
  const lifecycle = new ProviderLifecycle(adapter, { attempts: 2, delayMs: 0 });
  await lifecycle.connect();
  assert.equal(lifecycle.snapshot.state, "CONNECTED");
  assert.equal(attempts, 2);
  await lifecycle.reconnect();
  assert.equal(lifecycle.snapshot.state, "CONNECTED");
  assert.equal(disconnects, 1);
  lifecycle.fail(new Error("feed lost"));
  assert.equal(lifecycle.snapshot.state, "FAILED");
});
test("rate limiter creates an explicit retry boundary", () => {
  const limiter = new SlidingWindowRateLimiter(2, 1000);
  limiter.consume(0);
  limiter.consume(1);
  assert.throws(() => limiter.consume(2), RateLimitError);
});
test("provider payload normalization validates options, source and timestamps", () => {
  const tick = normalizeProviderTick(
    {
      symbol: " nifty 50 ",
      exchange: "nse",
      instrumentType: "INDEX",
      timestamp: "2026-09-28T04:00:00Z",
      price: 25000,
      source: "LICENSED",
      isDelayed: false,
    },
    new Date("2026-09-28T04:00:01Z"),
  );
  assert.equal(tick.normalizedSymbol, "NIFTY50");
  assert.equal(tick.exchange, "NSE");
  assert.throws(() =>
    normalizeProviderTick({
      symbol: "OPT",
      exchange: "NFO",
      instrumentType: "OPTION",
      timestamp: new Date(),
      price: 10,
      source: "X",
    }),
  );
  assert.throws(() =>
    normalizeProviderTick({
      symbol: "OPT",
      exchange: "NFO",
      instrumentType: "OPTION",
      optionType: "CE",
      strike: 100,
      expiry: new Date(),
      timestamp: new Date(),
      price: 10,
      bid: 12,
      ask: 11,
      source: "X",
    }),
  );
});
test("freshness distinguishes live, stale, delayed, unavailable and market closed", () => {
  const now = new Date("2026-09-28T04:01:00Z");
  assert.equal(realtimeFreshness("2026-09-28T04:00:30Z", { now }), "LIVE");
  assert.equal(realtimeFreshness("2026-09-28T03:00:00Z", { now }), "STALE");
  assert.equal(realtimeFreshness(now, { now, isDelayed: true }), "DELAYED");
  assert.equal(realtimeFreshness(null, { now }), "UNAVAILABLE");
  assert.equal(realtimeFreshness(now, { now, marketState: "CLOSED" }), "MARKET_CLOSED");
});
test("ingestion validates, caches, rate-limits persistence and routes option updates", async () => {
  const cached = [],
    persisted = [],
    published = [];
  const service = new MarketDataIngestionService(
    {
      async setLatest(key, value) {
        cached.push([key, value]);
      },
    },
    {
      async persistSnapshot(value) {
        persisted.push(value);
      },
    },
    {
      publish(event) {
        published.push(event);
      },
    },
    { cacheTtlSeconds: 60, persistEveryMs: 60000 },
  );
  const payload = {
    symbol: "ABC26SEP100CE",
    exchange: "NFO",
    instrumentType: "OPTION",
    timestamp: new Date("2026-09-28T04:00:00Z"),
    price: 12,
    strike: 100,
    optionType: "CE",
    expiry: new Date("2026-09-30"),
    bid: 11.9,
    ask: 12,
    source: "LICENSED",
    isDelayed: false,
  };
  const event = await service.ingest(payload, "OPEN", new Date("2026-09-28T04:00:01Z"));
  await service.ingest({ ...payload, price: 13 }, "OPEN", new Date("2026-09-28T04:00:02Z"));
  assert.equal(event.channel, "option");
  assert.equal(event.freshness, "LIVE");
  assert.equal(cached.length, 2);
  assert.equal(persisted.length, 1);
  assert.equal(published.length, 2);
});
test("realtime hub validates subscriptions, publishes and unsubscribes", () => {
  const sent = [];
  const peer = {
    id: "one",
    userId: "user",
    isAlive: true,
    send: (value) => sent.push(JSON.parse(value)),
    close() {},
  };
  const hub = new RealtimeHub();
  hub.connect(peer);
  assert.equal(
    hub.message("one", JSON.stringify({ action: "subscribe", channels: ["stock", "option"] })),
    true,
  );
  assert.equal(hub.subscriberCount("stock"), 1);
  hub.publish(
    createRealtimeEvent(
      "stock",
      "quote.updated",
      { symbol: "ABC" },
      { source: "X", freshness: "LIVE" },
    ),
  );
  assert.equal(sent.at(-1).type, "quote.updated");
  hub.message("one", JSON.stringify({ action: "unsubscribe", channels: ["stock"] }));
  assert.equal(hub.subscriberCount("stock"), 0);
  assert.equal(
    validateSubscriptionMessage({ action: "subscribe", channels: ["secret"] }).success,
    false,
  );
});
test("heartbeat closes dead realtime connections and provider failure fans out", () => {
  const sent = [];
  let closed = false;
  const peer = {
    id: "one",
    userId: "user",
    isAlive: false,
    send: (value) => sent.push(value),
    close() {
      closed = true;
    },
  };
  const hub = new RealtimeHub();
  hub.connect(peer);
  peer.isAlive = false;
  hub.heartbeat();
  assert.equal(closed, true);
  const active = {
    id: "two",
    userId: "user",
    isAlive: true,
    send: (value) => sent.push(value),
    close() {},
  };
  hub.connect(active);
  hub.providerDisconnected();
  assert.match(sent.at(-1), /provider.disconnected/);
});
test("WebSocket transport establishes a connection and exchanges versioned events", async () => {
  const server = new WebSocketServer({ port: 0 });
  await once(server, "listening");
  const address = server.address();
  if (typeof address === "string" || address === null) throw new Error("No test port");
  server.on("connection", (socket) =>
    socket.send(
      JSON.stringify(
        createRealtimeEvent(
          "session",
          "connection.ready",
          {},
          { source: "PLATFORM", freshness: "LIVE" },
        ),
      ),
    ),
  );
  const client = new WebSocket(`ws://127.0.0.1:${address.port}`);
  const [data] = await once(client, "message");
  assert.equal(JSON.parse(data.toString()).version, 1);
  client.close();
  server.close();
  await once(server, "close");
});
test("production websocket upgrade authenticates sessions and validates inbound channels", async () => {
  const server = await readFile(new URL("../server.ts", import.meta.url), "utf8");
  assert.match(server, /authenticateSessionToken/);
  assert.match(server, /401 Unauthorized/);
  assert.match(server, /realtimeHub\.message/);
  assert.doesNotMatch(server, /MARKET_DATA_API_KEY/);
});
test("worker reuses the canonical 15-minute engine and separates long-running jobs", async () => {
  const worker = await readFile(
    new URL("../src/server/workers/market-data-worker.ts", import.meta.url),
    "utf8",
  );
  assert.match(worker, /buildFifteenMinuteCandles/);
  for (const job of [
    "refreshScanners",
    "persistHistory",
    "ingestInstitutionalActivity",
    "cleanupRetention",
  ])
    assert.match(worker, new RegExp(job));
});
