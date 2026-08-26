/**
 * A KNOWN MEMBER THAT CANNOT BE REPAIRED OUT FROM UNDER THE INSTRUMENT (David's ruling on
 * Cowork's fixture lesson, 2026-08-25 — R721).
 *
 * Cowork's bank screen wired its known member to the shouted TWO — a fault in the STANDING
 * CORPUS. The moment the 28 rows were amended the screen refused, because the member it was
 * built knowing about had been repaired. Its lesson, taken whole:
 *
 *   **A KNOWN MEMBER DRAWN FROM THE STANDING CORPUS EXPIRES WHEN THE CORPUS IS FIXED, and a
 *   screen whose self-test expires goes dark exactly when the corpus is at its cleanest — the
 *   moment it is least likely to be questioned.**
 *
 * So a fixture is CARRIED: synthetic strings the instrument owns, some that MUST be caught by the
 * fault each names, and **at least one CLEAN string that must be caught by NOTHING** — because a
 * screen that flags clean text reports faults nobody can trust.
 *
 * It runs FIRST and prints before the sweep, so a reader knows the instrument worked before
 * reading what it found.
 */
export interface FixtureCase<T> {
  name: string;
  input: T;
  /** true = this input MUST be caught; false = it must be caught by NOTHING. */
  mustBeCaught: boolean;
}

export function assertFixture<T>(
  label: string,
  cases: ReadonlyArray<FixtureCase<T>>,
  detects: (input: T) => boolean,
): void {
  if (!cases.some((c) => c.mustBeCaught) || !cases.some((c) => !c.mustBeCaught)) {
    throw new Error(`${label} FIXTURE MALFORMED — a fixture needs both a must-catch and a clean case; one without the other proves half an instrument.`);
  }
  const wrong = cases.filter((c) => detects(c.input) !== c.mustBeCaught);
  if (wrong.length > 0) {
    console.error(`\n  ${label} FIXTURE FAILED — the instrument does not do what it claims:`);
    for (const w of wrong) {
      console.error(`    ${w.name}: expected ${w.mustBeCaught ? 'CAUGHT' : 'CLEAN'}, got ${w.mustBeCaught ? 'MISSED' : 'FALSELY CAUGHT'}`);
    }
    console.error('  Nothing this run prints can be trusted. Fix the instrument before reading its findings.');
    process.exitCode = 1;
    throw new Error(`${label}: fixture failed`);
  }
  console.log(`  FIXTURE PASSED — ${cases.length} carried cases (${cases.filter((c) => c.mustBeCaught).length} must-catch, ${cases.filter((c) => !c.mustBeCaught).length} must-be-clean). The instrument works; its findings follow.`);
}
