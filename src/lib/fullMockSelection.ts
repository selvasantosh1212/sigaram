import { existsSync, readFileSync, readdirSync } from "fs";
import path from "path";
import { z } from "zod";
import { getAllTopics, getSyllabusParts } from "./content";
import { GENERATOR_TOPICS, generateFromFamily } from "./generators";
import { shuffleOptions } from "./optionShuffle";
import { MockQuestionSchema, type Part, type QuestionSnapshot } from "./types";

// Pure session builder for Full Mock — no DB access, so scripts can simulate many
// sessions. fullMock.ts feeds it the reader's real question history.

// The real paper: 200 questions, 300 marks (1.5 each, no negative marking), 3 hours.
export const FULL_PAPER_MINUTES = 180;
export const MARKS_PER_QUESTION = 1.5;

export type FullMockQuestion = {
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
  trick?: string;
  snapshot: QuestionSnapshot;
};

export type QuestionHistory = {
  // Keyed by `${topicId}|${questionId}`.
  seen: Map<string, { count: number; lastAttemptId: number; lastCorrect: boolean | null }>;
  // The most recent few full-mock attempt ids — wrong answers seen in these are held
  // back so a retry is spaced out rather than immediate.
  recentFullMockAttemptIds: Set<number>;
};

export const historyKey = (topicId: string, questionId: string) => `${topicId}|${questionId}`;

// ---------- Unit quotas ----------

// Each unit's question count in the real 200-question paper (syllabus metadata).
export function unitQuotas(): Map<string, number> {
  const quotas = new Map<string, number>();
  for (const part of getSyllabusParts()) {
    for (const unit of part.units) quotas.set(unit.id, unit.questionCount);
  }
  return quotas;
}

// ---------- Static pool (topic files + full-mock bank) ----------

const BANK_DIR = path.join(process.cwd(), "content", "full-mock-bank");

const BankQuestionSchema = MockQuestionSchema.extend({
  topicId: z.string(),
  passageId: z.string().optional(),
});

const BankFileSchema = z.object({
  unitId: z.string(),
  passages: z.array(z.object({ id: z.string(), title: z.string().optional(), text: z.string() })).default([]),
  questions: z.array(BankQuestionSchema),
});

export type BankFile = z.infer<typeof BankFileSchema>;

type PoolItem = {
  part: Part;
  unitId: string;
  topicId: string;
  topicName: string;
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  sourceTag: string;
  trick?: string;
  // Questions sharing a passage are picked and shown together, in order.
  groupId?: string;
};

export function loadBankFiles(): BankFile[] {
  if (!existsSync(BANK_DIR)) return [];
  const files: BankFile[] = [];
  for (const f of readdirSync(BANK_DIR).filter((f) => f.endsWith(".json"))) {
    // A bad bank file shouldn't take Full Mock down — skip it (validate-bank.ts flags it).
    try {
      files.push(BankFileSchema.parse(JSON.parse(readFileSync(path.join(BANK_DIR, f), "utf8"))));
    } catch (e) {
      console.error(`Skipping invalid full-mock bank file ${f}:`, (e as Error).message);
    }
  }
  return files;
}

let poolCache: Map<string, PoolItem[]> | null = null;

function staticPoolByUnit(): Map<string, PoolItem[]> {
  if (poolCache) return poolCache;
  const byUnit = new Map<string, PoolItem[]>();
  const add = (item: PoolItem) => {
    if (!byUnit.has(item.unitId)) byUnit.set(item.unitId, []);
    byUnit.get(item.unitId)!.push(item);
  };
  const topics = getAllTopics();
  const topicNames = new Map(topics.map((t) => [t.topicId, t.name]));

  for (const topic of topics) {
    const part = topic.topicId[0].toUpperCase() as Part;
    for (const q of topic.mockTest.questions) {
      add({ part, unitId: topic.unitId, topicId: topic.topicId, topicName: topic.name, ...q });
    }
  }

  for (const bank of loadBankFiles()) {
    const passages = new Map(bank.passages.map((p) => [p.id, p]));
    for (const q of bank.questions) {
      const passage = q.passageId ? passages.get(q.passageId) : undefined;
      add({
        part: bank.unitId[0] as Part,
        unitId: bank.unitId,
        topicId: q.topicId,
        topicName: topicNames.get(q.topicId) ?? bank.unitId,
        id: q.id,
        prompt: passage ? `${passage.title ? `${passage.title}\n\n` : ""}${passage.text}\n\n${q.prompt}` : q.prompt,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        difficulty: q.difficulty,
        sourceTag: q.sourceTag,
        trick: q.trick,
        groupId: q.passageId ? `${bank.unitId}:${q.passageId}` : undefined,
      });
    }
  }
  poolCache = byUnit;
  return byUnit;
}

// ---------- Selection ----------

