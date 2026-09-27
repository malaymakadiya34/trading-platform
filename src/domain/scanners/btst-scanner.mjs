export const BTST_CONFIG = Object.freeze({
  minimumScore: 55,
  strongMovePct: 1.5,
  minimumRelativeVolume: 1.2,
  nearLevelPct: 1,
  closeStrengthBullish: 0.7,
  closeStrengthBearish: 0.3,
  weights: Object.freeze({
    priceStructure: 25,
    closeStrength: 20,
    volume: 15,
    sector: 15,
    market: 10,
    derivatives: 15,
  }),
});
const finite = (value) => typeof value === "number" && Number.isFinite(value);
const positive = (value) => finite(value) && value > 0;
const negative = (value) => finite(value) && value < 0;
const atLeast = (value, minimum) => finite(value) && value >= minimum;
const near = (price, level, pct = BTST_CONFIG.nearLevelPct) =>
  finite(price) && finite(level) && level !== 0 && Math.abs(((price - level) / level) * 100) <= pct;

function scoreFactors(factors) {
  const entries = Object.entries(factors);
  const available = entries.filter(([, value]) => value !== null);
  if (!available.length) return { score: 0, availableFactors: 0, matchedFactors: 0 };
  const availableWeight = available.reduce((sum, [key]) => sum + BTST_CONFIG.weights[key], 0);
  const matchedWeight = available
    .filter(([, value]) => value)
    .reduce((sum, [key]) => sum + BTST_CONFIG.weights[key], 0);
  return {
    score: availableWeight ? Math.round((matchedWeight / availableWeight) * 100) : 0,
    availableFactors: available.length,
    matchedFactors: available.filter(([, value]) => value).length,
  };
}

function result(candidate, setup, direction, factors, evidence) {
  const scored = scoreFactors(factors);
  return {
    symbol: candidate.symbol,
    name: candidate.name,
    setup,
    direction,
    optionType: direction === "BULLISH" ? "CE" : "PE",
    status:
      scored.score >= BTST_CONFIG.minimumScore && scored.matchedFactors >= 3
        ? "QUALIFIED"
        : "REJECTED",
    timestamp: candidate.timestamp,
    triggerLevel: candidate.currentPrice,
    currentPrice: candidate.currentPrice,
    score: scored.score,
    scoreLabel: "Ranking score — not certainty",
    supportingMetrics: {
      ...evidence,
      availableFactors: scored.availableFactors,
      matchedFactors: scored.matchedFactors,
    },
    dataFreshness: candidate.dataFreshness,
    invalidationReason:
      scored.score >= BTST_CONFIG.minimumScore && scored.matchedFactors >= 3
        ? null
        : "Insufficient independent setup confirmation",
  };
}

