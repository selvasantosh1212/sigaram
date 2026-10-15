import {
  getAverageDuration,
  getCompletedDaysCount,
  getDailyScoreTrend,
  getDifficultyAccuracy,
  getFullMockScoreTrend,
  getMonthlyScoreTrend,
  getPartAccuracy,
  getSourceTagAccuracy,
  getStreaks,
  getTimeOfDayDistribution,
  getTopicLevelStats,
  getUnitAccuracy,
  getWeeklyScoreTrend,
} from "@/lib/analytics";
import { getAllDays, getAllTopics } from "@/lib/content";
import { getSyllabusCoverage } from "@/lib/syllabus";
import {
  DifficultyAccuracyChart,
  PartAccuracyChart,
  ScoreTrendChart,
  SourceTagAccuracyChart,
  TimeOfDayChart,
} from "@/components/DashboardCharts";

export default async function DashboardPage() {
  const totalDays = getAllDays().length;
  const [
    completedDays,
    dailyTrend,
    fullMockTrend,
    weeklyTrend,
    monthlyTrend,
    partAccuracy,
    unitAccuracy,
    difficultyAccuracy,
    sourceTagAccuracy,
    timeOfDay,
    avgDuration,
    streaks,
    topicStats,
    syllabusCoverage,
  ] = await Promise.all([
    getCompletedDaysCount(),
    getDailyScoreTrend(),
    getFullMockScoreTrend(),
    getWeeklyScoreTrend(),
    getMonthlyScoreTrend(),
    getPartAccuracy(),
    getUnitAccuracy(),
    getDifficultyAccuracy(),
    getSourceTagAccuracy(),
    getTimeOfDayDistribution(),
    getAverageDuration(),
    getStreaks(),
    getTopicLevelStats(),
    getSyllabusCoverage(),
  ]);
  const topicMeta = new Map(getAllTopics().map((t) => [t.topicId, t]));
  const totalTopics = topicMeta.size;

  const weakestUnits = unitAccuracy.filter((u) => u.total > 0).slice(0, 8);
  const overallAccuracy =
    partAccuracy.reduce((sum, p) => sum + p.correct, 0) /
    Math.max(1, partAccuracy.reduce((sum, p) => sum + p.total, 0));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Performance Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Days completed" value={`${completedDays} / ${totalDays}`} />
        <StatCard
          label="Syllabus read"
          value={`${syllabusCoverage.topicsCovered} / ${syllabusCoverage.topicsTotal} topics`}
        />
        <StatCard label="Overall accuracy" value={`${Math.round(overallAccuracy * 1000) / 10}%`} />
        <StatCard label="Mock tests taken" value={`${dailyTrend.length + fullMockTrend.length}`} />
        <StatCard label="Avg. time per test" value={`${Math.round(avgDuration / 60)} min`} />
        <StatCard label="Current streak" value={`${streaks.currentStreak} day${streaks.currentStreak === 1 ? "" : "s"}`} />
        <StatCard label="Longest streak" value={`${streaks.longestStreak} day${streaks.longestStreak === 1 ? "" : "s"}`} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Daily practice — score trend</h2>
          <p className="text-sm text-zinc-500">Score % on each day&apos;s combined mock test, in order.</p>
          <div className="mt-3">
            <ScoreTrendChart data={dailyTrend} />
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Full-mock practice — score trend</h2>
          <p className="text-sm text-zinc-500">
            Score % on each full-mock paper (Phase 2, unlocked after Day 119).
          </p>
          <div className="mt-3">
            <ScoreTrendChart data={fullMockTrend} />
          </div>
        </section>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Weekly cycle tests — score trend</h2>
          <p className="text-sm text-zinc-500">
            Score % on each weekly revision test, in the order taken. {weeklyTrend.length} taken so far.
          </p>
          <div className="mt-3">
            <ScoreTrendChart data={weeklyTrend} />
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Monthly cycle tests — score trend</h2>
          <p className="text-sm text-zinc-500">
            Score % on each monthly revision test, in the order taken. {monthlyTrend.length} taken so far.
          </p>
          <div className="mt-3">
            <ScoreTrendChart data={monthlyTrend} />
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Syllabus reading coverage</h2>
        <p className="text-sm text-zinc-500">
          {`${syllabusCoverage.topicsCovered} / ${syllabusCoverage.topicsTotal} topics read (${syllabusCoverage.topicsCoveragePercent}%), `}
          {`weighted by exam marks it's ${syllabusCoverage.marksCoveragePercent}% of the ${syllabusCoverage.marksTotal}-mark syllabus.`}
        </p>
        <div className="mt-4 grid gap-6 md:grid-cols-3">
          {syllabusCoverage.byPart.map((p) => (
            <div key={p.part}>
              <div className="mb-2 flex items-baseline justify-between">
                <h3 className="text-sm font-semibold text-zinc-700">Part {p.part}</h3>
                <span className="text-xs text-zinc-500">
                  {p.topicsCovered}/{p.topicsTotal} topics · {p.marksCoveragePercent}% of {p.marksTotal} marks
                </span>
              </div>
              <div className="space-y-1.5">
                {syllabusCoverage.units
                  .filter((u) => u.part === p.part)
                  .map((u) => (
                    <div key={u.unitId} className="flex items-center gap-2 text-xs">
                      <span className="w-14 shrink-0 truncate font-mono text-zinc-500" title={u.unitId}>
                        {u.unitId}
                      </span>
                      <div className="h-2 flex-1 rounded-full bg-zinc-100">
                        <div
                          className={`h-2 rounded-full ${
                            u.coveragePercent === 0
                              ? "bg-zinc-300"
                              : u.coveragePercent < 100
                                ? "bg-amber-500"
                                : "bg-green-500"
                          }`}
                          style={{ width: `${u.coveragePercent}%` }}
                        />
                      </div>
                      <span className="w-14 shrink-0 text-right text-zinc-600">
                        {u.topicsCovered}/{u.topicsTotal}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Accuracy by Part</h2>
          <p className="text-sm text-zinc-500">Which of Part A / B / C is weakest overall.</p>
          <div className="mt-3">
            <PartAccuracyChart data={partAccuracy} />
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Accuracy by Difficulty</h2>
          <p className="text-sm text-zinc-500">Are you missing mostly the hard questions, or across the board?</p>
          <div className="mt-3">
            <DifficultyAccuracyChart data={difficultyAccuracy} />
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Weakest units</h2>
        <p className="text-sm text-zinc-500">
          Accuracy grouped by syllabus unit, worst first — this is where to focus revision.
        </p>
        <div className="mt-3 space-y-1.5">
          {weakestUnits.length === 0 && <p className="text-sm text-zinc-500">No data yet.</p>}
          {weakestUnits.map((u) => (
            <div key={u.unitId} className="flex items-center gap-3 text-sm">
              <span className="w-16 shrink-0 font-mono text-zinc-500">{u.unitId}</span>
              <div className="h-2 flex-1 rounded-full bg-zinc-100">
                <div
                  className={`h-2 rounded-full ${
                    u.accuracyPercent < 50 ? "bg-red-500" : u.accuracyPercent < 75 ? "bg-amber-500" : "bg-green-500"
                  }`}
                  style={{ width: `${u.accuracyPercent}%` }}
                />
              </div>
              <span className="w-28 shrink-0 text-right text-zinc-600">
                {u.accuracyPercent}% ({u.correct}/{u.total})
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Topic-level practice</h2>
        <p className="text-sm text-zinc-500">
          {`Questions answered and confidence per topic (${topicStats.length} / ${totalTopics} topics attempted so far), weakest first. Confidence is derived from accuracy — there's no separate self-rating.`}
        </p>
        <div className="mt-3 max-h-[28rem] space-y-1.5 overflow-y-auto pr-1">
          {topicStats.length === 0 && <p className="text-sm text-zinc-500">No data yet.</p>}
          {topicStats.map((t) => {
            const topic = topicMeta.get(t.topicId);
            return (
              <div key={t.topicId} className="flex items-center gap-3 text-sm">
                <div className="w-52 shrink-0 truncate" title={topic?.name ?? t.topicId}>
                  {topic?.name ?? t.topicId}
                  {topic?.unitId && (
                    <span className="ml-1.5 font-mono text-xs text-zinc-400">{topic.unitId}</span>
                  )}
                </div>
                <div className="h-2 flex-1 rounded-full bg-zinc-100">
                  <div
                    className={`h-2 rounded-full ${
                      t.confidence === "weak"
                        ? "bg-red-500"
                        : t.confidence === "moderate"
                          ? "bg-amber-500"
                          : "bg-green-500"
                    }`}
                    style={{ width: `${t.accuracyPercent}%` }}
                  />
                </div>
                <span className="w-24 shrink-0 text-right text-zinc-600">
                  {t.correct}/{t.total} qs
                </span>
                <span
                  className={`w-20 shrink-0 rounded-full px-2 py-0.5 text-center text-xs font-medium capitalize ${
                    t.confidence === "weak"
                      ? "bg-red-100 text-red-700"
                      : t.confidence === "moderate"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-green-100 text-green-700"
                  }`}
                >
                  {t.confidence}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Accuracy by evidence source</h2>
        <p className="text-sm text-zinc-500">
          A content-quality signal, not a study-priority one: are real past-paper questions easier
          than authored-from-scratch ones?
        </p>
        <div className="mt-3">
          <SourceTagAccuracyChart data={sourceTagAccuracy} />
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-semibold">When you study</h2>
        <p className="text-sm text-zinc-500">Number of mock tests submitted, by hour of day.</p>
        <div className="mt-3">
          <TimeOfDayChart data={timeOfDay} />
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-zinc-900">{value}</p>
    </div>
  );
}
