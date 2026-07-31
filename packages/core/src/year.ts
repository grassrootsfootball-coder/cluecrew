/**
 * The year model (ADDENDUM-D §1).
 *
 * A static year group goes stale every 1 September — a child entered as
 * Year 4 in March is Year 5 by October, and every runway and pacing
 * calculation quietly rots. So the schema stores the year group AT CAPTURE
 * plus WHICH academic year captured it, and the effective year group is
 * always derived here, never stored denormalised.
 *
 * Academic years are named by their September: 2026 means 2026/27.
 */

/** Supported range (§1): Year 3 accepted as an early start, never marketed. */
export const MIN_YEAR_GROUP = 3;
export const MAX_YEAR_GROUP = 6;

/** The academic year a date falls in: September onwards belongs to that
 *  calendar year; January–August still belongs to the previous September. */
export function academicYearOf(date: Date): number {
  const month = date.getUTCMonth() + 1;
  const year = date.getUTCFullYear();
  return month >= 9 ? year : year - 1;
}

/**
 * The capture year for the onboarding question "Which year group is [name]
 * in FROM THIS SEPTEMBER?" (§1's summer-ambiguity fix). "This September" is
 * the September of the current calendar year whether it has happened yet or
 * not — which is precisely why the wording works: in July the answer names
 * the incoming year, in October it names the year just started, and both
 * resolve to the same capture pair.
 */
export function captureAcademicYear(now: Date): number {
  return now.getUTCFullYear();
}

/** yearGroupAtCapture + elapsed academic years. May exceed Year 6 — display
 *  code decides what an aged-out profile shows; the maths stays honest. */
export function effectiveYearGroup(
  yearGroupAtCapture: number,
  capturedAcademicYear: number,
  now: Date,
): number {
  return yearGroupAtCapture + (academicYearOf(now) - capturedAcademicYear);
}

/**
 * True when the derived year is ahead of the captured one AND the change has
 * not yet been confirmed or corrected this academic year — the September
 * rollover beat (§1). Confirmation state is an event query; callers pass the
 * academic year of the latest year_rollover_confirmed/corrected event.
 */
export function rolloverPending(
  capturedAcademicYear: number,
  lastConfirmedAcademicYear: number | null,
  now: Date,
): boolean {
  const current = academicYearOf(now);
  if (current <= capturedAcademicYear) return false;
  return lastConfirmedAcademicYear === null || lastConfirmedAcademicYear < current;
}

/**
 * The exam sits at the start of Year 6 (§1), so the expected exam calendar
 * year is the September the child enters Year 6.
 */
export function expectedExamYear(yearGroupAtCapture: number, capturedAcademicYear: number): number {
  return capturedAcademicYear + (MAX_YEAR_GROUP - yearGroupAtCapture);
}

/**
 * Advisory only, never a block (§1): "Keep your dates if you know better;
 * schools vary." Returns the expected year when the parent's entry looks
 * implausible, null when it looks fine.
 */
export function examYearAdvisory(
  yearGroupAtCapture: number,
  capturedAcademicYear: number,
  enteredExamYear: number,
): number | null {
  const expected = expectedExamYear(yearGroupAtCapture, capturedAcademicYear);
  return enteredExamYear === expected ? null : expected;
}

/** Days from `now` to the expected exam date (1 September of examYear). The
 *  runway that leads every intensity decision (Addendum D §2). */
export function runwayDays(examYear: number, now: Date): number {
  const exam = Date.UTC(examYear, 8, 1); // 1 September
  return Math.ceil((exam - now.getTime()) / 86_400_000);
}
