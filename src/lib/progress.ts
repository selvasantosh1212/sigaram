import { getDb } from "./db";
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

export function getDayProgress(dayNumber: number): DayProgressRow | undefined {
  return getDb()
    .prepare("SELECT * FROM day_progress WHERE day_number = ?")
    .get(dayNumber) as DayProgressRow | undefined;
}

export function getAllProgress(): Map<number, DayProgressRow> {
  const rows = getDb().prepare("SELECT * FROM day_progress").all() as DayProgressRow[];
  return new Map(rows.map((r) => [r.day_number, r]));
}

function ensureRow(dayNumber: number) {
  getDb()
    .prepare("INSERT OR IGNORE INTO day_progress (day_number) VALUES (?)")
    .run(dayNumber);
}

const PART_COLUMN: Record<Part, string> = {
  A: "part_a_read_at",
  B: "part_b_read_at",
  C: "part_c_read_at",
};

export function markPartRead(dayNumber: number, part: Part) {
  ensureRow(dayNumber);
  const column = PART_COLUMN[part];
  getDb()
    .prepare(`UPDATE day_progress SET ${column} = ? WHERE day_number = ?`)
    .run(new Date().toISOString(), dayNumber);
}

export function markMockStarted(dayNumber: number) {
  ensureRow(dayNumber);
  getDb()
    .prepare("UPDATE day_progress SET mock_started_at = ? WHERE day_number = ?")
    .run(new Date().toISOString(), dayNumber);
}

export function markMockSubmitted(dayNumber: number) {
  ensureRow(dayNumber);
  getDb()
    .prepare("UPDATE day_progress SET mock_submitted_at = ? WHERE day_number = ?")
    .run(new Date().toISOString(), dayNumber);
}

export function isAllPartsRead(row: DayProgressRow | undefined): boolean {
  return !!row?.part_a_read_at && !!row?.part_b_read_at && !!row?.part_c_read_at;
}

// TNPSC-style pass bar for a day's mock test. Below this, the next day's reading
// material stays locked no matter how many times the test was submitted.
export const PASS_THRESHOLD_PERCENT = 80;

export function getBestScoreForDay(dayNumber: number): number | null {
  const row = getDb()
    .prepare(
      `SELECT MAX(score_percent) as best FROM attempts
       WHERE day_number = ? AND attempt_kind = 'daily' AND submitted_at IS NOT NULL`
    )
    .get(dayNumber) as { best: number | null } | undefined;
  return row?.best ?? null;
}

// Batched version of getBestScoreForDay for pages that render every day at once
// (avoids one query per day).
export function getAllBestScores(): Map<number, number> {
  const rows = getDb()
    .prepare(
      `SELECT day_number, MAX(score_percent) as best FROM attempts
       WHERE attempt_kind = 'daily' AND submitted_at IS NOT NULL AND day_number IS NOT NULL
       GROUP BY day_number`
    )
    .all() as Array<{ day_number: number; best: number }>;
  return new Map(rows.map((r) => [r.day_number, r.best]));
}

export function hasDayPassed(dayNumber: number, bestScores?: Map<number, number>): boolean {
  const best = bestScores ? bestScores.get(dayNumber) ?? null : getBestScoreForDay(dayNumber);
  return (best ?? 0) >= PASS_THRESHOLD_PERCENT;
}

// Cycle tests are revision, not a hard gate — "passed" only drives the
// completed/needs-retake badge and result-screen copy, never the unlock.
export function hasWeekPassed(weekNumber: number, bestWeekScores?: Map<number, number>): boolean {
  const best = bestWeekScores ? bestWeekScores.get(weekNumber) ?? null : getBestScoreForWeek(weekNumber);
  return (best ?? 0) >= PASS_THRESHOLD_PERCENT;
}

export function hasMonthPassed(monthNumber: number, bestMonthScores?: Map<number, number>): boolean {
  const best = bestMonthScores ? bestMonthScores.get(monthNumber) ?? null : getBestScoreForMonth(monthNumber);
  return (best ?? 0) >= PASS_THRESHOLD_PERCENT;
}

// What actually gates the next day: has the cycle test been submitted at all, any
// score. getBestScoreForWeek/Month only returns non-null once a submitted attempt
// exists, so this doubles as an "attempted" check without a separate query.
export function hasWeekBeenAttempted(weekNumber: number, bestWeekScores?: Map<number, number>): boolean {
  if (bestWeekScores) return bestWeekScores.has(weekNumber);
  return getBestScoreForWeek(weekNumber) !== null;
}

export function hasMonthBeenAttempted(monthNumber: number, bestMonthScores?: Map<number, number>): boolean {
  if (bestMonthScores) return bestMonthScores.has(monthNumber);
  return getBestScoreForMonth(monthNumber) !== null;
}

// A week's cycle test only becomes available once every one of its 7 daily mocks has
// individually cleared the pass bar.
export function isWeekTestUnlocked(weekNumber: number, bestDayScores?: Map<number, number>): boolean {
  const { start, end } = getWeekDayRange(weekNumber);
  for (let d = start; d <= end; d++) {
    if (!hasDayPassed(d, bestDayScores)) return false;
  }
  return true;
}

// A month's cycle test only becomes available once every week inside it has taken its
// own weekly cycle test (any score — revision, not a gate).
export function isMonthTestUnlocked(monthNumber: number, bestWeekScores?: Map<number, number>): boolean {
  return getMonthWeekNumbers(monthNumber).every((w) => hasWeekBeenAttempted(w, bestWeekScores));
}

export function isDayUnlocked(
  dayNumber: number,
  allProgress: Map<number, DayProgressRow>,
  bestScores?: Map<number, number>,
  bestWeekScores?: Map<number, number>,
  bestMonthScores?: Map<number, number>
): boolean {
  if (dayNumber <= 1) return true;
  const prevDay = dayNumber - 1;
  if (!hasDayPassed(prevDay, bestScores)) return false;
  // Crossing a week boundary also requires that week's cycle test to have been taken
  // (any score — it's revision, not a gate), and crossing a month boundary (every 4th
  // week) additionally requires the month's to have been taken too.
  if (isWeekEndDay(prevDay) && !hasWeekBeenAttempted(getWeekNumberForDay(prevDay), bestWeekScores)) return false;
  if (
    isMonthEndDay(prevDay) &&
    !hasMonthBeenAttempted(getMonthNumberForWeek(getWeekNumberForDay(prevDay)), bestMonthScores)
  ) {
    return false;
  }
  return true;
}

export function isFullMockUnlocked(
  allProgress: Map<number, DayProgressRow>,
  lastDayNumber: number,
  bestScores?: Map<number, number>,
  bestWeekScores?: Map<number, number>,
  bestMonthScores?: Map<number, number>
): boolean {
  if (!hasDayPassed(lastDayNumber, bestScores)) return false;
  const lastWeek = getWeekNumberForDay(lastDayNumber);
  if (!hasWeekBeenAttempted(lastWeek, bestWeekScores)) return false;
  return hasMonthBeenAttempted(getMonthNumberForWeek(lastWeek), bestMonthScores);
}
