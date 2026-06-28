import Link from "next/link";
import { getAllDays } from "@/lib/content";
import { getAllBestScores, getAllProgress, isAllPartsRead, isDayUnlocked, PASS_THRESHOLD_PERCENT } from "@/lib/progress";
import { getLatestAttemptForDay } from "@/lib/attempts";
import { startDailyMockAction } from "@/app/actions";

type MockStatus = "locked" | "read-first" | "ready" | "needs-retake" | "completed";

export default function MockTestModePage() {
  const days = getAllDays();
  const allProgress = getAllProgress();
  const bestScores = getAllBestScores();

  const rows = days.map((day) => {
    const unlocked = isDayUnlocked(day.dayNumber, allProgress, bestScores);
    const progress = allProgress.get(day.dayNumber);
    let status: MockStatus = "locked";
    if (unlocked) {
      if (progress?.mock_submitted_at) {
        status = (bestScores.get(day.dayNumber) ?? 0) >= PASS_THRESHOLD_PERCENT ? "completed" : "needs-retake";
      } else if (isAllPartsRead(progress)) status = "ready";
      else status = "read-first";
    }
    const latestAttempt =
      status === "completed" || status === "needs-retake" ? getLatestAttemptForDay(day.dayNumber) : undefined;
    return { day, status, latestAttempt };
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Mock Test Mode</h1>
        <p className="mt-1 text-zinc-600">
          Every day&apos;s combined Part A+B+C mock test, in one place. Score {PASS_THRESHOLD_PERCENT}%+ to
          clear a day and unlock the next — you can retake any test as many times as you need.
          Every 7 days you&apos;ll also need to take a{" "}
          <Link href="/weekly" className="text-indigo-700 hover:underline">
            Weekly Cycle Test
          </Link>{" "}
          (and every 4 weeks a{" "}
          <Link href="/monthly" className="text-purple-700 hover:underline">
            Monthly Cycle Test
          </Link>
          ) before the next day unlocks — these are pure revision, so any score unlocks the next
          day, though {PASS_THRESHOLD_PERCENT}%+ is the bar we&apos;d recommend.
        </p>
      </div>

      <div className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
        {rows.map(({ day, status, latestAttempt }) => (
          <div key={day.dayNumber} className="flex items-center justify-between px-4 py-3">
            <span className="font-medium">Day {day.dayNumber}</span>

            {status === "locked" && <span className="text-sm text-zinc-400">Locked</span>}

            {status === "read-first" && (
              <Link href={`/day/${day.dayNumber}`} className="text-sm text-amber-700 hover:underline">
                Read today&apos;s material first &rarr;
              </Link>
            )}

            {status === "ready" && (
              <form
                action={async () => {
                  "use server";
                  await startDailyMockAction(day.dayNumber);
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
                  {status === "needs-retake" ? ` (need ${PASS_THRESHOLD_PERCENT}%)` : ""}
                </span>
                <Link
                  href={`/day/${day.dayNumber}/results/${latestAttempt.id}`}
                  className="text-sm text-zinc-600 hover:underline"
                >
                  View results
                </Link>
                <form
                  action={async () => {
                    "use server";
                    await startDailyMockAction(day.dayNumber);
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
