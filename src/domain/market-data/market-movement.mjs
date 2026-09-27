export const MARKET_MOVEMENT_CONFIG = Object.freeze({
  neutralPct: 0.05,
  moderatePct: 1,
  strongPct: 2,
  maxIntensityPct: 3,
  blockSizes: Object.freeze({ low: 1, medium: 2, high: 3 }),
});

const finite = (value) => typeof value === "number" && Number.isFinite(value);

export function percentageChange(current, previous) {
  if (!finite(current) || !finite(previous) || previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function movementDirection(value, neutralPct = MARKET_MOVEMENT_CONFIG.neutralPct) {
  if (!finite(value)) return "UNAVAILABLE";
  if (Math.abs(value) <= neutralPct) return "NEUTRAL";
  return value > 0 ? "UP" : "DOWN";
}

export function weightedSectorMovement(items) {
  const usable = items.filter(
    ({ changePct, weight }) => finite(changePct) && finite(weight) && weight > 0,
  );
  const weight = usable.reduce((sum, item) => sum + item.weight, 0);
  if (weight === 0) return null;
  return usable.reduce((sum, item) => sum + item.changePct * item.weight, 0) / weight;
}

export function calculateBreadth(changes) {
  const available = changes.filter(finite);
  const advancing = available.filter((value) => value > MARKET_MOVEMENT_CONFIG.neutralPct).length;
  const declining = available.filter((value) => value < -MARKET_MOVEMENT_CONFIG.neutralPct).length;
  const unchanged = available.length - advancing - declining;
  return {
    advancing,
    declining,
    unchanged,
    total: available.length,
    ratio: available.length ? (advancing - declining) / available.length : null,
  };
}

export function relativeMovement(value, benchmark) {
  if (!finite(value) || !finite(benchmark)) return null;
  return value - benchmark;
}

export function stockRelativeStrength(stockChangePct, sectorChangePct, indexChangePct) {
  if (!finite(stockChangePct)) return null;
  const contexts = [sectorChangePct, indexChangePct].filter(finite);
  if (!contexts.length) return null;
  return stockChangePct - contexts.reduce((sum, value) => sum + value, 0) / contexts.length;
}

export function heatmapIntensity(changePct) {
  if (!finite(changePct)) return null;
  return Math.min(1, Math.abs(changePct) / MARKET_MOVEMENT_CONFIG.maxIntensityPct);
}

export function intensityLabel(changePct) {
  if (!finite(changePct)) return "UNAVAILABLE";
  const magnitude = Math.abs(changePct);
  if (magnitude <= MARKET_MOVEMENT_CONFIG.neutralPct) return "NEUTRAL";
  if (magnitude < MARKET_MOVEMENT_CONFIG.moderatePct) return "MILD";
  if (magnitude < MARKET_MOVEMENT_CONFIG.strongPct) return "MODERATE";
  return "STRONG";
}

export function heatmapBlockSize(activityScore) {
  if (!finite(activityScore) || activityScore <= 0) return MARKET_MOVEMENT_CONFIG.blockSizes.low;
  if (activityScore >= 0.67) return MARKET_MOVEMENT_CONFIG.blockSizes.high;
  if (activityScore >= 0.34) return MARKET_MOVEMENT_CONFIG.blockSizes.medium;
  return MARKET_MOVEMENT_CONFIG.blockSizes.low;
}

export function strengthDistribution(items) {
  return items.reduce(
    (result, item) => {
      const direction = movementDirection(item.changePct);
      if (direction === "DOWN") result.weak.push(item);
      else if (direction === "UP") result.strong.push(item);
      else result.neutral.push(item);
      return result;
    },
    { weak: [], neutral: [], strong: [] },
  );
}

export function rankSectors(items) {
  return [...items].sort((a, b) => {
    if (!finite(a.changePct)) return finite(b.changePct) ? 1 : a.name.localeCompare(b.name);
    if (!finite(b.changePct)) return -1;
    return b.changePct - a.changePct || a.name.localeCompare(b.name);
  });
}

export function indexPointContribution(indexValue, weightPct, stockChangePct) {
  if (![indexValue, weightPct, stockChangePct].every(finite) || indexValue <= 0 || weightPct < 0)
    return null;
  return indexValue * (weightPct / 100) * (stockChangePct / 100);
}

export function rankStocks(items) {
  return [...items].sort((a, b) => {
    const aStrength = finite(a.relativeStrength) ? a.relativeStrength : a.changePct;
    const bStrength = finite(b.relativeStrength) ? b.relativeStrength : b.changePct;
    if (!finite(aStrength)) return finite(bStrength) ? 1 : a.symbol.localeCompare(b.symbol);
    if (!finite(bStrength)) return -1;
    return bStrength - aStrength || a.symbol.localeCompare(b.symbol);
  });
}
