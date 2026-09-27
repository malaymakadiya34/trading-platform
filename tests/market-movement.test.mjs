import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  calculateBreadth,
  heatmapBlockSize,
  heatmapIntensity,
  intensityLabel,
  movementDirection,
  percentageChange,
  rankSectors,
  rankStocks,
  relativeMovement,
  stockRelativeStrength,
  strengthDistribution,
  weightedSectorMovement,
} from "../src/domain/market-data/market-movement.mjs";
import { getIndiaMarketSession } from "../src/server/market-session/service.ts";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("percentage and relative movement handle normal, zero and missing inputs", () => {
  assert.equal(percentageChange(110, 100), 10);
  assert.equal(percentageChange(90, 100), -10);
  assert.equal(percentageChange(10, 0), null);
  assert.equal(percentageChange(undefined, 10), null);
  assert.equal(relativeMovement(2.5, 1.25), 1.25);
  assert.equal(relativeMovement(null, 1), null);
  assert.equal(stockRelativeStrength(3, 2, 1), 1.5);
  assert.equal(stockRelativeStrength(3, null, null), null);
});

test("weighted movement ignores unavailable values and honors weights", () => {
  assert.equal(
    weightedSectorMovement([
      { changePct: 2, weight: 3 },
      { changePct: -1, weight: 1 },
    ]),
    1.25,
  );
  assert.equal(weightedSectorMovement([{ changePct: null, weight: 2 }]), null);
  assert.equal(weightedSectorMovement([{ changePct: 5, weight: 0 }]), null);
});

test("breadth and distribution classify strength, weakness and neutral values", () => {
  assert.deepEqual(calculateBreadth([2, -1, 0, null]), {
    advancing: 1,
    declining: 1,
    unchanged: 1,
    total: 3,
    ratio: 0,
  });
  const values = [
    { id: "up", changePct: 1 },
    { id: "down", changePct: -1 },
    { id: "flat", changePct: 0 },
    { id: "missing", changePct: null },
  ];
  const result = strengthDistribution(values);
  assert.deepEqual(
    result.strong.map(({ id }) => id),
    ["up"],
  );
  assert.deepEqual(
    result.weak.map(({ id }) => id),
    ["down"],
  );
  assert.deepEqual(
    result.neutral.map(({ id }) => id),
    ["flat", "missing"],
  );
  assert.equal(movementDirection(null), "UNAVAILABLE");
});

test("heatmap intensity, labels and centralized block sizing are deterministic", () => {
  assert.equal(heatmapIntensity(0), 0);
  assert.equal(heatmapIntensity(-1.5), 0.5);
  assert.equal(heatmapIntensity(8), 1);
  assert.equal(heatmapIntensity(null), null);
  assert.equal(intensityLabel(0), "NEUTRAL");
  assert.equal(intensityLabel(0.5), "MILD");
  assert.equal(intensityLabel(1.5), "MODERATE");
  assert.equal(intensityLabel(2.5), "STRONG");
  assert.equal(heatmapBlockSize(null), 1);
  assert.equal(heatmapBlockSize(0.5), 2);
  assert.equal(heatmapBlockSize(0.8), 3);
});

test("sector and stock rankings put unavailable metrics last", () => {
  assert.deepEqual(
    rankSectors([
      { name: "B", changePct: null },
      { name: "A", changePct: 1 },
      { name: "C", changePct: 3 },
    ]).map(({ name }) => name),
    ["C", "A", "B"],
  );
  assert.deepEqual(
    rankStocks([
      { symbol: "B", changePct: null, relativeStrength: null },
      { symbol: "A", changePct: 1, relativeStrength: 0.5 },
      { symbol: "C", changePct: 3, relativeStrength: 2 },
    ]).map(({ symbol }) => symbol),
    ["C", "A", "B"],
  );
});

test("Indian session boundaries preserve pre-market, open, close and holiday states", () => {
  assert.equal(getIndiaMarketSession(new Date("2026-09-28T03:44:00Z")).state, "PRE_MARKET");
  assert.equal(getIndiaMarketSession(new Date("2026-09-28T03:45:00Z")).state, "OPEN");
  assert.equal(getIndiaMarketSession(new Date("2026-09-28T10:00:00Z")).state, "OPEN");
  assert.equal(getIndiaMarketSession(new Date("2026-09-28T10:01:00Z")).state, "CLOSED");
  assert.equal(getIndiaMarketSession(new Date("2026-09-27T06:00:00Z")).state, "WEEKEND");
  assert.equal(
    getIndiaMarketSession(new Date("2026-09-28T06:00:00Z"), { isHoliday: () => true }).state,
    "HOLIDAY",
  );
});

test("sector-to-stock drill-down and stock details route use canonical market repository", async () => {
  const [heatmapPage, detailsPage, repository] = await Promise.all([
    read("app/sector-heatmap/page.tsx"),
    read("app/market-movement/stocks/[symbol]/page.tsx"),
    read("src/server/market-data/repositories/market-movement-repository.ts"),
  ]);
  assert.match(heatmapPage, /getSectorStocks/);
  assert.match(detailsPage, /getStockDetails/);
  assert.match(repository, /InstrumentMembership|childLinks/);
  assert.doesNotMatch(repository, /Math\.random|MOCK/);
});
