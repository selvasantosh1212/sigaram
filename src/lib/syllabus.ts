import { getAllDays, getAllTopics, getSyllabusParts } from "./content";
import { getAllProgress } from "./progress";
import type { Part } from "./types";

export type UnitCoverage = {
  unitId: string;
  unitName: string;
  part: Part;
  marks: number;
  topicsTotal: number;
  topicsCovered: number;
  coveragePercent: number;
};

export type PartCoverage = {
  part: Part;
  topicsTotal: number;
  topicsCovered: number;
  topicsCoveragePercent: number;
  marksTotal: number;
  marksCovered: number;
  marksCoveragePercent: number;
};

export type SyllabusCoverage = {
  units: UnitCoverage[];
  byPart: PartCoverage[];
  topicsTotal: number;
  topicsCovered: number;
  topicsCoveragePercent: number;
  marksTotal: number;
  marksCovered: number;
  marksCoveragePercent: number;
};

// "Covered" means the day's reading material for that part has been marked read
// (day_progress.part_{a,b,c}_read_at), not that questions on it have been attempted —
// this is a reading-coverage view, complementary to the accuracy stats elsewhere on
// the dashboard. A topic only counts once even if a Part B/C topic repeats across
// several days (day_progress -> days.json -> topicId is a many-to-one map).
export async function getSyllabusCoverage(): Promise<SyllabusCoverage> {
  const progress = await getAllProgress();
  const days = getAllDays();
  const topics = getAllTopics();
  const parts = getSyllabusParts();

  const dayByNumber = new Map(days.map((d) => [d.dayNumber, d]));
  const coveredTopicIds = new Set<string>();
  for (const [dayNumber, row] of progress) {
    const day = dayByNumber.get(dayNumber);
    if (!day) continue;
    if (row.part_a_read_at) coveredTopicIds.add(day.partATopicId);
    if (row.part_b_read_at) coveredTopicIds.add(day.partBTopicId);
    if (row.part_c_read_at) coveredTopicIds.add(day.partCTopicId);
  }

  const topicUnit = new Map(topics.map((t) => [t.topicId, t.unitId]));
  const topicsPerUnit = new Map<string, number>();
  for (const t of topics) topicsPerUnit.set(t.unitId, (topicsPerUnit.get(t.unitId) ?? 0) + 1);
  const coveredPerUnit = new Map<string, number>();
  for (const topicId of coveredTopicIds) {
    const unitId = topicUnit.get(topicId);
    if (!unitId) continue;
    coveredPerUnit.set(unitId, (coveredPerUnit.get(unitId) ?? 0) + 1);
  }

  const units: UnitCoverage[] = parts.flatMap((syllabusPart) =>
    syllabusPart.units.map((unit) => {
      const topicsTotal = topicsPerUnit.get(unit.id) ?? 0;
      const topicsCovered = Math.min(coveredPerUnit.get(unit.id) ?? 0, topicsTotal);
      return {
        unitId: unit.id,
        unitName: unit.name,
        part: syllabusPart.id,
        marks: unit.questionCount,
        topicsTotal,
        topicsCovered,
        coveragePercent: topicsTotal === 0 ? 0 : Math.round((topicsCovered / topicsTotal) * 1000) / 10,
      };
    })
  );

  const byPart: PartCoverage[] = (["A", "B", "C"] as const).map((part) => {
    const partUnits = units.filter((u) => u.part === part);
    const topicsTotal = partUnits.reduce((s, u) => s + u.topicsTotal, 0);
    const topicsCovered = partUnits.reduce((s, u) => s + u.topicsCovered, 0);
    const marksTotal = partUnits.reduce((s, u) => s + u.marks, 0);
    // Each unit's marks are pro-rated by how much of that unit's topic set is done —
    // a unit with 6/25 topics read contributes 6/25 of its mark weight, not 0 or all of it.
    const marksCovered = partUnits.reduce(
      (s, u) => s + (u.topicsTotal === 0 ? 0 : (u.topicsCovered / u.topicsTotal) * u.marks),
      0
    );
    return {
      part,
      topicsTotal,
      topicsCovered,
      topicsCoveragePercent: topicsTotal === 0 ? 0 : Math.round((topicsCovered / topicsTotal) * 1000) / 10,
      marksTotal,
      marksCovered: Math.round(marksCovered * 10) / 10,
      marksCoveragePercent: marksTotal === 0 ? 0 : Math.round((marksCovered / marksTotal) * 1000) / 10,
    };
  });

  const topicsTotal = byPart.reduce((s, p) => s + p.topicsTotal, 0);
  const topicsCovered = byPart.reduce((s, p) => s + p.topicsCovered, 0);
  const marksTotal = byPart.reduce((s, p) => s + p.marksTotal, 0);
  const marksCovered = byPart.reduce((s, p) => s + p.marksCovered, 0);

  return {
    units,
    byPart,
    topicsTotal,
    topicsCovered,
    topicsCoveragePercent: topicsTotal === 0 ? 0 : Math.round((topicsCovered / topicsTotal) * 1000) / 10,
    marksTotal,
    marksCovered: Math.round(marksCovered * 10) / 10,
    marksCoveragePercent: marksTotal === 0 ? 0 : Math.round((marksCovered / marksTotal) * 1000) / 10,
  };
}
