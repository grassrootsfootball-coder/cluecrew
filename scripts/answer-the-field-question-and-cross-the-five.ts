/** The authoring store's two questions: is `option.execution` one field with `misconceptionExecution`, and the five for set intersection. */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';
import { findingsDigest, digestsBlock } from './lib/findings-digest';
import { deliver, stampedName } from './lib/export-destination';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const LANE = pjoin(DL, '11+', 'from-cluecrew');
const sha = (s: string | Buffer) => createHash('sha256').update(typeof s === 'string' ? Buffer.from(s, 'utf8') : s).digest('hex');
/** The five written under her 231st — named by seat, because a row id names five seats (R1008). */
const THE_FIVE: Array<[string, string]> = [
  ['bank-vr-02-two-odd-ones-out-17', 'oval,triangle'],
  ['bank-vr-02-two-odd-ones-out-22', 'dog,snake'],
  ['bank-vr-02-two-odd-ones-out-23', 'cold,rough'],
  ['bank-vr-02-two-odd-ones-out-24', 'net,kick'],
  ['bank-vr-02-two-odd-ones-out-25', 'tuna,dolphin'],
];

async function main() {
  const execs = await prisma.itemOption.count({ where: { misconceptionExecution: { not: null } } });
  const pulls = await prisma.itemOption.count({ where: { drafterDeclaredPull: { not: null } } });
  const verdicts = await prisma.itemOption.count({ where: { drafterDeclaredPullVerdict: { not: null } } });
  requirePopulation('field-question', { 'option(s) carrying misconceptionExecution': execs, 'option(s) carrying drafterDeclaredPull': pulls });

  const five: Array<Record<string, unknown>> = [];
  for (const [itemId, seat] of THE_FIVE) {
    const it = await prisma.item.findUniqueOrThrow({ where: { id: itemId },
      select: { stem: true, status: true, options: { select: { content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true }, orderBy: { id: 'asc' } } } });
    const o = it.options.find((x) => { const v = (x.content as { value?: unknown })?.value; return (Array.isArray(v) ? v.join(',') : String(v)) === seat; })!;
    const key = it.options.find((x) => x.isCorrect)!;
    five.push({ itemId, seat, tag: o.misconceptionId, status: it.status,
      words: (it.stem as { words?: unknown[] }).words, key: (key.content as { value?: unknown })?.value,
      execution: o.misconceptionExecution, executionSha256: sha(String(o.misconceptionExecution ?? '')),
      writtenUnder: 'her 231st — an execution is a staff-facing derivation; the query returned no child-facing renderer',
      howItWasMade: 'computed from the row\'s own words in the template lifted from bank-vr-02-two-odd-ones-out-01, verified by rebuilding that row\'s own execution byte-identically before any write' });
  }

  const report = {
    kind: 'THE-FIELD-QUESTION-ANSWERED-AND-THE-FIVE-FOR-INTERSECTION',
    TO: 'the authoring store; Annie and David by relay',
    date: '2026-09-13',
    ONE_ARE_THEY_ONE_FIELD: {
      ANSWER: 'NO — and the distinction is deliberate, ruled, and load-bearing.',
      misconceptionExecution: { what: 'the gated, ATTESTED account of why this distractor executes this entry. Reviewer-facing.',
        readBy: 'itemWholeness — this is the field a door turns on', population: execs },
      drafterDeclaredPull: { what: 'THE DRAFTER\'S DECLARED PULL, verbatim from the authored source (R707). What a drafter CLAIMED, never what a reviewer attested.',
        readBy: 'NOTHING in the wholeness derivation, by design', population: pulls,
        andITSVERDICT: { field: 'drafterDeclaredPullVerdict (R708)', population: verdicts,
          why: 'the claim and its verdict live side by side, because a reader who meets the claim alone meets an unrefuted assertion. Null means NOT YET RULED, never accepted (R98).' } },
      WHY_THE_SEPARATION_IS_LOAD_BEARING: 'filling misconceptionExecution from a bank would MANUFACTURE WHOLENESS out of a machine\'s claim — R701\'s bar, and the exact fault R707 exists to prevent. The schema says so at the column: "deliberately NOT misconceptionExecution".',
      andWHATTHISSTORECANNOTTELLYOU: 'which of the two your `option.execution` corresponds to. Your vr-02 census carries the key on all 70 options and a VALUE on none, so there is nothing here to compare. **If it holds the drafter\'s sentence it maps to drafterDeclaredPull, and loading it into misconceptionExecution would make five owed seats look whole.** That is the question worth settling before any crossing writes it.',
      theHISTORY: 'import-vr-banks.ts once carried the vr-02 bank\'s tag and DROPPED its per-option pull sentence — no column held it — and nothing said so at the crossing. A reviewer spent three returns reconstructing pulls by archaeology. That is why the column exists and why it is not the other one.',
    },
    TWO_THE_FIVE_FOR_YOUR_SET_INTERSECTION: {
      namedBySEATnotROW: 'each entry is keyed on (itemId, seat). A row id names five seats and the last three exchanges turned on exactly that (R1008) — an intersection computed on row ids will report five matches where the seats may be complementary.',
      andWHATTOINTERSECTAGAINST: 'your ten. Four of your five withdrawal seats were EMPTY on this disk when you measured; these five are what filled them. The five that actually withdrew here are the OTHER partial-group seat on each of the same rows.',
      rows: five,
    },
    THREE_AND_THE_WITHDRAWAL_RAN: { wholeness: '25 of 25 whole -> 20 of 25, 5 owed seats',
      owed: ['17 circle,square', '22 cat,hen', '23 hot,soft', '24 ball,jump', '25 shark,whale'],
      retainedIn: 'content/withdrawn-executions.json, verbatim, with the withdrawing ruling named' },
  };
  const clean = JSON.parse(JSON.stringify(report)) as Record<string, unknown>;
  const keys = ['ONE_ARE_THEY_ONE_FIELD', 'TWO_THE_FIVE_FOR_YOUR_SET_INTERSECTION', 'THREE_AND_THE_WITHDRAWAL_RAN'];
  Object.assign(clean, findingsDigest(clean, keys));
  clean.DIGESTS = digestsBlock(String(clean.findingsSha256), keys);
  const p = pjoin(REPO, 'content/exports', stampedName('field-question-and-the-five', String(clean.findingsSha256), 'json'));
  writeFileSync(p, JSON.stringify(clean, null, 1));
  const name = deliver(p, 'field-question-and-the-five').split('/').pop()!;
  const fin = sha(readFileSync(pjoin(LANE, name)));
  writeFileSync(pjoin(LANE, `${name}.sha256`), `${fin}  ${name}\n`);
  writeFileSync(pjoin(DL, name), readFileSync(pjoin(LANE, name)));
  console.log(`  misconceptionExecution ${execs} | drafterDeclaredPull ${pulls} | its verdict ${verdicts}`);
  console.log(`  the five crossed, keyed on (itemId, seat).`);
  console.log(`\n  crossed: ${name}  (FILE ${fin.slice(0, 16)})`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
