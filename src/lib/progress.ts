import { getDb, rowsToObjects } from "./db";
import type { Part } from "./types";
import {
  getBestScoreForMonth,
  getBestScoreForWeek,
  getMonthNumberForWeek,
  getMonthWeekNumbers,
  getWeekDayRange,
  getWeekNumberForDay,
  isMonthEndDay,
  isWeekEndDay,
} from "./cycles";

export type DayProgressRow = {
  day_number: number;
  part_a_read_at: string | null;
  part_b_read_at: string | null;
  part_c_read_at: string | null;
  mock_started_at: string | null;
  mock_submitted_at: string | null;
};

export async function getDayProgress(dayNumber: number): Promise<DayProgressRow | undefined> {
  const db = await getDb();
  const rs = await db.execute({ sql: "SELECT * FROM day_progress WHERE day_number = ?", args: [dayNumber] });
  return rowsToObjects(rs)[0] as DayProgressRow | undefined;
}

export async function getAllProgress(): Promise<Map<number, DayProgressRow>> {
  const db = await getDb();
  const rs = await db.execute("SELECT * FROM day_progress");
  const rows = rowsToObjects(rs) as DayProgressRow[];
  return new Map(rows.map((r) => [r.day_number, r]));
}

async function ensureRow(dayNumber: number): Promise<void> {
  const db = await getDb();
  await db.execute({ sql: "INSERT OR IGNORE INTO day_progress (day_number) VALUES (?)", args: [dayNumber] });
}

const PART_COLUMN: Record<Part, string> = {
  A: "part_a_read_at",
  B: "part_b_read_at",
  C: "part_c_read_at",
};

export async function markPartRead(dayNumber: number, part: Part): Promise<void> {
  await ensureRow(dayNumber);
  const column = PART_COLUMN[part];
  const db = await getDb();
  await db.execute({
    sql: `UPDATE day_progress SET ${column} = ? WHERE day_number = ?`,
    args: [new Date().toISOString(), dayNumber],
  });
}

export async function markMockStarted(dayNumber: number): Promise<void> {
  await ensureRow(dayNumber);
  const db = await getDb();
  await db.execute({
    sql: "UPDATE day_progress SET mock_started_at = ? WHERE day_number = ?",
    args: [new Date().toISOString(), dayNumber],
  });
}

export async function markMockSubmitted(dayNumber: number): Promise<void> {
  await ensureRow(dayNumber);
  const db = await getDb();
  await db.execute({
    sql: "UPDATE day_progress SET mock_submitted_at = ? WHERE day_number = ?",
    args: [new Date().toISOString(), dayNumber],
  });
}

export function isAllPartsRead(row: DayProgressRow | undefined): boolean {
  return !!row?.part_a_read_at && !!row?.part_b_read_at && !!row?.part_c_read_at;
}

// TNPSC-style pass bar for a day's mock test. Below this, the next day's reading
// material stays locked no matter how many times the test was submitted.
export const PASS_THRESHOLD_PERCENT = 80;

export async function getBestScoreForDay(dayNumber: number): Promise<number | null> {
  const db = await getDb();
  const rs = await db.execute({
    sql: `SELECT MAX(score_percent) as best FROM attempts
       WHERE day_number = ? AND attempt_kind = 'daily' AND submitted_at IS NOT NULL`,
    args: [dayNumber],
  });
  const row = rowsToObjects(rs)[0] as { best: number | null } | undefined;
  return row?.best ?? null;
}

// Batched version of getBestScoreForDay for pages that render every day at once
// (avoids one query per day).
export async function getAllBestScores(): Promise<Map<number, number>> {
  const db = await getDb();
  const rs = await db.execute(
    `SELECT day_number, MAX(score_percent) as best FROM attempts
       WHERE attempt_kind = 'daily' AND submitted_at IS NOT NULL AND day_number IS NOT NULL
       GROUP BY day_number`
  );
  const rows = rowsToObjects(rs) as Array<{ day_number: number; best: number }>;
  return new Map(rows.map((r) => [r.day_number, r.best]));
}

export async function hasDayPassed(dayNumber: number, bestScores?: Map<number, number>): Promise<boolean> {
  const best = bestScores ? bestScores.get(dayNumber) ?? null : await getBestScoreForDay(dayNumber);
  return (best ?? 0) >= PASS_THRESHOLD_PERCENT;
}

