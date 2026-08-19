/**
 * A DRAFT FOR ANNIE'S APPROVAL — NOT A WRITE. Nothing here touches the database.
 *
 * `en-narrator-voice-as-fact` was NOT RECOVERED: absent from every pinned witness, and this store's
 * 11-word text is not the pre-cap either (13 words capped). Her ruling: **it does not stand under
 * her name on the strength of a capped string — redraft as new work.** So it is redrafted, and it
 * travels as a proposal.
 *
 * **THE CONSTRAINT THAT KILLED THE LAST DRAFT IS THE ONE THAT SHAPES THIS ONE.** She struck the
 * previous hint because its third sentence NAMED THE REPORTING — *"…or what the room decided?"* —
 * and on the carrier item (`ENG-002-pp-23`, whose key is *"We are told what the writer thinks, and
 * not only what the room says"*) naming the room hands the child the answer. **A hint for this
 * misconception must teach the child to ask whose voice is speaking WITHOUT supplying the voice.**
 * That is why all three candidates below stop at the question and none of them completes it.
 *
 * Each candidate is run through `checkChildFacingText` — the same gate the door uses — and its
 * verdict travels with it. A draft delivered without its gate result asks the reviewer to do the
 * machine's job first.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { checkChildFacingText, isBlocking } from '../packages/core/src/index';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'narrator-redraft-proposal';
const ID = 'en-narrator-voice-as-fact';

const CANDIDATES = [
  {
    label: 'A',
    text: 'Someone in this story is sure about something. Ask who is sure before you agree with them.',
    rationale:
      'Keeps the whole move in the child\'s hands: notice the certainty, then ask whose it is. Never says whose, so it cannot coach the key on any carrier.',
  },
  {
    label: 'B',
    text: 'A sentence can sound certain and still be someone\'s opinion. Work out who is speaking before you decide it is true.',
    rationale:
      'Names the trap directly — certainty of TONE is not truth — which is the misconception\'s own description. Two sentences, both under the cap.',
  },
  {
    label: 'C',
    text: 'Not everything stated flatly is a fact. Ask yourself whose view this is, then decide.',
    rationale:
      'Shortest of the three. "Stated flatly" may be the weakest phrase for this reading age; included so the register of the other two can be judged against something plainer.',
  },
];

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const longestSentence = (s: string) =>
  Math.max(...s.split(/(?<=[.!?])\s+/).filter(Boolean).map((x) => words(x)));

async function main() {
  const row = await prisma.misconception.findUniqueOrThrow({ where: { id: ID } });
  requirePopulation('narrator redraft', { candidates: CANDIDATES.length });

  const gated = CANDIDATES.map((c) => {
    const faults = checkChildFacingText({ role: 'hint', label: `misconception:${ID}.childHint`, text: c.text });
    return {
      ...c,
      words: words(c.text),
      longestSentenceWords: longestSentence(c.text),
      gateVerdict: faults.filter(isBlocking).length === 0 ? 'PASSES' : 'BLOCKED',
      gateFaults: faults.map((f) => `${f.rule} @ ${f.where}: ${f.detail}${f.severity === 'warning' ? ' (warning)' : ''}`),
    };
  });

  const payload = {
    what: `A redraft of ${ID}, proposed for Annie's approval. NOTHING WAS WRITTEN.`,
    whyARedraftAndNotARestore:
      'Not recovered from any pinned witness, and this store\'s text is not the pre-cap either. Her ruling: it does not stand under her name on the strength of a capped string.',
    theConstraint:
      'She struck the previous draft because its third sentence named the reporting ("or what the room decided?"), which on the carrier item hands over the key. A hint here must prompt the question WITHOUT supplying the voice.',
    theMisconception: row.description,
    currentTextInThisStore: { childHint: row.childHint, words: words(row.childHint), status: 'capped string, standing under no approval' },
    carrierItems: 'ENG-002-pp-23 (DRAFT, en-comp-technique) — key: "We are told what the writer thinks, and not only what the room says."',
    candidates: gated,
    askedOf:
      'Choose one, amend one, or reject all three. If all three are wrong the fault is likely mine in reading the constraint, not the wording.',
  };

  const stamp = artefactStamp(payload, new Date().toISOString(), 'content',
    'three gated candidate hints for the narrator entry, proposed not applied', ['candidates']);
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, stampedName(FAMILY, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify({ stamp, ...payload }, null, 2));
  deliver(path, FAMILY);

  for (const c of gated) {
    console.log(`  ${c.label}  ${c.gateVerdict}  ${c.words}w (longest sentence ${c.longestSentenceWords}w)`);
    console.log(`      ${c.text}`);
    if (c.gateFaults.length) console.log(`      faults: ${c.gateFaults.join(' | ')}`);
  }
  console.log(`\n  ${path}`);
  await prisma.$disconnect();
}

main();
