import Link from "next/link";
import { notFound } from "next/navigation";
import { hydrateAnswerRowsForReview } from "@/lib/content";
import { getAllAttemptsForDay, getAttempt, getAttemptAnswers } from "@/lib/attempts";
import {
  isDayUnlocked,
  getAllProgress,
  hasMonthBeenAttempted,
  hasWeekBeenAttempted,
  PASS_THRESHOLD_PERCENT,
} from "@/lib/progress";
import { getMonthNumberForWeek, getTotalDays, getWeekNumberForDay, isMonthEndDay, isWeekEndDay } from "@/lib/cycles";
import { AttemptReview } from "@/components/AttemptReview";
import { startDailyMockAction } from "@/app/actions";
import { getResultMessage } from "@/lib/motivation";

export default async function DayResultsPage({
  params,
}: {
  params: Promise<{ dayNumber: string; attemptId: string }>;
}) {
  const { dayNumber: dayNumberStr, attemptId: attemptIdStr } = await params;
  const dayNumber = Number(dayNumberStr);
  const attemptId = Number(attemptIdStr);

  const attempt = getAttempt(attemptId);
  if (!attempt || attempt.day_number !== dayNumber || !attempt.submitted_at) notFound();

  const rows = getAttemptAnswers(attemptId);
  const questions = hydrateAnswerRowsForReview(rows);

  const totalDays = getTotalDays();
  const allProgress = getAllProgress();
  const nextDayUnlocked = isDayUnlocked(dayNumber + 1, allProgress);
  const attemptHistory = getAllAttemptsForDay(dayNumber);
  const message = getResultMessage(attempt.score_percent ?? 0, {
    gated: true,
    passThreshold: PASS_THRESHOLD_PERCENT,
  });

  const weekClearedNow = isWeekEndDay(dayNumber);
  const weekNumber = getWeekNumberForDay(dayNumber);
  const weekAttempted = weekClearedNow && hasWeekBeenAttempted(weekNumber);
  const monthClearedNow = isMonthEndDay(dayNumber);
  const monthNumber = getMonthNumberForWeek(weekNumber);
  const monthAttempted = monthClearedNow && hasMonthBeenAttempted(monthNumber);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Day {dayNumber} — Results</h1>
        <Link href="/days" className="text-sm text-zinc-600 hover:underline">
          All days
        </Link>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <p className="text-3xl font-bold">
          {Math.round((attempt.score_percent ?? 0) * 10) / 10}%
        </p>
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

        {weekClearedNow && !weekAttempted && (
          <div className="mt-4 rounded-md border border-indigo-300 bg-indigo-50 p-4 text-sm text-indigo-900">
            <p className="font-medium">
              That&apos;s all 7 days of Week {weekNumber} read! Take the Week {weekNumber} Cycle
              Test next &mdash; it&apos;s revision, so any score{" "}
              {dayNumber < totalDays ? `unlocks Day ${dayNumber + 1}` : "clears the last step before full-mock practice"}
              , though {PASS_THRESHOLD_PERCENT}%+ is the bar we&apos;d recommend aiming for.
            </p>
            <Link href="/weekly" className="mt-2 inline-block font-semibold underline">
              Go to Weekly Cycle Tests &rarr;
            </Link>
          </div>
        )}
        {monthClearedNow && weekAttempted && !monthAttempted && (
          <div className="mt-4 rounded-md border border-purple-300 bg-purple-50 p-4 text-sm text-purple-900">
            <p className="font-medium">
              This also closes out Month {monthNumber}! Take the Month {monthNumber} Cycle Test
              too &mdash; any score{" "}
              {dayNumber < totalDays ? `unlocks Day ${dayNumber + 1}` : "clears the last step before full-mock practice"}
              , though {PASS_THRESHOLD_PERCENT}%+ is the bar we&apos;d recommend aiming for.
            </p>
            <Link href="/monthly" className="mt-2 inline-block font-semibold underline">
              Go to Monthly Cycle Tests &rarr;
            </Link>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          {nextDayUnlocked && dayNumber < totalDays && (
            <Link
              href={`/day/${dayNumber + 1}`}
              className="inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Continue to Day {dayNumber + 1} &rarr;
            </Link>
          )}
          {dayNumber === totalDays && weekAttempted && monthAttempted && (
            <Link
              href="/full-mock"
              className="inline-block rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              All {totalDays} days done! Start full-mock practice &rarr;
            </Link>
          )}
          <form
            action={async () => {
              "use server";
              await startDailyMockAction(dayNumber);
            }}
          >
            <button
              type="submit"
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Retake this day&apos;s test
            </button>
          </form>
        </div>
      </div>

      {attemptHistory.length > 1 && (
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-zinc-700">
            Attempt history for Day {dayNumber} ({attemptHistory.length} attempts)
          </h2>
          <div className="mt-2 space-y-1">
            {attemptHistory.map((a) => (
              <Link
                key={a.id}
                href={`/day/${dayNumber}/results/${a.id}`}
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