export function evaluateBullishReversal(candidate) {
  const recovery = positive(candidate.recoveryFromLowPct) && candidate.low < candidate.open;
  const structure =
    recovery && (near(candidate.low, candidate.support) || candidate.low <= candidate.support);
  return result(
    candidate,
    "BULLISH_REVERSAL",
    "BULLISH",
    {
      priceStructure: structure,
      closeStrength: atLeast(candidate.closingPosition, BTST_CONFIG.closeStrengthBullish),
      volume: finite(candidate.relativeVolume)
        ? atLeast(candidate.relativeVolume, BTST_CONFIG.minimumRelativeVolume)
        : null,
      sector: finite(candidate.sectorChangePct) ? positive(candidate.sectorChangePct) : null,
      market: finite(candidate.marketChangePct) ? positive(candidate.marketChangePct) : null,
      derivatives: finite(candidate.futuresOiChangePct)
        ? positive(candidate.futuresOiChangePct)
        : null,
    },
    {
      recoveryFromLowPct: candidate.recoveryFromLowPct,
      support: candidate.support,
      relativeVolume: candidate.relativeVolume,
      closingPosition: candidate.closingPosition,
    },
  );
}
export function evaluateBullishMomentum(candidate) {
  return result(
    candidate,
    "BULLISH_MOMENTUM",
    "BULLISH",
    {
      priceStructure:
        atLeast(candidate.changePct, BTST_CONFIG.strongMovePct) &&
        atLeast(candidate.closingPosition, BTST_CONFIG.closeStrengthBullish),
      closeStrength: finite(candidate.distanceFromHighPct)
        ? candidate.distanceFromHighPct <= 1
        : null,
      volume: finite(candidate.relativeVolume)
        ? atLeast(candidate.relativeVolume, BTST_CONFIG.minimumRelativeVolume)
        : null,
      sector: finite(candidate.sectorChangePct) ? positive(candidate.sectorChangePct) : null,
      market: finite(candidate.marketChangePct) ? positive(candidate.marketChangePct) : null,
      derivatives: finite(candidate.futuresOiChangePct)
        ? positive(candidate.futuresOiChangePct)
        : null,
    },
    {
      changePct: candidate.changePct,
      distanceFromHighPct: candidate.distanceFromHighPct,
      relativeVolume: candidate.relativeVolume,
      closingPosition: candidate.closingPosition,
    },
  );
}
export function evaluateBearishReversal(candidate) {
  const reversal = positive(candidate.retreatFromHighPct) && candidate.high > candidate.open;
  const structure =
    reversal &&
    (near(candidate.high, candidate.resistance) || candidate.high >= candidate.resistance);
  return result(
    candidate,
    "BEARISH_REVERSAL",
    "BEARISH",
    {
      priceStructure: structure,
      closeStrength: finite(candidate.closingPosition)
        ? candidate.closingPosition <= BTST_CONFIG.closeStrengthBearish
        : null,
      volume: finite(candidate.relativeVolume)
        ? atLeast(candidate.relativeVolume, BTST_CONFIG.minimumRelativeVolume)
        : null,
      sector: finite(candidate.sectorChangePct) ? negative(candidate.sectorChangePct) : null,
      market: finite(candidate.marketChangePct) ? negative(candidate.marketChangePct) : null,
      derivatives: finite(candidate.futuresOiChangePct)
        ? positive(candidate.futuresOiChangePct)
        : null,
    },
    {
      retreatFromHighPct: candidate.retreatFromHighPct,
      resistance: candidate.resistance,
      relativeVolume: candidate.relativeVolume,
      closingPosition: candidate.closingPosition,
    },
  );
}
export function evaluateBearishMomentum(candidate) {
  return result(
    candidate,
    "BEARISH_MOMENTUM",
    "BEARISH",
    {
      priceStructure:
        candidate.changePct <= -BTST_CONFIG.strongMovePct &&
        candidate.currentPrice < candidate.support,
      closeStrength: finite(candidate.closingPosition)
        ? candidate.closingPosition <= BTST_CONFIG.closeStrengthBearish
        : null,
      volume: finite(candidate.relativeVolume)
        ? atLeast(candidate.relativeVolume, BTST_CONFIG.minimumRelativeVolume)
        : null,
      sector: finite(candidate.sectorChangePct) ? negative(candidate.sectorChangePct) : null,
      market: finite(candidate.marketChangePct) ? negative(candidate.marketChangePct) : null,
      derivatives: finite(candidate.futuresOiChangePct)
        ? positive(candidate.futuresOiChangePct)
        : null,
    },
    {
      changePct: candidate.changePct,
      support: candidate.support,
      relativeVolume: candidate.relativeVolume,
      closingPosition: candidate.closingPosition,
    },
  );
}
export function scanBtst(candidates) {
  const results = candidates
    .flatMap((candidate) => [
      evaluateBullishReversal(candidate),
      evaluateBullishMomentum(candidate),
      evaluateBearishReversal(candidate),
      evaluateBearishMomentum(candidate),
    ])
    .filter((item) => item.status === "QUALIFIED");
  const bySetup = {
    BULLISH_REVERSAL: [],
    BULLISH_MOMENTUM: [],
    BEARISH_REVERSAL: [],
    BEARISH_MOMENTUM: [],
  };
  for (const item of results) bySetup[item.setup].push(item);
  for (const setup of Object.keys(bySetup))
    bySetup[setup].sort((a, b) => b.score - a.score || a.symbol.localeCompare(b.symbol));
  return {
    top: [...results].sort(
      (a, b) =>
        b.score - a.score ||
        b.supportingMetrics.matchedFactors - a.supportingMetrics.matchedFactors ||
        a.symbol.localeCompare(b.symbol),
    ),
    bySetup,
  };
}
