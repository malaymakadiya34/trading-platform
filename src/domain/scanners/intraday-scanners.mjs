export const INTRADAY_SCANNER_CONFIG = Object.freeze({
  boosterThresholds: Object.freeze([3, 4, 5]),
  defaultBoosterThreshold: 3,
  breakoutNearThresholds: Object.freeze([0.1, 0.25, 0.5, 1]),
  defaultNearThreshold: 0.25,
  confirmationWindowMs: 2 * 60_000,
  minimumConfirmations: 2,
  sessionOpenMinutes: 9 * 60 + 15,
  sessionCloseMinutes: 15 * 60 + 30,
});

const finite = (value) => typeof value === "number" && Number.isFinite(value);
const round = (value, places = 6) => Number(value.toFixed(places));

export function distancePct(value, reference) {
  if (!finite(value) || !finite(reference) || reference === 0) return null;
  return round(((value - reference) / Math.abs(reference)) * 100);
}

export function distanceFromExtreme(currentPrice, extreme, direction) {
  const distance = distancePct(currentPrice, extreme);
  if (distance === null) return null;
  return direction === "UP"
    ? round(Math.abs(Math.min(0, distance)))
    : round(Math.abs(Math.max(0, distance)));
}

export function scanIntradayBoosters(candidates, config = {}) {
  const threshold = config.threshold ?? INTRADAY_SCANNER_CONFIG.defaultBoosterThreshold;
  if (!INTRADAY_SCANNER_CONFIG.boosterThresholds.includes(threshold))
    throw new RangeError("Unsupported booster threshold");
  const direction = config.direction ?? "ALL";
  const sortBy = config.sortBy ?? "MOVEMENT";
  return candidates
    .filter((candidate) => candidate.isFnoEligible && finite(candidate.changePct))
    .filter((candidate) =>
      direction === "UP"
        ? candidate.changePct >= threshold
        : direction === "DOWN"
          ? candidate.changePct <= -threshold
          : Math.abs(candidate.changePct) >= threshold,
    )
    .map((candidate) => {
      const resultDirection = candidate.changePct > 0 ? "UP" : "DOWN";
      return {
        ...candidate,
        direction: resultDirection,
        status: "TRIGGERED",
        triggerLevel: resultDirection === "UP" ? threshold : -threshold,
        distanceFromExtremePct: distanceFromExtreme(
          candidate.currentPrice,
          resultDirection === "UP" ? candidate.dayHigh : candidate.dayLow,
          resultDirection,
        ),
        invalidationReason: null,
      };
    })
    .filter(
      (candidate) =>
        config.maxDistancePct === undefined ||
        (candidate.distanceFromExtremePct !== null &&
          candidate.distanceFromExtremePct <= config.maxDistancePct),
    )
    .sort((a, b) => {
      if (sortBy === "EXTREME_DISTANCE")
        return (a.distanceFromExtremePct ?? Infinity) - (b.distanceFromExtremePct ?? Infinity);
      if (sortBy === "RELATIVE_VOLUME")
        return (b.relativeVolume ?? -Infinity) - (a.relativeVolume ?? -Infinity);
      return Math.abs(b.changePct) - Math.abs(a.changePct);
    });
}

function indiaParts(date) {
  const entries = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(entries.map(({ type, value }) => [type, value]));
}

export function candleBoundary(date) {
  const parts = indiaParts(date);
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  if (
    minutes < INTRADAY_SCANNER_CONFIG.sessionOpenMinutes ||
    minutes >= INTRADAY_SCANNER_CONFIG.sessionCloseMinutes
  )
    return null;
  const bucketStart =
    INTRADAY_SCANNER_CONFIG.sessionOpenMinutes +
    Math.floor((minutes - INTRADAY_SCANNER_CONFIG.sessionOpenMinutes) / 15) * 15;
  const offsetMinutes = 330;
  const utcMs = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    0,
    bucketStart - offsetMinutes,
  );
  return { startsAt: new Date(utcMs), endsAt: new Date(utcMs + 15 * 60_000) };
}

