import { notFound, redirect } from "next/navigation";
import { hydrateQuestionRefs } from "@/lib/content";
import { getAttempt, getAttemptAnswers } from "@/lib/attempts";
import { MockTestRunner } from "@/components/MockTestRunner";
import { getPreMockEncouragement } from "@/lib/motivation";

export default async function DayMockPage({
  params,
  searchParams,
}: {
  params: Promise<{ dayNumber: string }>;
  searchParams: Promise<{ attemptId?: string }>;
}) {
  const { dayNumber: dayNumberStr } = await params;
  const { attemptId: attemptIdStr } = await searchParams;
  const dayNumber = Number(dayNumberStr);
  const attemptId = Number(attemptIdStr);

  if (!attemptId) notFound();
  const attempt = await getAttempt(attemptId);
  if (!attempt || attempt.day_number !== dayNumber || attempt.attempt_kind !== "daily") notFound();
  if (attempt.submitted_at) {
    redirect(`/day/${dayNumber}/results/${attemptId}`);
  }

  const attemptAnswers = await getAttemptAnswers(attemptId);
  const refs = attemptAnswers.map((r) => ({
    answerRowId: r.id,
    part: r.part,
    topicId: r.topic_id,
    questionId: r.question_id,
  }));
  const questions = hydrateQuestionRefs(refs);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Day {dayNumber} — Mock Test</h1>
      <p className="mt-1 mb-4 text-sm text-zinc-600">{getPreMockEncouragement(attemptId)}</p>
      <MockTestRunner attemptId={attemptId} dayNumber={dayNumber} questions={questions} />
    </div>
  );
}
