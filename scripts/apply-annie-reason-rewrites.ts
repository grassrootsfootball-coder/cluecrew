/**
 * Annie's twenty-second return: both verdicts stand, both reasons are rewritten (R369).
 *
 * **The replacements are READ FROM HER FILE, never retyped** (R25) — the script locates her authored
 * clause in `annie-twentysecond-return.md` and fails if it cannot find it verbatim.
 *
 * This REPLACES the faulty reason clause on the row. It is not the R346 record-without-repair any
 * more: she has ruled, in her own words, and the ruling is the repair. `flagRecordFaults` keeps its
 * entry and gains `ruledOn` so the history stays readable — the fault, her ruling, and the date.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const HER_FILE = '/Users/davidb/Downloads/annie-twentysecond-return.md';
const her = readFileSync(HER_FILE, 'utf8').replace(/\s*\n\s*/g, ' ');

/** Pull her authored replacement out of her own prose, or refuse. */
function herClause(after: string): string {
  const at = her.indexOf(after);
  if (at === -1) {
    throw new Error(
      `apply-annie-reason-rewrites ABORTED — cannot find "${after}" in ${HER_FILE}.\n` +
        '  The replacement is READ from her file, never typed here. If her wording has changed, this\n' +
        '  must refuse rather than apply a clause she did not write.',
    );
  }
  const rest = her.slice(at + after.length);
  const end = rest.indexOf('**');
  if (end === -1) throw new Error('apply-annie-reason-rewrites ABORTED — her clause is not delimited as expected.');
  return rest.slice(0, end).trim().replace(/\.$/, '');
}

const REWRITES = [
  {
    file: 'stream-a-03-wind-in-willows.json',
    flagIndex: 0,
    faulty: 'the rabbit is unhurt',
    replacement: herClause('Authored replacement for the reason clause: **'),
  },
  {
    file: 'stream-b-01.json',
    flagIndex: 1,
    faulty: 'It is never named or used, only reached for',
    replacement: herClause('Authored replacement: **'),
  },
];

for (const r of REWRITES) {
  const path = join(REPO_ROOT, 'content/passages', r.file);
  const j = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  const flags = j.contentFlags as unknown[];
  const flag = flags[r.flagIndex];
  const before = JSON.stringify(flag);
  if (!before.includes(r.faulty)) {
    throw new Error(
      `apply-annie-reason-rewrites ABORTED — ${r.file} flag ${r.flagIndex} no longer contains "${r.faulty}".\n` +
        '  Applying her rewrite to text that has since changed would replace something she did not read.',
    );
  }

  if (typeof flag === 'string') {
    flags[r.flagIndex] = flag.replace(r.faulty, r.replacement);
  } else {
    const f = flag as Record<string, string>;
    f.reason = f.reason!.replace(r.faulty, r.replacement);
  }

  const faults = (j.flagRecordFaults ?? []) as Array<Record<string, unknown>>;
  for (const fault of faults) {
    if (fault.flagIndex === r.flagIndex) {
      fault.ruledOn = '2026-08-21';
      fault.ruling = 'VERDICT STANDS, REASON REWRITTEN. Annie, twenty-second return.';
      fault.replacedWith = r.replacement;
      fault.disposition = 'RULED — the faulty clause is replaced by her authored wording';
    }
  }
  j.flagRecordFaults = faults;
  writeFileSync(path, JSON.stringify(j, null, 2) + '\n');
  console.log(`  ${r.file} flag ${r.flagIndex}`);
  console.log(`    was: "${r.faulty}"`);
  console.log(`    now: "${r.replacement}"`);
}
console.log('\n2 reason clauses replaced with her authored wording. Both verdicts stand.');
