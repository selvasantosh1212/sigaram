import Link from "next/link";
import { notFound } from "next/navigation";
import { hydrateAnswerRowsForReview } from "@/lib/content";
import { getAllAttemptsForMonth, getAttempt, getAttemptAnswers } from "@/lib/attempts";
import { getMonthDayRange, getTotalDays, getTotalMonths } from "@/lib/cycles";
import { getAllProgress, isDayUnlocked, PASS_THRESHOLD_PERCENT } from "@/lib/progress";
import { AttemptReview } from "@/components/AttemptReview";
import { startMonthlyCycleTestAction } from "@/app/actions";
import { getCycleTestResultMessage } from "@/lib/motivation";

export default async function MonthlyResultsPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId: attemptIdStr } = await params;
  const attemptId = Number(attemptIdStr);

  const attempt = getAttempt(attemptId);
  if (!attempt || attempt.attempt_kind !== "monthly" || !attempt.submitted_at || attempt.month_number == null) {
    notFound();
  }
  const monthNumber = attempt.month_number;

  const rows = getAttemptAnswers(attemptId);
  const questions = hydrateAnswerRowsForReview(rows);

  const { end } = getMonthDayRange(monthNumber);
  const totalDays = getTotalDays();
  const isLastMonth = monthNumber === getTotalMonths();
  const allProgress = getAllProgress();
  const nextDayUnlocked = end < totalDays && isDayUnlocked(end + 1, allProgress);
  const attemptHistory = getAllAttemptsForMonth(monthNumber);
  const message = getCycleTestResultMessage(attempt.score_percent ?? 0, PASS_THRESHOLD_PERCENT);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Month {monthNumber} Cycle Test — Results</h1>
        <Link href="/monthly" className="text-sm text-zinc-600 hover:underline">
          All months
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
        <div className="mt-5 flex flex-wrap gap-3">
          {nextDayUnlocked && (
            <Link
              href={`/day/${end + 1}`}
              className="inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Continue to Day {end + 1} &rarr;
            </Link>
          )}
          {isLastMonth && end === totalDays && (
            <Link
              href="/full-mock"
              className="inline-block rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              All revision done! Start Full-Mock Practice &rarr;
            </Link>
          )}
          <form
            action={async () => {
              "use server";
              await startMonthlyCycleTestAction(monthNumber);
            }}
          >
            <button
              type="submit"
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Retake this month&apos;s test
            </button>
          </form>
        </div>
      </div>

      {attemptHistory.length > 1 && (
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-zinc-700">
            Attempt history for Month {monthNumber} ({attemptHistory.length} attempts)
          </h2>
          <div className="mt-2 space-y-1">
            {attemptHistory.map((a) => (
              <Link
                key={a.id}
                href={`/monthly/results/${a.id}`}
                className={`flex items-center justify-between rounded px-2 py-1 text-sm ${
                  a.id === attemptId ? "bg-zinc-100 font-medium" : "hover:bg-zinc-50"
                }`}
              >
                <span>{new Date(a.submitted_at!).toLocaleString()}</span>
                <span>{Math.round((a.score_percent ?? 0) * 10) / 10}%</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <AttemptReview questions={questions} />
    </div>
  );
}
