import { z } from "zod";

export const QASchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.string(),
  tip: z.string().optional(),
});

export const MockQuestionSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  options: z.array(z.string()),
  correctIndex: z.number().int(),
  explanation: z.string(),
  sourceTag: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  trick: z.string().optional(),
});

export const TopicSchema = z.object({
  topicId: z.string(),
  unitId: z.string(),
  name: z.string(),
  sourceRefs: z.array(z.object({ type: z.string(), label: z.string() })),
  researchNotes: z.string(),
  reading: z.object({
    intro: z.string(),
    qa: z.array(QASchema),
  }),
  mockTest: z.object({
    questions: z.array(MockQuestionSchema),
  }),
});

export const DaySchema = z.object({
  dayNumber: z.number().int(),
  partATopicId: z.string(),
  partBTopicId: z.string(),
  partCTopicId: z.string(),
});

export const SyllabusPartSchema = z.object({
  id: z.enum(["A", "B", "C"]),
  name: z.string(),
  standard: z.string(),
  questionCount: z.number().int(),
  units: z.array(
    z.object({
      id: z.string(),
      number: z.string(),
      name: z.string(),
      questionCount: z.number().int(),
    })
  ),
});

export type QA = z.infer<typeof QASchema>;
export type MockQuestion = z.infer<typeof MockQuestionSchema>;
export type Topic = z.infer<typeof TopicSchema>;
export type Day = z.infer<typeof DaySchema>;
export type SyllabusPart = z.infer<typeof SyllabusPartSchema>;

export type Part = "A" | "B" | "C";

export type QuestionRef = {
  part: Part;
  topicId: string;
  unitId: string;
  questionId: string;
  difficulty: "easy" | "medium" | "hard";
};

// A question exactly as it was shown in one attempt — see attempt_answers.question_snapshot.
export type QuestionSnapshot = {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  sourceTag: string;
  trick?: string;
};