export function buildFifteenMinuteCandles(candles) {
  const buckets = new Map();
  for (const candle of [...candles].sort((a, b) => a.startsAt - b.startsAt)) {
    const boundary = candleBoundary(new Date(candle.startsAt));
    if (!boundary) continue;
    const key = boundary.startsAt.toISOString();
    const existing = buckets.get(key);
    if (!existing)
      buckets.set(key, {
        symbol: candle.symbol,
        startsAt: boundary.startsAt,
        endsAt: boundary.endsAt,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: finite(candle.volume) ? candle.volume : null,
        openInterest: finite(candle.openInterest) ? candle.openInterest : null,
      });
    else {
      existing.high = Math.max(existing.high, candle.high);
      existing.low = Math.min(existing.low, candle.low);
      existing.close = candle.close;
      existing.volume =
        existing.volume === null || !finite(candle.volume)
          ? existing.volume
          : existing.volume + candle.volume;
      existing.openInterest = finite(candle.openInterest)
        ? candle.openInterest
        : existing.openInterest;
    }
  }
  return [...buckets.values()];
}

export function previousCompletedCandle(candles, now) {
  return (
    [...candles]
      .filter((candle) => new Date(candle.endsAt).getTime() <= now.getTime())
      .sort((a, b) => new Date(b.endsAt) - new Date(a.endsAt))[0] ?? null
  );
}

export function evaluateBreakout(input, config = {}) {
  const nearThresholdPct = config.nearThresholdPct ?? INTRADAY_SCANNER_CONFIG.defaultNearThreshold;
  const confirmationWindowMs =
    config.confirmationWindowMs ?? INTRADAY_SCANNER_CONFIG.confirmationWindowMs;
  const minimumConfirmations =
    config.minimumConfirmations ?? INTRADAY_SCANNER_CONFIG.minimumConfirmations;
  const level = input.direction === "UP" ? input.previousCandle.high : input.previousCandle.low;
  const signedDistance = distancePct(input.currentPrice, level);
  const crossed =
    input.direction === "UP" ? input.currentPrice > level : input.currentPrice < level;
  const returnedThrough =
    input.hadCrossed &&
    (input.direction === "UP" ? input.currentPrice < level : input.currentPrice > level);
  const confirmations = Object.values(input.confirmations ?? {}).filter(
    (value) => value === true,
  ).length;
  let status = "OUTSIDE";
  let invalidationReason = null;
  if (returnedThrough) {
    status = "INVALIDATED";
    invalidationReason =
      input.direction === "UP"
        ? "Price returned below the previous candle high during confirmation"
        : "Price recovered above the previous candle low during confirmation";
  } else if (crossed) {
    const elapsed = input.crossedAt ? input.timestamp.getTime() - input.crossedAt.getTime() : 0;
    status =
      elapsed >= confirmationWindowMs && confirmations >= minimumConfirmations
        ? "CONFIRMED"
        : "TRIGGERED";
  } else if (
    signedDistance !== null &&
    (input.direction === "UP"
      ? signedDistance >= -nearThresholdPct
      : signedDistance <= nearThresholdPct) &&
    (input.direction === "UP" ? signedDistance < 0 : signedDistance > 0)
  )
    status = "NEAR";
  return {
    symbol: input.symbol,
    direction: input.direction,
    status,
    timestamp: input.timestamp,
    triggerLevel: level,
    currentPrice: input.currentPrice,
    supportingMetrics: {
      distancePct: signedDistance,
      confirmationCount: confirmations,
      ...input.supportingMetrics,
    },
    dataFreshness: input.dataFreshness,
    invalidationReason,
  };
}

export function optionTypeForDirection(direction) {
  return direction === "UP" ? "CE" : "PE";
}

export function selectAtmAndItmContracts(contracts, spotPrice, direction) {
  const optionType = optionTypeForDirection(direction);
  const available = contracts
    .filter(
      (contract) =>
        contract.kind === "OPTION" && contract.optionType === optionType && finite(contract.strike),
    )
    .sort((a, b) => a.strike - b.strike);
  if (!available.length || !finite(spotPrice)) return [];
  const atm = available.reduce((best, contract) =>
    Math.abs(contract.strike - spotPrice) < Math.abs(best.strike - spotPrice) ? contract : best,
  );
  const itm =
    direction === "UP"
      ? available
          .filter((contract) => contract.strike < atm.strike)
          .sort((a, b) => b.strike - a.strike)
      : available
          .filter((contract) => contract.strike > atm.strike)
          .sort((a, b) => a.strike - b.strike);
  return [
    { ...atm, moneyness: "ATM" },
    ...itm.slice(0, 2).map((contract, index) => ({ ...contract, moneyness: `ITM${index + 1}` })),
  ];
}
