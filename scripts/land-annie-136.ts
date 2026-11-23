/**
 * HER 136TH: LAND WHAT IS LANDABLE, REFUSE WHAT IS NOT (David, 2026-08-24 — R688).
 *
 * The doors were dry-tested before any act, and they disagree with BOTH of the desk's
 * predictions — this script reports what the doors actually said:
 *  - THE FACE REFUSES: her amended description carries two sentences over the narrative cap
 *    (24 and 20 words). landCaseFace is attempted as instructed and its refusal is captured
 *    verbatim — neither exit is taken (no exemption, no rewording of her text). The name alone
 *    is NOT landed: caseFaceServes keys on the title, so a name-only face would open the door
 *    with an empty doorplate — not ruled, not done.
 *  - THE ENTRY HINT PASSES: 6- and 11-word sentences; the predicted seventeen-against-the-cap
 *    was a whole-hint count and the cap is per sentence. The entry still does NOT land — the
 *    hold is the desk's instruction on its own leg — but its stated premise is corrected
 *    (R677: the order survives; the desk states which leg it now stands on).
 *  - THE WIW-19 RETAG LANDS: hybrid shape, replaced tag and execution asserted against the
 *    live row.
 * CZ-A2 option D, its tag, and the item's DRAFT status: all held, per the instruction and the
 * never-a-tag-without-its-entry rule.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { landCaseFace } from './lib/case-face';
import { deliver, stampedName } from './lib/export-destination';

const REPO = join(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const DAVID = 'human:david@cluecrew.test';
const HER_FILE = '/Users/davidb/Downloads/annie-136-for-code.md';
const HER_SHA256 = '5c029056066d3d6d13d68abbbea0671b0e401c9cece636d0dfb464b09d78d9b1';
const AUTHORITY = `annie-136-for-code.md, sha256 ${HER_SHA256}`;

const NAME = 'The Ashline Detective Register';
const sha256 = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');

async function run() {
  const bytes = readFileSync(HER_FILE);
  if (sha256(bytes) !== HER_SHA256) throw new Error(`REFUSED — her 136th reads ${sha256(bytes)}, declared ${HER_SHA256}`);
  const her = bytes.toString('utf8');
  const descMatch = /target: case:ashline-detective-register:description\n\s+replaced: .+\n\s+replacedSha256: .+\n\s+authored: (.+)/.exec(her);
  if (!descMatch) throw new Error('REFUSED — her amended description not found');
  const DESC = descMatch[1]!.trim();
  const rows: Array<Record<string, unknown>> = [];

  // ---- Act 1: the face, attempted through the standing path ----
  let faceOutcome: string;
  try {
    if (APPLY) await landCaseFace(REPO, 'case-en-06', { title: NAME, narrativeText: DESC }, 'Annie', `${AUTHORITY} — name APPROVED, description AS AMENDED`);
    faceOutcome = APPLY ? 'LANDED' : 'DRY — not attempted';
  } catch (e) {
    faceOutcome = `REFUSED BY THE DOOR — ${(e as Error).message}`;
  }
  rows.push({
    act: 'case-en-06 face', outcome: faceOutcome,
    note: faceOutcome.startsWith('REFUSED')
      ? 'THE GATE WORKING, not a fault in her text-as-judged: the narrative role caps sentences at 16 words and two of her description\'s sentences read 24 and 20. Neither exit taken — no exemption (house rule), no rewording (her text is hers). The face stays EMPTY and the case invisible. Resolution is the desk\'s: her split, or a role ruling (the doorplate may be notice-class under R669\'s reasoning — read once, calmly, an explanation not a mid-item hint — but assigning a role is a ruling, not a landing-time choice).'
      : 'name and description landed together through the standing path.',
  });

  // ---- Act 2: the WIW-19 retag, hybrid shape ----
  const item = await prisma.item.findUniqueOrThrow({ where: { id: 'ENG-001-WIW-19' }, select: { options: { orderBy: { id: 'asc' }, select: { id: true, content: true, misconceptionId: true, misconceptionExecution: true } } } });
  const optB = item.options.find((o) => (o.content as Record<string, unknown>).label === 'B');
  if (!optB) throw new Error('REFUSED — WIW-19 option B not found');
  const REPLACED_TAG = 'en-vocab-neighbouring-sense';
  const REPLACED_EXEC = 'To fast is a real second sense of the word and the passage supplies no food anywhere.';
  const AUTHORED_TAG = 'en-vocab-form-lookalike';
  const AUTHORED_EXEC = 'To fast is a different word that shares the spelling, and the passage supplies no food anywhere.';
  if (optB.misconceptionId !== REPLACED_TAG || optB.misconceptionExecution !== REPLACED_EXEC) {
    throw new Error(`REFUSED — WIW-19 B live row does not hold her replaced tag/execution: ${optB.misconceptionId} / ${JSON.stringify(optB.misconceptionExecution)}`);
  }
  const entry = await prisma.misconception.findUniqueOrThrow({ where: { id: AUTHORED_TAG }, select: { status: true } });
  if (entry.status !== 'ACTIVE') throw new Error(`REFUSED — ${AUTHORED_TAG} is ${entry.status}; a retag must resolve to a serving entry`);
  rows.push({
    act: 'ENG-001-WIW-19 option B retag', outcome: APPLY ? 'LANDED' : 'WOULD LAND',
    before: { misconceptionId: REPLACED_TAG, misconceptionExecution: REPLACED_EXEC },
    after: { misconceptionId: AUTHORED_TAG, misconceptionExecution: AUTHORED_EXEC },
    basis: 'her §3: the dictionary test, not etymology — a different word that shares the spelling. The oldest hold on the board releases.',
    authority: AUTHORITY,
  });
  if (APPLY) {
    await prisma.itemOption.update({ where: { id: optB.id }, data: { misconceptionId: AUTHORED_TAG, misconceptionExecution: AUTHORED_EXEC } });
    await prisma.attributionEvent.create({
      data: {
        recordType: 'item', recordId: 'ENG-001-WIW-19', action: 'AMENDED',
        reviewerId: 'rev-0001', actor: 'Annie', recordedBy: DAVID, field: 'options.B.misconceptionId',
        method: `her 136th return (${HER_SHA256.slice(0, 16)}); hybrid shape, replaced tag asserted against the live row`,
        note: `${REPLACED_TAG} -> ${AUTHORED_TAG}; execution clause corrected to match; the wiw19-sense-question hold RELEASED`,
      },
    });
    console.log('  RETAGGED ENG-001-WIW-19 option B');
  }

  // ---- Act 3: CZ-A2 — held entire ----
  const gateDry = 'dry-run of gateChildHint\'s own function on her hint: PASSES (sentences of 6 and 11 words; the per-sentence cap is not exceeded)';
  rows.push({
    act: 'library entry en-article-avoids-the-sound-choice', outcome: 'NOT LANDED — held per the desk\'s instruction',
    premiseCorrection: `THE STATED PREMISE IS CORRECTED (R677): the desk predicted "seventeen words against the cap, the write will refuse at the gate". ${gateDry}. Seventeen is the WHOLE-HINT count; the cap is per sentence. The hold stands on the desk's instruction alone; the desk states which leg it now stands on.`,
  });
  rows.push({ act: 'CZ-A2 option D transport + tag', outcome: 'NOT LANDED — the transport lands only after its entry, never before (a tag without its entry reads as filed); item ENG-003-A-CZ-A2 HELD AT DRAFT' });

  console.log(rows.map((r) => `  ${r.act}: ${String(r.outcome).slice(0, 60)}`).join('\n'));

  if (APPLY) {
    const artefact = {
      kind: 'annie-136-landing',
      what: 'Her 136th, landed where the doors allowed: the WIW-19 retag landed and the oldest hold released; the case face was attempted and REFUSED by its own gate (reported as the gate working); the CZ-A2 entry, tag and transport held — with the entry-refusal premise corrected from a dry run of the gate itself.',
      authority: AUTHORITY,
      rows,
      partFour: 'STILL WAITING. When the entry lands, the transport follows, then the go.',
    };
    const json = JSON.stringify(artefact, null, 1) + '\n';
    const name = stampedName('annie-136-landing', sha256(json).slice(0, 16), 'json');
    const local = join(REPO, 'content/exports', name);
    writeFileSync(local, json);
    deliver(local, 'annie-136-landing');
  }
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
