import { makeRand, type Family, type GeneratorTopic } from "./core";
import { percentage, ratioProportion, simplification } from "./arithmetic";
import { compoundInterest, simpleInterest } from "./interest";
import { hcf, lcmTopic } from "./numbers";
import { alphanumeric, numberSeries } from "./reasoning";
import { area, timeAndWork, volume } from "./workAndMensuration";
import type { Difficulty } from "./core";

export const GENERATOR_TOPICS: GeneratorTopic[] = [
  simplification,
  percentage,
  ratioProportion,
  simpleInterest,
  compoundInterest,
  hcf,
  lcmTopic,
  timeAndWork,
  area,
  volume,
  numberSeries,
  alphanumeric,
];

export type GeneratedMockQuestion = {
  topicId: string;
  unitId: string;
  questionId: string;
  prompt: string;
  // Correct answer first; the caller shuffles.
  options: string[];
  correctIndex: 0;
  explanation: string;
  trick: string;
  difficulty: Difficulty;
};

// Draws one valid question from a family, retrying when the random values don't give a
// clean answer or 3 distinct distractors.
export function generateFromFamily(
  topic: GeneratorTopic,
  family: Family,
  seed: number
): GeneratedMockQuestion | null {
  for (let attempt = 0; attempt < 200; attempt++) {
    const q = family.make(makeRand(seed + attempt * 7919));
    if (!q) continue;
    const options = [q.answer, ...q.distractors.slice(0, 3)];
    if (options.length !== 4 || new Set(options).size !== 4) continue;
    return {
      topicId: topic.topicId,
      unitId: topic.unitId,
      questionId: `gen:${family.id}:${seed + attempt * 7919}`,
      prompt: q.prompt,
      options,
      correctIndex: 0,
      explanation: q.explanation,
      trick: q.trick,
      difficulty: family.difficulty,
    };
  }
  return null;
}
