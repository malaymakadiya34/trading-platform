import {
  DevelopmentMarketDataProvider,
  loadDevelopmentDataset,
} from "./providers/development-provider.ts";
import { UpstoxMarketDataProvider, type UpstoxFeed } from "./providers/upstox-provider.ts";
import type { MarketDataProvider } from "./provider.ts";
import { ProviderNotConfiguredError } from "./provider.ts";

const UPSTOX_INSTRUMENT_FILES = [
  "https://assets.upstox.com/market-quote/instruments/exchange/NSE.json.gz",
  "https://assets.upstox.com/market-quote/instruments/exchange/BSE.json.gz",
  "https://assets.upstox.com/market-quote/instruments/exchange/global.json.gz",
] as const;

export type ProviderConfiguration =
  | { providerName: "upstox"; analyticsToken: string }
  | { providerName: "development"; datasetPath: string };

export function readProviderConfiguration(
  environment: NodeJS.ProcessEnv = process.env,
): ProviderConfiguration | null {
  const providerName = environment.MARKET_DATA_PROVIDER?.trim().toLowerCase();
  if (!providerName) return null;
  if (providerName === "upstox") {
    const analyticsToken = environment.UPSTOX_ANALYTICS_TOKEN?.trim();
    if (!analyticsToken) throw new ProviderNotConfiguredError();
    return { providerName, analyticsToken };
  }
  if (providerName === "development") {
    if (environment.NODE_ENV === "production")
      throw new Error("The development market-data provider cannot run in production");
    const datasetPath = environment.DEVELOPMENT_DATASET_PATH?.trim();
    if (!datasetPath) throw new Error("DEVELOPMENT_DATASET_PATH is required");
    return { providerName, datasetPath };
  }
  throw new Error(`Unsupported market-data provider: ${providerName}`);
}

async function loadOfficialUpstoxInstruments() {
  const rows: unknown[] = [];
  for (const url of UPSTOX_INSTRUMENT_FILES) {
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error(`Upstox instrument download failed (${response.status})`);
    const value = (await response.json()) as unknown;
    if (!Array.isArray(value)) throw new Error("Invalid Upstox instrument file");
    rows.push(...value);
  }
  return { status: "success", data: rows };
}

export type ProviderDependencies = {
  upstoxFeed?: UpstoxFeed;
  upstoxInstrumentLoader?: () => Promise<unknown>;
};

export async function createConfiguredMarketDataProvider(
  environment: NodeJS.ProcessEnv = process.env,
  dependencies: ProviderDependencies = {},
): Promise<MarketDataProvider | null> {
  const configuration = readProviderConfiguration(environment);
  if (!configuration) return null;
  if (configuration.providerName === "development")
    return new DevelopmentMarketDataProvider(
      await loadDevelopmentDataset(configuration.datasetPath),
    );
  return new UpstoxMarketDataProvider({
    token: configuration.analyticsToken,
    feed: dependencies.upstoxFeed,
    instrumentLoader: dependencies.upstoxInstrumentLoader ?? loadOfficialUpstoxInstruments,
  });
}
