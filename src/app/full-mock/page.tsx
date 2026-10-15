import Link from "next/link";
import { getAllDays } from "@/lib/content";
import { getAllProgress, isFullMockUnlocked } from "@/lib/progress";
import { getAllAttempts } from "@/lib/attempts";
import { startFullMockAction } from "@/app/actions";

export default async function FullMockPage() {
  const totalDays = getAllDays().length;
  const allProgress = await getAllProgress();
  const unlocked = await isFullMockUnlocked(allProgress, totalDays);

  if (!unlocked) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center">
        <h1 className="text-xl font-semibold">Full-Mock Practice (Phase 2)</h1>
        <p className="mt-2 text-zinc-600">
          Locked until Day {totalDays} is complete and every Weekly and Monthly Cycle Test has
          been taken. Finish the daily study plan first.
        </p>
        <div className="mt-4 flex justify-center gap-4 text-sm">
          <Link href="/days" className="text-zinc-900 underline">
            Back to Days
          </Link>
          <Link href="/weekly" className="text-indigo-700 underline">
            Weekly Cycle Tests
          </Link>
          <Link href="/monthly" className="text-purple-700 underline">
            Monthly Cycle Tests
          </Link>
        </div>
      </div>
    );
  }

  const sessions = (await getAllAttempts()).filter((a) => a.attempt_kind === "full_mock");
  const nextSessionNumber = sessions.length + 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Full-Mock Practice (Phase 2)</h1>
        <p className="mt-1 text-zinc-600">
          Each paper mirrors the real Group 2A exam: 200 questions in 3 hours (300 marks, 1.5 per
          question), laid out like the booklet — Part A General Studies (Q1–75), Part B Reasoning
          (Q76–100), Part C General English (Q101–200) — with the real unit-by-unit split. Questions
          you haven&apos;t seen in any test come first, past mistakes return a few papers later,
          aptitude and number-series questions get fresh numbers every time, and answer options are
          reshuffled. Your answers are saved as you go. Recommended pace: one paper a day for 60
          days, but papers are unlocked all at once — go at your own pace.
        </p>
      </div>

      <form
        action={async () => {
          "use server";
          await startFullMockAction(`Full Mock Paper ${nextSessionNumber}`);
        }}
      >
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Start Paper {nextSessionNumber} (200 questions · 3 hours)
        </button>
      </form>

      <section>
        <h2 className="text-lg font-semibold">Past papers</h2>
        {sessions.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No full-mock papers yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {sessions
              .slice()
              .reverse()
              .map((s) => (
                <Link
                  key={s.id}
                  href={`/full-mock/results/${s.id}`}
                  className="flex items-center justify-between rounded-md border border-zinc-200 bg-white p-3 text-sm hover:bg-zinc-50"
                >
                  <span>{s.session_label}</span>
                  <span className="font-medium">
                    {s.score_percent != null ? `${Math.round(s.score_percent * 10) / 10}%` : "In progress"}
                  </span>
                </Link>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}
