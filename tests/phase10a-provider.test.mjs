import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { readProviderConfiguration } from "../src/server/market-data/config.ts";
import {
  DevelopmentMarketDataProvider,
  DEVELOPMENT_SOURCE,
} from "../src/server/market-data/providers/development-provider.ts";
import { UpstoxMarketDataProvider } from "../src/server/market-data/providers/upstox-provider.ts";
import { normalizeProviderTick } from "../src/server/market-data/ingestion.ts";
import { selectAtmAndItmContracts } from "../src/domain/scanners/intraday-scanners.mjs";
import { realtimeFreshness } from "../src/domain/realtime/protocol.mjs";

const asOf = new Date("2026-09-25T10:00:00Z");
const developmentQuote = {
  symbol: "ABC",
  exchange: "NSE",
  lastPrice: 101,
  close: 100,
  asOf,
  source: DEVELOPMENT_SOURCE,
  isDelayed: true,
  status: "DEVELOPMENT_DATA",
};

test("provider selection is explicit, token-safe and rejects unsupported providers", () => {
  assert.equal(readProviderConfiguration({}), null);
  assert.deepEqual(
    readProviderConfiguration({ MARKET_DATA_PROVIDER: "upstox", UPSTOX_ANALYTICS_TOKEN: "secret" }),
    { providerName: "upstox", analyticsToken: "secret" },
  );
  assert.throws(() => readProviderConfiguration({ MARKET_DATA_PROVIDER: "upstox" }));
  assert.throws(() => readProviderConfiguration({ MARKET_DATA_PROVIDER: "other" }));
  assert.throws(() =>
    readProviderConfiguration({
      MARKET_DATA_PROVIDER: "development",
      DEVELOPMENT_DATASET_PATH: "/tmp/data.json",
      NODE_ENV: "production",
    }),
  );
});

test("development provider is offline, EOD-labelled and never pretends to stream", async () => {
  const provider = new DevelopmentMarketDataProvider({
    provenance: "Deterministic internal calculation fixture",
    asOf: asOf.toISOString(),
    quotes: [developmentQuote],
  });
  await provider.connect();
  assert.equal((await provider.getQuote("ABC", "NSE")).status, "DEVELOPMENT_DATA");
  assert.equal((await provider.getMarketStatus("NSE")).state, "CLOSED");
  await assert.rejects(provider.subscribe(["ABC"], "NSE"), /no realtime/i);
  await provider.disconnect();
  assert.throws(
    () =>
      new DevelopmentMarketDataProvider({
        provenance: "bad fixture",
        asOf: asOf.toISOString(),
        quotes: [{ ...developmentQuote, source: "LIVE" }],
      }),
    /labelled DEVELOPMENT_DATA/,
  );
});

test("Upstox adapter fulfills quotes, candles, actual contracts and option-chain boundaries", async () => {
  const requests = [];
  const master = [
    {
      instrument_key: "NSE_EQ|ABC",
      trading_symbol: "ABC",
      segment: "NSE_EQ",
      instrument_type: "EQUITY",
      name: "ABC Limited",
      isin: "INE000000001",
    },
    ...[90, 100, 110].flatMap((strike) =>
      ["CE", "PE"].map((type) => ({
        instrument_key: `NSE_FO|ABC${strike}${type}`,
        trading_symbol: `ABC26OCT${strike}${type}`,
        segment: "NSE_FO",
        instrument_type: type,
        underlying_symbol: "ABC",
        expiry: "2026-10-29",
        strike_price: strike,
        lot_size: 50,
        tick_size: 0.05,
      })),
    ),
  ];
  const request = async (path) => {
    requests.push(path);
    if (path.includes("market-quote"))
      return {
        status: "success",
        data: {
          "NSE_EQ|ABC": {
            last_price: 101,
            ohlc: { open: 99, high: 102, low: 98, close: 100 },
            volume: 5000,
            timestamp: asOf.toISOString(),
          },
        },
      };
    if (path.includes("historical-candle"))
      return {
        status: "success",
        data: { candles: [[asOf.toISOString(), 99, 102, 98, 101, 5000, 0]] },
      };
    if (path.includes("option/chain")) return { status: "success", data: [] };
    if (path.includes("market/status")) return { status: "success", data: { status: "CLOSED" } };
    throw new Error("Unexpected request");
  };
  const provider = new UpstoxMarketDataProvider({
    token: "not-logged",
    request,
    instrumentLoader: async () => ({ status: "success", data: master }),
    now: () => asOf,
  });
  await provider.connect();
  assert.equal((await provider.getQuote("ABC", "NSE")).source, "UPSTOX");
  assert.equal(
    (await provider.getHistoricalCandles("ABC", "NSE", "15m", asOf, asOf))[0].timeframe,
    "15m",
  );
  const chain = await provider.getOptionChain("ABC", "NSE");
  assert.equal(chain.contracts.length, 6);
  assert.deepEqual(
    selectAtmAndItmContracts(chain.contracts, 101, "UP").map((item) => [
      item.strike,
      item.moneyness,
    ]),
    [
      [100, "ATM"],
      [90, "ITM1"],
    ],
  );
  assert.ok(requests.every((path) => !path.includes("not-logged")));
  assert.equal((await provider.getMarketStatus("NSE")).status, "MARKET_CLOSED");
  await assert.rejects(provider.subscribe(["ABC"], "NSE"), /WebSocket feed is not configured/);
  await provider.disconnect();
});

test("normalization preserves status, source and timestamp freshness", () => {
  const tick = normalizeProviderTick({
    symbol: " ABC ",
    exchange: "nse",
    instrumentType: "STOCK",
    timestamp: asOf,
    price: 101,
    source: "DEVELOPMENT_DATA",
    status: "DEVELOPMENT_DATA",
    isDelayed: true,
  });
  assert.equal(tick.status, "DEVELOPMENT_DATA");
  assert.equal(tick.normalizedSymbol, "ABC");
  assert.equal(realtimeFreshness(asOf, { now: new Date(asOf.getTime() + 61_000) }), "STALE");
  assert.equal(realtimeFreshness(null, { now: asOf }), "UNAVAILABLE");
});

test("scanner repositories remain provider-neutral and consume canonical persisted data", async () => {
  const paths = [
    "../src/server/market-data/repositories/market-movement-repository.ts",
    "../src/server/market-data/repositories/market-context-repository.ts",
    "../src/server/scanners/btst-scanner-repository.ts",
    "../src/server/scanners/intraday-scanner-repository.ts",
  ];
  const source = (
    await Promise.all(paths.map((path) => readFile(new URL(path, import.meta.url), "utf8")))
  ).join("\n");
  assert.doesNotMatch(source, /upstox|UPSTOX_ANALYTICS_TOKEN/i);
  assert.match(source, /marketQuote|quotes/);
});
