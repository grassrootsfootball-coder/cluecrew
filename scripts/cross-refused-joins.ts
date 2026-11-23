/**
 * THE FIVE REFUSED JOINS, CROSSED TO BOTH PARTIES WITH THEIR CAUSES.
 *
 * Per option: her entry's behaviour, the option's OWN working verbatim, and the computation that
 * failed. **Nothing is proposed.** She rules whether the working is wrong, the carrier is wrong, or
 * the entry is; this file supplies the three things that decision needs and stops.
 *
 * THE OPTION'S OWN WORKING IS ABSENT, AND THAT IS A MEASUREMENT, NOT AN OMISSION (R98). There is no
 * `distractorWorking` in this store — not a column, not a key on any of 4,597 options. The only
 * field that could hold a carrier's own account of its error is `misconceptionExecution`, set on
 * 1,140 options store-wide and on ZERO of 748 MATHS options. So every row below reports the field
 * as ABSENT with the denominator that makes the absence legible, rather than dropping a key nobody
 * would then miss.
 *
 * AND THE PREMISE THIS FILE WAS ASKED UNDER DOES NOT HOLD — reported first, because it reaches
 * rows already written. Neither of the two joins that LANDED landed on a carrier stating its own
 * working: all seven named options carry `label` and `value` and nothing else. Both landed on the
 * SENDER's working, which is the very evidence the new ruling declines. What separated the two from
 * the five was executability, not provenance.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = pjoin(__dirname, '..');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const MINTS = '/Users/davidb/Downloads/maths-six-mints-for-code.json';

/** A carrier's own account of its error, or the absence of one, stated with its denominator. */
function ownWorkingOf(opt: { misconceptionExecution: string | null; content: unknown }) {
  const c = opt.content as Record<string, unknown>;
  const inContent = ['distractorWorking', 'working', 'notes'].find((k) => k in c);
  if (inContent) return { state: 'PRESENT' as const, field: `content.${inContent}`, verbatim: String(c[inContent]) };
  if (opt.misconceptionExecution) return { state: 'PRESENT' as const, field: 'misconceptionExecution', verbatim: opt.misconceptionExecution };
  return {
    state: 'ABSENT' as const,
    field: null,
    andWHATTHATMEANS: 'the option states no working of its own. distractorWorking exists nowhere in this store — not a column, not a key on any of 4,597 options — and misconceptionExecution is null on all 748 MATHS options.',
  };
}

const REFUSALS: Array<{ entryId: string; itemId: string; label: string; declaredValue: string; theComputationThatFailed: Record<string, unknown> }> = [
  { entryId: 'percentage-never-divided-by-hundred', itemId: 'MC01-FDP-03', label: 'C', declaredValue: '2000',
    theComputationThatFailed: {
      whatFailed: 'NOT the computation — the CARRIER IDENTITY. The arithmetic the sender wrote computes: 25 * 80 = 2000, and the option is £2000.',
      theMismatch: 'the mint declares the value "2000"; the store holds "£2000"',
      why: 'her own 180th amended those values — money keys and money options carry their unit — landing AFTER the population the mint quotes (1d7f9cf414f33a0a…), which is the same digest her 182nd is fenced against.',
      whatIsNotInDoubt: 'row id, label C, the option\'s retained _previousValue "2000" byte-identical to the declaration, and the working computing to the option\'s numeric value. Four agreements, nothing inferred.',
      whyItRefusedAnyway: 'landing it means adding retention-matching as a carrier-selection rule, invented mid-run to turn a red row green.',
    } },
  { entryId: 'fraction-part-used-alone', itemId: 'MC01-FDP-08', label: 'D', declaredValue: '60',
    theComputationThatFailed: {
      whatFailed: 'NOT the computation — the CONDITION. 15 * 4 = 60 and the option is 60.',
      theCondition: 'the file joins this candidate only if the store\'s declared gap prose agrees',
      antecedentState: 'ABSENT — misconceptionExecution, drafterDeclaredPull, drafterDeclaredPullVerdict, tagStatus, attractorLine, defeaterLine and a36Note are all null on this option',
      why: 'an absent antecedent is UNKNOWN, not false (R98). The file says "else waits".',
    } },
  { entryId: 'maximum-given-for-a-sum', itemId: 'MC01-STATS-01', label: 'D', declaredValue: '7',
    theComputationThatFailed: {
      whatFailed: 'there is no computation to run. The working names the act in words and writes no arithmetic.',
      extractedArithmetic: 'none',
      why: 'executing "the largest of" requires mapping an English phrase to an operation, which is deciding by inference (R826).',
    } },
  { entryId: 'ordering-goal-reversed', itemId: 'MC01-NPV-03', label: 'C', declaredValue: '640',
    theComputationThatFailed: {
      whatFailed: 'there is no computation to run. "digits 6, 4, 0 in descending order" states a property, not a calculation.',
      extractedArithmetic: 'none',
    } },
  { entryId: 'leading-zero-repaired-ordering-not', itemId: 'MC01-NPV-03', label: 'D', declaredValue: '604',
    theComputationThatFailed: {
      whatFailed: 'there is no computation to run. The working describes the repair and the residual fault in prose.',
      extractedArithmetic: 'none',
    } },
];

