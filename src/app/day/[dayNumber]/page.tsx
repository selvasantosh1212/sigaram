import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getDay, getTopic } from "@/lib/content";
import { getAllProgress, getDayProgress, isAllPartsRead, isDayUnlocked, PASS_THRESHOLD_PERCENT } from "@/lib/progress";
import { getLatestAttemptForDay } from "@/lib/attempts";
import { getUnitAccuracy } from "@/lib/analytics";
import { getBookmarksForTopics } from "@/lib/bookmarks";
import { getOrCreateRevisionTopicForDay } from "@/lib/revision";
import { markPartReadAction, startDailyMockAction, startTopicPracticeAction } from "@/app/actions";
import { getReadingEncouragement, getTimeGreeting, USER_NAME } from "@/lib/motivation";
import { QaItem } from "@/components/QaItem";
import type { Part } from "@/lib/types";

const PART_LABEL: Record<Part, string> = {
  A: "Part A — General Studies",
  B: "Part B — Aptitude & Mental Ability",
  C: "Part C — General English",
};

export default async function DayReadingPage({
  params,
}: {
  params: Promise<{ dayNumber: string }>;
}) {
  const { dayNumber: dayNumberStr } = await params;
  const dayNumber = Number(dayNumberStr);
  const day = getDay(dayNumber);
  if (!day) notFound();

  const allProgress = await getAllProgress();
  if (!(await isDayUnlocked(dayNumber, allProgress))) {
    redirect("/days");
  }

  const progress = await getDayProgress(dayNumber);
  const allRead = isAllPartsRead(progress);
  const mockDone = !!progress?.mock_submitted_at;
  const latestAttempt = mockDone ? await getLatestAttemptForDay(dayNumber) : undefined;
  const passed = (latestAttempt?.score_percent ?? 0) >= PASS_THRESHOLD_PERCENT;

  const parts: Array<{ part: Part; topicId: string; readAt: string | null }> = [
    { part: "A", topicId: day.partATopicId, readAt: progress?.part_a_read_at ?? null },
    { part: "B", topicId: day.partBTopicId, readAt: progress?.part_b_read_at ?? null },
    { part: "C", topicId: day.partCTopicId, readAt: progress?.part_c_read_at ?? null },
  ];

  const revisionPick = await getOrCreateRevisionTopicForDay(dayNumber);
  const revisionTopic = revisionPick ? getTopic(revisionPick.topicId) : null;

  const questionCountByPart: Record<Part, number> = {
    A: getTopic(day.partATopicId).mockTest.questions.length,
    B: getTopic(day.partBTopicId).mockTest.questions.length,
    C: getTopic(day.partCTopicId).mockTest.questions.length,
  };
  const totalQuestionsToday = questionCountByPart.A + questionCountByPart.B + questionCountByPart.C;

  const allTopicIds = parts.map((p) => p.topicId).concat(revisionTopic ? [revisionTopic.topicId] : []);
  const [unitAccuracy, bookmarks] = await Promise.all([getUnitAccuracy(), getBookmarksForTopics(allTopicIds)]);
  const unitAccuracyMap = new Map(unitAccuracy.map((u) => [u.unitId, u]));
  const bookmarkedItems: Array<{ topicId: string; qaId: string; question: string }> = [];
  for (const { topicId } of parts) {
    const topic = getTopic(topicId);
    for (const qa of topic.reading.qa) {
      if (bookmarks.has(`${topicId}:${qa.id}`)) {
        bookmarkedItems.push({ topicId, qaId: qa.id, question: qa.question });
      }
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500">{getTimeGreeting()} &#128075;</p>
          <h1 className="text-2xl font-semibold">Day {dayNumber} — Reading Mode</h1>
          <p className="mt-1 text-sm text-zinc-600">{getReadingEncouragement(dayNumber)}</p>
        </div>
        <div className="flex gap-3">
          {dayNumber > 1 && (
            <Link href={`/day/${dayNumber - 1}`} className="text-sm text-zinc-600 hover:underline">
              &larr; Day {dayNumber - 1}
            </Link>
          )}
          <a
            href={`/day-pdfs/day-${String(dayNumber).padStart(3, "0")}.pdf`}
            download
            className="text-sm text-zinc-600 hover:underline"
          >
            Download PDF
          </a>
          <Link href="/days" className="text-sm text-zinc-600 hover:underline">
            All days
          </Link>
        </div>
      </div>

      {revisionTopic && revisionPick && (
        <section className="rounded-lg border border-indigo-200 bg-indigo-50 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
                &#128260; Quick Revision &mdash; Part A
              </h2>
              <h3 className="mt-1 text-lg font-medium text-indigo-950">{revisionTopic.name}</h3>
              <p className="mt-1 text-xs font-medium text-indigo-700">
                {revisionPick.accuracy && revisionPick.accuracy.total > 0
                  ? `Picked for you, ${USER_NAME} — you've averaged ${revisionPick.accuracy.accuracyPercent}% here before (${revisionPick.accuracy.correct}/${revisionPick.accuracy.total}).`
                  : `Picked for you, ${USER_NAME} — from your earlier Part A reading, before today's new material.`}
              </p>
            </div>
            <form
              action={async () => {
                "use server";
                await startTopicPracticeAction(revisionTopic.topicId);
              }}
            >
              <button
                type="submit"
                className="whitespace-nowrap rounded-md border border-indigo-300 bg-white px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
              >
                Practice this topic ({revisionTopic.mockTest.questions.length}Q)
              </button>
            </form>
          </div>
          <div className="mt-4 space-y-3">
            {revisionTopic.reading.qa.map((qa, i) => (
              <QaItem
                key={qa.id}
                dayNumber={dayNumber}
                topicId={revisionTopic.topicId}
                qa={qa}
                number={i + 1}
                bookmarked={bookmarks.has(`${revisionTopic.topicId}:${qa.id}`)}
              />
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
        <span className="font-medium text-zinc-900">{totalQuestionsToday} questions today</span>
        <span>Part A: {questionCountByPart.A}</span>
        <span>Part B: {questionCountByPart.B}</span>
        <span>Part C: {questionCountByPart.C}</span>
      </section>

      {parts.map(({ part, topicId, readAt }) => {
        const topic = getTopic(topicId);
        const acc = unitAccuracyMap.get(topic.unitId);
        const isWeakUnit = !!acc && acc.total >= 3 && acc.accuracyPercent < 70;
        return (
          <section key={part} className="rounded-lg border border-zinc-200 bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                  {PART_LABEL[part]}
                </h2>
                <h3 className="mt-1 text-lg font-medium">{topic.name}</h3>
                {isWeakUnit && acc && (
                  <p className="mt-1 text-xs font-medium text-amber-700">
                    &#9888; You&apos;ve averaged {acc.accuracyPercent}% on this unit before ({acc.correct}/
                    {acc.total}) — worth reading closely, {USER_NAME}.
                  </p>
                )}
              </div>
              <form
                action={async () => {
                  "use server";
                  await markPartReadAction(dayNumber, part);
                }}
              >
                <button
                  type="submit"
                  disabled={!!readAt}
                  className={`whitespace-nowrap rounded-md border px-3 py-1.5 text-sm font-medium ${
                    readAt
                      ? "border-green-300 bg-green-50 text-green-700"
                      : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  {readAt ? "Read ✓" : "Mark as read"}
                </button>
              </form>
            </div>

            <p className="mt-3 text-zinc-700 italic">{topic.reading.intro}</p>

            <div className="mt-4 space-y-3">
              {topic.reading.qa.map((qa, i) => (
                <QaItem
                  key={qa.id}
                  dayNumber={dayNumber}
                  topicId={topicId}
                  qa={qa}
                  number={i + 1}
                  bookmarked={bookmarks.has(`${topicId}:${qa.id}`)}
                />
              ))}
            </div>
          </section>
        );
      })}

      {bookmarkedItems.length > 0 && (
        <details className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-amber-800">
            &#128204; {bookmarkedItems.length} item{bookmarkedItems.length === 1 ? "" : "s"} marked for review
          </summary>
          <ul className="mt-3 space-y-1 text-sm text-amber-900">
            {bookmarkedItems.map((item) => (
              <li key={`${item.topicId}:${item.qaId}`}>&#9733; {item.question}</li>
            ))}
          </ul>
        </details>
      )}

      <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-5">
        {mockDone ? (
          <>
            <div>
              <p className={passed ? "font-medium text-green-700" : "font-medium text-red-600"}>
                {passed
                  ? `Nice work, ${USER_NAME} — you scored ${Math.round((latestAttempt?.score_percent ?? 0) * 10) / 10}% and cleared the ${PASS_THRESHOLD_PERCENT}% bar.`
                  : `You scored ${Math.round((latestAttempt?.score_percent ?? 0) * 10) / 10}% — TNPSC needs ${PASS_THRESHOLD_PERCENT}%+ to unlock Day ${dayNumber + 1}.`}
              </p>
              {!passed && (
                <p className="mt-1 text-sm text-zinc-600">
                  Re-read the parts above, then retake — as many times as you need, {USER_NAME}.
                </p>
              )}
            </div>
            <div className="flex gap-3">
              {latestAttempt && (
                <Link
                  href={`/day/${dayNumber}/results/${latestAttempt.id}`}
                  className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
                >
                  View results
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
                  className={`rounded-md border px-4 py-2 text-sm font-medium hover:bg-zinc-50 ${
                    passed ? "border-zinc-300 text-zinc-700" : "border-red-300 text-red-700 bg-red-50"
                  }`}
                >
                  Retake test
                </button>
              </form>
            </div>
          </>
        ) : (
          <>
            <p className="text-zinc-700">
              {allRead
                ? `All 3 parts read — you're ready for today's mock test, ${USER_NAME}. Score ${PASS_THRESHOLD_PERCENT}%+ to unlock Day ${dayNumber + 1}.`
                : "Mark all 3 parts as read to unlock today's mock test."}
            </p>
            <form
              action={async () => {
                "use server";
                await startDailyMockAction(dayNumber);
              }}
            >
              <button
                type="submit"
                disabled={!allRead}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
              >
                Start Mock Test
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
