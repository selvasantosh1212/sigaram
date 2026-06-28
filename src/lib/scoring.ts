import type { Part } from "./types";

export type AnsweredQuestion = {
  part: Part;
  topicId: string;
  unitId: string;
  questionId: string;
  difficulty: "easy" | "medium" | "hard";
  correctIndex: number;
  selectedIndex: number | null;
};

export type ScoredQuestion = AnsweredQuestion & { isCorrect: boolean };

export type ScoreSummary = {
  totalQuestions: number;
  correctCount: number;
  scorePercent: number;
  byPart: Record<Part, { correct: number; total: number }>;
  questions: ScoredQuestion[];
};

export function scoreAttempt(answered: AnsweredQuestion[]): ScoreSummary {
  const byPart: Record<Part, { correct: number; total: number }> = {
    A: { correct: 0, total: 0 },
    B: { correct: 0, total: 0 },
    C: { correct: 0, total: 0 },
  };

  const questions: ScoredQuestion[] = answered.map((q) => {
    const isCorrect = q.selectedIndex !== null && q.selectedIndex === q.correctIndex;
    byPart[q.part].total += 1;
    if (isCorrect) byPart[q.part].correct += 1;
    return { ...q, isCorrect };
  });

  const totalQuestions = questions.length;
  const correctCount = questions.filter((q) => q.isCorrect).length;
  const scorePercent = totalQuestions === 0 ? 0 : (correctCount / totalQuestions) * 100;

  return { totalQuestions, correctCount, scorePercent, byPart, questions };
}
