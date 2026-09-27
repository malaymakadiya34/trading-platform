export type InstrumentKind = "STOCK" | "INDEX" | "SECTOR";
export type ContractKind = "FUTURE" | "OPTION";
export type OptionType = "CE" | "PE";
export type CandleTimeframe = "1m" | "5m" | "15m" | "1d";
export type MarketDataStatus =
  "LIVE" | "DELAYED" | "STALE" | "UNAVAILABLE" | "MARKET_CLOSED" | "DEVELOPMENT_DATA";

export type InstrumentDescriptor = {
  exchange: string;
  symbol: string;
  normalizedSymbol: string;
  displayName: string;
  kind: InstrumentKind;
  currency: string;
  isin?: string;
  isFnoEligible: boolean;
  metadata?: Record<string, unknown>;
};

export type ContractDescriptor = {
  exchange: string;
  underlyingSymbol: string;
  kind: ContractKind;
  contractSymbol: string;
  normalizedSymbol: string;
  optionType?: OptionType;
  expiry: Date;
  strike?: number;
  lotSize?: number;
  tickSize?: number;
  metadata?: Record<string, unknown>;
};

export type Quote = {
  symbol: string;
  exchange: string;
  lastPrice: number;
  change?: number;
  changePct?: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
  openInterest?: number;
  openInterestChange?: number;
  bid?: number;
  ask?: number;
  impliedVolatility?: number;
  asOf: Date;
  source: string;
  isDelayed: boolean;
  status: MarketDataStatus;
};

export type InstitutionalActivityRecord = {
  tradingDate: string;
  fiiBuy: number;
  fiiSell: number;
  fiiNet: number;
  inMarket: number;
  diiNet: number;
  diiBuy: number;
  diiSell: number;
  asOf: Date;
  source: string;
  status: MarketDataStatus;
};

export type ProviderMarketStatus = {
  exchange: string;
  state: "PRE_MARKET" | "OPEN" | "CLOSED" | "WEEKEND" | "HOLIDAY";
  asOf: Date;
  source: string;
  status: MarketDataStatus;
};

export type HistoricalCandle = {
  symbol: string;
  exchange: string;
  timeframe: CandleTimeframe;
  startsAt: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  openInterest?: number;
  source: string;
  status: MarketDataStatus;
};

export type OptionChain = {
  underlyingSymbol: string;
  exchange: string;
  asOf: Date;
  contracts: ContractDescriptor[];
  source: string;
  isDelayed: boolean;
  status: MarketDataStatus;
};

export type InstrumentMaster = {
  instruments: InstrumentDescriptor[];
  contracts: ContractDescriptor[];
  asOf: Date;
  source: string;
  status: MarketDataStatus;
};
