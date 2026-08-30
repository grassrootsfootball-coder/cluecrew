/**
 * THE DOOR FOUND FOUR SERVING ROWS ON A WITHDRAWN SUBSTANCE. TWO COME OUT AND TWO DO NOT.
 *
 * The split is not a judgement about the bytes — the door says all four carry a substance Cowork
 * withdrew. It is a question of WHOSE AUTHORITY STANDS BEHIND EACH ROW, and the two classes are
 * genuinely different:
 *
 *   COMES OUT — `MC01-CALC-01`, `MC01-CALC-05`. In the twenty-five-with-no-replacement class: no
 *   replacement substance exists in any current send, and no reviewer ever restored them. **The
 *   "later authority" this store credited them with earlier was a RE-PIN, and a re-pin asserts that
 *   a row is byte-identical to what Annie verified — it says nothing about whether the authoring
 *   store stands behind those bytes.** That was my inference and it was wrong; the notice says so
 *   directly.
 *
 *   STAYS, REPORTED, NOT RESOLVED — `MC04-FDP-04`, `MC05-FDP-01`. Cowork withdrew the substance;
 *   Annie explicitly restored the row (*the absence recorded earlier was false and is withdrawn*)
 *   and David endorsed keeping them. **Two authorities over two different things, and this store
 *   holds neither** (R867). Pulling them would resolve a conflict in favour of whichever party
 *   spoke last, which is not a rule.
 */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = pjoin(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');

const OUT = ['MC01-CALC-01', 'MC01-CALC-05'];
const CONFLICT = ['MC04-FDP-04', 'MC05-FDP-01'];

async function run() {
  assertFixture('authority-split', [
    { name: 'withdrawn substance + no restore + no replacement comes out', input: JSON.stringify({ restored: false, replacement: false }), mustBeCaught: true },
    { name: 'withdrawn substance + a reviewer restore is a CONFLICT, not a pull', input: JSON.stringify({ restored: true, replacement: false }), mustBeCaught: false },
    { name: 'a named replacement substance is a lift, not a pull', input: JSON.stringify({ restored: false, replacement: true }), mustBeCaught: false },
  ], (raw) => { const c = JSON.parse(raw) as { restored: boolean; replacement: boolean }; return !c.restored && !c.replacement; });

  const rows = await prisma.item.findMany({ where: { id: { in: [...OUT, ...CONFLICT] } }, select: { id: true, status: true, reviewedBy: true } });
  requirePopulation('pull:withdrawn-substance', { 'row(s) the door refused': rows.length });
  const pulling = rows.filter((r) => OUT.includes(r.id) && r.status === 'LIVE').map((r) => r.id);

  if (APPLY && pulling.length) {
    await prisma.$transaction(async (tx) => {
      const n = await tx.item.updateMany({ where: { id: { in: pulling }, status: 'LIVE' }, data: { status: 'REVIEWED' } });
      if (n.count !== pulling.length) throw new Error(`moved ${n.count} of ${pulling.length} — rolling back`);
      await tx.attributionEvent.createMany({ data: pulling.map((id) => ({
        recordType: 'item', recordId: id, action: 'UNATTRIBUTED', reviewerId: null, actor: 'Cowork (withdrawal)',
        recordedBy: 'human:david', field: 'status',
        method: 'PULLED FROM SERVING — LIVE to REVIEWED. Its SUBSTANCE is named in the standing withdrawal of 2026-08-30, verified by a door armed on 37 of 37 declared digests. No replacement substance exists in any current send and no reviewer restored it.',
        note: 'this store had earlier credited this row with a later authority on the strength of a RE-PIN. A re-pin asserts byte-identity to what the reviewer verified; it says nothing about whether the authoring store stands behind those bytes. That inference was mine and it was wrong.',
      })) });
    });
  }

  const after = await prisma.item.findMany({ where: { id: { in: [...OUT, ...CONFLICT] } }, select: { id: true, status: true } });
  const live = await prisma.item.count({ where: { questionType: { district: 'MATHS' }, status: 'LIVE', pool: 'PRACTICE' } });

  const full = {
    kind: 'withdrawn-substance-rows', mode: APPLY ? 'APPLIED' : 'DRY RUN — nothing written',
    THE_DOOR_IS_ARMED: 'check:withdrawn-substance — their worked probe reproduces as a string and a digest, 37 of 37 declared digests recompute from the input strings they crossed, and this implementation rebuilds 29 of 31 of those strings from real send rows.',
    PULLED: { ids: pulling, why: 'withdrawn substance, no replacement anywhere, no reviewer restore' },
    NOT_PULLED_AND_WHY: {
      ids: CONFLICT,
      theConflict: 'Cowork withdrew the SUBSTANCE; Annie restored the ROW — "restored from the population she verified in her 182nd. THE ABSENCE RECORDED EARLIER WAS FALSE AND IS WITHDRAWN" — and David endorsed keeping them.',
      whyThisStoreDoesNotDecide: 'two authorities over two different things and this store holds neither. Pulling would resolve the conflict in favour of whoever spoke last, which is not a rule (R867).',
      whatWouldSettleIt: 'one ruling. If the standing rule is categorical — a row published from a send its author withdrew comes out — these two come out on one word, and the pull is one statement.',
      andWHATTHEYARESERVINGMEANWHILE: 'the variant Annie read, signed against a pin that recomputes, with the unchosen variant now retained on the row.',
    },
    MY_EARLIER_INFERENCE_WAS_WRONG: {
      what: 'this store classified MC01-CALC-01 and MC01-CALC-05 as STAYS because they had been re-pinned against the amended source.',
      why_it_was_wrong: 'a re-pin asserts a row is byte-identical to what the reviewer verified. It is silent on whether the AUTHORING store stands behind those bytes, and those are different questions. The notice puts both rows in the twenty-five-with-no-replacement class.',
      andWHATCAUGHTIT: 'not a re-reading — a door keyed on substance rather than on id, arming on evidence the sender supplied.',
    },
    stateAfter: after, mathsLivePractice: live,
  };
  const lines = after.map((r) => `${r.id}\t${r.status}`);
  const d = digestOverText('one line per row, "<id>\\t<status>"', lines.join('\n'));
  const withLines = { ...full, RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec };
  const artefact = { ...withLines, ...findingsDigest(withLines, ['PULLED', 'NOT_PULLED_AND_WHY', 'RESULT_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const fam = APPLY ? 'withdrawn-substance-rows' : 'withdrawn-substance-rows-dry-run';
  const name = stampedName(fam, sha(json).slice(0, 16), 'json');
  writeFileSync(pjoin(REPO, 'content/exports', name), json);
  deliver(pjoin(REPO, 'content/exports', name), fam);
  console.log(`\n  ${APPLY ? 'APPLIED' : 'DRY RUN'} — pulled ${pulling.length}: ${pulling.join(', ') || '(none)'}`);
  for (const r of after) console.log(`   ${r.id.padEnd(14)} ${r.status}${CONFLICT.includes(r.id) ? '   (conflict — reported, not resolved)' : ''}`);
  console.log(`  MATHS live now ${live}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
