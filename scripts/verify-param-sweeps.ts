/**
 * EMITTED BEHAVIOUR, GUARDED ON EVERY CI RUN — `pnpm verify:param-sweeps`
 *
 * Annie's condition for lifting the maths hold, 2026-08-12. `verify:fingerprints` guards the
 * DECLARED SURFACE a reviewer met on the sample sheet. It cannot see emitted behaviour at all:
 * verified 2026-08-12, replacing a family's generator body does not move its fingerprint, and
 * `spag-punct-terminal-boundary` is the live proof — declared surface intact, T4/T5 items emitted
 * outside its own ladder. The sweeps are the only instrument for that, and they had run twice in
 * this project's history, both times because someone asked.
 *
 * So the assertion runs here, on the same trigger as the fingerprints, in ~7s for both districts
 * over ~35,000 emitted items. The reviewer-facing ARTEFACT is still produced by
 * `pnpm sweep:maths-params` and `pnpm export:param-sweep`; all three call the same functions in
 * `lib/param-sweep.ts`, so the sheet she reads and the gate CI runs can never diverge (R42).
 *
 * This gate DELIVERS NOTHING. An export writing review artefacts from a CI runner would be
 * delivery without a reader, and the outbound folder is a macOS path that does not exist there.
 *
 * Fails on three things, each a different way for the sweep to stop meaning anything:
 *   DISAGREES — a recomputed parameter contradicts the signed sheet. The finding itself.
 *   BLIND     — a family emitted nothing, so nothing was asserted about it (R61).
 *   UNSWEPT   — a family declares no recomputation, so it is unchecked rather than clean. The
 *               sweep's own rule: an unchecked family and a clean one must never read alike.
 */
import { requirePopulation } from './lib/population';
import {
  sweepMathsFamilies,
  sweepSpagFamilies,
  MATHS_DRAWS,
  SPAG_DRAWS,
  type MathsSweepRow,
  type SpagSweepRow,
} from './lib/param-sweep';

/**
 * THE SUCCESS REPORT, BUILT WHERE IT CAN BE INTERROGATED (David, 2026-08-12).
 *
 * The out-of-scope line is the part that matters most and the part most likely to be lost: a
 * passing run that omits it reads as full coverage over all 19 maths families, when the gate
 * actually asserts about the 6 that declare structural parameters. So the report is a pure
 * function of the sweep rows, and `--self-test` proves it still names the out-of-scope families
 * and their count before the real run is trusted. Refactor the wording freely; the self-test
 * fails if the SCOPE disappears.
 */
export function successReport(maths: MathsSweepRow[], spag: SpagSweepRow[]): string {
  const asserted = maths.filter((r) => r.verdict === 'ASSERTED').length;
  const partial = maths.filter((r) => r.verdict === 'PARTIAL').length;
  const outOfScope = maths.filter((r) => r.verdict === 'NONE-DECLARED');
  const inScope = maths.length - outOfScope.length;

  let report =
    '\nEmitted behaviour clean: 0 disagreements, 0 blind families, 0 unswept.\n' +
    `  maths verdicts: ${asserted} ASSERTED · ${partial} PARTIAL · ${outOfScope.length} NONE-DECLARED.\n` +
    `  IN SCOPE: ${inScope} of ${maths.length} maths families · ${spag.length} of ${spag.length} SPaG families.`;

  if (outOfScope.length > 0) {
    report +=
      `\n  OUT OF SCOPE — NOT CLEARED: ${outOfScope.length} maths families declare no structural\n` +
      '  parameters, so this gate asserted NOTHING about what they emit, either way. A pass here\n' +
      '  is not coverage of them:\n' +
      `    ${outOfScope.map((r) => r.id).join(', ')}`;
  }
  return report;
}

