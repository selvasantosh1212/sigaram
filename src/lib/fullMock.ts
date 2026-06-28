import { getAllTopics } from "./content";
import type { Part } from "./types";

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
};

// Scaled from the real exam's 75:25:100 (out of 200) part ratio down to a single
// 100-question session: 37.5:12.5:50, rounded to whole numbers summing to 100.
const SESSION_SIZE: Record<Part, number> = { A: 38, B: 12, C: 50 };

function partOf(topicId: string): Part {
  return topicId[0].toUpperCase() as Part;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function generateFullMockSession(): FullMockQuestion[] {
  const topics = getAllTopics();
  const pools: Record<Part, FullMockQuestion[]> = { A: [], B: [], C: [] };

  for (const topic of topics) {
    const part = partOf(topic.topicId);
    for (const q of topic.mockTest.questions) {
      pools[part].push({
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
      });
    }
  }

  const session: FullMockQuestion[] = [];
  for (const part of ["A", "B", "C"] as Part[]) {
    const wanted = Math.min(SESSION_SIZE[part], pools[part].length);
    session.push(...shuffle(pools[part]).slice(0, wanted));
  }

  return shuffle(session);
}
