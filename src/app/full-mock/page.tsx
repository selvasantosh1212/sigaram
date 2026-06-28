import Link from "next/link";
import { getAllDays } from "@/lib/content";
import { getAllProgress, isFullMockUnlocked } from "@/lib/progress";
import { getAllAttempts } from "@/lib/attempts";
import { startFullMockAction } from "@/app/actions";

export default function FullMockPage() {
  const totalDays = getAllDays().length;
  const allProgress = getAllProgress();
  const unlocked = isFullMockUnlocked(allProgress, totalDays);

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

  const sessions = getAllAttempts().filter((a) => a.attempt_kind === "full_mock");
  const nextSessionNumber = sessions.length + 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Full-Mock Practice (Phase 2)</h1>
        <p className="mt-1 text-zinc-600">
          200 questions/day across 2 sessions (100 each), sampled fresh every time from the full
          219-topic pool in the real exam&apos;s Part A:B:C ratio (~38:12:50 per session). Recommended
          pace: 2 sessions/day for 60 days, but sessions are unlocked all at once — go at your own
          pace.
        </p>
      </div>

      <form
        action={async () => {
          "use server";
          await startFullMockAction(`Full Mock Session ${nextSessionNumber}`);
        }}
      >
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Start Session {nextSessionNumber} (100 questions)
        </button>
      </form>

      <section>
        <h2 className="text-lg font-semibold">Past sessions</h2>
        {sessions.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No full-mock sessions yet.</p>
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
