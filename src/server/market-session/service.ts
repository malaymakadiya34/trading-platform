export const INDIA_TIMEZONE = "Asia/Kolkata";
export const INDIA_MARKET_OPEN = "09:15";
export const INDIA_MARKET_CLOSE = "15:30";

export type IndiaSessionState = "PRE_MARKET" | "OPEN" | "CLOSED" | "WEEKEND" | "HOLIDAY";

export type IndiaMarketSession = {
  state: IndiaSessionState;
  timezone: typeof INDIA_TIMEZONE;
  tradingDate: string;
  isTradingDay: boolean;
  progressPct: number;
  open: string;
  close: string;
};

export type HolidayCalendar = {
  isHoliday(tradingDate: string): boolean;
};

const emptyCalendar: HolidayCalendar = { isHoliday: () => false };

function getIndiaParts(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: INDIA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  return Object.fromEntries(parts.map(({ type, value }) => [type, value])) as Record<
    string,
    string
  >;
}

export function getIndiaMarketSession(
  now = new Date(),
  calendar = emptyCalendar,
): IndiaMarketSession {
  const parts = getIndiaParts(now);
  const tradingDate = `${parts.year}-${parts.month}-${parts.day}`;
  const isWeekend = parts.weekday === "Sat" || parts.weekday === "Sun";
  const isHoliday = !isWeekend && calendar.isHoliday(tradingDate);
  const isTradingDay = !isWeekend && !isHoliday;
  const currentMinutes = Number(parts.hour) * 60 + Number(parts.minute);
  const openMinutes = 9 * 60 + 15;
  const closeMinutes = 15 * 60 + 30;
  const progressPct = isTradingDay
    ? Math.min(
        100,
        Math.max(0, ((currentMinutes - openMinutes) / (closeMinutes - openMinutes)) * 100),
      )
    : 0;

  let state: IndiaSessionState = "CLOSED";
  if (isWeekend) state = "WEEKEND";
  else if (isHoliday) state = "HOLIDAY";
  else if (currentMinutes < openMinutes) state = "PRE_MARKET";
  else if (currentMinutes <= closeMinutes) state = "OPEN";

  return {
    state,
    timezone: INDIA_TIMEZONE,
    tradingDate,
    isTradingDay,
    progressPct: Number(progressPct.toFixed(2)),
    open: INDIA_MARKET_OPEN,
    close: INDIA_MARKET_CLOSE,
  };
}

export function isTradingDay(date: string, calendar = emptyCalendar) {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  return day !== 0 && day !== 6 && !calendar.isHoliday(date);
}
