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

  let standard = 0;
  let legacyStrings = 0;
  let legacyObjects = 0;
  const refusals: string[] = [];
  const reported: string[] = [];
  const landed: string[] = [];
  const splits: string[] = [];

  for (const f of files) {
    const p = JSON.parse(readFileSync(join(PASSAGES, f), 'utf8')) as Record<string, unknown>;
    const r = readContentFlags(p);
    standard += r.standardFlags.length;
    legacyStrings += r.legacy.strings;
    legacyObjects += r.legacy.objects;
    for (const x of r.refusals) refusals.push(`  ${x.code}  ${x.where}\n      ${x.detail}`);
    reported.push(...r.reported.map((s) => `  ${s}`));
    for (const sf of r.standardFlags) {
      const conv = sf.convertedBy ? `  converted by ${sf.convertedBy}` : `  judgedBy ${sf.judgedBy}`;
      landed.push(`  ${String(p.id)}  ${sf.axis}  [${sf.disposition}]${conv}${sf.splitNote ? '  [SPLIT]' : ''}`);
      // Her number to watch: every split found is a legacy flag that was two judgements all along.
      if (sf.splitNote) splits.push(`  ${String(p.id)}  ${sf.axis} — ${sf.splitNote}`);
    }
  }

  console.log(`\n  ${files.length} passages screened · ${canary.detail} — canary held`);
  declareMayBeEmpty('check:content-flags', 'standard-shape flag(s) arrived', standard,
    'The freeze gated corpus writes until the standard was signed, and only the two railway-children '
    + 'flags have been unfrozen since. Zero arrivals is the door having been shut, not the door '
    + 'working; the screened denominator above is asserted separately.');
  if (standard > 0) for (const l of landed) console.log(l);
  console.log(
    `  LEGACY census — counted, NEVER refused (the standard does not decide the twenty-six, and this\n`
    + `  reader does not either): ${legacyStrings} string flag(s), ${legacyObjects} pre-standard object flag(s).`,
  );
  if (splits.length > 0) {
    const pairs = splits.filter((s) => s.includes('second object')).length;
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
