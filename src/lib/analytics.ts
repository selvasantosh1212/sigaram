import { getDb } from "./db";

export type ScoreTrendPoint = {
  attemptId: number;
  label: string;
  submittedAt: string;
  scorePercent: number;
  durationSeconds: number;
};

// Daily-practice and full-mock attempts have very different lengths (~34 vs 100
// questions) and cadence, so they're queried — and charted — separately rather
// than as one mixed trend line.
function queryScoreTrend(attemptKind: "daily" | "full_mock"): ScoreTrendPoint[] {
  const rows = getDb()
    .prepare(
      `SELECT id, day_number, session_label, submitted_at, score_percent, duration_seconds
       FROM attempts WHERE submitted_at IS NOT NULL AND attempt_kind = ? ORDER BY submitted_at ASC`
    )
    .all(attemptKind) as Array<{
    id: number;
    day_number: number | null;
    session_label: string | null;
    submitted_at: string;
    score_percent: number;
    duration_seconds: number;
  }>;

  return rows.map((r) => ({
    attemptId: r.id,
    label: r.day_number != null ? `Day ${r.day_number}` : r.session_label ?? `Attempt ${r.id}`,
    submittedAt: r.submitted_at,
    scorePercent: Math.round(r.score_percent * 10) / 10,
    durationSeconds: r.duration_seconds,
  }));
}

export function getDailyScoreTrend(): ScoreTrendPoint[] {
  return queryScoreTrend("daily");
}

export function getFullMockScoreTrend(): ScoreTrendPoint[] {
  return queryScoreTrend("full_mock");
}

export type PartAccuracy = { part: "A" | "B" | "C"; correct: number; total: number; accuracyPercent: number };

export function getPartAccuracy(): PartAccuracy[] {
  const rows = getDb()
    .prepare(
      `SELECT part, SUM(is_correct) as correct, COUNT(*) as total
       FROM attempt_answers WHERE selected_index IS NOT NULL OR is_correct IS NOT NULL
       GROUP BY part`
    )
    .all() as Array<{ part: "A" | "B" | "C"; correct: number; total: number }>;

  const byPart = new Map(rows.map((r) => [r.part, r]));
  return (["A", "B", "C"] as const).map((part) => {
    const r = byPart.get(part);
    const correct = r?.correct ?? 0;
    const total = r?.total ?? 0;
    return { part, correct, total, accuracyPercent: total === 0 ? 0 : Math.round((correct / total) * 1000) / 10 };
  });
}

export type UnitAccuracy = { unitId: string; correct: number; total: number; accuracyPercent: number };

export function getUnitAccuracy(): UnitAccuracy[] {
  const rows = getDb()
    .prepare(
      `SELECT unit_id, SUM(is_correct) as correct, COUNT(*) as total
       FROM attempt_answers WHERE is_correct IS NOT NULL
       GROUP BY unit_id`
    )
    .all() as Array<{ unit_id: string; correct: number; total: number }>;

  return rows
    .map((r) => ({
      unitId: r.unit_id,
      correct: r.correct,
      total: r.total,
      accuracyPercent: r.total === 0 ? 0 : Math.round((r.correct / r.total) * 1000) / 10,
    }))
    .sort((a, b) => a.accuracyPercent - b.accuracyPercent);
}

export type TopicAccuracy = { topicId: string; correct: number; total: number; accuracyPercent: number };

function queryTopicAccuracyRows(): TopicAccuracy[] {
  const rows = getDb()
    .prepare(
      `SELECT topic_id, SUM(is_correct) as correct, COUNT(*) as total
       FROM attempt_answers WHERE is_correct IS NOT NULL
       GROUP BY topic_id`
    )
    .all() as Array<{ topic_id: string; correct: number; total: number }>;

  return rows.map((r) => ({
    topicId: r.topic_id,
    correct: r.correct,
    total: r.total,
    accuracyPercent: r.total === 0 ? 0 : Math.round((r.correct / r.total) * 1000) / 10,
  }));
}

// Per-topic (not per-unit) accuracy — used to weight which topic the spaced-revision
// picker resurfaces, since a unit can span several topics of very different strength.
export function getTopicAccuracy(): Map<string, TopicAccuracy> {
  return new Map(queryTopicAccuracyRows().map((r) => [r.topicId, r]));
}

export type ConfidenceLevel = "weak" | "moderate" | "strong";

// No self-rated confidence exists in the schema, so confidence is derived from accuracy —
// same 50/75 thresholds the dashboard already uses to color-code "weakest units".
export function getConfidenceLevel(accuracyPercent: number): ConfidenceLevel {
  if (accuracyPercent < 50) return "weak";
  if (accuracyPercent < 75) return "moderate";
  return "strong";
}

export type TopicLevelStat = TopicAccuracy & { confidence: ConfidenceLevel };

// Topic-level breakdown for the dashboard: how many questions have actually been sat for
// each topic, plus a derived confidence band. Only topics with at least one attempt are
// returned — the syllabus has 200+ topics and most won't have been reached yet.
export function getTopicLevelStats(): TopicLevelStat[] {
  return queryTopicAccuracyRows()
    .filter((t) => t.total > 0)
    .map((t) => ({ ...t, confidence: getConfidenceLevel(t.accuracyPercent) }))
    .sort((a, b) => a.accuracyPercent - b.accuracyPercent);
}

