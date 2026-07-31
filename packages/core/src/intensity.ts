/**
 * The intensity matrix (ADDENDUM-D §2): every intensity decision in one
 * declared, config-driven model. Two inputs only — effective year group and
 * runway — runway leads, year group guards.
 *
 * What intensity NEVER touches (§3, restated as law): the 15-minute session
 * cap does not scale, ever — intensity is composition, never duration. Streak
 * forgiveness, no-red, no urgency language and every D-law hold at every
 * column. The final stretch gets CALMER copy, not louder.
 *
 * Values are launch defaults awaiting ratification by David + the reviewer,
 * revisited against cohort-one data on the same 8-week calendar rule as the
 * Addendum C thresholds.
 *
 * Note recorded at implementation: Addendum C §2 scaled the Boss Round
 * 1 → 3 → 5 purely by runway (1 above nine months); Addendum D's matrix,
 * which declares itself as modifying C, gives the 18–9-month column 3. The
 * matrix is the single source of truth, so a Year 5 child more than nine
 * months out gets a 3-question Boss Round — D supersedes C here.
 */
import { academicYearOf, runwayDays } from './year';

export type IntensityColumn = 'foundations' | 'building' | 'together' | 'final';

export interface IntensityLevers {
  column: IntensityColumn;
  /** New cases per week per district; 0 in the final stretch (§2's most
   *  important cell: no new types close to the exam). */
  newCasesPerWeek: number;
  /** Whether pacing should aim to complete blueprint coverage by −4 months. */
  coverageDriven: boolean;
  /** Review items allowed per session (composition, not duration). */
  reviewLoadCap: number;
  /** In the final stretch, overdue reviews go first. */
  overdueFirst: boolean;
  /** Boss Round questions per session (Addendum C rung 1, sized here). */
  bossRoundSize: number;
  fluency: 'off' | 'light' | 'standard';
  /** What the readiness ladder can reach in this column. */
  mockLadder: 'locked' | 'half' | 'full';
  /** Suggested cadence once FULL papers are unlocked. */
  mockCadenceSuggestion: 'none' | 'monthly' | 'fortnightly';
  /**
   * Parent-facing display of the gentle weekly rhythm. DISPLAY ONLY: streak
   * computation is deliberately not wired to this value — David's instruction
   * for this build was "do not touch streak logic", and the matrix's streak
   * cell is surfaced to him as the one lever left unwired.
   */
  weeklySessionTarget: number;
  /** The copy register for parent surfaces, per §2. */
  parentRegister: string;
}

/** The D §2 matrix, column by column. Config, not code. */
export const INTENSITY_MATRIX: Readonly<Record<IntensityColumn, IntensityLevers>> = {
  foundations: {
    column: 'foundations',
    newCasesPerWeek: 0.5,
    coverageDriven: false,
    reviewLoadCap: 8,
    overdueFirst: false,
    bossRoundSize: 1,
    fluency: 'light', // Year 3 overrides to 'off' in levers()
    mockLadder: 'locked',
    mockCadenceSuggestion: 'none',
    weeklySessionTarget: 4,
    parentRegister: 'building foundations',
  },
  building: {
    column: 'building',
    newCasesPerWeek: 1,
    coverageDriven: false,
    reviewLoadCap: 10,
    overdueFirst: false,
    bossRoundSize: 3,
    fluency: 'light',
    mockLadder: 'half',
    mockCadenceSuggestion: 'none',
    weeklySessionTarget: 5,
    parentRegister: 'building the toolkit',
  },
  together: {
    column: 'together',
    newCasesPerWeek: 1, // pace rises to whatever completes coverage by −4mo
    coverageDriven: true,
    reviewLoadCap: 12,
    overdueFirst: false,
    bossRoundSize: 3,
    fluency: 'standard',
    mockLadder: 'full',
    mockCadenceSuggestion: 'monthly',
    weeklySessionTarget: 5,
    parentRegister: 'putting it together',
  },
  final: {
    column: 'final',
    newCasesPerWeek: 0, // the matrix's most important cell: no new types
    coverageDriven: false,
    reviewLoadCap: 12,
    overdueFirst: true,
    bossRoundSize: 5,
    fluency: 'standard',
    mockLadder: 'full',
    mockCadenceSuggestion: 'fortnightly',
    weeklySessionTarget: 5,
    parentRegister: 'staying sharp, staying calm',
  },
};

/** Runway boundaries in days: >18mo | 18–9mo | 9–4mo | <4mo. */
const MONTHS_18 = 548;
const MONTHS_9 = 274;
const MONTHS_4 = 122;

export function columnForRunway(days: number): IntensityColumn {
  if (days > MONTHS_18) return 'foundations';
  if (days > MONTHS_9) return 'building';
  if (days > MONTHS_4) return 'together';
  return 'final';
}

/**
 * Runway leads, year group guards: a Year 3–4 child never runs hotter than
 * `building`, whatever the entered exam date says — a strong Year 4 goes
 * deeper, not two years forward (§3). Without an exam year the column comes
 * from the year group alone.
 */
export function intensityColumn(
  effectiveYear: number,
  examYear: number | null,
  now: Date,
): IntensityColumn {
  const fromRunway: IntensityColumn = examYear
    ? columnForRunway(runwayDays(examYear, now))
    : effectiveYear <= 4
      ? 'foundations'
      : effectiveYear === 5
        ? 'building'
        : 'together';
  if (effectiveYear <= 4) {
    return fromRunway === 'foundations' ? 'foundations' : 'building';
  }
  return fromRunway;
}

/** The levers in force for a child right now. */
export function levers(effectiveYear: number, examYear: number | null, now: Date): IntensityLevers {
  const column = intensityColumn(effectiveYear, examYear, now);
  const base = INTENSITY_MATRIX[column];
  // Year 3: the gentlest column with the fluency thread off (§2).
  if (effectiveYear <= 3) return { ...base, fluency: 'off' };
  return base;
}

/** One calm line when the column changes (§4) — never urgency. */
export const INTENSITY_TRANSITION_LINES: Readonly<Record<IntensityColumn, string>> = {
  foundations:
    'This stretch is about foundations: play forward, no hurry — the toolkit comes later.',
  building: 'From this month the pace steps up gently: about one new case type a week.',
  together:
    'From this month the programme works to complete the full range of question types, well ahead of the test.',
  final:
    'From this month we stop introducing new question types and sharpen what’s there — this is deliberate.',
};

/** Convenience for touchpoints that only have the capture pair. */
export function intensityForCapture(
  yearGroupAtCapture: number,
  capturedAcademicYear: number,
  examYear: number | null,
  now: Date,
): IntensityLevers {
  const effectiveYear =
    yearGroupAtCapture + (academicYearOf(now) - capturedAcademicYear);
  return levers(effectiveYear, examYear, now);
}
