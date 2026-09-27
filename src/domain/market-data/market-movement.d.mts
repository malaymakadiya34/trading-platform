export type MovementDirection = "UP" | "DOWN" | "NEUTRAL" | "UNAVAILABLE";
export type IntensityLabel = "NEUTRAL" | "MILD" | "MODERATE" | "STRONG" | "UNAVAILABLE";
export type Breadth = {
  advancing: number;
  declining: number;
  unchanged: number;
  total: number;
  ratio: number | null;
};
export const MARKET_MOVEMENT_CONFIG: Readonly<{
  neutralPct: number;
  moderatePct: number;
  strongPct: number;
  maxIntensityPct: number;
  blockSizes: Readonly<{ low: number; medium: number; high: number }>;
}>;
export function percentageChange(
  current: number | null | undefined,
  previous: number | null | undefined,
): number | null;
export function movementDirection(
  value: number | null | undefined,
  neutralPct?: number,
): MovementDirection;
export function weightedSectorMovement(
  items: Array<{ changePct: number | null; weight: number }>,
): number | null;
export function calculateBreadth(changes: Array<number | null | undefined>): Breadth;
export function relativeMovement(
  value: number | null | undefined,
  benchmark: number | null | undefined,
): number | null;
export function stockRelativeStrength(
  stock: number | null | undefined,
  sector: number | null | undefined,
  index: number | null | undefined,
): number | null;
export function heatmapIntensity(changePct: number | null | undefined): number | null;
export function intensityLabel(changePct: number | null | undefined): IntensityLabel;
export function heatmapBlockSize(activityScore: number | null | undefined): number;
export function strengthDistribution<T extends { changePct: number | null }>(
  items: T[],
): { weak: T[]; neutral: T[]; strong: T[] };
export function rankSectors<T extends { name: string; changePct: number | null }>(items: T[]): T[];
export function rankStocks<
  T extends { symbol: string; changePct: number | null; relativeStrength: number | null },
>(items: T[]): T[];
