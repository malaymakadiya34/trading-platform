import {
  filterInstitutionalRecords,
  institutionalRange,
  latestTradingDates,
  type InstitutionalPreset,
} from "@/src/domain/institutional-activity/ranges.mjs";
import { getPrismaClient } from "@/src/server/db/prisma";
import { getDataFreshness } from "@/src/server/market-data/freshness";
import { getIndiaMarketSession } from "@/src/server/market-session/service";

type RawRecord = {
  id: string;
  tradingDate: Date;
  fiiBuy: unknown;
  fiiSell: unknown;
  fiiNet: unknown;
  inMarket: unknown;
  diiNet: unknown;
  diiBuy: unknown;
  diiSell: unknown;
  source: string;
  asOf: Date;
};
type InstitutionalClient = {
  institutionalActivity: { findMany(args: unknown): Promise<RawRecord[]> };
  marketHoliday: { findMany(args: unknown): Promise<Array<{ tradingDate: Date }>> };
};
export type InstitutionalQuery = { preset: InstitutionalPreset; from?: string; to?: string };
export async function getInstitutionalActivity(query: InstitutionalQuery) {
  const prisma = await getPrismaClient();
  const client = prisma as unknown as InstitutionalClient;
  const today = getIndiaMarketSession().tradingDate;
  const requested = institutionalRange(query.preset, today, { from: query.from, to: query.to });
  const holidayFrom = requested.from ?? `${Number(today.slice(0, 4)) - 1}-01-01`;
  const holidays = await client.marketHoliday.findMany({
    where: {
      exchange: { code: "NSE" },
      tradingDate: {
        gte: new Date(`${holidayFrom}T00:00:00Z`),
        lte: new Date(`${requested.to}T23:59:59Z`),
      },
    },
    select: { tradingDate: true },
  });
  const holidaySet = new Set(
    holidays.map(({ tradingDate }) => tradingDate.toISOString().slice(0, 10)),
  );
  const latestDates = requested.limit
    ? latestTradingDates(requested.to, requested.limit, holidaySet)
    : null;
  const queryFrom = requested.from ?? latestDates?.at(-1) ?? requested.to;
  const records = await client.institutionalActivity.findMany({
    where: {
      tradingDate: {
        gte: new Date(`${queryFrom}T00:00:00Z`),
        lte: new Date(`${requested.to}T23:59:59Z`),
      },
    },
    orderBy: { tradingDate: "desc" },
  });
  const normalized = records.map((record) => ({
    id: record.id,
    date: record.tradingDate.toISOString().slice(0, 10),
    fiiBuy: Number(record.fiiBuy),
    fiiSell: Number(record.fiiSell),
    fiiNet: Number(record.fiiNet),
    inMarket: Number(record.inMarket),
    diiNet: Number(record.diiNet),
    diiBuy: Number(record.diiBuy),
    diiSell: Number(record.diiSell),
    source: record.source,
    asOf: record.asOf.toISOString(),
    freshness: getDataFreshness(record.asOf, new Date(), 36 * 60 * 60 * 1000).state,
  }));
  return {
    range: requested,
    records: filterInstitutionalRecords(normalized, requested, holidaySet),
  };
}
