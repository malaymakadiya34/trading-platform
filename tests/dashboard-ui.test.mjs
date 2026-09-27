import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Phase 4 ticker fixtures are isolated and visibly marked as mock data", async () => {
  const fixture = await read("src/demo/market-ticker.ts");
  const ticker = await read("src/components/market/market-ticker.tsx");

  assert.match(fixture, /Development-only presentation fixtures/);
  assert.match(fixture, /source: "MOCK"/);
  assert.match(fixture, /freshness: "UNKNOWN"/);
  assert.match(ticker, /DataSourceBadge/);
  assert.match(ticker, /MarketStatusBadge/);
  assert.match(ticker, /FreshnessBadge/);
});

test("Phase 4 navigation exposes the approved module boundaries", async () => {
  const navigation = await read("src/components/navigation/navigation-items.ts");

  for (const href of [
    "/dashboard",
    "/market-movement",
    "/sector-heatmap",
    "/index-mover",
    "/btst-scanner",
    "/intraday-boosters",
    "/breakout-15m",
    "/fii-dii",
    "/global-markets",
    "/profile",
  ]) {
    assert.match(navigation, new RegExp(href.replace(/\//g, "\\/")));
  }
});

test("module boundaries keep realtime transport out of server presentation components", async () => {
  const boundaries = await Promise.all([
    read("src/components/market/index-mover-boundary.tsx"),
    read("src/components/market/global-markets-boundary.tsx"),
  ]);

  const source = boundaries.join("\n");
  assert.doesNotMatch(source, /WebSocket|Socket\.IO|subscribe\(/);
  assert.match(source, /No index contribution data/);
  assert.match(source, /normalized instrument master/);
  assert.doesNotMatch(source, /mockGlobalTickerItems/);
});
