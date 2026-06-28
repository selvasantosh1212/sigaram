import Link from "next/link";
import { getAllBestWeekScores, getTotalWeeks, getWeekDayRange } from "@/lib/cycles";
import {
  getAllBestScores,
  hasWeekPassed,
  isWeekTestUnlocked,
  PASS_THRESHOLD_PERCENT,
} from "@/lib/progress";
import { getLatestAttemptForWeek } from "@/lib/attempts";
import { startWeeklyCycleTestAction } from "@/app/actions";

type WeekStatus = "locked" | "ready" | "needs-retake" | "completed";

export default function WeeklyCycleTestsPage() {
  const totalWeeks = getTotalWeeks();
  const bestDayScores = getAllBestScores();
  const bestWeekScores = getAllBestWeekScores();

  const rows = Array.from({ length: totalWeeks }, (_, i) => i + 1).map((weekNumber) => {
    const { start, end } = getWeekDayRange(weekNumber);
    const unlocked = isWeekTestUnlocked(weekNumber, bestDayScores);
    let status: WeekStatus = "locked";
    if (unlocked) {
      if (hasWeekPassed(weekNumber, bestWeekScores)) status = "completed";
      else if (bestWeekScores.has(weekNumber)) status = "needs-retake";
      else status = "ready";
    }
    const latestAttempt = status === "completed" || status === "needs-retake" ? getLatestAttemptForWeek(weekNumber) : undefined;
    return { weekNumber, start, end, status, latestAttempt };
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Weekly Cycle Tests</h1>
        <p className="mt-1 text-zinc-600">
          Every 7 days, a mixed-topic revision test sampled from just that week&apos;s syllabus
          (weighted across Part A/B/C like the real exam). Clear all 7 daily mocks first, then
          take this test to unlock the next day&apos;s reading — any score counts, though{" "}
          {PASS_THRESHOLD_PERCENT}%+ is the bar we&apos;d recommend before moving on.
        </p>
      </div>

      <div className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
        {rows.map(({ weekNumber, start, end, status, latestAttempt }) => (
          <div key={weekNumber} className="flex items-center justify-between px-4 py-3">
            <div>
              <span className="font-medium">Week {weekNumber}</span>
              <span className="ml-2 text-sm text-zinc-500">
                Days {start}-{end}
              </span>
            </div>

            {status === "locked" && (
              <span className="text-sm text-zinc-400">Finish this week&apos;s daily tests first</span>
            )}

            {status === "ready" && (
              <form
                action={async () => {
                  "use server";
                  await startWeeklyCycleTestAction(weekNumber);
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
                  href={`/weekly/results/${latestAttempt.id}`}
                  className="text-sm text-zinc-600 hover:underline"
                >
                  View results
                </Link>
                <form
                  action={async () => {
                    "use server";
                    await startWeeklyCycleTestAction(weekNumber);
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
