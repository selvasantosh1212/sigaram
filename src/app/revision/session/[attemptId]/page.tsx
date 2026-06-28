import { notFound, redirect } from "next/navigation";
import { hydrateQuestionRefs } from "@/lib/content";
import { getAttempt, getAttemptAnswers } from "@/lib/attempts";
import { MockTestRunner } from "@/components/MockTestRunner";
import { getPreMockEncouragement } from "@/lib/motivation";

export default async function RevisionSessionPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId: attemptIdStr } = await params;
  const attemptId = Number(attemptIdStr);

  const attempt = await getAttempt(attemptId);
  if (!attempt || attempt.attempt_kind !== "revision") notFound();
  if (attempt.submitted_at) {
    redirect(`/revision/results/${attemptId}`);
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
      <h1 className="text-2xl font-semibold">{attempt.session_label}</h1>
      <p className="mt-1 mb-4 text-sm text-zinc-600">{getPreMockEncouragement(attemptId)}</p>
      <MockTestRunner attemptId={attemptId} questions={questions} />
    </div>
  );
}
