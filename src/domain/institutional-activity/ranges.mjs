const DAY_MS = 86_400_000;
const iso = (date) => date.toISOString().slice(0, 10);
const parse = (value) => new Date(`${value}T12:00:00Z`);
export function isTradingDate(value, holidays = new Set()) {
  const date = parse(value);
  const day = date.getUTCDay();
  return day !== 0 && day !== 6 && !holidays.has(value);
}
export function latestTradingDates(endDate, count, holidays = new Set()) {
  if (!Number.isInteger(count) || count < 1)
    throw new RangeError("Trading-day count must be positive");
  const dates = [];
  let cursor = parse(endDate);
  while (dates.length < count) {
    const value = iso(cursor);
    if (isTradingDate(value, holidays)) dates.push(value);
    cursor = new Date(cursor.getTime() - DAY_MS);
  }
  return dates;
}
export function institutionalRange(preset, endDate, custom = {}) {
  const end = parse(endDate);
  if (preset === "10D") return { mode: "LATEST_RECORDS", limit: 10, from: null, to: iso(end) };
  if (preset === "CUSTOM") {
    if (!custom.from || !custom.to || custom.from > custom.to)
      throw new RangeError("A valid custom range is required");
    return { mode: "DATE_RANGE", limit: null, from: custom.from, to: custom.to };
  }
  const months = { "1M": 1, "3M": 3, "6M": 6 }[preset];
  if (!months) throw new RangeError("Unsupported institutional range");
  const from = new Date(end);
  from.setUTCMonth(from.getUTCMonth() - months);
  return { mode: "DATE_RANGE", limit: null, from: iso(from), to: iso(end) };
}
export function filterInstitutionalRecords(records, range, holidays = new Set()) {
  return records
    .filter(
      (record) =>
        isTradingDate(record.date, holidays) &&
        record.date <= range.to &&
        (range.from === null || record.date >= range.from),
    )
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, range.limit ?? undefined);
}
