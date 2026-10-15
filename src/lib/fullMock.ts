import { getDb, rowsToObjects } from "./db";
import { buildFullMockSession, historyKey, type FullMockQuestion, type QuestionHistory } from "./fullMockSelection";

export type { FullMockQuestion };

// Wrong answers seen in this many of the latest full mocks are held back, so a retry
// comes a few sessions later rather than straight away.
const RETRY_SPACING_SESSIONS = 3;

// Every question the reader has been shown, across ALL test kinds (daily, weekly,
// monthly, revision, full mock) — the repeat complaint spans every level of test.
export async function getQuestionHistory(): Promise<QuestionHistory> {
  const db = await getDb();
  const rows = rowsToObjects(
    await db.execute("SELECT topic_id, question_id, attempt_id, is_correct FROM attempt_answers ORDER BY id")
  ) as Array<{ topic_id: string; question_id: string; attempt_id: number; is_correct: number | null }>;

  const seen: QuestionHistory["seen"] = new Map();
  for (const r of rows) {
    const key = historyKey(r.topic_id, r.question_id);
    const prev = seen.get(key);
    seen.set(key, {
      count: (prev?.count ?? 0) + 1,
      lastAttemptId: Number(r.attempt_id),
      // An unsubmitted draft doesn't overwrite a real earlier result.
      lastCorrect: r.is_correct == null ? (prev?.lastCorrect ?? null) : r.is_correct === 1,
    });
  }

  const recent = rowsToObjects(
    await db.execute({
      sql: "SELECT id FROM attempts WHERE attempt_kind = 'full_mock' ORDER BY id DESC LIMIT ?",
      args: [RETRY_SPACING_SESSIONS],
    })
  ) as Array<{ id: number }>;

  return { seen, recentFullMockAttemptIds: new Set(recent.map((r) => Number(r.id))) };
}

export async function generateFullMockSession(): Promise<FullMockQuestion[]> {
  return buildFullMockSession(await getQuestionHistory());
}
