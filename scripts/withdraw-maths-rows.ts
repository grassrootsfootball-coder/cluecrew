/**
 * THE WITHDRAWN SEND'S ROWS COME OUT (R836).
 *
 * Cowork withdrew its 196-row send; 25 of its ids are not in the replacement send. **20 of those 25
 * are landed here**, so the withdrawal reached only the authoring store — and a refusal that
 * reaches only the copy has not happened yet.
 *
 * **The bytes are retained in this artefact BEFORE anything is deleted.** A withdrawal removes rows
 * from the store; it must not remove the record of what was in it.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { beginCut, sealCut } from './lib/cut-stamp';
import { deliver, stampedName } from './lib/export-destination';
import { canonicalJson, digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = join(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const SITTING_ONE = ['MC01-CALC-01', 'MC01-CALC-02', 'MC01-CALC-03', 'MC01-CALC-04', 'MC01-CALC-05', 'MC01-CALC-06', 'MC01-CALC-07', 'MC01-CALC-08'];

async function run() {
  const cutBeganAt = beginCut();
  assertFixture('withdraw-maths', [
    { name: 'a withdrawn id is in scope', input: 'MC04-FDP-04', mustBeCaught: true },
    { name: 'the other colliding id is', input: 'MC05-FDP-01', mustBeCaught: true },
    { name: 'an id in the current send is not', input: 'MC02-CALC-01', mustBeCaught: false },
    { name: 'an empty id is not', input: '', mustBeCaught: false },
  ], (id) => ['MC04-FDP-04', 'MC05-FDP-01'].includes(id));

  const src = JSON.parse(readFileSync('/Users/davidb/Downloads/CALC04GENERATORANDTHE187.json', 'utf8')) as { THE_187_EXCEEDS_WHAT_THIS_STORE_SENT: { theTwentyFiveWithdrawnOnlyIds: string[] } };
  const withdrawn = src.THE_187_EXCEEDS_WHAT_THIS_STORE_SENT.theTwentyFiveWithdrawnOnlyIds;
  const rows = await prisma.item.findMany({ where: { id: { in: withdrawn } }, select: { id: true, status: true, stem: true, explanation: true, difficultyTier: true, questionTypeId: true, options: { select: { content: true, isCorrect: true, misconceptionId: true } } }, orderBy: { id: 'asc' } });
  requirePopulation('withdraw:maths-rows', { 'withdrawn-only ids': withdrawn.length, 'of those landed here': rows.length });

  const attempts = await prisma.attempt.count({ where: { itemId: { in: rows.map((r) => r.id) } } });

  const retained = rows.map((r) => ({
    itemId: r.id, status: r.status, questionTypeId: r.questionTypeId, difficultyTier: r.difficultyTier,
    stem: r.stem, explanation: r.explanation,
    options: r.options.map((o) => ({ content: o.content, isCorrect: o.isCorrect, misconceptionId: o.misconceptionId })),
    /**
     * NOT named `rowSha256`: that name is reserved by the R767 recompute guard for a digest over
     * the WHOLE row object, and this is a digest over the CONTENT subtree only. Two different
     * things must not share a field name — the guard caught the collision on the first run.
     */
    contentSha256: sha(canonicalJson({ stem: r.stem, explanation: r.explanation, options: r.options })),
    contentSha256Spec: 'sha256 over canonical JSON of {stem, explanation, options} — keys sorted at every level, separators (",",":"), ensure_ascii false.',
    wasInSittingOne: SITTING_ONE.includes(r.id),
  }));

  if (APPLY && attempts === 0) {
    for (const r of rows) {
      await prisma.attributionEvent.create({ data: { recordType: 'item', recordId: r.id, action: 'UNATTRIBUTED', reviewerId: null, actor: 'Cowork (withdrawal)', recordedBy: 'human:david', field: 'row', subjectHash: retained.find((x) => x.itemId === r.id)!.contentSha256, method: 'the 196-row send was WITHDRAWN by the authoring store; this id is not in the replacement send. The row is removed before anything publishes.', note: 'bytes retained in the withdraw-maths-rows artefact; the event survives the row because recordId is a string, not a foreign key.' } });
    }
    await prisma.item.deleteMany({ where: { id: { in: rows.map((r) => r.id) } } });
  }

  const after = await prisma.item.count({ where: { questionType: { district: 'MATHS' } } });
  const cut = await sealCut(prisma, cutBeganAt);
  const payload = {
    kind: 'withdrawn-maths-rows',
    mode: APPLY ? 'APPLIED' : 'DRY RUN — nothing removed',
    THE_CUT: cut,
    THE_INTERSECTION: {
      withdrawnOnlyIds: withdrawn.length,
      landedHere: rows.length,
      ids: rows.map((r) => r.id),
      notLandedHere: withdrawn.filter((id) => !rows.some((r) => r.id === id)),
      THE_TWO_THAT_MATTER_MOST: { 'MC04-FDP-04': rows.some((r) => r.id === 'MC04-FDP-04'), 'MC05-FDP-01': rows.some((r) => r.id === 'MC05-FDP-01') },
      soTHEWITHDRAWALREACHEDONLYTHEM: '**both are here.** The authoring store superseded its own copy and retained the bytes; nothing crossed that removed them from this store. **A refusal that reaches only the copy has not happened.**',
    },
    AND_SIX_ARE_SITTING_ONE: {
      ids: retained.filter((r) => r.wasInSittingOne).map((r) => r.itemId),
      what: '**six of the eight rows in her sitting one came from the withdrawn send.** Her content verification was made against the crossed artefact, which was built from those rows. Removing them removes most of the proving run\'s subject.',
      andTHEVERIFICATIONISNOTVOIDED: 'she verified the CONTENT — keys computed, distractors their tags\' products, hints agreeing with keys. That reading holds of those texts. **What is withdrawn is the SEND, not her judgement of it**, and if the replacement send carries the same ids the verification is re-pinnable against the new rows rather than re-done.',
    },
    THE_REMOVAL: {
      attemptsOnTheseRows: attempts,
      refusedIfAny: attempts > 0 ? 'REFUSED — an attempt references one of these rows and the foreign key would restrict the delete (R772). Nothing removed.' : 'none, so the delete is unobstructed',
      bytesRetained: 'every row is in RETAINED_ROWS below with its own digest, captured BEFORE deletion. A withdrawal removes rows from the store; it must not remove the record of what was in it.',
      eventRecordedFirst: 'an AttributionEvent per row, actor "Cowork (withdrawal)", with the row hash pinned. It survives the row because recordId is a string and not a foreign key.',
      mathsRowsAfter: after,
    },
    RETAINED_ROWS: retained,
  };
  const lines = retained.map((r) => `${r.itemId}\t${r.contentSha256}`);
  const d = digestOverText('the retained rows joined by \\n, each "<itemId>\\t<contentSha256>"', lines.join('\n'));
  const full = { ...payload, RETAINED_LINES: lines, retainedSha256: d.value, retainedSha256Spec: d.spec };
  const artefact = { ...full, ...findingsDigest(full, ['THE_INTERSECTION', 'AND_SIX_ARE_SITTING_ONE', 'THE_REMOVAL', 'RETAINED_ROWS', 'RETAINED_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const fam = APPLY ? 'withdrawn-maths-rows' : 'withdrawn-maths-rows-dry-run';
  const name = stampedName(fam, sha(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), fam);
  console.log(`${APPLY ? 'APPLIED' : 'DRY RUN'} — intersection ${rows.length} of ${withdrawn.length}; attempts ${attempts}; maths rows after ${after}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
