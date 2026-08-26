/**
 * THREE ANSWERS THAT WERE GIVEN IN PROSE AND ARE NOW GIVEN IN BYTES (R25).
 *
 * The 553 re-import and the execution population were answered in a reply two turns running and
 * reported unanswered both times. **A reply is not an artefact**, and the rule this store already
 * holds says so: when a value carries a signature, send the value, not an account of it. Prose may
 * accompany a value; it may never stand in for one.
 *
 * Section A answers Cowork's list-shape question, and CORRECTS ITS PREMISE rather than agreeing
 * with it. Sections B and C carry the two figures.
 */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { dispositionFor, isScreenedPath } from '../packages/core/src/index';
import { textsFrom } from '../packages/core/src/item-content-gate';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = join(__dirname, '..');

async function run() {
  assertFixture('three-open-answers', [
    { name: 'a list-shaped option value path is undeclared', input: 'content.value[0]', mustBeCaught: true },
    { name: 'a second list index is equally undeclared', input: 'content.value[1]', mustBeCaught: true },
    { name: 'the scalar option value path IS declared', input: 'content.value', mustBeCaught: false },
    { name: 'the option label path IS declared', input: 'content.label', mustBeCaught: false },
  ], (p) => dispositionFor('options[]', p) == null);

  // ---- A. the vr-02 list shape ------------------------------------------------
  const vr02 = await prisma.itemOption.findMany({
    where: { item: { questionTypeId: 'vr-02-two-odd-ones-out' } },
    select: { id: true, itemId: true, content: true, isCorrect: true },
    orderBy: [{ itemId: 'asc' }, { id: 'asc' }],
  });
  requirePopulation('emit:three-open-answers', { 'vr-02 options': vr02.length });
  const elements = vr02.flatMap((o) => ((o.content as { value?: unknown }).value as string[] | undefined) ?? []);
  const screened = vr02.reduce((n, o) => n + textsFrom(o.content, 'content').filter(([p]) => isScreenedPath('options[]', p)).length, 0);
  const statuses = await prisma.item.groupBy({ by: ['status'], _count: true, where: { questionTypeId: 'vr-02-two-odd-ones-out' } });

  const A = {
    theQuestion: 'can a list-shaped option value land at all, and do those rows carry any joinable key?',
    CAN_IT_LAND: 'YES, AND IT ALREADY HAS. ItemOption.content is a Json column, so {"value": ["van","bus"]} stores without difficulty. 100 vr-02 options hold exactly this shape today, 2 elements each, 200 strings on the rows.',
    SO_THE_PREMISE_NEEDS_CORRECTING: 'the message reads "a value with no shape to arrive in is an unbuilt path, not a dropped one, and it leaves no record at any door". At the STORAGE layer that is not what happened here — the shape arrived, and the record is the rows. What is unbuilt is one layer up: THE MEMBERSHIP. `options[].content.value` is declared child-facing and screened; `options[].content.value[]` is declared NOWHERE, so the gate walks these 200 strings and screens none of them.',
    screenedByTheChildFacingGate: `${screened} of ${elements.length}`,
    andWHYNOTHINGREPORTEDIT: `check:every-string-field reports "UNDECLARED 0" on every run and is correct: it screens the ${'326'} LIVE items behind a door, and all 25 vr-02 items are DRAFT. The check's zero is true about its own population and says nothing whatever about these. R61's shape — a gate whose scope legitimately excludes the thing being asked about.`,
    itemStatuses: Object.fromEntries(statuses.map((s) => [s.status, s._count])),
    THE_JOINABLE_KEY: {
      answer: 'itemId, and the value tuple. NOT the option id.',
      itemIdIsStableAndMeaningful: 'e.g. bank-vr-02-two-odd-ones-out-01 — authored, not minted, and the same on both sides.',
      optionIdIsNOTjoinable: `all ${vr02.length} option ids are auto-minted cuids (e.g. ${vr02[0]?.id}). Nothing on the authoring side can have produced them, so they cannot join.`,
      noLabelExists: `0 of ${vr02.length} vr-02 options carry a content.label, so the label route other templates use is not available here.`,
      soTheJOIN: 'itemId + the ordered value tuple (["van","bus"]). Stable, and unique within an item on the current rows.',
    },
    THE_COUNT_GAP: {
      coworkSays: 224,
      onTheRowsHere: elements.length,
      difference: 224 - elements.length,
      andIDoNotCLOSEIT: 'reported, not reconciled. 24 could be authored strings that never arrived, a different counting unit, or rows this store does not hold. The join above is what settles it, row by row.',
      distinctWords: new Set(elements).size,
    },
    NO_COLUMN_WAS_BUILT: 'as instructed. No disposition was declared, no column added, no gate widened. This is a report.',
  };

  // ---- B. the execution population -------------------------------------------
  const incorrect = await prisma.itemOption.count({ where: { isCorrect: false } });
  const incorrectWith = await prisma.itemOption.count({ where: { isCorrect: false, misconceptionExecution: { not: null } } });
  const allWith = await prisma.itemOption.count({ where: { misconceptionExecution: { not: null } } });
  const totalOptions = await prisma.itemOption.count();
  const B = {
    theQuestion: 'the execution population.',
    optionsTOTAL: totalOptions,
    incorrectOptions: incorrect,
    incorrectCarryingMisconceptionExecution: incorrectWith,
    percentOfIncorrectCarryingIt: Math.round((incorrectWith / incorrect) * 100),
    incorrectCarryingNONE: incorrect - incorrectWith,
    correctOptionsCarryingIt: allWith - incorrectWith,
    andWhyThatLastFigureIsZERO: 'it was 19 for part of one run and is 0 now. Those 19 were written by me and reversed within the same run (R762) — the column means "why THIS distractor executes THIS misconception", so a key cannot carry one. The reversal restored the prior state exactly, because the writes had only ever touched null fields.',
  };

  // ---- C. the 553 re-import ---------------------------------------------------
  const C = {
    theQuestion: 'the 553 re-import.',
    STATUS: 'BLOCKED, NOT FAILED. It completes the moment an authoritative source directory is named, and not before.',
    theFigureIsCORRECTED: { asFirstReported: 553, deduplicatedByItemOptionKeyValue: 419, andOfTHOSE: { alreadyPresentAndEQUAL: 288, absentAndLANDABLE: 21, presentButDIVERGED: 76, retentionKeysNotColumns: 22, keysWithNoColumnAnywhere: 12 } },
    whatTHATmeans: 'the door\'s fault was real and the mechanism is closed, but its exposure was about a quarter of what I first reported. 288 of the values had reached the database by another path. I published an alarming number without checking whether the values were actually missing from the rows.',
    whatWasAPPLIED: '2 tagStatus values on ENG-004-AGG-07/08 distractors, which are correct and stand. 19 misconceptionExecution values were applied and REVERSED in the same run.',
    WHY_IT_IS_BLOCKED: 'no source is authoritative. Two files named eng006-draft.json sit in different directories and disagree about what option B of ENG-006-TM-02 IS and about which option is CORRECT. Across the authored files, 135 (item, label) pairs disagree between copies, 48 of them about which option is the key, over 36 items.',
    theSCRIPTnowREFUSES: 'scripts/land-dropped-option-fields.ts records each (itemId, label) identity as it collects and exits naming the conflicts rather than landing anything. Picking between disagreeing copies is a ruling, and a ruling is not a script\'s to make.',
    whatWouldUNBLOCKit: 'one directory named as authoritative for these batches. Nothing else is needed.',
  };

  const payload = {
    kind: 'three-open-answers',
    what: 'The vr-02 list shape, the execution population, and the 553 re-import — as values rather than as an account of them.',
    whyThisExists: 'two of the three were answered in a reply two turns running and reported unanswered both times. A reply is not an artefact (R25).',
    A_THE_VR02_LIST_SHAPE: A,
    B_THE_EXECUTION_POPULATION: B,
    C_THE_553_REIMPORT: C,
  };
  const rowsText = vr02.map((o) => `${o.itemId}\t${JSON.stringify((o.content as { value?: unknown }).value)}\t${o.isCorrect}`);
  const rowsDigest = digestOverText('the VR02_ROWS lines joined by \\n, no trailing newline, each line "<itemId>\\t<JSON value array>\\t<isCorrect>"', rowsText.join('\n'));
  const full = { ...payload, VR02_ROWS: rowsText, vr02RowsSha256: rowsDigest.value, vr02RowsSha256Spec: rowsDigest.spec };
  const artefact = { ...full, ...findingsDigest(full, ['A_THE_VR02_LIST_SHAPE', 'B_THE_EXECUTION_POPULATION', 'C_THE_553_REIMPORT', 'VR02_ROWS']) };

  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('three-open-answers', createHash('sha256').update(json).digest('hex').slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), 'three-open-answers');
  console.log(`vr-02 options ${vr02.length}, elements ${elements.length}, screened ${screened} | execution ${incorrectWith}/${incorrect} | re-import BLOCKED`);
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
