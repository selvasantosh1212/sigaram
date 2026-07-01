import { getDb, rowsToObjects } from "./db";
import { scoreAttempt, type AnsweredQuestion } from "./scoring";
import { markMockSubmitted } from "./progress";
import type { Part } from "./types";

export type QuestionInstance = {
  part: Part;
  topicId: string;
  unitId: string;
  questionId: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  sourceTag: string;
};

export type AttemptRow = {
  id: number;
  day_number: number | null;
  week_number: number | null;
  month_number: number | null;
  attempt_kind: "daily" | "weekly" | "monthly" | "full_mock" | "revision";
  session_label: string | null;
  started_at: string;
  submitted_at: string | null;
  duration_seconds: number | null;
  total_questions: number;
  correct_count: number | null;
  score_percent: number | null;
  part_a_correct: number | null;
  part_a_total: number | null;
  part_b_correct: number | null;
  part_b_total: number | null;
  part_c_correct: number | null;
  part_c_total: number | null;
};

export type DraftAttempt = {
  attemptId: number;
  questions: Array<QuestionInstance & { answerRowId: number }>;
};

export async function createDraftAttempt(params: {
  dayNumber?: number;
  weekNumber?: number;
  monthNumber?: number;
  attemptKind: "daily" | "weekly" | "monthly" | "full_mock" | "revision";
  sessionLabel?: string;
  questions: QuestionInstance[];
}): Promise<DraftAttempt> {
  const db = await getDb();
  const info = await db.execute({
    sql: `INSERT INTO attempts (day_number, week_number, month_number, attempt_kind, session_label, started_at, total_questions)
   VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      params.dayNumber ?? null,
      params.weekNumber ?? null,
      params.monthNumber ?? null,
      params.attemptKind,
      params.sessionLabel ?? null,
      new Date().toISOString(),
      params.questions.length,
    ],
  });
  const attemptId = Number(info.lastInsertRowid);

  // Batched into a single round-trip (rather than one await per question) — with up to
  // 50 questions for a weekly cycle test, sequential round-trips to a remote Turso DB
  // routinely approached serverless function time limits.
  const answerResults = params.questions.length
    ? await db.batch(
        params.questions.map((q) => ({
          sql: `INSERT INTO attempt_answers (attempt_id, part, topic_id, unit_id, question_id, difficulty, source_tag, correct_index, selected_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
          args: [attemptId, q.part, q.topicId, q.unitId, q.questionId, q.difficulty, q.sourceTag, q.correctIndex],
        })),
        "write"
      )
    : [];
  const rowIds = answerResults.map((r) => Number(r.lastInsertRowid));

  return {
    attemptId,
    questions: params.questions.map((q, i) => ({ ...q, answerRowId: rowIds[i] })),
  };
}

export async function getAttempt(attemptId: number): Promise<AttemptRow | undefined> {
  const db = await getDb();
  const rs = await db.execute({ sql: "SELECT * FROM attempts WHERE id = ?", args: [attemptId] });
  return rowsToObjects(rs)[0] as AttemptRow | undefined;
}

type AttemptAnswerRow = {
  id: number;
  attempt_id: number;
  part: Part;
  topic_id: string;
  unit_id: string;
  question_id: string;
  difficulty: "easy" | "medium" | "hard";
  selected_index: number | null;
  correct_index: number;
  is_correct: number | null;
};

export async function getAttemptAnswers(attemptId: number): Promise<AttemptAnswerRow[]> {
  const db = await getDb();
  const rs = await db.execute({
    sql: "SELECT * FROM attempt_answers WHERE attempt_id = ? ORDER BY id",
    args: [attemptId],
  });
  return rowsToObjects(rs) as AttemptAnswerRow[];
}

export async function submitAttempt(
  attemptId: number,
  answers: Array<{ answerRowId: number; selectedIndex: number | null }>
) {
  const attempt = await getAttempt(attemptId);
  if (!attempt) throw new Error(`Attempt ${attemptId} not found`);

  const existingRows = await getAttemptAnswers(attemptId);
  const selectedByRowId = new Map(answers.map((a) => [a.answerRowId, a.selectedIndex]));

  const answered: AnsweredQuestion[] = existingRows.map((row) => ({
    part: row.part,
    topicId: row.topic_id,
    unitId: row.unit_id,
    questionId: row.question_id,
    difficulty: row.difficulty,
    correctIndex: row.correct_index,
    selectedIndex: selectedByRowId.get(row.id) ?? null,
  }));

  const summary = scoreAttempt(answered);
  const submittedAt = new Date();
  const startedAt = new Date(attempt.started_at);
  const durationSeconds = Math.max(0, Math.round((submittedAt.getTime() - startedAt.getTime()) / 1000));

  const db = await getDb();
  // Batched into a single round-trip — see createDraftAttempt for why per-row awaits
  // don't scale to a 50-question weekly cycle test on a remote DB.
  await db.batch(
    [
      ...existingRows.map((row) => {
        const sel = selectedByRowId.get(row.id) ?? null;
        const isCorrect = sel !== null && sel === row.correct_index ? 1 : 0;
        return {
          sql: "UPDATE attempt_answers SET selected_index = ?, is_correct = ? WHERE id = ?",
          args: [sel, isCorrect, row.id],
        };
      }),
      {
        sql: `UPDATE attempts SET submitted_at = ?, duration_seconds = ?, correct_count = ?, score_percent = ?,
       part_a_correct = ?, part_a_total = ?, part_b_correct = ?, part_b_total = ?, part_c_correct = ?, part_c_total = ?
     WHERE id = ?`,
        args: [
          submittedAt.toISOString(),
          durationSeconds,
          summary.correctCount,
          summary.scorePercent,
          summary.byPart.A.correct,
          summary.byPart.A.total,
          summary.byPart.B.correct,
          summary.byPart.B.total,
          summary.byPart.C.correct,
          summary.byPart.C.total,
          attemptId,
        ],
      },
    ],
    "write"
  );

  if (attempt.attempt_kind === "daily" && attempt.day_number != null) {
    await markMockSubmitted(attempt.day_number);
  }

  return summary;
}

