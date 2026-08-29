/**
 * THE DECLARED GAP PROSE FOR MC01-FDP-08 D, CROSSED VERBATIM (her 192nd §3).
 *
 * **The antecedent existing at the store is not the antecedent existing at her desk.** The prose was
 * found — it is the carrier's own working in the crossed bytes — and finding it settles nothing,
 * because the reading is two texts against each other and one of them has never reached her. This
 * carries both, verbatim, and proposes nothing.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { carrierWorking } from './lib/crossed-carrier-working';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = pjoin(__dirname, '..');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');

async function run() {
  const mints = JSON.parse(readFileSync('/Users/davidb/Downloads/maths-six-mints-for-code.json', 'utf8')) as { entries: Array<{ id: string; behaviour: string; childHint: string; secondCarrierCandidate?: Record<string, unknown> }> };
  const entry = mints.entries.find((e) => e.id === 'fraction-part-used-alone')!;
  const item = await prisma.item.findUniqueOrThrow({ where: { id: 'MC01-FDP-08' }, select: { stem: true, options: { select: { content: true, isCorrect: true, misconceptionId: true } } } });
  const prose = carrierWorking('MC01-FDP-08', 'D');
  requirePopulation('cross:fdp08d-prose', { 'candidate carrier(s)': 1, 'crossed copies stating the prose': prose.copiesHoldingTheCarrier });
  if (prose.state !== 'PRESENT') throw new Error(`the prose is ${prose.state} — refusing to cross a reading with one text missing`);

  const full = {
    kind: 'fdp08-d-prose-for-the-reading',
    forAnnie: 'her 192nd §3 — send the prose verbatim and the reading lands same-day',
    NOTHING_IS_PROPOSED: 'whether these two texts agree is your reading. Both are here; neither is interpreted.',
    THE_CANDIDATE: 'MC01-FDP-08 option D, value 60 — the second carrier for fraction-part-used-alone, conditional since it was minted',
    THE_ITEMS_STEM: (item.stem as { text?: string }).text,
    THE_DECLARED_GAP_PROSE_VERBATIM: prose.verbatim,
    itsSource: `the carrier's own distractorWorking in ${prose.copiesHoldingTheCarrier} crossed copies, unanimous`,
    THE_ENTRYS_BEHAVIOUR_VERBATIM: entry.behaviour,
    theEntrysChildHint: entry.childHint,
    theSendersAccountOfThisCarrier: entry.secondCarrierCandidate ?? null,
    THE_THREE_PART_SET: item.options.map((o) => ({ label: (o.content as { label?: string }).label, value: String((o.content as { value: unknown }).value), isKey: o.isCorrect, tag: o.misconceptionId ?? null })),
    whatTheOtherHalfOfTheEntryDid: 'option C landed on this entry — its own working is `15 / 3 = 5`, the top used alone. D would be the bottom used alone.',
    THE_STATE_IT_HOLDS: 'conditional. It costs nothing and asserts nothing until you read it.',
  };
  const d = digestOverText('the prose and the behaviour, joined by \\n', `${prose.verbatim}\n${entry.behaviour}`);
  const withD = { ...full, RESULT_LINES: [`MC01-FDP-08 D\t${prose.verbatim}`], resultsSha256: d.value, resultsSha256Spec: d.spec };
  const artefact = { ...withD, ...findingsDigest(withD, ['THE_DECLARED_GAP_PROSE_VERBATIM', 'THE_ENTRYS_BEHAVIOUR_VERBATIM', 'THE_THREE_PART_SET']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('fdp08-d-prose-for-the-reading', sha(json).slice(0, 16), 'json');
  writeFileSync(pjoin(REPO, 'content/exports', name), json);
  deliver(pjoin(REPO, 'content/exports', name), 'fdp08-d-prose-for-the-reading');
  console.log(`\n  prose: ${JSON.stringify(prose.verbatim)}  (unanimous across ${prose.copiesHoldingTheCarrier} crossed copies)`);
  console.log(`  behaviour: ${JSON.stringify(entry.behaviour)}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