const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function shuffleInPlace<T>(arr: T[], random: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Lower rank = shown sooner. 0: never seen anywhere. 1: last answered wrong and not in
// the last few full mocks (spaced retry). 2+: seen before — oldest sighting first.
function rank(item: PoolItem, history: QuestionHistory): number {
  const h = history.seen.get(historyKey(item.topicId, item.id));
  if (!h) return 0;
  if (h.lastCorrect === false && !history.recentFullMockAttemptIds.has(h.lastAttemptId)) return 1;
  return 2 + h.lastAttemptId / 1e6 + h.count;
}

type Unit = PoolItem[]; // one question, or a whole passage group

function pickStatic(
  pool: PoolItem[],
  quota: number,
  history: QuestionHistory,
  random: () => number,
  usedPrompts: Set<string>
): PoolItem[] {
  if (quota <= 0) return [];
  const units = new Map<string, Unit>();
  for (const item of pool) {
    const key = item.groupId ?? `${item.topicId}|${item.id}`;
    if (!units.has(key)) units.set(key, []);
    units.get(key)!.push(item);
  }
  // Random tiebreak first, then a stable sort by rank keeps ties shuffled.
  const ranked = shuffleInPlace([...units.values()], random)
    .map((u) => ({ u, r: Math.max(...u.map((i) => rank(i, history))) }))
    .sort((a, b) => a.r - b.r);

  const perTopicCap = Math.max(2, Math.ceil(quota / 5));
  const perTopic = new Map<string, number>();
  const chosen: PoolItem[] = [];
  const tryTake = (unit: Unit, enforceCap: boolean) => {
    if (chosen.length + unit.length > quota && chosen.length > 0) return false;
    if (unit.some((i) => usedPrompts.has(normalise(i.prompt)))) return false;
    const topic = unit[0].topicId;
    if (enforceCap && (perTopic.get(topic) ?? 0) + unit.length > Math.max(perTopicCap, unit.length)) return false;
    chosen.push(...unit.slice(0, Math.max(1, quota - chosen.length)));
    unit.forEach((i) => usedPrompts.add(normalise(i.prompt)));
    perTopic.set(topic, (perTopic.get(topic) ?? 0) + unit.length);
    return true;
  };
  for (const { u } of ranked) if (chosen.length < quota) tryTake(u, true);
  // Small units can't always satisfy the per-topic cap — fill the rest without it.
  for (const { u } of ranked) if (chosen.length < quota && !chosen.includes(u[0])) tryTake(u, false);
  return chosen;
}

function toQuestion(item: PoolItem, random: () => number): FullMockQuestion {
  const shuffled = shuffleOptions(item.options, item.correctIndex, random, item.prompt);
  return {
    part: item.part,
    topicId: item.topicId,
    unitId: item.unitId,
    questionId: item.id,
    prompt: item.prompt,
    options: shuffled.options,
    correctIndex: shuffled.correctIndex,
    explanation: item.explanation,
    difficulty: item.difficulty,
    sourceTag: item.sourceTag,
    trick: item.trick,
    snapshot: {
      prompt: item.prompt,
      options: shuffled.options,
      correctIndex: shuffled.correctIndex,
      explanation: item.explanation,
      sourceTag: item.sourceTag,
      trick: item.trick,
    },
  };
}

// How many of a unit's slots go to freshly generated questions. Aptitude is fully
// computable; in Reasoning only number series and alphanumeric are, so dice, visual,
// puzzles and logical reasoning still come from the static pool.
const GENERATED_SHARE: Record<string, number> = { "B-I": 1, "B-II": 0.4 };

function generateForUnit(unitId: string, count: number, random: () => number, usedPrompts: Set<string>): PoolItem[] {
  const topics = GENERATOR_TOPICS.filter((t) => t.unitId === unitId);
  const out: PoolItem[] = [];
  const topicNames = new Map(getAllTopics().map((t) => [t.topicId, t.name]));
  // Round-robin over a shuffled topic order so one session spreads across topics.
  const order = shuffleInPlace([...topics], random);
  for (let i = 0, guard = 0; out.length < count && guard < count * 20; i++, guard++) {
    const topic = order[i % order.length];
    const family = topic.families[Math.floor(random() * topic.families.length)];
    const q = generateFromFamily(topic, family, Math.floor(random() * 2 ** 31));
    if (!q || usedPrompts.has(normalise(q.prompt + q.options.join("|")))) continue;
    usedPrompts.add(normalise(q.prompt + q.options.join("|")));
    out.push({
      part: unitId[0] as Part,
      unitId,
      topicId: q.topicId,
      topicName: topicNames.get(q.topicId) ?? q.topicId,
      id: q.questionId,
      prompt: q.prompt,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      difficulty: q.difficulty,
      sourceTag: "generated",
      trick: q.trick,
    });
  }
  return out;
}

// One full paper, laid out like the real booklet: Part A General Studies (Q1–75),
// Part B Reasoning (Q76–100), Part C General English (Q101–200). Questions are shuffled
// within each part; reading-comprehension passages stay together.
export function buildFullMockSession(
  history: QuestionHistory,
  random: () => number = Math.random
): FullMockQuestion[] {
  const pools = staticPoolByUnit();
  const usedPrompts = new Set<string>();
  const blocksByPart: Record<Part, PoolItem[][]> = { A: [], B: [], C: [] };

  for (const [unitId, quota] of unitQuotas()) {
    const generatedCount = Math.round(quota * (GENERATED_SHARE[unitId] ?? 0));
    const generated = generateForUnit(unitId, generatedCount, random, usedPrompts);
    const fromPool = pickStatic(pools.get(unitId) ?? [], quota - generated.length, history, random, usedPrompts);
    // Keep passage groups contiguous: bundle by group, single questions on their own.
    const blocks = new Map<string, PoolItem[]>();
    for (const item of [...generated, ...fromPool]) {
      const key = item.groupId ?? `${item.topicId}|${item.id}`;
      if (!blocks.has(key)) blocks.set(key, []);
      blocks.get(key)!.push(item);
    }
    blocksByPart[unitId[0] as Part].push(...blocks.values());
  }

  return (["A", "B", "C"] as Part[])
    .flatMap((part) => shuffleInPlace(blocksByPart[part], random).flat())
    .map((item) => toQuestion(item, random));
}
