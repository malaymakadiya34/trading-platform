import {
  ProviderNotConfiguredError,
  type MarketDataProvider,
} from "@/src/server/market-data/provider";
export type ProviderConfiguration = {
  providerName: string;
  apiUrl: string;
  apiKey: string;
  apiSecret?: string;
};
export function readProviderConfiguration(): ProviderConfiguration | null {
  const providerName = process.env.MARKET_DATA_PROVIDER?.trim();
  const apiUrl = process.env.MARKET_DATA_API_URL?.trim();
  const apiKey = process.env.MARKET_DATA_API_KEY?.trim();
  if (!providerName || !apiUrl || !apiKey) return null;
  return { providerName, apiUrl, apiKey, apiSecret: process.env.MARKET_DATA_API_SECRET?.trim() };
}
export type ProviderFactory = (configuration: ProviderConfiguration) => MarketDataProvider;
export function configureMarketDataProvider(factory: ProviderFactory) {
  const configuration = readProviderConfiguration();
  if (!configuration) throw new ProviderNotConfiguredError();
  return factory(configuration);
}
