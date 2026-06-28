"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDayQuestions, getTopic, getTopicQuestions, hydrateWrongAnswerRefs } from "@/lib/content";
import { generateFullMockSession } from "@/lib/fullMock";
import { generateMonthlySession, generateWeeklySession } from "@/lib/cycleMock";
import { markPartRead, markMockStarted } from "@/lib/progress";
import { createDraftAttempt, getAttempt, getWrongAnswerRefs, submitAttempt } from "@/lib/attempts";
import { toggleBookmark } from "@/lib/bookmarks";
import type { Part } from "@/lib/types";

export async function markPartReadAction(dayNumber: number, part: Part) {
  markPartRead(dayNumber, part);
  revalidatePath(`/day/${dayNumber}`);
}

export async function toggleBookmarkAction(dayNumber: number, topicId: string, qaId: string) {
  toggleBookmark(topicId, qaId);
  revalidatePath(`/day/${dayNumber}`);
}

export async function startDailyMockAction(dayNumber: number) {
  const questions = getDayQuestions(dayNumber);
  const draft = createDraftAttempt({
    dayNumber,
    attemptKind: "daily",
    questions,
  });
  markMockStarted(dayNumber);
  redirect(`/day/${dayNumber}/mock?attemptId=${draft.attemptId}`);
}

export async function startTopicPracticeAction(topicId: string) {
  const topic = getTopic(topicId);
  const questions = getTopicQuestions(topicId, "A");
  const draft = createDraftAttempt({
    attemptKind: "revision",
    sessionLabel: `Revision: ${topic.name}`,
    questions,
  });
  redirect(`/revision/session/${draft.attemptId}`);
}

export async function startWrongAnswerPracticeAction() {
  const refs = getWrongAnswerRefs();
  if (refs.length === 0) redirect("/mistakes");
  const questions = hydrateWrongAnswerRefs(refs);
  const draft = createDraftAttempt({
    attemptKind: "revision",
    sessionLabel: `Mistake Review (${questions.length}Q)`,
    questions,
  });
  redirect(`/revision/session/${draft.attemptId}`);
}

export async function startWeeklyCycleTestAction(weekNumber: number) {
  const questions = generateWeeklySession(weekNumber);
  const draft = createDraftAttempt({
    attemptKind: "weekly",
    weekNumber,
    sessionLabel: `Week ${weekNumber} Cycle Test`,
    questions,
  });
  redirect(`/weekly/session/${draft.attemptId}`);
}

export async function startMonthlyCycleTestAction(monthNumber: number) {
  const questions = generateMonthlySession(monthNumber);
  const draft = createDraftAttempt({
    attemptKind: "monthly",
    monthNumber,
    sessionLabel: `Month ${monthNumber} Cycle Test`,
    questions,
  });
  redirect(`/monthly/session/${draft.attemptId}`);
}

export async function startFullMockAction(sessionLabel: string) {
  const questions = generateFullMockSession();
  const draft = createDraftAttempt({
    attemptKind: "full_mock",
    sessionLabel,
    questions,
  });
  redirect(`/full-mock/session/${draft.attemptId}`);
}

export async function submitAttemptAction(
  attemptId: number,
  answers: Array<{ answerRowId: number; selectedIndex: number | null }>,
  dayNumber?: number
) {
  const attempt = getAttempt(attemptId);
  submitAttempt(attemptId, answers);
  if (dayNumber != null) {
    revalidatePath("/days");
    redirect(`/day/${dayNumber}/results/${attemptId}`);
  }
  if (attempt?.attempt_kind === "weekly") {
    revalidatePath("/days");
    revalidatePath("/weekly");
    redirect(`/weekly/results/${attemptId}`);
  }
  if (attempt?.attempt_kind === "monthly") {
    revalidatePath("/days");
    revalidatePath("/monthly");
    redirect(`/monthly/results/${attemptId}`);
  }
  if (attempt?.attempt_kind === "revision") {
    redirect(`/revision/results/${attemptId}`);
  }
  redirect(`/full-mock/results/${attemptId}`);
}
