import { getDb, rowsToObjects } from "./db";

export async function isBookmarked(topicId: string, qaId: string): Promise<boolean> {
  const db = await getDb();
  const rs = await db.execute({
    sql: "SELECT 1 FROM qa_bookmarks WHERE topic_id = ? AND qa_id = ?",
    args: [topicId, qaId],
  });
  return rs.rows.length > 0;
}

// Batched lookup for rendering a whole day (3 topics) without one query per QA item.
export async function getBookmarksForTopics(topicIds: string[]): Promise<Set<string>> {
  if (topicIds.length === 0) return new Set();
  const db = await getDb();
  const placeholders = topicIds.map(() => "?").join(",");
  const rs = await db.execute({
    sql: `SELECT topic_id, qa_id FROM qa_bookmarks WHERE topic_id IN (${placeholders})`,
    args: topicIds,
  });
  const rows = rowsToObjects(rs) as Array<{ topic_id: string; qa_id: string }>;
  return new Set(rows.map((r) => `${r.topic_id}:${r.qa_id}`));
}

export async function toggleBookmark(topicId: string, qaId: string): Promise<void> {
  const db = await getDb();
  if (await isBookmarked(topicId, qaId)) {
    await db.execute({ sql: "DELETE FROM qa_bookmarks WHERE topic_id = ? AND qa_id = ?", args: [topicId, qaId] });
  } else {
    await db.execute({
      sql: "INSERT INTO qa_bookmarks (topic_id, qa_id, created_at) VALUES (?, ?, ?)",
      args: [topicId, qaId, new Date().toISOString()],
    });
  }
}
