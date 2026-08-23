/**
 * THE STANDING RUN OF THE contentFlags READER (R628). Second of the reader's three callers.
 *
 * On a corpus whose standard-shape arrivals are currently zero, this prints its own bound rather
 * than a green line: the screened denominator is asserted, the canary proves the axes transcription
 * is not blind, the zero is DECLARED under the freeze's reason, and the 61 legacy flags are a
 * census the reader never refuses — the standard deliberately does not decide the twenty-six.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { axesTableCanary, readContentFlags } from '../packages/core/src/index';
import { declareMayBeEmpty, requirePopulation } from './lib/population';

const PASSAGES = join(dirname(fileURLToPath(import.meta.url)), '..', 'content/passages');

function main() {
  const files = readdirSync(PASSAGES).filter((f) => f.endsWith('.json'));
  requirePopulation('check:content-flags', { 'passage file(s) screened': files.length });

  const canary = axesTableCanary();
  if (!canary.holds) {
    console.error(`check:content-flags BLIND — ${canary.detail}. A blind reader must fail, not report a clean corpus.`);
    process.exitCode = 1;
    return;
  }
  /**
   * **CALIBRATION SPECIMEN (Annie's standing practice, R646): the christmas-carol item-set claim.**
   * A census ships with its known member and refuses on failing to find it — *"an instrument that
   * cannot find the fault it was built from has not been built yet."* This census was built while
   * that flag landed; a run that cannot see it is blind, whatever else it prints.
   */
  let specimenSeen = false;

  let standard = 0;
  const screenedClean: string[] = [];
  const neverScreened: string[] = [];
  let legacyStrings = 0;
  let legacyObjects = 0;
  const refusals: string[] = [];
  const reported: string[] = [];
  const landed: string[] = [];
  const splits: string[] = [];
  const declaredByKind = new Map<string, number>();

  for (const f of files) {
    const p = JSON.parse(readFileSync(join(PASSAGES, f), 'utf8')) as Record<string, unknown>;
    const r = readContentFlags(p);
    standard += r.standardFlags.length;
    if (r.screenings.length > 0) screenedClean.push(`${String(p.id)} — ${r.screenings.map((s) => s.axes.join('+')).join('; ')}`);
    else if (r.standardFlags.length === 0 && r.legacy.strings + r.legacy.objects === 0) neverScreened.push(String(p.id));
    legacyStrings += r.legacy.strings;
    legacyObjects += r.legacy.objects;
    for (const x of r.refusals) refusals.push(`  ${x.code}  ${x.where}\n      ${x.detail}`);
    if (f === 'stream-a-08-christmas-carol.json' && r.declared.some((d) => d.kind === 'item-set')) specimenSeen = true;
    for (const dcl of r.declared) declaredByKind.set(dcl.kind, (declaredByKind.get(dcl.kind) ?? 0) + 1);
    reported.push(...r.reported.map((s) => `  ${s}`));
    for (const sf of r.standardFlags) {
      const conv = sf.convertedBy ? `  converted by ${sf.convertedBy}` : `  judgedBy ${sf.judgedBy}`;
      landed.push(`  ${String(p.id)}  ${sf.axis}  [${sf.disposition}]${conv}${sf.splitNote ? '  [SPLIT]' : ''}`);
      // Her number to watch: every split found is a legacy flag that was two judgements all along.
      if (sf.splitNote) splits.push(`  ${String(p.id)}  ${sf.axis} — ${sf.splitNote}`);
    }
  }

  if (!specimenSeen) {
    console.error('check:content-flags BLIND — the CALIBRATION SPECIMEN (christmas-carol\'s DECLARED(item-set) flag) was not found. The census cannot see its known member; nothing else it prints is trustworthy.');
    process.exitCode = 1;
    return;
  }
  console.log(`\n  ${files.length} passages screened · ${canary.detail} — canary held · specimen found (christmas-carol item-set)`);
  declareMayBeEmpty('check:content-flags', 'standard-shape flag(s) arrived', standard,
    'The freeze gated corpus writes until the standard was signed, and only the two railway-children '
    + 'flags have been unfrozen since. Zero arrivals is the door having been shut, not the door '
    + 'working; the screened denominator above is asserted separately.');
  if (standard > 0) for (const l of landed) console.log(l);
  /**
   * **A NUMBER THAT TRAVELS WITHOUT ITS UNIT GETS RECONCILED BY HAND EVERY TIME** (David,
   * 2026-08-22 — R634). This census splits legacy by shape; the authoring store counts legacy
   * WHOLE. Both are right, the desk reconciled them once, and the fix is that the line carries both
   * figures WITH both units so no reader ever subtracts on a guess.
   */
  console.log(
    `  LEGACY census — counted, NEVER refused (the standard does not decide the twenty-six, and this\n`
    + `  reader does not either):\n`
    + `      ${legacyStrings} [unit: legacy STRING flags] + ${legacyObjects} [unit: legacy pre-standard OBJECT flags]\n`
    + `      = ${legacyStrings + legacyObjects} [unit: legacy flags, whole — the authoring store's unit]`,
  );
  if (declaredByKind.size > 0) {
    console.log(`\n  DECLARED strikes, by kind [unit: flags]: ${[...declaredByKind].sort().map(([k, v]) => `${k} ${v}`).join(' · ')}`);
  }
  /**
   * **THE TWO SILENCES, APART (ruling eleven).** A passage with no flags was, until the screening
   * record existed, one population wearing two meanings. Now: SCREENED-CLEAN carries its recorded
   * zero (axes, scope, judge); NEVER-SCREENED is the silence that still means nothing. Reported as
   * distinct populations, units on their faces, so neither silence can borrow the other's credit.
   */
  console.log(`\n  SCREENED-CLEAN: ${screenedClean.length} [unit: passages with a recorded zero]`);
  for (const s of screenedClean) console.log(`      ${s}`);
  console.log(`  NEVER-SCREENED: ${neverScreened.length} [unit: passages with no flag, no legacy row and no screening — a silence that means nothing]`);
  for (const s of neverScreened) console.log(`      ${s}`);
  if (splits.length > 0) {
    // "second object OF THE SPLIT" marks the pair's second member; the FIRST member's note also
    // contains "second object" ("…second object below shares…"), which made 2 splits print as 4.
    const pairs = splits.filter((s) => /second object of the split/.test(s)).length;
    console.log(`\n  SPLITS — her number to watch (a split is a legacy flag that was two judgements all along): ${pairs} split(s), ${splits.length} object(s)`);
    for (const s of splits) console.log(s);
  }
  if (reported.length > 0) {
    // Three reported classes share this block — absence claims, pending bytes, assertive-not-load-
    // bearing — and each line names its own; a header claiming one class over all three is R591.
    console.log(`\n  REPORTED, not refused (§5 — each line names its class): ${reported.length}`);
    for (const s of reported) console.log(s);
  }
  if (refusals.length > 0) {
    console.error(`\n  REFUSED: ${refusals.length}`);
    for (const s of refusals) console.error(s);
    process.exitCode = 1;
    return;
  }
  console.log('\n  refused nothing' + (standard === 0 ? ' because nothing has arrived — this line is not a pass.' : '.'));
}

main();
