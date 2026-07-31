/**
 * Mock sitting scoring and the Stage-1 report (ADDENDUM-B §4).
 *
 * The honesty ladder, stage 1: raw score, percentage, per-type breakdown,
 * time-per-section, and trajectory across sittings — nothing else. We do not
 * collect date of birth (Phase 1 minimisation), so true age-standardised
 * scores are impossible for us and the report SAYS so rather than faking it.
 * Never, at any stage: predicted pass, predicted standardised score, pass
 * probability, region-threshold comparison, or any outcome claim (L1).
 *
 * The child-facing result is a different artifact entirely: strengths and one
 * focus, by name, no numbers (Addendum A §1.2 Boss Case result row).
 */

export interface MockResponse {
  optionId: string;
  correct: boolean;
  answeredAt: string;
}

export interface SectionTiming {
  startedAt?: string | null;
  endedAt?: string | null;
  secondsUsed?: number | null;
}

export interface ScoredSection {
  index: number;
  minutes: number;
  questionCount: number;
  correct: number;
  answered: number;
  secondsUsed: number | null;
}

export interface PerTypeLine {
  questionTypeId: string;
  /** Display name — the parent never reads a slug. */
  name: string;
  correct: number;
  total: number;
}

export interface Stage1Report {
  raw: number;
  total: number;
  /** 0–100, rounded to the nearest whole point. */
  percentage: number;
  perType: PerTypeLine[];
  sections: ScoredSection[];
}

export function scoreSitting(input: {
  servedSections: Array<{ itemIds: string[] }>;
  sectionMinutes: number[];
  responses: Record<string, MockResponse>;
  sectionTimings: SectionTiming[];
  /** itemId → questionTypeId, from the composed items. */
  itemTypeById: Record<string, string>;
  /** questionTypeId → display name. */
  typeNames: Record<string, string>;
}): Stage1Report {
  const { servedSections, sectionMinutes, responses, sectionTimings, itemTypeById, typeNames } =
    input;

  let raw = 0;
  let total = 0;
  const perTypeMap = new Map<string, { correct: number; total: number }>();
  const sections: ScoredSection[] = [];

  servedSections.forEach((section, index) => {
    let sectionCorrect = 0;
    let sectionAnswered = 0;
    for (const itemId of section.itemIds) {
      total += 1;
      const typeId = itemTypeById[itemId] ?? 'unknown';
      const line = perTypeMap.get(typeId) ?? { correct: 0, total: 0 };
      line.total += 1;
      const response = responses[itemId];
      if (response) {
        sectionAnswered += 1;
        if (response.correct) {
          raw += 1;
          sectionCorrect += 1;
          line.correct += 1;
        }
      }
      perTypeMap.set(typeId, line);
    }
    const timing = sectionTimings[index];
    sections.push({
      index,
      minutes: sectionMinutes[index] ?? 0,
      questionCount: section.itemIds.length,
      correct: sectionCorrect,
      answered: sectionAnswered,
      secondsUsed: timing?.secondsUsed ?? null,
    });
  });

  const perType = [...perTypeMap.entries()]
    .map(([questionTypeId, line]) => ({
      questionTypeId,
      name: typeNames[questionTypeId] ?? questionTypeId,
      correct: line.correct,
      total: line.total,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    raw,
    total,
    percentage: total === 0 ? 0 : Math.round((raw / total) * 100),
    perType,
    sections,
  };
}

/** One point per completed sitting — the trajectory line in the parent report. */
export interface TrajectoryPoint {
  satAt: string; // ISO
  raw: number;
  total: number;
  percentage: number;
}

export function trajectory(
  sittings: Array<{ createdAt: string; raw: number; total: number }>,
): TrajectoryPoint[] {
  return [...sittings]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((sitting) => ({
      satAt: sitting.createdAt,
      raw: sitting.raw,
      total: sitting.total,
      percentage: sitting.total === 0 ? 0 : Math.round((sitting.raw / sitting.total) * 100),
    }));
}

/**
 * The child's result: up to two strengths and exactly one focus, by type NAME,
 * never a number (Addendum A: "Two you nailed: hidden words, letter jumps.
 * One for next time: mirror codes."). Strengths need at least one correct
 * answer to be honest; with fewer than two types answered, fewer strengths
 * show rather than padding with something the child didn't demonstrate.
 */
export interface ChildMockResult {
  strengths: string[];
  focus: string | null;
}

export function childMockResult(perType: PerTypeLine[]): ChildMockResult {
  const answered = perType.filter((line) => line.total > 0);
  const byAccuracy = [...answered].sort(
    (a, b) => b.correct / b.total - a.correct / a.total || b.correct - a.correct,
  );
  const strengths = byAccuracy
    .filter((line) => line.correct > 0)
    .slice(0, 2)
    .map((line) => line.name);
  const weakest = byAccuracy.at(-1);
  // The focus must not be one of the named strengths — with only one type
  // answered there is nothing honest to contrast, so no focus shows.
  const focus = weakest && !strengths.includes(weakest.name) ? weakest.name : null;
  return { strengths, focus };
}
