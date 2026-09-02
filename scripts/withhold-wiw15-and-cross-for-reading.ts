/**
 * ENG-001-WIW-15 WITHHOLDS, AND ITS BYTES CROSS FOR A FRESH READING (Annie's 217th, 2026-09-02).
 *
 * **HELD AND LIVE CANNOT BOTH BE TRUE OF ONE ROW.** Her 216th held the signature and left the
 * row's state unstated; her 217th corrects it, and the argument is hers: a signature that
 * reproduces under no declared subject **cannot tell anyone whether the bytes moved since the
 * reading**, so the row serves on an unverifiable reading, and the three-assertion rule (R909)
 * admits no exception for a row already live. Identity is exactly what is missing.
 *
 * This store had argued the opposite — that the content was not in doubt. That was wrong, and
 * wrong in a way worth naming: the pin is the only thing that can say the served bytes are the
 * read bytes, so an unverifiable pin puts the content in doubt in the one sense that matters.
 *
 * LIVE -> REVIEWED, the signature RETAINED, the reason published. Refusing to rely on a signature
 * and destroying the evidence of one are different acts.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { SIGNATURE_SUBJECTS, isHeldFromServing } from '../packages/core/src/index';
import { pinHashes } from './lib/pin-projection';
import { requirePopulation } from './lib/population';
import { findingsDigest } from './lib/findings-digest';
import { deliver, stampedName } from './lib/export-destination';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const LANE = pjoin(DL, '11+', 'from-cluecrew');
const ID = 'ENG-001-WIW-15';
const APPLY = process.argv.includes('--apply');
const sha = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');

async function main() {
  console.log(`WITHHOLD ${ID} — ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);
  const r217 = sha(readFileSync(pjoin(DL, 'annie-217-for-code.md')));

  const row = await prisma.item.findUniqueOrThrow({ where: { id: ID },
    select: { status: true, pool: true, questionTypeId: true, difficultyTier: true, stem: true, explanation: true,
      reviewedBy: true, reviewMethod: true, options: { select: { content: true, isCorrect: true, misconceptionId: true }, orderBy: { id: 'asc' } } } });
  requirePopulation('withhold:wiw15', { 'row(s) to withhold': 1, 'option(s) on the row': row.options.length });

  // ---- BLAST RADIUS, WALKED BEFORE THE WRITE ---------------------------------------------------
  const live = await prisma.item.findMany({ where: { questionTypeId: row.questionTypeId, status: 'LIVE', pool: 'PRACTICE' }, select: { id: true } });
  const servingBefore = live.filter((x) => !isHeldFromServing(x.id)).length;
  const attempts = await prisma.attempt.count({ where: { itemId: ID } });
  const cases = await prisma.case.findMany({ select: { id: true, title: true, questionTypeId: true, mappedQuestionTypeIds: true } });
  const touching = cases.filter((c) => [c.questionTypeId, ...c.mappedQuestionTypeIds].includes(row.questionTypeId));
  const caseStaysServable = servingBefore - 1 > 0;
  console.log(`  ${row.questionTypeId}: ${servingBefore} serving -> ${servingBefore - 1}; case stays servable: ${caseStaysServable}; children who met it: ${attempts}`);
  if (!caseStaysServable) throw new Error('withdrawing this row would empty its case\'s pool — that is a second decision and is not taken here');

  // ---- THE FRESH-READING SUBJECT, UNDER THE CANONICAL SPEC -------------------------------------
  const val = (o: { content: unknown }) => String((o.content as { value?: unknown })?.value ?? '');
  const canonicalOptions = [...row.options].sort((a, b) => val(a).localeCompare(val(b)));
  const canonical = pinHashes({ stem: row.stem, explanation: row.explanation, options: canonicalOptions });
  const asRead = pinHashes({ stem: row.stem, explanation: row.explanation, options: row.options });
  const sigs = await prisma.attributionEvent.findMany({ where: { recordId: ID, action: 'SIGNED' },
    select: { at: true, subjectHash: true, subjectKind: true, subjectSpec: true, method: true, note: true } });

  // ---- THE WRITE -------------------------------------------------------------------------------
  if (APPLY && row.status === 'LIVE') {
    await prisma.$transaction(async (tx) => {
      const n = await tx.item.updateMany({ where: { id: ID, status: 'LIVE' }, data: { status: 'REVIEWED' } });
      if (n.count !== 1) throw new Error(`expected to withhold exactly 1 row, moved ${n.count} — rolling back`);
      await tx.attributionEvent.create({ data: {
        recordType: 'item', recordId: ID, action: 'AMENDED', actor: 'annie', reviewerId: 'rev-0001',
        recordedBy: "agent:claude-code, David's session 2026-09-02", field: 'status',
        method: `WITHHELD from serving on her 217th (${r217.slice(0, 16)}): HELD and LIVE cannot both be true of one row. LIVE -> REVIEWED.`,
        note: 'the signature is RETAINED — refusing to rely on a signature and destroying the evidence of one are different acts. The row returns when its reading is retaken under a declared subject.',
      } });
    });
  }

  const after = await prisma.item.findUniqueOrThrow({ where: { id: ID }, select: { status: true } });

  // ---- THE CROSSING: ONE ROW, ONE SITTING ------------------------------------------------------
  const artefact = {
    kind: 'ONE-ROW-FOR-A-FRESH-READING',
    TO: 'Annie', date: '2026-09-02',
    THE_RULING_THIS_SERVES: `her 217th (${r217}): ENG-001-WIW-15 withholds until its signature verifies or its reading is retaken; the retake is one row, one sitting; a reading nobody can verify is replaced, not defended.`,
    THE_STATE_NOW: { itemId: ID, statusWas: 'LIVE', statusNow: after.status, pool: row.pool, signatureRetained: true },
    WHAT_THIS_STORE_HAD_ARGUED_AND_WHY_IT_WAS_WRONG: 'that the row could stay LIVE because an unverifiable signature is not a wrong answer. The pin is the only thing that can say the SERVED bytes are the READ bytes, so an unverifiable pin puts the content in doubt in the one sense that matters. Identity was the missing assertion, not a technicality beside it.',
    THE_BLAST_RADIUS_WALKED: {
      questionType: row.questionTypeId,
      servingRowsForThatType: `${servingBefore} -> ${servingBefore - 1}`,
      casesCarryingIt: touching.map((c) => ({ id: c.id, title: c.title })),
      caseStaysServable,
      childrenWhoHaveMetThisRow: attempts,
      soTHECOSTOFWITHDRAWING: attempts === 0 ? 'nothing served. No child has met this row, and its case keeps a non-empty pool.' : `${attempts} attempt(s) already exist against it`,
    },
    THE_ROW_AS_IT_STANDS: {
      stem: row.stem, difficultyTier: row.difficultyTier,
      options: row.options.map((o) => ({ content: o.content, isCorrect: o.isCorrect, misconceptionId: o.misconceptionId })),
      explanation: row.explanation,
    },
    THE_SUBJECT_DECLARED_FOR_THE_FRESH_READING: {
      subjectKind: SIGNATURE_SUBJECTS.ROW_PROJECTION_CANONICAL_ORDER.kind,
      subjectSpec: SIGNATURE_SUBJECTS.ROW_PROJECTION_CANONICAL_ORDER.spec,
      theHashYourReadingWOULDCERTIFY: canonical.retentionExcluded,
      theOptionOrderThatHashIsTakenIn: canonicalOptions.map(val),
      andFORCOMPARISON: { asStoredOrderRetentionExcluded: asRead.retentionExcluded, asStoredOrderRetentionIncluded: asRead.retentionIncluded },
      whyCanonical: 'her 216th: canonical order binds signatures made or re-made from that date. This reading is being MADE, so it is canonical by that ruling — and "canonical" names the ARRANGEMENT of options, not a claim that the row projection is the canonical subject (her 217th).',
    },
    THE_SIGNATURE_BEING_REPLACED: {
      retained: true,
      events: sigs,
      whyItCannotBeVerified: 'no declared subject reproduces 425245f09b627e89: not the row projection under any permutation of the five options or either retention variant, not any execution text on the row, and not the surface\'s own subject computed from stem.text or stem.prompt. The three schema migrations that rewrote this stem all landed before the signature was taken.',
      andWHATTHATDOESNOTMEAN: 'it is not evidence the content is wrong, and it is not evidence the content drifted. It is the absence of evidence either way, which is precisely why the row cannot serve on it.',
    },
    WHAT_ENDS_THE_HOLD: 'one reading of the bytes above, signed under the declared subject and spec. The row returns to LIVE on that signature — nothing else is owed and no other row is involved.',
  };
  const clean = JSON.parse(JSON.stringify(artefact)) as Record<string, unknown>;
  Object.assign(clean, findingsDigest(clean, ['THE_ROW_AS_IT_STANDS', 'THE_SUBJECT_DECLARED_FOR_THE_FRESH_READING', 'THE_BLAST_RADIUS_WALKED', 'THE_SIGNATURE_BEING_REPLACED']));
  const p = pjoin(REPO, 'content/exports', stampedName('wiw15-one-row-for-a-fresh-reading', String(clean.findingsSha256), 'json'));
  writeFileSync(p, JSON.stringify(clean, null, 1));
  if (APPLY) {
    const name = deliver(p, 'wiw15-one-row-for-a-fresh-reading').split('/').pop()!;
    const b = readFileSync(pjoin(LANE, name));
    writeFileSync(pjoin(LANE, `${name}.sha256`), `${sha(b)}  ${name}\n`);
    writeFileSync(pjoin(DL, name), b);
    console.log(`  crossed: ${name} (${sha(b).slice(0, 16)})`);
  }
  console.log(`  status: ${row.status} -> ${after.status} | canonical hash for her reading: ${canonical.retentionExcluded.slice(0, 16)}`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
