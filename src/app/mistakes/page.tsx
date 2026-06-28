import Link from "next/link";
import { getWrongAnswerRefs } from "@/lib/attempts";
import { startWrongAnswerPracticeAction } from "@/app/actions";
import { USER_NAME } from "@/lib/motivation";
import type { Part } from "@/lib/types";

export default function MistakesPage() {
  const refs = getWrongAnswerRefs();
  const byPart: Record<Part, number> = { A: 0, B: 0, C: 0 };
  for (const r of refs) byPart[r.part]++;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Mistake Bank</h1>
        <p className="mt-1 text-zinc-600">
          Every question across all your attempts where your most recent answer was wrong, {USER_NAME} —
          the most direct fix for repeat mistakes. Get one right here and it drops off the list.
        </p>
      </div>

      {refs.length === 0 ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
          <p className="font-medium text-green-800">No outstanding mistakes right now, {USER_NAME} — nice work!</p>
          <p className="mt-1 text-sm text-green-700">Anything you get wrong in a mock will land here automatically.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <div className="grid grid-cols-3 gap-4 text-sm">
            {(["A", "B", "C"] as const).map((p) => (
              <div key={p} className="rounded-md bg-zinc-50 p-3 text-center">
                <p className="font-semibold uppercase text-zinc-500">Part {p}</p>
                <p className="mt-1 text-lg font-medium">{byPart[p]}</p>
              </div>
            ))}
          </div>
          <form
            action={async () => {
              "use server";
              await startWrongAnswerPracticeAction();
            }}
            className="mt-5"
          >
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Practice all {refs.length} mistakes
            </button>
          </form>
        </div>
      )}

      <Link href="/days" className="text-sm text-zinc-600 hover:underline">
        &larr; Back to days
      </Link>
    </div>
  );
}
