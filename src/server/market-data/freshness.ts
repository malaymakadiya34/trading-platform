export type FreshnessState = "FRESH" | "STALE" | "UNKNOWN";

export type FreshnessResult = {
  state: FreshnessState;
  ageMs: number | null;
  isDelayed: boolean;
};

export function getDataFreshness(
  asOf: Date | null,
  now = new Date(),
  staleAfterMs = 60_000,
): FreshnessResult {
  if (!asOf) return { state: "UNKNOWN", ageMs: null, isDelayed: true };

  const ageMs = Math.max(0, now.getTime() - asOf.getTime());
  return {
    state: ageMs <= staleAfterMs ? "FRESH" : "STALE",
    ageMs,
    isDelayed: ageMs > staleAfterMs,
  };
}
