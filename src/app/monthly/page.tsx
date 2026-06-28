import Link from "next/link";
import {
  getAllBestMonthScores,
  getAllBestWeekScores,
  getMonthDayRange,
  getMonthWeekNumbers,
  getTotalMonths,
} from "@/lib/cycles";
import { hasMonthPassed, isMonthTestUnlocked, PASS_THRESHOLD_PERCENT } from "@/lib/progress";
import { getLatestAttemptForMonth } from "@/lib/attempts";
import { startMonthlyCycleTestAction } from "@/app/actions";

type MonthStatus = "locked" | "ready" | "needs-retake" | "completed";

export default function MonthlyCycleTestsPage() {
  const totalMonths = getTotalMonths();
  const bestWeekScores = getAllBestWeekScores();
  const bestMonthScores = getAllBestMonthScores();

  const rows = Array.from({ length: totalMonths }, (_, i) => i + 1).map((monthNumber) => {
    const { start, end } = getMonthDayRange(monthNumber);
    const weeks = getMonthWeekNumbers(monthNumber);
    const unlocked = isMonthTestUnlocked(monthNumber, bestWeekScores);
    let status: MonthStatus = "locked";
    if (unlocked) {
      if (hasMonthPassed(monthNumber, bestMonthScores)) status = "completed";
      else if (bestMonthScores.has(monthNumber)) status = "needs-retake";
      else status = "ready";
    }
    const latestAttempt =
      status === "completed" || status === "needs-retake" ? getLatestAttemptForMonth(monthNumber) : undefined;
    return { monthNumber, start, end, weeks, status, latestAttempt };
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Monthly Cycle Tests</h1>
        <p className="mt-1 text-zinc-600">
          Every 4 weeks, a full-mock-scale revision test (100 questions, real exam&apos;s
          ~38:12:50 Part A/B/C weighting) sampled only from that month&apos;s syllabus. Take every
          week&apos;s cycle test inside first, then take this one to unlock the next day&apos;s
          reading — any score counts, though {PASS_THRESHOLD_PERCENT}%+ is the bar we&apos;d
          recommend before moving on.
        </p>
      </div>

      <div className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
        {rows.map(({ monthNumber, start, end, weeks, status, latestAttempt }) => (
          <div key={monthNumber} className="flex items-center justify-between px-4 py-3">
            <div>
              <span className="font-medium">Month {monthNumber}</span>
              <span className="ml-2 text-sm text-zinc-500">
                Weeks {weeks[0]}-{weeks[weeks.length - 1]} &middot; Days {start}-{end}
              </span>
            </div>

            {status === "locked" && (
              <span className="text-sm text-zinc-400">Take every week&apos;s cycle test first</span>
            )}

            {status === "ready" && (
              <form
                action={async () => {
                  "use server";
                  await startMonthlyCycleTestAction(monthNumber);
                }}
              >
                <button
                  type="submit"
                  className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700"
                >
                  Take test
                </button>
              </form>
            )}

            {(status === "completed" || status === "needs-retake") && latestAttempt && (
              <div className="flex items-center gap-3">
                <span
                  className={`text-sm font-medium ${
                    status === "completed" ? "text-green-700" : "text-red-600"
                  }`}
                >
                  {Math.round((latestAttempt.score_percent ?? 0) * 10) / 10}%
                  {status === "needs-retake" ? ` (${PASS_THRESHOLD_PERCENT}%+ recommended)` : ""}
                </span>
                <Link
                  href={`/monthly/results/${latestAttempt.id}`}
                  className="text-sm text-zinc-600 hover:underline"
                >
                  View results
                </Link>
                <form
                  action={async () => {
                    "use server";
                    await startMonthlyCycleTestAction(monthNumber);
                  }}
                >
                  <button
                    type="submit"
                    className={`text-sm hover:underline ${
                      status === "needs-retake" ? "font-medium text-red-600" : "text-blue-600"
                    }`}
                  >
                    Retake
                  </button>
                </form>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
