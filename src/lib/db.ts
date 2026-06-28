import { createClient, type Client, type ResultSet } from "@libsql/client";
import path from "path";
import { mkdirSync } from "fs";

declare global {
  var __tnpscDb: Client | undefined;
  var __tnpscDbReady: Promise<void> | undefined;
}

function createDb(): Client {
  const url = process.env.TURSO_DATABASE_URL;
  if (url) {
    return createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  }
  const dataDir = path.join(process.cwd(), "data");
  mkdirSync(dataDir, { recursive: true });
  return createClient({ url: `file:${path.join(dataDir, "progress.db")}` });
}

async function initSchema(db: Client): Promise<void> {
  if (db.protocol === "file") {
    await db.execute("PRAGMA journal_mode = WAL");
  }
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS day_progress (
      day_number INTEGER PRIMARY KEY,
      part_a_read_at TEXT,
      part_b_read_at TEXT,
      part_c_read_at TEXT,
      mock_started_at TEXT,
      mock_submitted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day_number INTEGER,
      week_number INTEGER,
      month_number INTEGER,
      attempt_kind TEXT NOT NULL,
      session_label TEXT,
      started_at TEXT NOT NULL,
      submitted_at TEXT,
      duration_seconds INTEGER,
      total_questions INTEGER NOT NULL,
      correct_count INTEGER,
      score_percent REAL,
      part_a_correct INTEGER, part_a_total INTEGER,
      part_b_correct INTEGER, part_b_total INTEGER,
      part_c_correct INTEGER, part_c_total INTEGER
    );

    CREATE TABLE IF NOT EXISTS attempt_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      attempt_id INTEGER NOT NULL REFERENCES attempts(id),
      part TEXT NOT NULL,
      topic_id TEXT NOT NULL,
      unit_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      source_tag TEXT NOT NULL DEFAULT 'unknown',
      selected_index INTEGER,
      correct_index INTEGER NOT NULL,
      is_correct INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt ON attempt_answers(attempt_id);
    CREATE INDEX IF NOT EXISTS idx_attempt_answers_unit ON attempt_answers(unit_id);
    CREATE INDEX IF NOT EXISTS idx_attempts_day ON attempts(day_number);

    CREATE TABLE IF NOT EXISTS qa_bookmarks (
      topic_id TEXT NOT NULL,
      qa_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (topic_id, qa_id)
    );

    CREATE TABLE IF NOT EXISTS day_revision_picks (
      day_number INTEGER PRIMARY KEY,
      topic_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  await migrate(db);
}

// Lightweight migration for installs whose attempt_answers table predates the
// source_tag column (added after initial release). Safe to run every startup.
async function migrate(db: Client): Promise<void> {
  const columns = rowsToObjects(await db.execute("PRAGMA table_info(attempt_answers)")) as Array<{ name: string }>;
  const hasSourceTag = columns.some((c) => c.name === "source_tag");
  if (!hasSourceTag) {
    await db.execute("ALTER TABLE attempt_answers ADD COLUMN source_tag TEXT NOT NULL DEFAULT 'unknown'");
  }

  const attemptColumns = rowsToObjects(await db.execute("PRAGMA table_info(attempts)")) as Array<{ name: string }>;
  if (!attemptColumns.some((c) => c.name === "week_number")) {
    await db.execute("ALTER TABLE attempts ADD COLUMN week_number INTEGER");
  }
  if (!attemptColumns.some((c) => c.name === "month_number")) {
    await db.execute("ALTER TABLE attempts ADD COLUMN month_number INTEGER");
  }
  await db.execute("CREATE INDEX IF NOT EXISTS idx_attempts_week ON attempts(week_number)");
  await db.execute("CREATE INDEX IF NOT EXISTS idx_attempts_month ON attempts(month_number)");
}

// Cache the connection on globalThis so Next.js dev-mode hot-reload doesn't
// open a new connection (and re-run the schema bootstrap) on every edit.
export async function getDb(): Promise<Client> {
  if (!global.__tnpscDb) {
    global.__tnpscDb = createDb();
    global.__tnpscDbReady = initSchema(global.__tnpscDb);
  }
  await global.__tnpscDbReady;
  return global.__tnpscDb;
}

// libsql Row objects are array-like with named accessors, not plain objects —
// they don't survive Server Component -> Client Component prop serialization.
// Convert to plain objects everywhere a row crosses that boundary.
export function rowsToObjects(rs: ResultSet): Record<string, unknown>[] {
  return rs.rows.map((row) => Object.fromEntries(rs.columns.map((col, i) => [col, row[i]])));
}
