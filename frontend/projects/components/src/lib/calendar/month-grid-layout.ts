/** One cell of a Sunday-first month grid. */
export interface MonthCell {
  /** `YYYY-MM-DD`. */
  date: string;
  day: number;
  /** A leading or trailing day of the adjacent month. */
  outside: boolean;
  today: boolean;
}

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

/**
 * The cells of a month (`YYYY-MM`): leading days back to Sunday, every day of the month, and trailing days to the
 * end of the last week. Pure date arithmetic in UTC, so the grid renders before any data arrives.
 */
export function monthCells(month: string, today: string): MonthCell[] {
  const [year, m] = month.split('-').map(Number);
  const first = new Date(Date.UTC(year, m - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, m, 0)).getUTCDate();
  const lead = first.getUTCDay();
  const total = Math.ceil((lead + daysInMonth) / 7) * 7;
  return Array.from({ length: total }, (_, i) => {
    const date = new Date(Date.UTC(year, m - 1, 1 - lead + i));
    const value = iso(date);
    return {
      date: value,
      day: date.getUTCDate(),
      outside: date.getUTCMonth() !== m - 1,
      today: value === today,
    };
  });
}

/** `YYYY-MM` of the month before or after. */
export function shiftMonth(month: string, step: number): string {
  const [year, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(year, m - 1 + step, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
}

/** "November 2026" for `2026-11`. */
export function monthLabel(month: string): string {
  const [year, m] = month.split('-').map(Number);
  return new Date(Date.UTC(year, m - 1, 1)).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
