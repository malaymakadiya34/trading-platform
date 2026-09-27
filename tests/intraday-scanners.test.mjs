import assert from "node:assert/strict";
import test from "node:test";
import {
  buildFifteenMinuteCandles,
  candleBoundary,
  distanceFromExtreme,
  evaluateBreakout,
  optionTypeForDirection,
  previousCompletedCandle,
  scanIntradayBoosters,
  selectAtmAndItmContracts,
} from "../src/domain/scanners/intraday-scanners.mjs";

const candidate = (changePct, overrides = {}) => ({
  symbol: `S${changePct}`,
  isFnoEligible: true,
  currentPrice: 103,
  changePct,
  dayHigh: 104,
  dayLow: 98,
  volume: 1000,
  relativeVolume: 1.5,
  timestamp: new Date("2026-09-28T04:30:00Z"),
  dataFreshness: "FRESH",
  ...overrides,
});
test("boosters enforce +3%, -3%, configurable thresholds and F&O universe", () => {
  const values = [
    candidate(3),
    candidate(2.99),
    candidate(-3),
    candidate(-2.99),
    candidate(5, { isFnoEligible: false }),
  ];
  assert.deepEqual(
    scanIntradayBoosters(values, { direction: "UP" }).map((x) => x.changePct),
    [3],
  );
  assert.deepEqual(
    scanIntradayBoosters(values, { direction: "DOWN" }).map((x) => x.changePct),
    [-3],
  );
  assert.equal(scanIntradayBoosters([candidate(3.9), candidate(4)], { threshold: 4 }).length, 1);
});
test("extreme distance, sorting and filtering are deterministic", () => {
  assert.equal(distanceFromExtreme(99, 100, "UP"), 1);
  assert.equal(distanceFromExtreme(101, 100, "DOWN"), 1);
  const result = scanIntradayBoosters(
    [
      candidate(4, { symbol: "far", currentPrice: 100, dayHigh: 105, relativeVolume: 1 }),
      candidate(3, { symbol: "near", currentPrice: 104, dayHigh: 105, relativeVolume: 3 }),
    ],
    { direction: "UP", sortBy: "EXTREME_DISTANCE", maxDistancePct: 2 },
  );
  assert.deepEqual(
    result.map((x) => x.symbol),
    ["near"],
  );
  assert.equal(
    scanIntradayBoosters(result, { direction: "UP", sortBy: "RELATIVE_VOLUME" })[0].symbol,
    "near",
  );
});
test("standard candle boundaries begin at 09:15 IST and aggregate without crossing session", () => {
  assert.equal(
    candleBoundary(new Date("2026-09-28T03:45:00Z")).startsAt.toISOString(),
    "2026-09-28T03:45:00.000Z",
  );
  assert.equal(candleBoundary(new Date("2026-09-28T10:00:00Z")), null);
  const candles = buildFifteenMinuteCandles([
    {
      symbol: "A",
      startsAt: new Date("2026-09-28T03:45:00Z"),
      open: 100,
      high: 102,
      low: 99,
      close: 101,
      volume: 10,
    },
    {
      symbol: "A",
      startsAt: new Date("2026-09-28T03:46:00Z"),
      open: 101,
      high: 103,
      low: 100,
      close: 102,
      volume: 20,
    },
    {
      symbol: "A",
      startsAt: new Date("2026-09-28T04:00:00Z"),
      open: 102,
      high: 104,
      low: 101,
      close: 103,
      volume: 30,
    },
  ]);
  assert.equal(candles.length, 2);
  assert.deepEqual(
    [candles[0].open, candles[0].high, candles[0].low, candles[0].close, candles[0].volume],
    [100, 103, 99, 102, 30],
  );
  assert.equal(
    previousCompletedCandle(candles, new Date("2026-09-28T04:00:00Z")).startsAt.toISOString(),
    "2026-09-28T03:45:00.000Z",
  );
});
const breakoutInput = (overrides = {}) => ({
  symbol: "ABC",
  direction: "UP",
  previousCandle: {
    symbol: "ABC",
    startsAt: new Date("2026-09-28T03:45:00Z"),
    endsAt: new Date("2026-09-28T04:00:00Z"),
    open: 98,
    high: 100,
    low: 97,
    close: 99,
    volume: 100,
    openInterest: 1000,
  },
  currentPrice: 99.8,
  timestamp: new Date("2026-09-28T04:02:00Z"),
  dataFreshness: "FRESH",
  confirmations: { volume: true, candleBody: true },
  ...overrides,
});
test("breakout near, trigger and confirmation never treat a touch as confirmed", () => {
  assert.equal(evaluateBreakout(breakoutInput()).status, "NEAR");
  assert.equal(evaluateBreakout(breakoutInput({ currentPrice: 100 })).status, "OUTSIDE");
  assert.equal(
    evaluateBreakout(
      breakoutInput({ currentPrice: 100.1, crossedAt: new Date("2026-09-28T04:01:30Z") }),
    ).status,
    "TRIGGERED",
  );
  assert.equal(
    evaluateBreakout(
      breakoutInput({ currentPrice: 100.1, crossedAt: new Date("2026-09-28T03:59:00Z") }),
    ).status,
    "CONFIRMED",
  );
});
test("false breakout and breakdown return explicit invalidation", () => {
  const up = evaluateBreakout(breakoutInput({ currentPrice: 99.9, hadCrossed: true }));
  assert.equal(up.status, "INVALIDATED");
  assert.match(up.invalidationReason, /below/);
  const down = evaluateBreakout(
    breakoutInput({ direction: "DOWN", currentPrice: 97.1, hadCrossed: true }),
  );
  assert.equal(down.status, "INVALIDATED");
  assert.match(down.invalidationReason, /above/);
});
test("option direction and ATM/ITM use actual irregular contract strikes", () => {
  const contracts = [90, 97, 100, 106, 115].flatMap((strike) =>
    ["CE", "PE"].map((optionType) => ({
      kind: "OPTION",
      optionType,
      strike,
      contractSymbol: `${optionType}${strike}`,
    })),
  );
  assert.equal(optionTypeForDirection("UP"), "CE");
  assert.equal(optionTypeForDirection("DOWN"), "PE");
  assert.deepEqual(
    selectAtmAndItmContracts(contracts, 102, "UP").map((x) => x.strike),
    [100, 97, 90],
  );
  assert.deepEqual(
    selectAtmAndItmContracts(contracts, 102, "DOWN").map((x) => x.strike),
    [100, 106, 115],
  );
});
