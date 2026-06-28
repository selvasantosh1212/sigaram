import { getAllDays, getTopic, type DayQuestion } from "./content";
import type { Part } from "./types";
import { getMonthWeekNumbers, getWeekDayRange } from "./cycles";

// Real exam ratio (Part A:B:C ~ 75:25:100 out of 200, same source ratio fullMock.ts
// uses) scaled down for a single-sitting cycle test: half-scale for a week's worth of
// material, full single-session scale for a month's worth.
const WEEKLY_SESSION_SIZE: Record<Part, number> = { A: 19, B: 6, C: 25 };
const MONTHLY_SESSION_SIZE: Record<Part, number> = { A: 38, B: 12, C: 50 };

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function dayRange(start: number, end: number): number[] {
  const out: number[] = [];
  for (let d = start; d <= end; d++) out.push(d);
  return out;
}

// Dedupes by the Day record's own part->topic mapping rather than inferring part from
// topicId prefix — robust even if a topic ever gets reused across parts.
function collectTopicIds(dayNumbers: number[]): Record<Part, Set<string>> {
  const byDay = new Map(getAllDays().map((d) => [d.dayNumber, d]));
  const sets: Record<Part, Set<string>> = { A: new Set(), B: new Set(), C: new Set() };
  for (const n of dayNumbers) {
    const day = byDay.get(n);
    if (!day) continue;
    sets.A.add(day.partATopicId);
    sets.B.add(day.partBTopicId);
    sets.C.add(day.partCTopicId);
  }
  return sets;
}

function buildPools(topicIdsByPart: Record<Part, Set<string>>): Record<Part, DayQuestion[]> {
  const pools: Record<Part, DayQuestion[]> = { A: [], B: [], C: [] };
  for (const part of ["A", "B", "C"] as Part[]) {
    for (const topicId of topicIdsByPart[part]) {
      const topic = getTopic(topicId);
      for (const q of topic.mockTest.questions) {
        pools[part].push({
          part,
          topicId: topic.topicId,
          unitId: topic.unitId,
          questionId: q.id,
          prompt: q.prompt,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          difficulty: q.difficulty,
          sourceTag: q.sourceTag,
        });
      }
    }
  }
  return pools;
}

function sampleSession(pools: Record<Part, DayQuestion[]>, sizes: Record<Part, number>): DayQuestion[] {
  const out: DayQuestion[] = [];
  for (const part of ["A", "B", "C"] as Part[]) {
    const wanted = Math.min(sizes[part], pools[part].length);
    out.push(...shuffle(pools[part]).slice(0, wanted));
  }
  return shuffle(out);
}

// Fresh weighted mix from the unique topics covered across the week's 7 days —
// re-rolled (different questions, same ratio) on every retake.
export function generateWeeklySession(weekNumber: number): DayQuestion[] {
  const { start, end } = getWeekDayRange(weekNumber);
  const pools = buildPools(collectTopicIds(dayRange(start, end)));
  return sampleSession(pools, WEEKLY_SESSION_SIZE);
}

// Same idea at full single-session scale, scoped to the topics covered across the
// month's weeks (up to 4 weeks / 28 days).
export function generateMonthlySession(monthNumber: number): DayQuestion[] {
  const dayNumbers = getMonthWeekNumbers(monthNumber).flatMap((w) => {
    const { start, end } = getWeekDayRange(w);
    return dayRange(start, end);
  });
  const pools = buildPools(collectTopicIds(dayNumbers));
  return sampleSession(pools, MONTHLY_SESSION_SIZE);
}
