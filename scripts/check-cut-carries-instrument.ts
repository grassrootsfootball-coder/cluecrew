/**
 * check:cut-carries-instrument — A THRESHOLD TRAVELS WITH THE INSTRUMENT IT WAS TAKEN ON (R993).
 *
 * Annie's 225th: *"the authoring store runs wordfreq 3.1.1 and gets GRAN at 3.44 — two honest
 * instruments, and a ruling that names only its number cannot be checked across stores."* Measured
 * here, GRAN reads 3.94 on SUBTLEX-UK. **Both stores are right, they differ by half a Zipf, and
 * nothing in the number 3.0 would ever have surfaced that.**
 *
 * So any emitter that publishes a figure taken at the cut must publish the instrument with it:
 * `cutDeclaration()` — source, digest, version, column, and the NAME FILTER, which is part of the
 * measurement rather than a detail of the implementation. GOVE clears 3.0 at 3.74; a store told
 * only "3.0" would admit it and be faithful to the ruling as written.
 *
 * **THIS IS R985 ONE LEVEL UP.** There a digest travelled with the keys it was taken over; here a
 * threshold travels with the instrument it was taken on. A number without its instrument is a
 * value with no subject.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { requirePopulation } from './lib/population';
import { assertFixture } from './lib/carried-fixture';

const REPO = pjoin(__dirname, '..');
/** A file that MEASURES at the cut: it loads the lexicon or names the threshold constant. */
const MEASURES = /loadChildLexicon\(|CHILD_CUT_ZIPF|searchMoveLetter\(|performingLetters\(/;
/** Carrying the instrument: the declaration itself, or provenance which embeds it. */
const CARRIES = /cutDeclaration\(|THE_CUT_AND_ITS_INSTRUMENT|\.provenance\b/;
/** A file that only DEFINES the machinery is not an emitter of figures. */
const DEFINES = /^(scripts\/lib\/child-lexicon\.ts|scripts\/lib\/move-letter-search\.ts|scripts\/check-cut-carries-instrument\.ts)$/;

function files(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e.startsWith('.')) continue;
    const full = pjoin(dir, e);
    if (statSync(full).isDirectory()) files(full, out);
    else if (e.endsWith('.ts') && !e.endsWith('.test.ts')) out.push(full);
  }
  return out;
}

function main() {
  console.log('check:cut-carries-instrument — a figure taken at 3.0 names the instrument it was taken on.');
  assertFixture('cut-instrument', [
    { name: 'measures at the cut and names no instrument', input: 'const L = loadChildLexicon(); report({ flatters: n });', mustBeCaught: true },
    { name: 'measures and carries the declaration', input: 'const L = loadChildLexicon(); report({ THE_INSTRUMENT: cutDeclaration() });', mustBeCaught: false },
    { name: 'measures and carries provenance, which embeds it', input: 'const L = loadChildLexicon(); report({ i: L.provenance });', mustBeCaught: false },
    { name: 'does not measure at the cut at all', input: 'const rows = await prisma.item.findMany({});', mustBeCaught: false },
  ], (src) => MEASURES.test(src) && !CARRIES.test(src));

  const all = files(pjoin(REPO, 'scripts'));
  requirePopulation('check:cut-carries-instrument', { 'script(s) screened': all.length });

  const faults: string[] = [];
  let measuring = 0;
  for (const f of all) {
    const rel = f.replace(`${REPO}/`, '');
    if (DEFINES.test(rel)) continue;
    const src = readFileSync(f, 'utf8');
    if (!MEASURES.test(src)) continue;
    measuring += 1;
    if (!CARRIES.test(src)) faults.push(rel);
  }

  console.log(`  ${all.length} script(s) screened; ${measuring} measure at the cut; ${faults.length} publish a figure without naming the instrument.`);
  if (faults.length === 0) {
    console.log('  Every emitter that measures at 3.0 carries its instrument — source, digest, column and name filter.');
    console.log('  Cross-store check available: GRAN reads 3.94 here (SUBTLEX-UK) and 3.44 there (wordfreq 3.1.1).');
    return;
  }
  console.error(`\n  REFUSED — ${faults.length} emitter(s) measure at the cut and name no instrument:`);
  for (const f of faults) console.error(`    ${f}`);
  console.error('\n  Two honest instruments disagree: GRAN is 3.94 on SUBTLEX-UK and 3.44 on wordfreq 3.1.1.');
  console.error('  A ruling that names only its number cannot be checked across stores (Annie, 225th).');
  console.error('  Publish it: include cutDeclaration() — or the lexicon\'s own .provenance, which embeds it.');
  process.exitCode = 1;
}

main();
