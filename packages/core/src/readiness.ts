/**
 * The readiness model and the mock ladder (ADDENDUM-C §3).
 *
 * Three signals per child, per district, per target blueprint — coverage,
 * transfer, rhythm — and two thresholds that gate the ladder's rungs:
 * Boss Round (every session, always) → Half Boss Case → Boss Case.
 * No child ever sits a paper they haven't been prepared for.
 *
 * Readiness is parent-facing ONLY: the child's world stays cases and ranks
 * (§6). Readiness is never a likelihood, and no copy may imply it (L1).
 *
 * Thresholds are launch defaults awaiting ratification by David + the
 * reviewer against first-cohort data within 8 weeks of launch — starting
 * points, not truths (§7.7).
 */
import { ENGINE_CONFIG } from './config';
import type { Blueprint } from './blueprints';
import type { IntensityLevers } from './intensity';

export type MockRung = 'locked' | 'half' | 'full';

/** §3 launch defaults, config not code. */
export const READINESS_THRESHOLDS = {
  half: {
    /** Every blueprint type at "taught and progressing" (mastery ≥ 0.55). */
    coveragePct: 100,
    crackedPct: 40,
    transferPct: 50,
  },
  full: {
    crackedPct: 60,
    transferPct: 60,
    requiresCompletedHalf: true,
  },
  /** Rolling Boss Round window (items). */
  transferWindow: 20,
  /** Rhythm proxy: streak-weeks counted over the last N weeks. */
  rhythmWindowWeeks: 6,
} as const;

export interface CaseFileSignal {
  questionTypeId: string;
  masteryLevel: number;
  cracked: boolean;
}

export interface ReadinessInput {
  blueprint: Blueprint;
  /** Every case file the child holds in this district. */
  caseFiles: CaseFileSignal[];
  /** Total cases in the district — the crackedPct denominator (§3: "% of
   *  DISTRICT cases cracked", not of the child's opened files). */
  districtCaseCount: number;
  /** Boss Round outcomes, newest first; only the window is read. */
  bossRoundOutcomes: boolean[];
  /** Streak-weeks earned in the rhythm window. Never shown as judgement. */
  streakWeeksInWindow: number;
  completedHalfPaper: boolean;
}

export interface Readiness {
  /** % of blueprint typeMix types at mastery ≥ progressing. */
  coveragePct: number;
  /** % of the child's district cases cracked (≥ the cracked threshold). */
  crackedPct: number;
  /** Rolling Boss Round accuracy over the window, 0–100. */
  transferPct: number;
  /** The blueprint types not yet "taught and progressing" — the meter names
   *  what's left, never a judgement of the child (§4). */
  typesStillBuilding: string[];
  /** The hard floor: blueprint types with no case file at all — untaught. */
  untaughtTypes: string[];
  rung: MockRung;
}

export function blueprintTypeIds(blueprint: Blueprint): string[] {
  return [...new Set(blueprint.sections.flatMap((section) => Object.keys(section.typeMix)))];
}

export function computeReadiness(input: ReadinessInput): Readiness {
  const typeIds = blueprintTypeIds(input.blueprint);
  const byType = new Map(input.caseFiles.map((file) => [file.questionTypeId, file]));

  const progressing = typeIds.filter(
    (typeId) => (byType.get(typeId)?.masteryLevel ?? 0) >= ENGINE_CONFIG.mastery.progressing,
  );
  const untaughtTypes = typeIds.filter((typeId) => !byType.has(typeId));
  const typesStillBuilding = typeIds.filter((typeId) => !progressing.includes(typeId));

  const coveragePct = Math.round((progressing.length / typeIds.length) * 100);
  const crackedCount = input.caseFiles.filter((file) => file.cracked).length;
  const crackedPct =
    input.districtCaseCount === 0
      ? 0
      : Math.round((crackedCount / input.districtCaseCount) * 100);

  const window = input.bossRoundOutcomes.slice(0, READINESS_THRESHOLDS.transferWindow);
  const transferPct =
    window.length === 0
      ? 0
      : Math.round((window.filter(Boolean).length / window.length) * 100);

  const half =
    coveragePct >= READINESS_THRESHOLDS.half.coveragePct &&
    crackedPct >= READINESS_THRESHOLDS.half.crackedPct &&
    transferPct >= READINESS_THRESHOLDS.half.transferPct;
  const full =
    half &&
    crackedPct >= READINESS_THRESHOLDS.full.crackedPct &&
    transferPct >= READINESS_THRESHOLDS.full.transferPct &&
    (!READINESS_THRESHOLDS.full.requiresCompletedHalf || input.completedHalfPaper);

  return {
    coveragePct,
    crackedPct,
    transferPct,
    typesStillBuilding,
    untaughtTypes,
    rung: full ? 'full' : half ? 'half' : 'locked',
  };
}

/**
 * THE HARD FLOOR (§3) — a fairness law, not a setting, with no override: no
 * paper, half or full, may contain a question type the child has never been
 * taught. "Taught" means a case file exists: the case was opened, so the
 * engine's forced first Mode has introduced the type. Every composition path
 * — parent request, cadence, early request — must pass here first.
 */
export function hardFloorSatisfied(
  blueprint: Blueprint,
  taughtTypeIds: ReadonlySet<string>,
): { ok: true } | { ok: false; untaughtTypes: string[] } {
  const untaught = blueprintTypeIds(blueprint).filter((typeId) => !taughtTypeIds.has(typeId));
  return untaught.length === 0 ? { ok: true } : { ok: false, untaughtTypes: untaught };
}

/**
 * What this child may actually sit: readiness rung clamped by the intensity
 * column's ladder cell (Addendum D §2 guards Addendum C's unlocks), except
 * that an EARLY half request — above the hard floor, below threshold — is a
 * deliberate parent flow, never a silent unlock (§4).
 */
export function reachableRung(readiness: Readiness, intensity: IntensityLevers): MockRung {
  const ladder = intensity.mockLadder;
  if (ladder === 'locked') return 'locked';
  if (readiness.rung === 'locked') return 'locked';
  if (ladder === 'half') return 'half';
  return readiness.rung;
}

/** Early request is only ever HALF, only above the hard floor (§4). Full
 *  papers are never available below the FULL threshold. */
export function earlyHalfAvailable(readiness: Readiness, intensity: IntensityLevers): boolean {
  return (
    intensity.mockLadder !== 'locked' &&
    readiness.rung === 'locked' &&
    readiness.untaughtTypes.length === 0
  );
}
