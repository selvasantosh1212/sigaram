import type { ReviewQuestion } from "@/lib/content";

const PART_COLORS: Record<string, string> = {
  A: "bg-rose-100 text-rose-700",
  B: "bg-amber-100 text-amber-700",
  C: "bg-sky-100 text-sky-700",
};

export function AttemptReview({ questions }: { questions: ReviewQuestion[] }) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Review</h2>
      {questions.map((q, i) => (
        <div key={q.answerRowId} className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between text-xs">
            <span className={`rounded-full px-2 py-0.5 font-semibold ${PART_COLORS[q.part]}`}>
              Part {q.part} &middot; {q.topicName}
            </span>
            <span className={q.isCorrect ? "font-semibold text-green-600" : "font-semibold text-red-600"}>
              {q.isCorrect ? "Correct" : q.selectedIndex === null ? "Skipped" : "Incorrect"}
            </span>
          </div>
          <p className="mt-2 font-bold">
            {i + 1}. {q.prompt}
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            {q.options.map((opt, idx) => {
              const isCorrectOpt = idx === q.correctIndex;
              const isSelected = idx === q.selectedIndex;
              return (
                <li
                  key={idx}
                  className={`rounded px-2 py-1 ${
                    isCorrectOpt
                      ? "bg-green-50 font-medium text-green-700"
                      : isSelected
                        ? "bg-red-50 text-red-700"
                        : "text-zinc-600"
                  }`}
                >
                  {String.fromCharCode(65 + idx)}. {opt}
                  {isCorrectOpt ? " ✓" : isSelected ? " (your answer)" : ""}
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-sm text-zinc-500">
            <em>Explanation:</em> {q.explanation}
          </p>
        </div>
      ))}
    </div>
  );
}
