import Link from "next/link";
import { notFound } from "next/navigation";
import { hydrateAnswerRowsForReview } from "@/lib/content";
import { getAttempt, getAttemptAnswers } from "@/lib/attempts";
import { AttemptReview } from "@/components/AttemptReview";
import { getResultMessage } from "@/lib/motivation";

export default async function RevisionResultsPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId: attemptIdStr } = await params;
  const attemptId = Number(attemptIdStr);

  const attempt = getAttempt(attemptId);
  if (!attempt || attempt.attempt_kind !== "revision" || !attempt.submitted_at) notFound();

  const rows = getAttemptAnswers(attemptId);
  const questions = hydrateAnswerRowsForReview(rows);
  const message = getResultMessage(attempt.score_percent ?? 0, { gated: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{attempt.session_label} — Results</h1>
        <Link href="/days" className="text-sm text-zinc-600 hover:underline">
          All days
        </Link>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <p className="text-3xl font-bold">{Math.round((attempt.score_percent ?? 0) * 10) / 10}%</p>
        <p className="mt-1 text-zinc-600">
          {attempt.correct_count} / {attempt.total_questions} correct &middot; took{" "}
          {Math.round((attempt.duration_seconds ?? 0) / 60)} min
        </p>
        <p className="mt-3 font-semibold text-zinc-900">{message.headline}</p>
        <p className="mt-1 text-sm text-zinc-600">{message.detail}</p>
      </div>

      <AttemptReview questions={questions} />
    </div>
  );
}