export type DifficultyAccuracy = { difficulty: "easy" | "medium" | "hard"; correct: number; total: number; accuracyPercent: number };

export function getDifficultyAccuracy(): DifficultyAccuracy[] {
  const rows = getDb()
    .prepare(
      `SELECT difficulty, SUM(is_correct) as correct, COUNT(*) as total
       FROM attempt_answers WHERE is_correct IS NOT NULL
       GROUP BY difficulty`
    )
    .all() as Array<{ difficulty: "easy" | "medium" | "hard"; correct: number; total: number }>;

  const byDiff = new Map(rows.map((r) => [r.difficulty, r]));
  return (["easy", "medium", "hard"] as const).map((difficulty) => {
    const r = byDiff.get(difficulty);
    const correct = r?.correct ?? 0;
    const total = r?.total ?? 0;
    return { difficulty, correct, total, accuracyPercent: total === 0 ? 0 : Math.round((correct / total) * 1000) / 10 };
  });
}

export type TimeOfDayBucket = { hour: number; count: number };

export function getTimeOfDayDistribution(): TimeOfDayBucket[] {
  const rows = getDb()
    .prepare(`SELECT submitted_at FROM attempts WHERE submitted_at IS NOT NULL`)
    .all() as Array<{ submitted_at: string }>;

  const counts = new Array(24).fill(0);
  for (const r of rows) {
    const hour = new Date(r.submitted_at).getHours();
    counts[hour] += 1;
  }
  return counts.map((count, hour) => ({ hour, count }));
}

// A day only counts as "completed" once its mock score has cleared the unlock
// bar (see PASS_THRESHOLD_PERCENT in progress.ts) — submitting below that bar
// just means a retake is due, not that the day is done.
export function getCompletedDaysCount(): number {
  const row = getDb()
    .prepare(
      `SELECT COUNT(DISTINCT day_number) as c FROM attempts
       WHERE attempt_kind = 'daily' AND submitted_at IS NOT NULL AND day_number IS NOT NULL
         AND score_percent >= 80`
    )
    .get() as { c: number };
  return row.c;
}

export function getAverageDuration(): number {
  const row = getDb()
    .prepare("SELECT AVG(duration_seconds) as avg FROM attempts WHERE duration_seconds IS NOT NULL")
    .get() as { avg: number | null };
  return row.avg ? Math.round(row.avg) : 0;
}

export type SourceTagAccuracy = { sourceTag: string; correct: number; total: number; accuracyPercent: number };

// A content-quality signal (is real past-paper evidence easier than authored-from-scratch
// content?) rather than a user-performance signal, but it's free given the schema.
export function getSourceTagAccuracy(): SourceTagAccuracy[] {
  const rows = getDb()
    .prepare(
      `SELECT source_tag, SUM(is_correct) as correct, COUNT(*) as total
       FROM attempt_answers WHERE is_correct IS NOT NULL
       GROUP BY source_tag`
    )
    .all() as Array<{ source_tag: string; correct: number; total: number }>;

  return rows
    .map((r) => ({
      sourceTag: r.source_tag,
      correct: r.correct,
      total: r.total,
      accuracyPercent: r.total === 0 ? 0 : Math.round((r.correct / r.total) * 1000) / 10,
    }))
    .sort((a, b) => b.total - a.total);
}

export type StreakInfo = { currentStreak: number; longestStreak: number };

// A "streak day" is any day with mock_submitted_at set, counted by calendar date
// (not day_number) so a user who does 2 days' worth of work in one sitting still
// only banks consecutive *days*, not consecutive *submissions*.
export function getStreaks(): StreakInfo {
  const rows = getDb()
    .prepare(`SELECT mock_submitted_at FROM day_progress WHERE mock_submitted_at IS NOT NULL ORDER BY mock_submitted_at ASC`)
    .all() as Array<{ mock_submitted_at: string }>;

  if (rows.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const dateStrings = Array.from(
    new Set(rows.map((r) => new Date(r.mock_submitted_at).toISOString().slice(0, 10)))
  ).sort();

  let longestStreak = 1;
  let runningStreak = 1;
  for (let i = 1; i < dateStrings.length; i++) {
    const prev = new Date(dateStrings[i - 1]);
    const curr = new Date(dateStrings[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86_400_000);
    runningStreak = diffDays === 1 ? runningStreak + 1 : 1;
    longestStreak = Math.max(longestStreak, runningStreak);
  }

  const today = new Date().toISOString().slice(0, 10);
  const lastDate = dateStrings[dateStrings.length - 1];
  const daysSinceLast = Math.round((new Date(today).getTime() - new Date(lastDate).getTime()) / 86_400_000);
  const currentStreak = daysSinceLast <= 1 ? runningStreak : 0;

  return { currentStreak, longestStreak };
}

// Days since the last submitted mock (any kind) — null if nothing's been submitted yet.
// Used to nudge Kirthi back in gently after a gap, without needing the full streak calc.
export function getDaysSinceLastActivity(): number | null {
  const row = getDb()
    .prepare(`SELECT MAX(submitted_at) as last FROM attempts WHERE submitted_at IS NOT NULL`)
    .get() as { last: string | null };
  if (!row?.last) return null;
  const lastDate = new Date(row.last).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  return Math.round((new Date(today).getTime() - new Date(lastDate).getTime()) / 86_400_000);
}
