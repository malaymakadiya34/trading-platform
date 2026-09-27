export type ScannerDirection = "UP" | "DOWN";
export type ScannerFreshness = "FRESH" | "STALE" | "UNKNOWN";
export type BoosterCandidate = {
  symbol: string;
  name?: string;
  isFnoEligible: boolean;
  currentPrice: number;
  changePct: number;
  dayHigh: number | null;
  dayLow: number | null;
  volume: number | null;
  relativeVolume: number | null;
  timestamp: Date;
  dataFreshness: ScannerFreshness;
  sectorContext?: string | null;
  marketContext?: string | null;
  source?: string;
};
export type BoosterResult = BoosterCandidate & {
  direction: ScannerDirection;
  status: "TRIGGERED";
  triggerLevel: number;
  distanceFromExtremePct: number | null;
  invalidationReason: null;
};
export type ScannerCandle = {
  symbol: string;
  startsAt: Date;
  endsAt?: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number | null;
  openInterest?: number | null;
};
export type BuiltCandle = Required<
  Pick<ScannerCandle, "symbol" | "startsAt" | "open" | "high" | "low" | "close">
> & { endsAt: Date; volume: number | null; openInterest: number | null };
export type ActualOptionContract = {
  kind: "OPTION" | "FUTURE";
  optionType?: "CE" | "PE";
  strike?: number;
  [key: string]: unknown;
};
export const INTRADAY_SCANNER_CONFIG: Readonly<{
  boosterThresholds: readonly number[];
  defaultBoosterThreshold: number;
  breakoutNearThresholds: readonly number[];
  defaultNearThreshold: number;
  confirmationWindowMs: number;
  minimumConfirmations: number;
  sessionOpenMinutes: number;
  sessionCloseMinutes: number;
}>;
export function distancePct(value: number | null, reference: number | null): number | null;
export function distanceFromExtreme(
  currentPrice: number,
  extreme: number | null,
  direction: ScannerDirection,
): number | null;
export function scanIntradayBoosters(
  candidates: BoosterCandidate[],
  config?: {
    threshold?: number;
    direction?: ScannerDirection | "ALL";
    sortBy?: "MOVEMENT" | "EXTREME_DISTANCE" | "RELATIVE_VOLUME";
    maxDistancePct?: number;
  },
): BoosterResult[];
export function candleBoundary(date: Date): { startsAt: Date; endsAt: Date } | null;
export function buildFifteenMinuteCandles(candles: ScannerCandle[]): BuiltCandle[];
export function previousCompletedCandle(candles: BuiltCandle[], now: Date): BuiltCandle | null;
export function evaluateBreakout(
  input: {
    symbol: string;
    direction: ScannerDirection;
    previousCandle: BuiltCandle;
    currentPrice: number;
    timestamp: Date;
    crossedAt?: Date | null;
    hadCrossed?: boolean;
    confirmations?: Record<string, boolean | null>;
    supportingMetrics?: Record<string, number | string | boolean | null>;
    dataFreshness: ScannerFreshness;
  },
  config?: {
    nearThresholdPct?: number;
    confirmationWindowMs?: number;
    minimumConfirmations?: number;
  },
): {
  symbol: string;
  direction: ScannerDirection;
  status: "OUTSIDE" | "NEAR" | "TRIGGERED" | "CONFIRMED" | "INVALIDATED";
  timestamp: Date;
  triggerLevel: number;
  currentPrice: number;
  supportingMetrics: Record<string, unknown>;
  dataFreshness: ScannerFreshness;
  invalidationReason: string | null;
};
export function optionTypeForDirection(direction: ScannerDirection): "CE" | "PE";
export function selectAtmAndItmContracts<T extends ActualOptionContract>(
  contracts: T[],
  spotPrice: number,
  direction: ScannerDirection,
): Array<T & { moneyness: string }>;
