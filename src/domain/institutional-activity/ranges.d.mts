export type InstitutionalPreset = "10D" | "1M" | "3M" | "6M" | "CUSTOM";
export type InstitutionalRange = {
  mode: "LATEST_RECORDS" | "DATE_RANGE";
  limit: number | null;
  from: string | null;
  to: string;
};
export function isTradingDate(value: string, holidays?: Set<string>): boolean;
export function latestTradingDates(
  endDate: string,
  count: number,
  holidays?: Set<string>,
): string[];
export function institutionalRange(
  preset: InstitutionalPreset,
  endDate: string,
  custom?: { from?: string; to?: string },
): InstitutionalRange;
export function filterInstitutionalRecords<T extends { date: string }>(
  records: T[],
  range: InstitutionalRange,
  holidays?: Set<string>,
): T[];
