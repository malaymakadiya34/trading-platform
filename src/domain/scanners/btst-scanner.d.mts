export type BtstSetup =
  "BULLISH_REVERSAL" | "BULLISH_MOMENTUM" | "BEARISH_REVERSAL" | "BEARISH_MOMENTUM";
export type BtstCandidate = {
  symbol: string;
  name?: string;
  currentPrice: number;
  open: number;
  high: number;
  low: number;
  changePct: number;
  support: number;
  resistance: number;
  closingPosition: number | null;
  recoveryFromLowPct: number | null;
  retreatFromHighPct: number | null;
  distanceFromHighPct: number | null;
  relativeVolume: number | null;
  sectorChangePct: number | null;
  marketChangePct: number | null;
  futuresOiChangePct: number | null;
  timestamp: Date;
  dataFreshness: "FRESH" | "STALE" | "UNKNOWN";
};
export type BtstResult = {
  symbol: string;
  name?: string;
  setup: BtstSetup;
  direction: "BULLISH" | "BEARISH";
  optionType: "CE" | "PE";
  status: "QUALIFIED" | "REJECTED";
  timestamp: Date;
  triggerLevel: number;
  currentPrice: number;
  score: number;
  scoreLabel: string;
  supportingMetrics: Record<string, number | null>;
  dataFreshness: "FRESH" | "STALE" | "UNKNOWN";
  invalidationReason: string | null;
};
export const BTST_CONFIG: Readonly<{
  minimumScore: number;
  strongMovePct: number;
  minimumRelativeVolume: number;
  nearLevelPct: number;
  closeStrengthBullish: number;
  closeStrengthBearish: number;
  weights: Readonly<Record<string, number>>;
}>;
export function evaluateBullishReversal(candidate: BtstCandidate): BtstResult;
export function evaluateBullishMomentum(candidate: BtstCandidate): BtstResult;
export function evaluateBearishReversal(candidate: BtstCandidate): BtstResult;
export function evaluateBearishMomentum(candidate: BtstCandidate): BtstResult;
export function scanBtst(candidates: BtstCandidate[]): {
  top: BtstResult[];
  bySetup: Record<BtstSetup, BtstResult[]>;
};