export async function getAllAttemptsForDay(dayNumber: number): Promise<AttemptRow[]> {
  const db = await getDb();
  const rs = await db.execute({
    sql: "SELECT * FROM attempts WHERE day_number = ? AND submitted_at IS NOT NULL ORDER BY submitted_at DESC",
    args: [dayNumber],
  });
  return rowsToObjects(rs) as AttemptRow[];
}

export async function getLatestAttemptForDay(dayNumber: number): Promise<AttemptRow | undefined> {
  const db = await getDb();
  const rs = await db.execute({
    sql: "SELECT * FROM attempts WHERE day_number = ? AND submitted_at IS NOT NULL ORDER BY submitted_at DESC LIMIT 1",
    args: [dayNumber],
  });
  return rowsToObjects(rs)[0] as AttemptRow | undefined;
}

export async function getAllAttemptsForWeek(weekNumber: number): Promise<AttemptRow[]> {
  const db = await getDb();
  const rs = await db.execute({
    sql: "SELECT * FROM attempts WHERE week_number = ? AND attempt_kind = 'weekly' AND submitted_at IS NOT NULL ORDER BY submitted_at DESC",
    args: [weekNumber],
  });
  return rowsToObjects(rs) as AttemptRow[];
}

export async function getLatestAttemptForWeek(weekNumber: number): Promise<AttemptRow | undefined> {
  const db = await getDb();
  const rs = await db.execute({
    sql: "SELECT * FROM attempts WHERE week_number = ? AND attempt_kind = 'weekly' AND submitted_at IS NOT NULL ORDER BY submitted_at DESC LIMIT 1",
    args: [weekNumber],
  });
  return rowsToObjects(rs)[0] as AttemptRow | undefined;
}

export async function getAllAttemptsForMonth(monthNumber: number): Promise<AttemptRow[]> {
  const db = await getDb();
  const rs = await db.execute({
    sql: "SELECT * FROM attempts WHERE month_number = ? AND attempt_kind = 'monthly' AND submitted_at IS NOT NULL ORDER BY submitted_at DESC",
    args: [monthNumber],
  });
  return rowsToObjects(rs) as AttemptRow[];
}

export async function getLatestAttemptForMonth(monthNumber: number): Promise<AttemptRow | undefined> {
  const db = await getDb();
  const rs = await db.execute({
    sql: "SELECT * FROM attempts WHERE month_number = ? AND attempt_kind = 'monthly' AND submitted_at IS NOT NULL ORDER BY submitted_at DESC LIMIT 1",
    args: [monthNumber],
  });
  return rowsToObjects(rs)[0] as AttemptRow | undefined;
}

export async function getAllAttempts(): Promise<AttemptRow[]> {
  const db = await getDb();
  const rs = await db.execute("SELECT * FROM attempts WHERE submitted_at IS NOT NULL ORDER BY submitted_at ASC");
  return rowsToObjects(rs) as AttemptRow[];
}

export type WrongAnswerRef = { topicId: string; questionId: string; part: Part };

// One row per (topic, question) where the MOST RECENT scored attempt at it was wrong —
// a question you've since gotten right (in any attempt kind) naturally drops out.
export async function getWrongAnswerRefs(): Promise<WrongAnswerRef[]> {
  const db = await getDb();
  const rs = await db.execute(
    `SELECT topic_id, question_id, part FROM attempt_answers
       WHERE id IN (
         SELECT MAX(id) FROM attempt_answers WHERE is_correct IS NOT NULL GROUP BY topic_id, question_id
       ) AND is_correct = 0`
  );
  const rows = rowsToObjects(rs) as Array<{ topic_id: string; question_id: string; part: Part }>;
  return rows.map((r) => ({ topicId: r.topic_id, questionId: r.question_id, part: r.part }));
}
