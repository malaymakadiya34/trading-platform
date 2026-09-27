export type RealtimeChannel =
  "market" | "index" | "sector" | "stock" | "option" | "scanner" | "session" | "institutional";
export type RealtimeFreshness = "LIVE" | "STALE" | "DELAYED" | "UNAVAILABLE" | "MARKET_CLOSED";
export type RealtimeEvent<T = unknown> = {
  version: 1;
  id: string;
  channel: RealtimeChannel;
  type: string;
  timestamp: string;
  source: string;
  freshness: RealtimeFreshness;
  payload: T;
};
export const REALTIME_VERSION: 1;
export const REALTIME_CHANNELS: readonly RealtimeChannel[];
export function isValidChannel(value: unknown): value is RealtimeChannel;
export function validateSubscriptionMessage(
  value: unknown,
):
  | {
      success: true;
      data: { action: "subscribe" | "unsubscribe" | "pong"; channels: RealtimeChannel[] };
    }
  | { success: false; error: string };
export function createRealtimeEvent<T>(
  channel: RealtimeChannel,
  type: string,
  payload: T,
  options?: { timestamp?: Date; id?: string; source?: string; freshness?: RealtimeFreshness },
): RealtimeEvent<T>;
export function realtimeFreshness(
  asOf: Date | string | null | undefined,
  options?: {
    now?: Date;
    staleAfterMs?: number;
    isDelayed?: boolean;
    marketState?: string;
    available?: boolean;
  },
): RealtimeFreshness;
