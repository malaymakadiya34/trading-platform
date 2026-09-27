import type { MarketTickerItemData } from "@/src/components/market/market-ticker";

/**
 * Development-only presentation fixtures. These values never enter the provider,
 * API, database, or production market-data contracts. Every rendered item carries
 * a visible MOCK source label and UNKNOWN freshness state.
 */
const mock = (
  id: string,
  name: string,
  value: number,
  absoluteChange: number,
  percentageChange: number,
  currency: MarketTickerItemData["currency"] = "INR",
): MarketTickerItemData => ({
  id,
  name,
  value,
  absoluteChange,
  percentageChange,
  currency,
  positive: absoluteChange >= 0,
  marketStatus: "UNKNOWN",
  freshness: "UNKNOWN",
  source: "MOCK",
});

export const mockIndianTickerItems = [
  mock("nifty-50", "NIFTY 50", 22_480.35, 118.4, 0.53),
  mock("bank-nifty", "BANK NIFTY", 48_610.7, -214.2, -0.44),
  mock("finnifty", "FINNIFTY", 21_440.25, 82.15, 0.38),
  mock("nifty-midcap", "NIFTY MIDCAP", 11_875.8, 45.1, 0.38),
  mock("nifty-smallcap", "NIFTY SMALLCAP", 8_234.65, -31.7, -0.38),
  mock("nifty-it", "NIFTY IT", 37_480.4, 245.6, 0.66),
  mock("nifty-auto", "NIFTY AUTO", 23_782.3, -95.25, -0.4),
  mock("nifty-pharma", "NIFTY PHARMA", 18_945.2, 154.9, 0.82),
  mock("nifty-fmcg", "NIFTY FMCG", 55_240.75, 70.55, 0.13),
  mock("btc-usd", "BTC/USD", 68_245.5, 624.85, 0.92, "USD"),
];

export const mockGlobalTickerItems = [
  mock("dow-jones", "DOW JONES", 39_120.55, 165.45, 0.42, "USD"),
  mock("sp-500", "S&P 500", 5_185.2, -22.6, -0.43, "USD"),
  mock("nasdaq", "NASDAQ", 16_235.9, 93.35, 0.58, "USD"),
  mock("ftse", "FTSE LONDON", 8_190.4, 31.85, 0.39, "USD"),
  mock("dax", "DAX", 18_225.55, -72.4, -0.4, "USD"),
  mock("gift-nifty", "GIFT NIFTY", 22_530.1, 45.75, 0.2, "USD"),
  mock("nikkei", "NIKKEI 225", 38_405.7, 288.1, 0.76, "USD"),
  mock("hang-seng", "HANG SENG", 18_042.6, -135.8, -0.75, "USD"),
];
