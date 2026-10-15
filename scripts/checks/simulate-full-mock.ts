// Simulates N Full Mock sessions against a COPY of the reader's history and reports
// repeats, answer-position balance and unit quotas.
// Run: npx jiti scripts/checks/simulate-full-mock.ts [path/to/progress.db copy] [sessions]
import { createClient } from "@libsql/client";
import { buildFullMockSession, historyKey, unitQuotas, type QuestionHistory } from "../../src/lib/fullMockSelection";

async function main() {
  const dbPath = process.argv[2];
  const sessions = Number(process.argv[3] ?? 120);
  const history: QuestionHistory = { seen: new Map(), recentFullMockAttemptIds: new Set() };
  if (dbPath) {
    const db = createClient({ url: `file:${dbPath}` });
    const rs = await db.execute("SELECT topic_id, question_id, attempt_id, is_correct FROM attempt_answers ORDER BY id");
    for (const r of rs.rows) {
      const key = historyKey(String(r.topic_id), String(r.question_id));
      const prev = history.seen.get(key);
      history.seen.set(key, {
        count: (prev?.count ?? 0) + 1,
        lastAttemptId: Number(r.attempt_id),
        lastCorrect: r.is_correct == null ? (prev?.lastCorrect ?? null) : Number(r.is_correct) === 1,
      });
    }
    console.log(`Loaded history: ${history.seen.size} distinct questions already seen`);
  }
  const priorSeen = new Set(history.seen.keys());

  let attemptId = 1_000_000;
  const recent: number[] = [];
  const fmShown = new Map<string, number>(); // static questions shown within full mock
  // Repeats of a question the reader last got RIGHT — the unwanted kind. Repeats of
  // wrong answers are the deliberate spaced retry.
  const unwanted = new Map<string, number>();
  const unitOf = new Map<string, string>();
  const positions = [0, 0, 0, 0];
  let quotaMismatches = 0;
  const firstRepeatSession: Record<string, number> = {};
  const firstPriorRepeat: Record<string, number> = {};

  for (let s = 1; s <= sessions; s++) {
    attemptId++;
    const qs = buildFullMockSession(s, { seen: history.seen, recentFullMockAttemptIds: new Set(recent) });
    if (qs.length !== 100) console.log(`Session ${s}: ${qs.length} questions`);
    const perUnit = new Map<string, number>();
    for (const q of qs) {
      perUnit.set(q.unitId, (perUnit.get(q.unitId) ?? 0) + 1);
      positions[q.correctIndex]++;
      if (q.correctIndex < 0 || q.correctIndex > 3 || q.options[q.correctIndex] === undefined) console.log("BAD INDEX", q.questionId);
      if (q.questionId.startsWith("gen:")) continue;
      const key = historyKey(q.topicId, q.questionId);
      unitOf.set(key, q.unitId);
      const before = history.seen.get(key);
      if (before && before.lastCorrect !== false) unwanted.set(q.unitId, (unwanted.get(q.unitId) ?? 0) + 1);
      const n = (fmShown.get(key) ?? 0) + 1;
      fmShown.set(key, n);
      if (n === 2 && !(q.unitId in firstRepeatSession)) firstRepeatSession[q.unitId] = s;
      if (priorSeen.has(key) && !(q.unitId in firstPriorRepeat)) firstPriorRepeat[q.unitId] = s;
      const correct = Math.random() < 0.7;
      const prev = history.seen.get(key);
      history.seen.set(key, { count: (prev?.count ?? 0) + 1, lastAttemptId: attemptId, lastCorrect: correct });
    }
    for (const [u, want] of unitQuotas(s)) {
      if ((perUnit.get(u) ?? 0) !== want) {
        quotaMismatches++;
        if (quotaMismatches < 10) console.log(`Session ${s} unit ${u}: got ${perUnit.get(u) ?? 0}, want ${want}`);
      }
    }
    recent.unshift(attemptId);
    recent.length = Math.min(recent.length, 3);
  }

  const maxByUnit = new Map<string, number>();
  for (const [k, n] of fmShown) {
    const u = unitOf.get(k)!;
    maxByUnit.set(u, Math.max(maxByUnit.get(u) ?? 0, n));
  }
  console.log(`\nAfter ${sessions} sessions:`);
  console.log("unit   max-repeats  first-FM-repeat-session  first-session-reusing-a-pre-FM-question  repeats-of-correctly-answered");
  for (const u of [...maxByUnit.keys()].sort()) {
    console.log(`${u.padEnd(7)}${String(maxByUnit.get(u)).padEnd(13)}${String(firstRepeatSession[u] ?? "-").padEnd(25)}${String(firstPriorRepeat[u] ?? "-").padEnd(41)}${unwanted.get(u) ?? 0}`);
  }
  const total = positions.reduce((a, b) => a + b);
  console.log("Answer positions A-D:", positions.map((p) => `${((p / total) * 100).toFixed(1)}%`).join(" "));
  console.log("Quota mismatches:", quotaMismatches);
}
main();
