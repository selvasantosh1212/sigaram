import { readFileSync, readdirSync } from "fs";
import path from "path";
import { cache } from "react";
import { DaySchema, TopicSchema, type Day, type Topic } from "./types";

const CONTENT_DIR = path.join(process.cwd(), "content");
const DAYS_PATH = path.join(CONTENT_DIR, "days/days.json");
const TOPICS_DIR = path.join(CONTENT_DIR, "topics");

export const getAllDays = cache((): Day[] => {
  const raw = JSON.parse(readFileSync(DAYS_PATH, "utf8"));
  return raw.map((d: unknown) => DaySchema.parse(d));
});

export const getDay = cache((dayNumber: number): Day | undefined => {
  return getAllDays().find((d) => d.dayNumber === dayNumber);
});

export const getTopic = cache((topicId: string): Topic => {
  const raw = JSON.parse(readFileSync(path.join(TOPICS_DIR, `${topicId}.json`), "utf8"));
  return TopicSchema.parse(raw);
});

export const getAllTopicIds = cache((): string[] => {
  return readdirSync(TOPICS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""));
});

export const getAllTopics = cache((): Topic[] => {
  return getAllTopicIds().map((id) => getTopic(id));
});

export type DayQuestion = {
  part: "A" | "B" | "C";
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
};

export type RenderableQuestion = {
  answerRowId: number;
  part: "A" | "B" | "C";
  topicId: string;
  topicName: string;
  questionId: string;
  prompt: string;
  options: string[];
};

// Reconstructs question text/options for rendering from (topicId, questionId) refs —
// deliberately does NOT include correctIndex/explanation, so the answer key never
// reaches the client before the attempt is submitted.
export function hydrateQuestionRefs(
  refs: Array<{ answerRowId: number; part: "A" | "B" | "C"; topicId: string; questionId: string }>
): RenderableQuestion[] {
  return refs.map((ref) => {
    const topic = getTopic(ref.topicId);
    const q = topic.mockTest.questions.find((mq) => mq.id === ref.questionId);
    if (!q) throw new Error(`Question ${ref.questionId} not found in topic ${ref.topicId}`);
    return {
      answerRowId: ref.answerRowId,
      part: ref.part,
      topicId: ref.topicId,
      topicName: topic.name,
      questionId: ref.questionId,
      prompt: q.prompt,
      options: q.options,
    };
  });
}

export type ReviewQuestion = {
  answerRowId: number;
  part: "A" | "B" | "C";
  topicId: string;
  topicName: string;
  questionId: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  selectedIndex: number | null;
  isCorrect: boolean;
  sourceTag: string;
  trick?: string;
};

// Like hydrateQuestionRefs, but includes the answer key + explanation — only safe to
// call for an attempt that's already been submitted (post-hoc review).
export function hydrateAnswerRowsForReview(
  rows: Array<{
    id: number;
    part: "A" | "B" | "C";
    topic_id: string;
    question_id: string;
    selected_index: number | null;
    is_correct: number | null;
  }>
): ReviewQuestion[] {
  return rows.map((row) => {
    const topic = getTopic(row.topic_id);
    const q = topic.mockTest.questions.find((mq) => mq.id === row.question_id);
    if (!q) throw new Error(`Question ${row.question_id} not found in topic ${row.topic_id}`);
    return {
      answerRowId: row.id,
      part: row.part,
      topicId: row.topic_id,
      topicName: topic.name,
      questionId: row.question_id,
      prompt: q.prompt,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      selectedIndex: row.selected_index,
      isCorrect: !!row.is_correct,
      sourceTag: q.sourceTag,
      trick: q.trick,
    };
  });
}

export function getDayQuestions(dayNumber: number): DayQuestion[] {
  const day = getDay(dayNumber);
  if (!day) return [];
  const parts: Array<["A" | "B" | "C", string]> = [
    ["A", day.partATopicId],
    ["B", day.partBTopicId],
    ["C", day.partCTopicId],
  ];
  const out: DayQuestion[] = [];
  for (const [part, topicId] of parts) {
    out.push(...getTopicQuestions(topicId, part));
  }
  return out;
}

// Builds a quiz-ready question set from cross-topic (topicId, questionId) refs — used
// by the mistake bank, where questions can come from any topic rather than one day's three.
export function hydrateWrongAnswerRefs(
  refs: Array<{ topicId: string; questionId: string; part: "A" | "B" | "C" }>
): DayQuestion[] {
  return refs.map((ref) => {
    const topic = getTopic(ref.topicId);
    const q = topic.mockTest.questions.find((mq) => mq.id === ref.questionId);
    if (!q) throw new Error(`Question ${ref.questionId} not found in topic ${ref.topicId}`);
    return {
      part: ref.part,
      topicId: topic.topicId,
      unitId: topic.unitId,
      questionId: q.id,
      prompt: q.prompt,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      difficulty: q.difficulty,
      sourceTag: q.sourceTag,
      trick: q.trick,
    };
  });
}

export function getTopicQuestions(topicId: string, part: "A" | "B" | "C"): DayQuestion[] {
  const topic = getTopic(topicId);
  return topic.mockTest.questions.map((q) => ({
    part,
    topicId: topic.topicId,
    unitId: topic.unitId,
    questionId: q.id,
    prompt: q.prompt,
    options: q.options,
    correctIndex: q.correctIndex,
    explanation: q.explanation,
    difficulty: q.difficulty,
    sourceTag: q.sourceTag,
    trick: q.trick,
  }));
}
