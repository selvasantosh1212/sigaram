import { getDb } from "./db";

export function isBookmarked(topicId: string, qaId: string): boolean {
  const row = getDb()
    .prepare("SELECT 1 FROM qa_bookmarks WHERE topic_id = ? AND qa_id = ?")
    .get(topicId, qaId);
  return !!row;
}

// Batched lookup for rendering a whole day (3 topics) without one query per QA item.
export function getBookmarksForTopics(topicIds: string[]): Set<string> {
  if (topicIds.length === 0) return new Set();
  const placeholders = topicIds.map(() => "?").join(",");
  const rows = getDb()
    .prepare(`SELECT topic_id, qa_id FROM qa_bookmarks WHERE topic_id IN (${placeholders})`)
    .all(...topicIds) as Array<{ topic_id: string; qa_id: string }>;
  return new Set(rows.map((r) => `${r.topic_id}:${r.qa_id}`));
}

export function toggleBookmark(topicId: string, qaId: string) {
  const db = getDb();
  if (isBookmarked(topicId, qaId)) {
    db.prepare("DELETE FROM qa_bookmarks WHERE topic_id = ? AND qa_id = ?").run(topicId, qaId);
  } else {
    db.prepare("INSERT INTO qa_bookmarks (topic_id, qa_id, created_at) VALUES (?, ?, ?)").run(
      topicId,
      qaId,
      new Date().toISOString()
    );
  }
}
