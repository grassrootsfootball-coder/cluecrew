/**
 * HER SIGNATURE LANDS AND THE ROW RETURNS (Annie's 219th, 2026-09-02).
 *
 * She signs `ENG-001-WIW-15` under subject `row-projection`, canonical option order, hash
 * `65576865481b4452…` — **the row's first real reading, since the path that signed it before was
 * never a reading at all** (R976). The bytes are asserted against her hash BEFORE the signature is
 * written: her 219th recomputed it at her desk and got the same number her 218th named, and this
 * run must reach it too or refuse. Three independent computations or nothing.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma, recordSignature } from '../packages/db/src/index';
import { SIGNATURE_SUBJECTS } from '../packages/core/src/index';
import { pinHashes } from './lib/pin-projection';
import { requirePopulation } from './lib/population';
import { findingsDigest } from './lib/findings-digest';
import { deliver, stampedName } from './lib/export-destination';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const LANE = pjoin(DL, '11+', 'from-cluecrew');
const ID = 'ENG-001-WIW-15';
const HER_HASH = '65576865481b4452d91dcf5d4aef9331abaef69f3275d3df51c859974f68fa8d';
const APPLY = process.argv.includes('--apply');
const sha = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');

async function main() {
  console.log(`SIGN ${ID} — ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);
  const r219 = sha(readFileSync(pjoin(DL, 'annie-219-for-code.md')));

  const row = await prisma.item.findUniqueOrThrow({ where: { id: ID },
    select: { status: true, pool: true, questionTypeId: true, reviewedBy: true,
      options: { select: { content: true, isCorrect: true }, orderBy: { id: 'asc' } }, stem: true, explanation: true } });
  requirePopulation('sign:wiw15', { 'row(s) to sign': 1, 'option(s)': row.options.length });

  // THE BYTES SHE SIGNED, ASSERTED — canonical option order, retention stripped.
  const val = (o: { content: unknown }) => String((o.content as { value?: unknown })?.value ?? '');
  const canonical = [...row.options].sort((a, b) => val(a).localeCompare(val(b)));
  const h = pinHashes({ stem: row.stem, explanation: row.explanation, options: canonical });
  const matches = h.retentionExcluded === HER_HASH;
  console.log(`  her hash:   ${HER_HASH.slice(0, 32)}…`);
  console.log(`  this run:   ${h.retentionExcluded.slice(0, 32)}…  ${matches ? 'MATCH' : 'MISMATCH'}`);
  if (!matches) throw new Error('the row does not recompute to the hash she signed — refusing to land her signature on bytes she did not read');

  const already = await prisma.attributionEvent.count({ where: { recordId: ID, action: 'SIGNED', subjectKind: SIGNATURE_SUBJECTS.ROW_PROJECTION_CANONICAL_ORDER.kind } });
  if (already > 0) { console.log('  her signature already stands.'); }
  else if (APPLY) {
    await prisma.$transaction(async (tx) => {
      await recordSignature(tx as never, {
        recordType: 'item', recordId: ID, reviewerId: 'rev-0001', recordedBy: "agent:claude-code, David's session 2026-09-02",
        method: `her 219th return (${r219.slice(0, 16)}): all five options and the key verify against lines 43 to 52 of stream-a-03 — 43 the twinkle, 44 the simile, 45 the negation, 48 the face, 51 the ears. The row is sound and she signs it.`,
        note: `the row's FIRST real reading: the path that signed it before was the e2e suite and was never a reading at all (R976). Hash recomputed independently at her desk (218th and 219th) and here before writing.`,
        subjectHash: HER_HASH,
        subjectKind: SIGNATURE_SUBJECTS.ROW_PROJECTION_CANONICAL_ORDER.kind,
        subjectSpec: SIGNATURE_SUBJECTS.ROW_PROJECTION_CANONICAL_ORDER.spec,
      });
      const n = await tx.item.updateMany({ where: { id: ID, status: 'REVIEWED' }, data: { status: 'LIVE', reviewedBy: 'reviewer:rev-0001' } });
      if (n.count !== 1) throw new Error(`expected to return exactly 1 row to LIVE, moved ${n.count} — rolling back`);
      await tx.attributionEvent.create({ data: {
        recordType: 'item', recordId: ID, action: 'APPROVED', actor: 'annie', reviewerId: 'rev-0001',
        recordedBy: "agent:claude-code, David's session 2026-09-02", field: 'status',
        method: `RETURNED TO SERVING on her 219th (${r219.slice(0, 16)}) — REVIEWED to LIVE on her signature`,
        note: 'the hold was identity-shaped, then content-shaped, and is now discharged by a reading rather than by an explanation',
      } });
    });
  }

  const after = await prisma.item.findUniqueOrThrow({ where: { id: ID }, select: { status: true, reviewedBy: true } });
  const sigs = await prisma.attributionEvent.findMany({ where: { recordId: ID, action: 'SIGNED' }, orderBy: { at: 'asc' }, select: { subjectKind: true, subjectHash: true, at: true } });
  const live = await prisma.item.count({ where: { questionTypeId: row.questionTypeId, status: 'LIVE', pool: 'PRACTICE' } });

  const report = {
    kind: 'WIW-15-SIGNED-AND-RETURNED', TO: 'Annie; David', date: '2026-09-02', mode: APPLY ? 'APPLIED' : 'DRY RUN',
    THE_SIGNATURE: { subject: SIGNATURE_SUBJECTS.ROW_PROJECTION_CANONICAL_ORDER.kind, spec: SIGNATURE_SUBJECTS.ROW_PROJECTION_CANONICAL_ORDER.spec, hash: HER_HASH,
      recomputedIndependently: ['her 218th, at her desk', 'her 219th, at her desk', 'this run, before writing'],
      andWHYTHATMATTERS: 'the hash was asserted against her number before the write; a mismatch would have refused rather than landing her signature on bytes she did not read' },
    THE_ROW: { statusWas: 'REVIEWED', statusNow: after.status, reviewedBy: after.reviewedBy, livePoolForItsType: live },
    THE_SIGNATURES_ON_THE_ROW_NOW: sigs.map((s) => ({ at: s.at, subjectKind: s.subjectKind ?? 'UNKNOWN', hash: s.subjectHash?.slice(0, 16) })),
    andWHATTHATSHOWS: 'two signatures labelled UNVERIFIABLE, retained beside the one that replaces them, and one carrying a named subject and spec. A reader can tell them apart by inspection rather than by forensics — which is the property her 219th asked the estate to have.',
  };
  const clean = JSON.parse(JSON.stringify(report)) as Record<string, unknown>;
  Object.assign(clean, findingsDigest(clean, ['THE_SIGNATURE', 'THE_ROW', 'THE_SIGNATURES_ON_THE_ROW_NOW']));
  const p = pjoin(REPO, 'content/exports', stampedName('wiw15-signed-and-returned', String(clean.findingsSha256), 'json'));
  writeFileSync(p, JSON.stringify(clean, null, 1));
  if (APPLY) {
    const name = deliver(p, 'wiw15-signed-and-returned').split('/').pop()!;
    const b = readFileSync(pjoin(LANE, name));
    writeFileSync(pjoin(LANE, `${name}.sha256`), `${sha(b)}  ${name}\n`);
    writeFileSync(pjoin(DL, name), b);
    console.log(`  crossed: ${name}`);
  }
  console.log(`  status: REVIEWED -> ${after.status} | live pool for ${row.questionTypeId}: ${live}`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
