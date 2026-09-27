import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  evaluateBearishMomentum,
  evaluateBearishReversal,
  evaluateBullishMomentum,
  evaluateBullishReversal,
  scanBtst,
} from "../src/domain/scanners/btst-scanner.mjs";
import {
  filterInstitutionalRecords,
  institutionalRange,
  isTradingDate,
  latestTradingDates,
} from "../src/domain/institutional-activity/ranges.mjs";
const base = (overrides = {}) => ({
  symbol: "ABC",
  name: "ABC",
  currentPrice: 104,
  open: 100,
  high: 105,
  low: 95,
  changePct: 2,
  support: 95,
  resistance: 105,
  closingPosition: 0.9,
  recoveryFromLowPct: 9,
  retreatFromHighPct: 1,
  distanceFromHighPct: 1,
  relativeVolume: 1.5,
  sectorChangePct: 1,
  marketChangePct: 0.5,
  futuresOiChangePct: 2,
  timestamp: new Date(),
  dataFreshness: "FRESH",
  ...overrides,
});
test("each BTST setup requires multiple independent confirmations", () => {
  assert.equal(evaluateBullishReversal(base()).status, "QUALIFIED");
  assert.equal(evaluateBullishMomentum(base()).status, "QUALIFIED");
  assert.equal(
    evaluateBearishReversal(
      base({
        currentPrice: 96,
        open: 100,
        high: 106,
        low: 95,
        changePct: -2,
        closingPosition: 0.1,
        retreatFromHighPct: 10,
        sectorChangePct: -1,
        marketChangePct: -0.5,
      }),
    ).status,
    "QUALIFIED",
  );
  assert.equal(
    evaluateBearishMomentum(
      base({
        currentPrice: 93,
        open: 100,
        high: 101,
        low: 92,
        changePct: -3,
        support: 95,
        closingPosition: 0.1,
        sectorChangePct: -1,
        marketChangePct: -0.5,
      }),
    ).status,
    "QUALIFIED",
  );
  assert.equal(
    evaluateBullishMomentum(
      base({ changePct: 0.2, relativeVolume: 0.5, sectorChangePct: -1, marketChangePct: -1 }),
    ).status,
    "REJECTED",
  );
});
test("Top BTST aggregates qualifying categories and ranks scores without claiming certainty", () => {
  const result = scanBtst([
    base(),
    base({
      symbol: "WEAK",
      relativeVolume: null,
      sectorChangePct: null,
      marketChangePct: null,
      futuresOiChangePct: null,
    }),
  ]);
  assert.ok(result.top.length >= 2);
  assert.ok(
    result.top.every((item, index, array) => index === 0 || array[index - 1].score >= item.score),
  );
  assert.ok(result.top.every((item) => item.scoreLabel.includes("not certainty")));
  assert.equal(result.bySetup.BULLISH_MOMENTUM[0].optionType, "CE");
});
test("BTST bearish setups map to PE and missing metrics remain excluded from scoring", () => {
  const item = evaluateBearishMomentum(
    base({
      currentPrice: 93,
      changePct: -3,
      support: 95,
      closingPosition: 0.1,
      sectorChangePct: null,
      marketChangePct: null,
      futuresOiChangePct: null,
    }),
  );
  assert.equal(item.optionType, "PE");
  assert.equal(item.supportingMetrics.availableFactors, 3);
  assert.ok(Number.isFinite(item.score));
});
test("trading-day utilities exclude weekends and exchange holidays", () => {
  const holidays = new Set(["2026-09-25"]);
  assert.equal(isTradingDate("2026-09-27", holidays), false);
  assert.equal(isTradingDate("2026-09-25", holidays), false);
  assert.deepEqual(latestTradingDates("2026-09-28", 3, holidays), [
    "2026-09-28",
    "2026-09-24",
    "2026-09-23",
  ]);
});
test("institutional ranges default to 10 records and support month/custom bounds", () => {
  assert.deepEqual(institutionalRange("10D", "2026-09-28"), {
    mode: "LATEST_RECORDS",
    limit: 10,
    from: null,
    to: "2026-09-28",
  });
  assert.equal(institutionalRange("1M", "2026-09-28").from, "2026-08-28");
  assert.deepEqual(
    institutionalRange("CUSTOM", "2026-09-28", { from: "2026-09-01", to: "2026-09-10" }),
    { mode: "DATE_RANGE", limit: null, from: "2026-09-01", to: "2026-09-10" },
  );
  assert.throws(() =>
    institutionalRange("CUSTOM", "2026-09-28", { from: "2026-09-10", to: "2026-09-01" }),
  );
});
test("institutional filtering honors selected range, weekends, holidays and ten-day cap", () => {
  const records = Array.from({ length: 20 }, (_, index) => ({
    date: new Date(Date.UTC(2026, 8, 28 - index)).toISOString().slice(0, 10),
  }));
  const range = institutionalRange("10D", "2026-09-28");
  const result = filterInstitutionalRecords(records, range, new Set(["2026-09-25"]));
  assert.equal(result.length, 10);
  assert.ok(result.every((item) => isTradingDate(item.date, new Set(["2026-09-25"]))));
});
test("FII/DII UI has an explicit empty state and exact required fields", async () => {
  const source = await readFile(
    new URL("../src/components/market/institutional-activity-workspace.tsx", import.meta.url),
    "utf8",
  );
  for (const field of [
    "FII Buy",
    "FII Sell",
    "FII Net",
    "IN MARKET",
    "DII Net",
    "DII Buy",
    "DII Sell",
  ])
    assert.match(source, new RegExp(field));
  assert.match(source, /No FII \/ DII records available/);
});
test("BTST option flow reuses Phase 6 actual-contract selection service", async () => {
  const [page, repository] = await Promise.all([
    readFile(new URL("../app/btst-scanner/options/[symbol]/page.tsx", import.meta.url), "utf8"),
    readFile(
      new URL("../src/server/scanners/intraday-scanner-repository.ts", import.meta.url),
      "utf8",
    ),
  ]);
  assert.match(page, /ScannerOptionsPage/);
  assert.match(repository, /selectAtmAndItmContracts/);
  assert.doesNotMatch(repository, /strike\s*[+\-]\s*\d+/);
});
