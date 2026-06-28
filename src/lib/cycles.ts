import { getDb, rowsToObjects } from "./db";
import { getAllDays } from "./content";

export const DAYS_PER_WEEK = 7;
export const WEEKS_PER_MONTH = 4;

export function getTotalDays(): number {
  return getAllDays().length;
}

export function getTotalWeeks(): number {
  return Math.ceil(getTotalDays() / DAYS_PER_WEEK);
}

export function getTotalMonths(): number {
  return Math.ceil(getTotalWeeks() / WEEKS_PER_MONTH);
}

export function getWeekNumberForDay(dayNumber: number): number {
  return Math.ceil(dayNumber / DAYS_PER_WEEK);
}

export function getWeekDayRange(weekNumber: number): { start: number; end: number } {
  const start = (weekNumber - 1) * DAYS_PER_WEEK + 1;
  const end = Math.min(weekNumber * DAYS_PER_WEEK, getTotalDays());
  return { start, end };
}

export function getMonthNumberForWeek(weekNumber: number): number {
  return Math.ceil(weekNumber / WEEKS_PER_MONTH);
}

export function getMonthWeekNumbers(monthNumber: number): number[] {
  const totalWeeks = getTotalWeeks();
  const start = (monthNumber - 1) * WEEKS_PER_MONTH + 1;
  const end = Math.min(monthNumber * WEEKS_PER_MONTH, totalWeeks);
  const weeks: number[] = [];
  for (let w = start; w <= end; w++) weeks.push(w);
  return weeks;
}

export function getMonthDayRange(monthNumber: number): { start: number; end: number } {
  const weeks = getMonthWeekNumbers(monthNumber);
  return {
    start: getWeekDayRange(weeks[0]).start,
    end: getWeekDayRange(weeks[weeks.length - 1]).end,
  };
}

// True on the last day of a week (every 7th day, and the final day overall in case the
// last week is short) — the point at which a weekly cycle test gates the next day.
export function isWeekEndDay(dayNumber: number): boolean {
  return dayNumber === getTotalDays() || dayNumber % DAYS_PER_WEEK === 0;
}

// True only on week-end days that also close out a month (every 4th week, or the final
// week if the month grouping runs short) — the point a monthly cycle test also gates.
export function isMonthEndDay(dayNumber: number): boolean {
  if (!isWeekEndDay(dayNumber)) return false;
  const monthNumber = getMonthNumberForWeek(getWeekNumberForDay(dayNumber));
  return dayNumber === getMonthDayRange(monthNumber).end;
}

export async function getBestScoreForWeek(weekNumber: number): Promise<number | null> {
  const db = await getDb();
  const rs = await db.execute({
    sql: `SELECT MAX(score_percent) as best FROM attempts
       WHERE week_number = ? AND attempt_kind = 'weekly' AND submitted_at IS NOT NULL`,
    args: [weekNumber],
  });
  const row = rowsToObjects(rs)[0] as { best: number | null } | undefined;
  return row?.best ?? null;
}

export async function getAllBestWeekScores(): Promise<Map<number, number>> {
  const db = await getDb();
  const rs = await db.execute(
    `SELECT week_number, MAX(score_percent) as best FROM attempts
       WHERE attempt_kind = 'weekly' AND submitted_at IS NOT NULL AND week_number IS NOT NULL
       GROUP BY week_number`
  );
  const rows = rowsToObjects(rs) as Array<{ week_number: number; best: number }>;
  return new Map(rows.map((r) => [r.week_number, r.best]));
}

export async function getBestScoreForMonth(monthNumber: number): Promise<number | null> {
  const db = await getDb();
  const rs = await db.execute({
    sql: `SELECT MAX(score_percent) as best FROM attempts
       WHERE month_number = ? AND attempt_kind = 'monthly' AND submitted_at IS NOT NULL`,
    args: [monthNumber],
  });
  const row = rowsToObjects(rs)[0] as { best: number | null } | undefined;
  return row?.best ?? null;
}

export async function getAllBestMonthScores(): Promise<Map<number, number>> {
  const db = await getDb();
  const rs = await db.execute(
    `SELECT month_number, MAX(score_percent) as best FROM attempts
       WHERE attempt_kind = 'monthly' AND submitted_at IS NOT NULL AND month_number IS NOT NULL
       GROUP BY month_number`
  );
  const rows = rowsToObjects(rs) as Array<{ month_number: number; best: number }>;
  return new Map(rows.map((r) => [r.month_number, r.best]));
}
