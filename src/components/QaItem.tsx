import { toggleBookmarkAction } from "@/app/actions";

export function QaItem({
  dayNumber,
  topicId,
  qa,
  number,
  bookmarked,
}: {
  dayNumber: number;
  topicId: string;
  qa: { id: string; question: string; answer: string; tip?: string };
  number: number;
  bookmarked: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-l-2 border-zinc-200 pl-3">
      <div className="flex-1">
        <p className="font-bold text-zinc-900">Q{number}: {qa.question}</p>
        <p className="mt-1 text-zinc-600">A: {qa.answer}</p>
        {qa.tip && (
          <p className="mt-1 text-amber-700">
            <span className="font-semibold">⚡ Trick:</span> {qa.tip}
          </p>
        )}
      </div>
      <form
        action={async () => {
          "use server";
          await toggleBookmarkAction(dayNumber, topicId, qa.id);
        }}
      >
        <button
          type="submit"
          title={bookmarked ? "Remove from review list" : "Mark for review"}
          className={`text-lg leading-none ${
            bookmarked ? "text-amber-500" : "text-zinc-300 hover:text-amber-400"
          }`}
        >
          {bookmarked ? "★" : "☆"}
        </button>
      </form>
    </div>
  );
}
