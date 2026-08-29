/**
 * MC04-FDP-04 AND MC05-FDP-01 ARE ABSENT FROM THE DISTRICT, NOT PENDING (R842).
 *
 * **Absent is a settled state; pending is an expectation.** These two rows are in no send and no
 * source — the withdrawal existed for them, the replacement send omits them, and the amended source
 * carries neither. Nothing is due to arrive, so recording them as pending would leave a queue with
 * two permanent members and a reader waiting on nobody.
 */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { beginCut, sealCut } from './lib/cut-stamp';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = join(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const ABSENT = ['MC04-FDP-04', 'MC05-FDP-01'];

async function run() {
  const cutBeganAt = beginCut();
  assertFixture('absent-from-district', [
    { name: 'a row in no send is absent', input: 'MC04-FDP-04', mustBeCaught: true },
    { name: 'the second is', input: 'MC05-FDP-01', mustBeCaught: true },
    { name: 'a row held on a collision is not absent', input: 'MC01-CALC-04', mustBeCaught: false },
    { name: 'a landed row is not', input: 'MC01-CALC-01', mustBeCaught: false },
  ], (id) => ABSENT.includes(id));

  const stillPresent = await prisma.item.findMany({ where: { id: { in: ABSENT } }, select: { id: true } });
  requirePopulation('record:absent-from-district', { 'ids to record absent': ABSENT.length });

  if (APPLY && stillPresent.length === 0) {
    for (const id of ABSENT) {
      await prisma.attributionEvent.create({ data: {
        recordType: 'item', recordId: id, action: 'UNATTRIBUTED', reviewerId: null,
        actor: 'the desk', recordedBy: 'human:david', field: 'district membership',
        method: 'recorded ABSENT FROM THE DISTRICT, not pending: in no send and no source. The 196-row send was withdrawn for these two rows; the 171-row replacement omits them; the amended source carries neither.',
        note: 'ABSENT IS A SETTLED STATE. Nothing is due to arrive, so no queue holds them and no reader waits. If a later send names either id it arrives as a new row and this event is its prior state.',
      } });
    }
  }

  const cut = await sealCut(prisma, cutBeganAt);
  const payload = {
    kind: 'absent-from-district',
    mode: APPLY ? 'APPLIED' : 'DRY RUN — nothing written',
    THE_CUT: cut,
    THE_TWO: ABSENT,
    THE_STATE_RECORDED: 'ABSENT FROM THE DISTRICT',
    WHY_NOT_PENDING: '**pending is an expectation and absent is a settled state.** These two are in no send and no source: the 196-row send was withdrawn FOR them, the 171-row replacement omits them, and the amended source carries neither. **Nothing is due to arrive.** Recorded as pending they would sit in a queue with two permanent members, and a reader would wait on nobody — which is the shape that turns a closed question into an open one that never closes.',
    THE_TRAIL: 'an AttributionEvent per id, actor "the desk". It attaches to the id rather than to a row, because there is no row — `recordId` is a string, not a foreign key, which is the same property that let the withdrawal record survive the delete.',
    ANDIFTHEYRETURN: 'if a later send names either id it arrives as a NEW row, and this event is its prior state rather than a contradiction. Absent is not a refusal and does not bar a future arrival — it records that on this date nothing was owed.',
    stillPresentInTheStore: stillPresent.map((r) => r.id),
    theDistrict: { rows: await prisma.item.count({ where: { questionType: { district: 'MATHS' } } }), signed: await prisma.item.count({ where: { questionType: { district: 'MATHS' }, reviewedBy: { not: null } } }) },
  };
  const lines = ABSENT.map((id) => `${id}\tABSENT FROM THE DISTRICT`);
  const d = digestOverText('the lines joined by \\n, each "<itemId>\\tABSENT FROM THE DISTRICT"', lines.join('\n'));
  const full = { ...payload, ABSENT_LINES: lines, absentSha256: d.value, absentSha256Spec: d.spec };
  const artefact = { ...full, ...findingsDigest(full, ['THE_TWO', 'WHY_NOT_PENDING', 'ABSENT_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const fam = APPLY ? 'absent-from-district' : 'absent-from-district-dry-run';
  const name = stampedName(fam, sha(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), fam);
  console.log(`${APPLY ? 'APPLIED' : 'DRY RUN'} — ${ABSENT.join(', ')} recorded ABSENT; district ${payload.theDistrict.rows} rows, ${payload.theDistrict.signed} signed`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
