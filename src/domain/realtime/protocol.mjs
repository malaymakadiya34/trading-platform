export const REALTIME_VERSION = 1;
export const REALTIME_CHANNELS = Object.freeze([
  "market",
  "index",
  "sector",
  "stock",
  "option",
  "scanner",
  "session",
  "institutional",
]);
export function isValidChannel(value) {
  return typeof value === "string" && REALTIME_CHANNELS.includes(value);
}
export function validateSubscriptionMessage(value) {
  if (
    !value ||
    typeof value !== "object" ||
    !["subscribe", "unsubscribe", "pong"].includes(value.action)
  )
    return { success: false, error: "Invalid realtime action" };
  if (value.action === "pong") return { success: true, data: { action: "pong", channels: [] } };
  if (
    !Array.isArray(value.channels) ||
    value.channels.length < 1 ||
    value.channels.length > 50 ||
    !value.channels.every(isValidChannel)
  )
    return { success: false, error: "Invalid realtime channels" };
  return { success: true, data: { action: value.action, channels: [...new Set(value.channels)] } };
}
export function createRealtimeEvent(channel, type, payload, options = {}) {
  if (!isValidChannel(channel)) throw new TypeError("Invalid realtime channel");
  const timestamp = options.timestamp ?? new Date();
  return {
    version: REALTIME_VERSION,
    id: options.id ?? `${timestamp.getTime()}-${Math.random().toString(36).slice(2)}`,
    channel,
    type,
    timestamp: timestamp.toISOString(),
    source: options.source ?? "NOT_CONFIGURED",
    freshness: options.freshness ?? "UNAVAILABLE",
    payload,
  };
}
export function realtimeFreshness(
  asOf,
  {
    now = new Date(),
    staleAfterMs = 60000,
    isDelayed = false,
    marketState = "OPEN",
    available = true,
  } = {},
) {
  if (marketState !== "OPEN") return "MARKET_CLOSED";
  if (!available || !asOf) return "UNAVAILABLE";
  if (isDelayed) return "DELAYED";
  return now.getTime() - new Date(asOf).getTime() > staleAfterMs ? "STALE" : "LIVE";
}
