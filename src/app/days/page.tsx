import Link from "next/link";
import { getAllDays } from "@/lib/content";
import { getAllBestScores, getAllProgress, isAllPartsRead, isDayUnlocked, PASS_THRESHOLD_PERCENT } from "@/lib/progress";
import { isWeekEndDay, isMonthEndDay, getWeekNumberForDay, getMonthNumberForWeek } from "@/lib/cycles";
import { getDaysSinceLastActivity, getStreaks } from "@/lib/analytics";
import { getStreakNudge, getTimeGreeting } from "@/lib/motivation";

type DayStatus = "locked" | "not-started" | "reading" | "ready-for-mock" | "needs-retake" | "completed";

async function getStatus(
  dayNumber: number,
  allProgress: Awaited<ReturnType<typeof getAllProgress>>,
  bestScores: Map<number, number>
): Promise<DayStatus> {
  if (!(await isDayUnlocked(dayNumber, allProgress, bestScores))) return "locked";
  const row = allProgress.get(dayNumber);
  if (row?.mock_submitted_at) {
    return (bestScores.get(dayNumber) ?? 0) >= PASS_THRESHOLD_PERCENT ? "completed" : "needs-retake";
  }
  if (isAllPartsRead(row)) return "ready-for-mock";
  if (row?.part_a_read_at || row?.part_b_read_at || row?.part_c_read_at) return "reading";
  return "not-started";
}

const STATUS_STYLES: Record<DayStatus, string> = {
  locked: "bg-zinc-100 text-zinc-400 border-zinc-200",
  "not-started": "bg-white text-zinc-700 border-zinc-300 hover:border-zinc-400",
  reading: "bg-amber-50 text-amber-800 border-amber-300 hover:border-amber-400",
  "ready-for-mock": "bg-blue-50 text-blue-800 border-blue-300 hover:border-blue-400",
  "needs-retake": "bg-red-50 text-red-700 border-red-300 hover:border-red-400",
  completed: "bg-green-50 text-green-800 border-green-300 hover:border-green-400",
};

const STATUS_LABEL: Record<DayStatus, string> = {
  locked: "Locked",
  "not-started": "Not started",
  reading: "Reading...",
  "ready-for-mock": "Ready for mock",
  "needs-retake": `Below ${PASS_THRESHOLD_PERCENT}% — retake`,
  completed: "Done",
};

export default async function DaysPage() {
  const days = getAllDays();
  const [allProgress, bestScores, streaks, daysSinceLastActivity] = await Promise.all([
    getAllProgress(),
    getAllBestScores(),
    getStreaks(),
    getDaysSinceLastActivity(),
  ]);
  const statuses = await Promise.all(
    days.map(async (d) => ({ day: d, status: await getStatus(d.dayNumber, allProgress, bestScores) }))
  );
  const completedCount = statuses.filter((s) => s.status === "completed").length;
  const continueDay = statuses.find((s) => s.status !== "completed" && s.status !== "locked")?.day.dayNumber;

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm font-medium text-zinc-500">{getTimeGreeting()} &#128075;</p>
        <h1 className="text-2xl font-semibold">Study Plan: Days 1-119</h1>
        <p className="mt-1 text-zinc-600">
          {completedCount} / {days.length} days completed ·{" "}
          {getStreakNudge(daysSinceLastActivity, streaks.currentStreak, PASS_THRESHOLD_PERCENT)}
        </p>
        <div className="mt-2 h-2 w-full max-w-md rounded-full bg-zinc-200">
          <div
            className="h-2 rounded-full bg-green-500"
            style={{ width: `${(completedCount / days.length) * 100}%` }}
          />
        </div>
        {continueDay && (
          <Link
            href={`/day/${continueDay}`}
            className="mt-4 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Continue: Day {continueDay}
          </Link>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
        {statuses.flatMap(({ day, status }) => {
          const card = (
            <div
              className={`flex flex-col items-center justify-center rounded-md border px-2 py-3 text-xs ${STATUS_STYLES[status]}`}
            >
              <span className="font-semibold">Day {day.dayNumber}</span>
              <span className="mt-0.5">{STATUS_LABEL[status]}</span>
            </div>
          );
          const dayTile =
            status === "locked" ? (
              <div key={day.dayNumber}>{card}</div>
            ) : (
              <Link key={day.dayNumber} href={`/day/${day.dayNumber}`}>
                {card}
              </Link>
            );

          const tiles = [dayTile];
          if (isWeekEndDay(day.dayNumber)) {
            const weekNumber = getWeekNumberForDay(day.dayNumber);
            tiles.push(
              <Link key={`week-${weekNumber}`} href="/weekly">
                <div className="flex flex-col items-center justify-center rounded-md border border-indigo-300 bg-indigo-50 px-2 py-3 text-xs text-indigo-700 hover:border-indigo-400">
                  <span className="font-semibold">Week {weekNumber}</span>
                  <span className="mt-0.5">Cycle Test</span>
                </div>
              </Link>
            );
          }
          if (isMonthEndDay(day.dayNumber)) {
            const monthNumber = getMonthNumberForWeek(getWeekNumberForDay(day.dayNumber));
            tiles.push(
              <Link key={`month-${monthNumber}`} href="/monthly">
                <div className="flex flex-col items-center justify-center rounded-md border border-purple-300 bg-purple-50 px-2 py-3 text-xs text-purple-700 hover:border-purple-400">
                  <span className="font-semibold">Month {monthNumber}</span>
                  <span className="mt-0.5">Cycle Test</span>
                </div>
              </Link>
            );
          }
          return tiles;
        })}
      </div>
    </div>
  );
}