// Cycle tests are revision, not a hard gate — "passed" only drives the
// completed/needs-retake badge and result-screen copy, never the unlock.
export async function hasWeekPassed(weekNumber: number, bestWeekScores?: Map<number, number>): Promise<boolean> {
  const best = bestWeekScores ? bestWeekScores.get(weekNumber) ?? null : await getBestScoreForWeek(weekNumber);
  return (best ?? 0) >= PASS_THRESHOLD_PERCENT;
}

export async function hasMonthPassed(monthNumber: number, bestMonthScores?: Map<number, number>): Promise<boolean> {
  const best = bestMonthScores ? bestMonthScores.get(monthNumber) ?? null : await getBestScoreForMonth(monthNumber);
  return (best ?? 0) >= PASS_THRESHOLD_PERCENT;
}

// What actually gates the next day: has the cycle test been submitted at all, any
// score. getBestScoreForWeek/Month only returns non-null once a submitted attempt
// exists, so this doubles as an "attempted" check without a separate query.
export async function hasWeekBeenAttempted(weekNumber: number, bestWeekScores?: Map<number, number>): Promise<boolean> {
  if (bestWeekScores) return bestWeekScores.has(weekNumber);
  return (await getBestScoreForWeek(weekNumber)) !== null;
}

export async function hasMonthBeenAttempted(monthNumber: number, bestMonthScores?: Map<number, number>): Promise<boolean> {
  if (bestMonthScores) return bestMonthScores.has(monthNumber);
  return (await getBestScoreForMonth(monthNumber)) !== null;
}

// A week's cycle test only becomes available once every one of its 7 daily mocks has
// individually cleared the pass bar.
export async function isWeekTestUnlocked(weekNumber: number, bestDayScores?: Map<number, number>): Promise<boolean> {
  const { start, end } = getWeekDayRange(weekNumber);
  for (let d = start; d <= end; d++) {
    if (!(await hasDayPassed(d, bestDayScores))) return false;
  }
  return true;
}

// A month's cycle test only becomes available once every week inside it has taken its
// own weekly cycle test (any score — revision, not a gate).
export async function isMonthTestUnlocked(monthNumber: number, bestWeekScores?: Map<number, number>): Promise<boolean> {
  for (const w of getMonthWeekNumbers(monthNumber)) {
    if (!(await hasWeekBeenAttempted(w, bestWeekScores))) return false;
  }
  return true;
}

export async function isDayUnlocked(
  dayNumber: number,
  allProgress: Map<number, DayProgressRow>,
  bestScores?: Map<number, number>,
  bestWeekScores?: Map<number, number>,
  bestMonthScores?: Map<number, number>
): Promise<boolean> {
  if (dayNumber <= 1) return true;
  const prevDay = dayNumber - 1;
  if (!(await hasDayPassed(prevDay, bestScores))) return false;
  // Crossing a week boundary also requires that week's cycle test to have been taken
  // (any score — it's revision, not a gate), and crossing a month boundary (every 4th
  // week) additionally requires the month's to have been taken too.
  if (isWeekEndDay(prevDay) && !(await hasWeekBeenAttempted(getWeekNumberForDay(prevDay), bestWeekScores))) return false;
  if (
    isMonthEndDay(prevDay) &&
    !(await hasMonthBeenAttempted(getMonthNumberForWeek(getWeekNumberForDay(prevDay)), bestMonthScores))
  ) {
    return false;
  }
  return true;
}

export async function isFullMockUnlocked(
  allProgress: Map<number, DayProgressRow>,
  lastDayNumber: number,
  bestScores?: Map<number, number>,
  bestWeekScores?: Map<number, number>,
  bestMonthScores?: Map<number, number>
): Promise<boolean> {
  if (!(await hasDayPassed(lastDayNumber, bestScores))) return false;
  const lastWeek = getWeekNumberForDay(lastDayNumber);
  if (!(await hasWeekBeenAttempted(lastWeek, bestWeekScores))) return false;
  return hasMonthBeenAttempted(getMonthNumberForWeek(lastWeek), bestMonthScores);
}
