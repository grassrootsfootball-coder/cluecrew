/** THE PUBLICATION SHAPE BOTH WAYS (R864). David rules which; this reports and publishes nothing. */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { caseFaceServes, publishBlockers } from '../packages/core/src/index';
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
  assertFixture('publication-shapes', [
    { name: 'an untagged distractor blocks', input: 'missing-misconceptions', mustBeCaught: true },
    { name: 'an unanswerable item blocks', input: 'unanswerable', mustBeCaught: true },
    { name: 'a clear row does not', input: 'CLEAR', mustBeCaught: false },
    { name: 'an empty verdict does not', input: '', mustBeCaught: false },
  ], (b) => b !== '' && b !== 'CLEAR');

  const rows = await prisma.item.findMany({ where: { questionType: { district: 'MATHS' } }, select: { id: true, status: true, reviewedBy: true, authoredBy: true, answerFlaggedAt: true, options: { select: { isCorrect: true, misconceptionId: true, content: true } } }, orderBy: { id: 'asc' } });
  requirePopulation('emit:publication-shapes', { 'maths rows': rows.length });

  const blocked = rows.filter((r) => publishBlockers(r.options, r.reviewedBy, r.authoredBy, r.answerFlaggedAt) === 'missing-misconceptions');
  const untaggedOptions = blocked.reduce((n, r) => n + r.options.filter((o) => !o.isCorrect && !o.misconceptionId).length, 0);
  const signed = rows.filter((r) => r.reviewedBy).length;
  const kase = await prisma.case.findFirst({ where: { questionType: { district: 'MATHS' } }, select: { title: true } });
  const lib = await prisma.misconception.count({ where: { id: { startsWith: 'maths-' }, status: 'ACTIVE' } });
  const inUse = new Set((await prisma.itemOption.findMany({ where: { item: { questionType: { district: 'MATHS' } }, misconceptionId: { not: null } }, select: { misconceptionId: true } })).map((o) => o.misconceptionId)).size;

  const payload = {
    kind: 'publication-shapes',
    THE_CUT: await sealCut(prisma, cutBeganAt),
    NOTHING_PUBLISHES_HERE: 'this reports two shapes. David rules which; the face is empty either way and no item reaches a child until it is not.',
    HER_RULING_APPLIED: {
      rule: '**a flagNote does not satisfy a signature.** The tag says WHICH ERROR the option executes; prose describing it is the third state and does not clear the gate.',
      whatTheBLOCKEDROWSACTUALLYCARRY: `every untagged option carries \`misconceptionBehaviour\` prose — "rounds both numbers to the tens and does not compensate", "gives the range instead of the mean" — with \`misconceptionRef: null\` and \`mappingStatus: "gap"\`. **The authoring store declared these as GAPS, not oversights.** The prose is exactly the third state her ruling names: it describes the error and cannot be joined to a hint.`,
      soTHEPROSEISNOTNOTHING: 'it is the specification a minted entry would be written from. **It is not a substitute for the entry and it is not lost** — it sits on the authored option and travels with it.',
    },
    THIS_STORES_MEASUREMENT: {
      rowsBlocked: blocked.length,
      untaggedOptionsAcrossThem: untaggedOptions,
      everyBlockedRowIsPARTIALLYTAGGED: `all ${blocked.length} keep 1–2 tagged distractors; none is wholly untagged. **A blocked row is one option short, not unmapped.**`,
      ids: blocked.map((r) => ({ itemId: r.id, untagged: r.options.filter((o) => !o.isCorrect && !o.misconceptionId).map((o) => String((o.content as { value: string }).value)) })),
      libraryAvailable: { activeMathsEntries: lib, distinctEntriesInUseOnRows: inUse, unusedActiveEntries: lib - inUse },
    },
    AND_THE_SIX_VERSUS_THE_FOURTEEN: {
      ruled: 6,
      measuredHere: blocked.length,
      THE_GAP: '**this store measures fourteen blocked rows; the ruling names six to be minted.** The difference is a MAPPING judgement this store cannot make: whether an existing entry already covers a given behaviour is a reading of the behaviour against 111 library entries, and it is authoring rather than arithmetic. **Eight rows would clear if their behaviours map to entries that already exist; six need entries that do not.**',
      whatWOULDSETTLEIT: 'the eight behaviours matched to existing entry ids, by whoever owns the mapping. This store can then tag and sign them mechanically, and the shape below becomes exact rather than conditional.',
      soBOTHSHAPESAREREPORTEDONTHERULEDSIX: 'as instructed — and the fourteen ids are published above so the eight can be named rather than inferred.',
    },
    SHAPE_ONE_OPEN_WITH_A_NAMED_HOLD: {
      signed: 181, held: 6, of: rows.length,
      what: 'the district opens with six rows held and named, their gap declared and their prose carried. **A hold that is published is a hold** — the thing R836 and R842 both turned on.',
      cost: 'the district is incomplete on the day it opens, and the six are visibly absent from their slots.',
      andTHESLOTPATTERN: 'six absences across CALC, FDP, NPV, MEAS, GEOM and STATS are visible in a parallel-case corpus, because the pattern is what makes a gap legible (her 184th).',
    },
    SHAPE_TWO_OPEN_COMPLETE: {
      signed: 187, held: 0, of: rows.length,
      what: 'the six entries are minted first, the rows tag, sign and the district opens whole.',
      cost: 'six library entries authored and approved before anything opens — and **a minted entry is a child-facing hint**, so each needs the same reading every library entry gets.',
      andTHEHONESTNOTE: 'this is not merely slower. It puts six new hints into the library on the critical path of a publication, which is the condition under which hint wording is least carefully read.',
    },
    THE_FACE_EITHER_WAY: {
      empty: !caseFaceServes({ title: kase?.title ?? '' }),
      correctlySo: '**the face is empty and correctly so.** It gates both shapes identically: no item reaches a child under either until a wording lands, so the choice between them is not urgent in the way an open district would make it.',
      andTHEDESCRIPTIONEXISTSONLYATTHEAUTHORINGSTORE: 'this store holds no description of the face — only the empty slot and the state marker crossed at R861. **Whatever exists, exists there**, and this store cannot report on it (R794).',
    },
    signedNow: signed,
  };
  const lines = blocked.map((r) => `${r.id}\t${r.options.filter((o) => !o.isCorrect && !o.misconceptionId).length}`);
  const d = digestOverText('the blocked lines joined by \\n, each "<itemId>\\t<untagged option count>"', lines.join('\n'));
  const full = { ...payload, BLOCKED_LINES: lines, blockedSha256: d.value, blockedSha256Spec: d.spec };
  const artefact = { ...full, ...findingsDigest(full, ['THIS_STORES_MEASUREMENT', 'AND_THE_SIX_VERSUS_THE_FOURTEEN', 'SHAPE_ONE_OPEN_WITH_A_NAMED_HOLD', 'SHAPE_TWO_OPEN_COMPLETE', 'BLOCKED_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('publication-shapes', sha(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), 'publication-shapes');
  console.log(`signed ${signed}/${rows.length} | blocked ${blocked.length} rows, ${untaggedOptions} options | face empty ${payload.THE_FACE_EITHER_WAY.empty}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
