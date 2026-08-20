/**
 * Re-present the seven artefacts for Annie as ONE delivery, each through `deliver()` (R255/R265).
 *
 * **NOTHING IS REBUILT.** Six already exist and are staged as they stand; only the flag-fault record
 * (item 5) is produced, because it has never existed as an artefact — the faults live on the passage
 * rows and a row is not a delivery.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deliver } from './lib/export-destination';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PASSAGES = join(REPO_ROOT, 'content/passages');

/** Item 5, derived from the rows themselves — never retyped (R25). */
function buildFlagFaults(): string {
  const out: string[] = [
    '# Two flag faults, recorded on the rows and not repaired',
    '',
    '**21 August 2026. For Annie.**',
    '',
    '**Both were found the only way a fault of this kind can be found: by reading the flag against the',
    'passage it describes.** Neither is reachable by any check on either side — **nothing anywhere reads',
    "a flag's REASON against a passage's PROSE.** Every check here compares a value to a rule, or a value",
    'to another value; none compares a claim to the text it is a claim about.',
    '',
    '**Recorded, NOT repaired.** The flag text is unchanged on both rows — verified by hashing the',
    '`contentFlags` array before and after, identical both times. Rewriting either would put an agent\'s',
    "words into a field that reads as your judgement, and would erase the evidence that the flag was",
    'written that way. **Whether each verdict survives its correction is yours**, which is why both rows',
    'carry `ruledOn: null` rather than a disposition someone here invented.',
    '',
    '---',
    '',
  ];
  for (const file of ['stream-a-03-wind-in-willows.json', 'stream-b-01.json']) {
    const j = JSON.parse(readFileSync(join(PASSAGES, file), 'utf8')) as Record<string, unknown>;
    const faults = j.flagRecordFaults;
    if (!Array.isArray(faults) || faults.length === 0) {
      throw new Error(
        `deliver-annie-seven ABORTED — ${file} carries no flagRecordFaults.\n` +
          '  This artefact is DERIVED from the rows. If the rows are empty the delivery would be an\n' +
          '  empty page reporting that nothing was found, which is the opposite of the truth.',
      );
    }
    const flags = (j.contentFlags ?? []) as unknown[];
    for (const raw of faults) {
      const f = raw as Record<string, string | number | null>;
      const idx = Number(f.flagIndex);
      out.push(`## \`${String(j.id)}\` — ${String(f.asDeliveredAs)}`, '');
      out.push(`**${String(f.fault)}**`, '');
      out.push('**The flag says:**', '', `> …${String(f.theFlagSays)}…`, '');
      out.push('**The text says:**', '', `> ${String(f.theTextSays)}`, '');
      out.push('**Why it matters:**', '', String(f.why), '');
      out.push('<details><summary>the flag as it stands, unchanged</summary>', '');
      out.push('```json', JSON.stringify(flags[idx], null, 2), '```', '', '</details>', '');
      out.push(`*Found by ${String(f.foundBy)}. Disposition: ${String(f.disposition)}. Ruled on: ${f.ruledOn ?? 'NOT YET — yours.'}*`, '');
      out.push('---', '');
    }
  }
  out.push('## The class this opens', '');
  out.push(
    '**These two are the first instance of a class nothing screens.** A wrong string fails a gate. **A',
    'wrong claim about a text passes every gate and then becomes the reason for a verdict** — and in',
    'both cases here the faulty clause is load-bearing: *"the rabbit is unhurt"* is offered as the reason',
    'the scene is comic rather than cruel, and *"never named"* as the reason the insecticide is',
    'acceptable. The verdicts stand in the store while the reasons for them are false.',
    '',
    '**The open question, which the content standard will have to answer:** when a flag\'s reason makes a',
    'factual claim about the passage, is that claim part of the JUDGEMENT — so correcting it reopens the',
    'verdict — or part of the EXPLANATION, so it does not? **These two point opposite ways.** The rabbit',
    'claim looks load-bearing; the naming claim looks recoverable. Nothing currently distinguishes them.',
    '',
  );
  return out.join('\n');
}

const faultsPath = join(REPO_ROOT, 'content/exports/FLAG-FAULTS-ON-THE-ROWS.md');
writeFileSync(faultsPath, buildFlagFaults());

const SEVEN = [
  'content/exports/FIFTEEN-PASSAGES-DECODING-AND-COMPREHENSION.md',
  'content/exports/RAILWAY-CHILDREN-UNJUDGED.md',
  'content/exports/PROPOSAL-CONDITIONAL-RECOMMENDATION-SCHEMA.md',
  'content/exports/CONDITIONAL-FLAG-RECOMMENDATIONS.md',
  'content/exports/FLAG-FAULTS-ON-THE-ROWS.md',
];
for (const p of SEVEN) deliver(join(REPO_ROOT, p));