/** Proves the report still carries its scope before any real run is trusted. */
function selfTest(): void {
  const row = (id: string, verdict: MathsSweepRow['verdict']): MathsSweepRow => ({
    id, tiers: ['T1'], declared: [], asserted: [], metadataOnly: [], emissions: 1, verdict, mismatches: [],
  });
  const withGap = successReport(
    [row('M-a', 'ASSERTED'), row('M-b', 'NONE-DECLARED'), row('M-c', 'NONE-DECLARED')],
    [],
  );
  const problems: string[] = [];
  if (!/OUT OF SCOPE/.test(withGap)) problems.push('the report no longer names families as out of scope');
  if (!/NOT CLEARED/.test(withGap)) problems.push('the report no longer says out-of-scope families are not cleared');
  if (!withGap.includes('M-b') || !withGap.includes('M-c')) problems.push('the report no longer NAMES the out-of-scope families');
  if (!/IN SCOPE: 1 of 3/.test(withGap)) problems.push('the report no longer states how many of the total are in scope');

  const noGap = successReport([row('M-a', 'ASSERTED')], []);
  if (/OUT OF SCOPE/.test(noGap)) problems.push('the report claims families are out of scope when none are');

  if (problems.length > 0) {
    console.error('verify:param-sweeps SELF-TEST FAILED — the success report lost its scope statement:');
    for (const p of problems) console.error(`  ✗ ${p}`);
    console.error(
      '\nA passing run that omits the scope reads as coverage of all 19 maths families, when the\n' +
        'gate asserts about the 6 that declare structural parameters. Restore the scope, not this test.',
    );
    process.exit(1);
  }
  console.log('verify:param-sweeps self-test passed: the success report names its out-of-scope families and refuses to imply coverage of them.');
}

function main(): void {
  const maths = sweepMathsFamilies();
  const spag = sweepSpagFamilies();

  requirePopulation('verify:param-sweeps', {
    'maths families': maths.length,
    'SPaG families': spag.length,
  });

  const mathsItems = maths.reduce((s, r) => s + r.emissions, 0);
  const spagItems = spag.reduce((s, r) => s + r.emissions, 0);
  console.log(
    `  maths: ${maths.length} families · ${mathsItems.toLocaleString('en-GB')} items (${MATHS_DRAWS}/tier)\n` +
      `  SPaG:  ${spag.length} families · ${spagItems.toLocaleString('en-GB')} items (${SPAG_DRAWS}/tier)`,
  );

  const failures: string[] = [];

  // --- DISAGREES: the finding the sweeps exist to surface ---------------------
  for (const r of maths.filter((x) => x.verdict === 'DISAGREES')) {
    for (const m of r.mismatches) failures.push(`maths ${r.id}: [${m.count}×] ${m.detail}`);
  }
  for (const r of spag.filter((x) => x.mismatches.length > 0)) {
    for (const m of r.mismatches) failures.push(`SPaG ${r.id} T${m.tier}: [${m.count}×] ${m.detail}`);
  }

  // --- BLIND: emitted nothing, so asserted nothing ----------------------------
  for (const r of maths.filter((x) => x.verdict === 'BLIND')) {
    failures.push(`maths ${r.id}: emitted NO items across ${r.tiers.join(',')} — nothing was asserted about it`);
  }
  for (const r of spag.filter((x) => x.emissions === 0)) {
    failures.push(`SPaG ${r.id}: emitted NO items across ${r.tiers.join(',')} — nothing was asserted about it`);
  }

  // --- UNSWEPT: unchecked, which must never read as clean ---------------------
  const unswept = spag.filter((r) => !r.swept);
  for (const r of unswept) {
    failures.push(`SPaG ${r.id}: declares no recomputeParams — UNCHECKED, not passing`);
  }

  // --- The recompute mechanism itself has to be alive -------------------------
  // Strip recomputeParams from every maths family and each row becomes NONE-DECLARED or PARTIAL
  // under a "0 disagreeing" headline. At least one family must actually assert something.
  if (!maths.some((r) => r.asserted.length > 0)) {
    failures.push('maths: NO family recomputed a single parameter — the recompute mechanism is dead');
  }

  if (failures.length > 0) {
    console.error(`\nPARAMETER SWEEP GATE FAILED — ${failures.length} finding(s):`);
    for (const f of failures) console.error(`  ✗ ${f}`);
    console.error(
      '\nA disagreement means a signed sample sheet said something untrue about what the family\n' +
        'emits. Fix the generator or the declaration, then re-run `pnpm sweep:maths-params` and\n' +
        '`pnpm export:param-sweep` so the reviewer artefacts match.',
    );
    process.exit(1);
  }

  console.log(successReport(maths, spag));
}

if (process.argv.includes('--self-test')) selfTest();
else main();
