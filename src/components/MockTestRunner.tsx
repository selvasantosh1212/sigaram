"use client";

import { useMemo, useState, useTransition } from "react";
import { submitAttemptAction } from "@/app/actions";
import type { RenderableQuestion } from "@/lib/content";

const PART_COLORS: Record<string, string> = {
  A: "bg-rose-100 text-rose-700",
  B: "bg-amber-100 text-amber-700",
  C: "bg-sky-100 text-sky-700",
};

export function MockTestRunner({
  attemptId,
  dayNumber,
  questions,
}: {
  attemptId: number;
  dayNumber?: number;
  questions: RenderableQuestion[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const current = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  const navStatus = useMemo(
    () =>
      questions.map((q) => ({
        answered: answers[q.answerRowId] !== undefined,
      })),
    [questions, answers]
  );

  function selectOption(optionIndex: number) {
    setAnswers((prev) => ({ ...prev, [current.answerRowId]: optionIndex }));
  }

  function handleSubmit() {
    startTransition(async () => {
      const payload = questions.map((q) => ({
        answerRowId: q.answerRowId,
        selectedIndex: answers[q.answerRowId] ?? null,
      }));
      await submitAttemptAction(attemptId, payload, dayNumber);
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_220px]">
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between text-sm text-zinc-500">
          <span>
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PART_COLORS[current.part]}`}>
            Part {current.part} &middot; {current.topicName}
          </span>
        </div>

        <p className="mt-4 text-lg font-bold text-zinc-900">{current.prompt}</p>

        <div className="mt-4 space-y-2">
          {current.options.map((opt, idx) => {
            const selected = answers[current.answerRowId] === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => selectOption(idx)}
                className={`block w-full rounded-md border px-4 py-2 text-left text-sm ${
                  selected
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50"
                }`}
              >
                {String.fromCharCode(65 + idx)}. {opt}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex justify-between">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 disabled:opacity-40"
          >
            Previous
          </button>
          {currentIndex < questions.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Finish &amp; Submit
            </button>
          )}
        </div>

        {confirmOpen && (
          <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm">
            <p>
              You&apos;ve answered {answeredCount} of {questions.length} questions. Submit now?
            </p>
            <div className="mt-3 flex gap-3">
              <button
                type="button"
                disabled={isPending}
                onClick={handleSubmit}
                className="rounded-md bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-60"
              >
                {isPending ? "Submitting..." : "Yes, submit"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-md border border-zinc-300 px-4 py-2 font-medium text-zinc-700"
              >
                Keep reviewing
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {answeredCount} / {questions.length} answered
        </p>
        <div className="mt-3 grid grid-cols-6 gap-1.5">
          {questions.map((q, idx) => (
            <button
              key={q.answerRowId}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`flex h-7 w-7 items-center justify-center rounded text-xs font-medium ${
                idx === currentIndex
                  ? "bg-zinc-900 text-white"
                  : navStatus[idx].answered
                    ? "bg-green-100 text-green-700"
                    : "bg-zinc-100 text-zinc-500"
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
