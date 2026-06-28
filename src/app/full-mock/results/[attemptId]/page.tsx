import Link from "next/link";
import { notFound } from "next/navigation";
import { hydrateAnswerRowsForReview } from "@/lib/content";
import { getAttempt, getAttemptAnswers } from "@/lib/attempts";
import { AttemptReview } from "@/components/AttemptReview";
import { getResultMessage } from "@/lib/motivation";

export default async function FullMockResultsPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId: attemptIdStr } = await params;
  const attemptId = Number(attemptIdStr);

  const attempt = await getAttempt(attemptId);
  if (!attempt || attempt.attempt_kind !== "full_mock" || !attempt.submitted_at) notFound();

  const rows = await getAttemptAnswers(attemptId);
  const questions = hydrateAnswerRowsForReview(rows);
  const message = getResultMessage(attempt.score_percent ?? 0, { gated: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{attempt.session_label} — Results</h1>
        <Link href="/full-mock" className="text-sm text-zinc-600 hover:underline">
          All sessions
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
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          {(["a", "b", "c"] as const).map((p) => {
            const correct = attempt[`part_${p}_correct` as keyof typeof attempt] as number | null;
            const total = attempt[`part_${p}_total` as keyof typeof attempt] as number | null;
            return (
              <div key={p} className="rounded-md bg-zinc-50 p-3 text-center">
                <p className="font-semibold uppercase text-zinc-500">Part {p.toUpperCase()}</p>
                <p className="mt-1 text-lg font-medium">
                  {correct ?? 0} / {total ?? 0}
                </p>
              </div>
            );
          })}
        </div>
        <Link
          href="/full-mock"
          className="mt-5 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Start another session
        </Link>
      </div>

      <AttemptReview questions={questions} />
    </div>
  );
}