async function run() {
  assertFixture('own-working-detection', [
    { name: 'a working in misconceptionExecution is found', input: JSON.stringify({ misconceptionExecution: 'takes the larger', content: { label: 'A', value: '1' } }), mustBeCaught: true },
    { name: 'a working under content.distractorWorking is found', input: JSON.stringify({ misconceptionExecution: null, content: { label: 'A', value: '1', distractorWorking: '2+2' } }), mustBeCaught: true },
    { name: 'a bare label+value option states NO working', input: JSON.stringify({ misconceptionExecution: null, content: { label: 'A', value: '1' } }), mustBeCaught: false },
    { name: 'retention is not a working', input: JSON.stringify({ misconceptionExecution: null, content: { label: 'A', value: '1', _previousValue: '2' } }), mustBeCaught: false },
  ], (raw) => ownWorkingOf(JSON.parse(raw)).state === 'PRESENT');

  const mints = JSON.parse(readFileSync(MINTS, 'utf8')) as { entries: Array<{ id: string; behaviour: string; childHint: string; join?: { working?: string }; secondCarrierCandidate?: { optionLabel?: string; working?: string } }> };
  requirePopulation('cross:refused-joins', { 'refused join(s)': REFUSALS.length });

  const rows = [];
  for (const r of REFUSALS) {
    const entry = mints.entries.find((e) => e.id === r.entryId)!;
    const item = await prisma.item.findUniqueOrThrow({ where: { id: r.itemId }, select: { id: true, stem: true, options: { orderBy: { id: 'asc' }, select: { content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true } } } });
    const opt = item.options.find((o) => (o.content as { label?: string }).label === r.label)!;
    const senderWorking = r.label === (entry.secondCarrierCandidate?.optionLabel ?? '') ? entry.secondCarrierCandidate?.working : entry.join?.working;
    rows.push({
      entryId: r.entryId,
      carrier: `${r.itemId} option ${r.label}`,
      stem: (item.stem as { text?: string }).text ?? null,
      optionValueInTheStore: String((opt.content as { value: unknown }).value),
      optionValueAsDeclared: r.declaredValue,
      HER_ENTRYS_BEHAVIOUR: entry.behaviour,
      herChildHint: entry.childHint,
      THE_OPTIONS_OWN_WORKING: ownWorkingOf(opt),
      theSendersWorking: senderWorking ?? null,
      andWHOSEEVIDENCETHATIS: 'the sender\'s, not the carrier\'s — the party naming the entry also supplied the account of how the option executes it.',
      THE_COMPUTATION_THAT_FAILED: r.theComputationThatFailed,
      siblingsOnTheRow: item.options.map((o) => ({ label: (o.content as { label?: string }).label, value: String((o.content as { value: unknown }).value), isKey: o.isCorrect, tag: o.misconceptionId ?? null })),
    });
  }

  const mathsOpts = await prisma.itemOption.count({ where: { item: { questionType: { district: 'MATHS' } } } });
  const mathsExec = await prisma.itemOption.count({ where: { item: { questionType: { district: 'MATHS' } }, misconceptionExecution: { not: null } } });
  const allOpts = await prisma.itemOption.count();

  const lines = rows.map((r) => `${r.entryId}\t${r.carrier}\t${r.THE_OPTIONS_OWN_WORKING.state}`);
  const d = digestOverText('one line per refused join, "<entryId>\\t<carrier>\\t<ownWorkingState>"', lines.join('\n'));
  const full = {
    kind: 'refused-joins-with-causes',
    forBothParties: 'Annie and Cowork',
    NOTHING_IS_PROPOSED: 'she rules whether the working is wrong, the carrier is wrong, or the entry is. This file carries the three facts that decision needs and stops.',

    THE_PREMISE_THIS_WAS_ASKED_UNDER_DOES_NOT_HOLD: {
      asStated: 'two joins landed on carriers that state their own working; five did not.',
      measured: 'NONE of the seven named options states a working of its own. All seven carry `label` and `value` and nothing else (FDP-03 C additionally carries retention).',
      soWHATSEPARATEDTHEM: 'executability, not provenance. Both landed joins ran on the SENDER\'s working — the same class of evidence the new ruling declines — and landed only because that working happened to be written as arithmetic.',
      theExposure: 'two joined options (MC01-FDP-08 C, MC01-GEOM-04 D) and ONE SIGNED ROW (MC01-GEOM-04, signed because that join unblocked it).',
      andWHATISNOTDONEHERE: 'nothing is unwound. Applying a ruling whose stated premise has just been falsified is a reading, and the reading is hers.',
      theField: { distractorWorking: 'does not exist in this store — not a column, not a key on any option', misconceptionExecution: `set on 1,140 of ${allOpts} options store-wide and on 0 of ${mathsOpts} MATHS options` },
    },

    refusals: rows,
    denominators: { optionsInStore: allOpts, mathsOptions: mathsOpts, mathsOptionsStatingTheirOwnExecution: mathsExec },
    RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec,
  };
  const artefact = { ...full, ...findingsDigest(full, ['refusals', 'RESULT_LINES', 'THE_PREMISE_THIS_WAS_ASKED_UNDER_DOES_NOT_HOLD']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('refused-joins-with-causes', sha(json).slice(0, 16), 'json');
  writeFileSync(pjoin(REPO, 'content/exports', name), json);
  deliver(pjoin(REPO, 'content/exports', name), 'refused-joins-with-causes');
  console.log(`\n  ${rows.length} refused joins crossed. Options stating their own working: ${rows.filter((r) => r.THE_OPTIONS_OWN_WORKING.state === 'PRESENT').length} of ${rows.length}.`);
  console.log(`  MATHS options stating their own execution: ${mathsExec} of ${mathsOpts}.`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
