import { getPrismaClient } from "@/src/server/db/prisma";
import type { HolidayCalendar } from "@/src/server/market-session/service";

export function createHolidayCalendar(holidayDates: Iterable<string>): HolidayCalendar {
  const dates = new Set(holidayDates);
  return { isHoliday: (tradingDate) => dates.has(tradingDate) };
}

export async function loadExchangeHolidayCalendar(
  exchangeCode: "NSE" | "BSE" | "NFO" | "GLOBAL",
  year: number,
) {
  const prisma = await getPrismaClient();
  const holidays = await prisma.marketHoliday.findMany({
    where: {
      exchange: { code: exchangeCode },
      tradingDate: { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) },
    },
    select: { tradingDate: true },
  });

  return createHolidayCalendar(
    holidays.map(({ tradingDate }) => tradingDate.toISOString().slice(0, 10)),
  );
}
