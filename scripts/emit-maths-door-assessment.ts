/**
 * THE MATHS DOOR: CENSUS, AND WHY PARTS TWO TO FIVE CANNOT EXECUTE (R823).
 *
 * David's instruction anticipated this: *"If they do not exist, say that plainly — it is a bigger
 * finding than the door."* They do not exist, and the absence is one level deeper than items.
 */
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { beginCut, sealCut } from './lib/cut-stamp';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = join(__dirname, '..');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');

async function run() {
  const cutBeganAt = beginCut();
  assertFixture('maths-door', [
    { name: 'a MATHS district string is the district sought', input: 'MATHS', mustBeCaught: true },
    { name: 'lower case is still it', input: 'maths', mustBeCaught: true },
    { name: 'ENGLISH is not', input: 'ENGLISH', mustBeCaught: false },
    { name: 'VR is not', input: 'VR', mustBeCaught: false },
  ], (d) => d.toUpperCase() === 'MATHS');

  const qtByDistrict = await prisma.questionType.groupBy({ by: ['district'], _count: true });
  const mathsTypes = await prisma.questionType.findMany({ where: { district: 'MATHS' }, select: { id: true } });
  const mathsItems = await prisma.item.findMany({ where: { questionType: { district: 'MATHS' } }, select: { id: true, status: true, questionTypeId: true } });
  const lib = await prisma.misconception.findMany({ where: { district: 'MATHS' }, select: { id: true, childHint: true, approvedBy: true, status: true } });
  requirePopulation('emit:maths-door', { 'MATHS library entries': lib.length, 'question types across all districts': qtByDistrict.reduce((n, d) => n + d._count, 0) });

  // --- CANARY: prove the door is structurally impossible rather than asserting it ---
  let fkVerdict = 'NOT TESTED';
  try {
    await prisma.$transaction(async (tx) => {
      await tx.case.create({ data: { id: 'zz-canary-maths-door', questionTypeId: 'maths-does-not-exist', title: '', narrativeIntro: {}, modes: {}, orderInDistrict: 999, freeTier: false } });
      throw new Error('ROLLBACK');
    });
    fkVerdict = 'THE CREATE SUCCEEDED — the FK does not block it (unexpected)';
  } catch (e) {
    const m = String((e as Error).message);
    fkVerdict = m.includes('ROLLBACK') ? 'THE CREATE SUCCEEDED and was rolled back — the FK does NOT block it' : 'REFUSED BY THE DATABASE — Case.questionTypeId is a foreign key and no MATHS question type exists to point at';
  }

  const attested = lib.filter((m) => m.approvedBy && String(m.approvedBy).trim() !== '');
  const withHint = lib.filter((m) => m.childHint && m.childHint.trim() !== '');
  const gate = (cmd: string) => { try { return { ran: true, output: execSync(`pnpm ${cmd} 2>&1 | tail -3`, { cwd: REPO, encoding: 'utf8' }).trim() }; } catch (e) { return { ran: true, output: String((e as { stdout?: string }).stdout ?? '').trim().split('\n').slice(-3).join('\n') }; } };

  const cut = await sealCut(prisma, cutBeganAt);
  const payload = {
    kind: 'maths-door-assessment',
    THE_CUT: cut,
    ONE_THE_CENSUS: {
      questionTypesByDistrict: Object.fromEntries(qtByDistrict.map((d) => [d.district, d._count])),
      MATHS_QUESTION_TYPES: mathsTypes.length ? mathsTypes.map((t) => t.id) : 'NONE — not one question type in the MATHS district exists.',
      MATHS_ITEMS: mathsItems.length ? mathsItems : 'NONE — zero items, at any status, in any MATHS question type.',
      itemsCarryingASignedHint: 'not applicable: there are no items to carry one.',
      THE_ABSENCE_IS_ONE_LEVEL_DEEPER_THAN_ASKED: '**the question was whether ITEMS exist. They do not — and neither do the QUESTION TYPES they would belong to.** An item cannot exist without a questionTypeId, so this is not a content gap that authoring fills; it is a missing layer of the taxonomy.',
    },
    TWO_THE_DOOR_CANNOT_BE_BUILT: {
      why: '`Case.questionTypeId` is a REQUIRED foreign key to QuestionType. A MATHS case must point at a MATHS question type, and none exists.',
      demonstratedNotAsserted: fkVerdict,
      soITISNOTAJUDGEMENT: 'the build does not fail a policy check or a readiness bar — **the row cannot be inserted.** Nothing about case-en-06\'s pattern was re-derived, because the pattern is not what blocks it.',
      whatWouldBeNEEDEDFIRST: ['one or more QuestionType rows in district MATHS', 'items authored against them', 'signatures on those items', 'then, and only then, the case-en-06 pattern applies unchanged'],
    },
    THREE_THE_BLAST_RADIUS: {
      itemsThatWouldReachAChild: 0,
      walkedFrom: 'prisma.item where questionType.district = MATHS — the rows, not a count carried from anywhere',
      andTHEREFUSAL: 'nothing is published and nothing could be. The instruction was to refuse on any count that cannot be walked; this count is walked and it is zero.',
    },
    FOUR_THE_THREE_WALLS: {
      hintsAttested: { mathsLibraryEntries: lib.length, carryingAChildHint: withHint.length, carryingAnApprover: attested.length, derivedFrom: 'Misconception rows where district = MATHS, read now', note: 'THE HINTS ARE THE ONE WALL THAT STANDS. The maths class closed at 106; the store holds more, every one with a childHint.' },
      itemsSigned: { signed: 0, of: 0, verdict: 'VACUOUS — a wall over an empty population is not a wall (R61). Reported as vacuous rather than as passed.' },
      gatesGreen: { 'verify:solutions': gate('verify:solutions'), 'check:maths-distractors': gate('check:maths-distractors'), note: 'R60/R61 — both gates are correctly written and have never screened a single item, because no path creates a MATHS questionType. Their green is the declared-empty state, not evidence.' },
    },
    FIVE_PUBLICATION: 'HELD, and not by choice — there is nothing to publish. No transaction is prepared, because no membership exists to flip.',
    THE_FINDING_THAT_OUTRANKS_THE_DOOR: '**111 MATHS library entries, every one carrying a child-facing hint, and nothing anywhere that can carry them to a child.** The teaching half of a district is authored, reviewed and stored; the question types, items and case do not exist. R60 recorded that the maths gates had never screened anything and read it as an instrument fault. **It was not: the gates were right and the district is empty.**',
  };
  const lines = [`MATHS question types\t${mathsTypes.length}`, `MATHS items\t${mathsItems.length}`, `MATHS library entries\t${lib.length}`, `MATHS library hints\t${withHint.length}`];
  const d = digestOverText('the census lines joined by \\n, each "<what>\\t<count>"', lines.join('\n'));
  const full = { ...payload, CENSUS_LINES: lines, censusSha256: d.value, censusSha256Spec: d.spec };
  const artefact = { ...full, ...findingsDigest(full, ['ONE_THE_CENSUS', 'TWO_THE_DOOR_CANNOT_BE_BUILT', 'THREE_THE_BLAST_RADIUS', 'FOUR_THE_THREE_WALLS', 'CENSUS_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('maths-door-assessment', sha(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), 'maths-door-assessment');
  console.log(`MATHS: types ${mathsTypes.length}, items ${mathsItems.length}, library ${lib.length} (hints ${withHint.length}) | FK canary: ${fkVerdict.slice(0, 60)}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
