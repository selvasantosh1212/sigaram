import { getDb, rowsToObjects } from "./db";
import { getAllDays } from "./content";
import { getTopicAccuracy } from "./analytics";

// Part A's slot switches from new core-syllabus topics to current-affairs once the
// core 53 are exhausted (see projectplan.md) — that's exactly where Part A's content
// stops getting a fresh first pass and needs a spaced-revision mechanism instead, since
// nothing else resurfaces it before Phase 2 (full-mock, which only starts after Day 119).
const REVISION_INTERVAL = 3;
const RECENT_EXCLUSION_WINDOW = 5;

function isCurrentAffairsTopic(topicId: string): boolean {
  return topicId.includes("current-affairs");
}

function getRevisionStartDay(): number {
  const days = getAllDays();
  const firstCurrentAffairsDay = days.find((d) => isCurrentAffairsTopic(d.partATopicId))?.dayNumber;
  return firstCurrentAffairsDay ?? 54;
}

// The pool to revise: every distinct Part A topic from before current-affairs took
// over the slot — i.e. the original, one-pass-only core syllabus topics.
function getRevisionTopicPool(): string[] {
  const days = getAllDays();
  const startDay = getRevisionStartDay();
  const pool = new Set(
    days.filter((d) => d.dayNumber < startDay).map((d) => d.partATopicId)
  );
  return Array.from(pool);
}

export function isRevisionDay(dayNumber: number): boolean {
  const startDay = getRevisionStartDay();
  return dayNumber >= startDay && (dayNumber - startDay) % REVISION_INTERVAL === 0;
}

async function getRecentRevisionTopicIds(limit: number): Promise<string[]> {
  const db = await getDb();
  const rs = await db.execute({
    sql: "SELECT topic_id FROM day_revision_picks ORDER BY day_number DESC LIMIT ?",
    args: [limit],
  });
  const rows = rowsToObjects(rs) as Array<{ topic_id: string }>;
  return rows.map((r) => r.topic_id);
}

function weightedRandomPick(items: string[], weights: number[]): string {
  const total = weights.reduce((sum, w) => sum + w, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return items[i];
  }
  return items[items.length - 1];
}

async function pickRevisionTopic(): Promise<string> {
  const pool = getRevisionTopicPool();
  const recent = new Set(await getRecentRevisionTopicIds(RECENT_EXCLUSION_WINDOW));
  const candidates = pool.filter((id) => !recent.has(id));
  const usable = candidates.length > 0 ? candidates : pool;

  const accuracy = await getTopicAccuracy();
  const weights = usable.map((id) => {
    const acc = accuracy.get(id);
    const accuracyPercent = acc && acc.total > 0 ? acc.accuracyPercent : 50;
    return Math.max(5, 100 - accuracyPercent); // floor so even a 100%-accurate topic keeps a small chance
  });
  return weightedRandomPick(usable, weights);
}

export type RevisionTopicPick = { topicId: string; accuracy: { correct: number; total: number; accuracyPercent: number } | null };

// Stable per-day pick: computed once on first visit, then persisted so revisiting the
// same day's page (or restarting its mock) always shows the same revision topic.
export async function getOrCreateRevisionTopicForDay(dayNumber: number): Promise<RevisionTopicPick | null> {
  if (!isRevisionDay(dayNumber)) return null;

  const db = await getDb();
  const existingRs = await db.execute({
    sql: "SELECT topic_id FROM day_revision_picks WHERE day_number = ?",
    args: [dayNumber],
  });
  const existing = rowsToObjects(existingRs)[0] as { topic_id: string } | undefined;

  const topicId = existing?.topic_id ?? (await pickRevisionTopic());
  if (!existing) {
    await db.execute({
      sql: "INSERT INTO day_revision_picks (day_number, topic_id, created_at) VALUES (?, ?, ?)",
      args: [dayNumber, topicId, new Date().toISOString()],
    });
  }

  const accuracy = (await getTopicAccuracy()).get(topicId) ?? null;
  return { topicId, accuracy };
}
