/**
 * PUBLISH A DOOR — the vr-02 publisher generalised for the agent-review regime (David's ruling,
 * 2026-11-18: an agent acts in the reviewer role; "make it happen").
 *
 * EVERY ASSERTION RUNS BEFORE THE WRITE AND ANY FAILURE REFUSES THE WHOLE DOOR. One transaction.
 *
 * A row's SIGNATURE may be a person's (rev-0001, taken before this regime, verified under any option
 * order as R936 requires) or the machine reviewer's (rev-agent-01, over the canonical-order subject).
 * Either way it must recompute against the row AS IT STANDS — a signature over a superseded state
 * covers nothing. The publication event is recorded under rev-agent-01, never a person's name (R94).
 *
 *   tsx scripts/agent-review/publish-door.ts --door=vr-17            (dry run)
 *   tsx scripts/agent-review/publish-door.ts --door=vr-17 --apply
 */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../../packages/db/src/index';
import { publishBlockers, isHeldFromServing, caseFaceServes, checkItemChildFacing, isBlocking } from '../../packages/core/src/index';
import { itemWholeness } from '../lib/item-wholeness';
import { loadClearances } from '../lib/clearances';
import { pinHashes, canonicalOrderHash } from '../lib/pin-projection';
import { requirePopulation } from '../lib/population';

const REPO = pjoin(__dirname, '..', '..');
const DOOR = process.argv.find((a) => a.startsWith('--door='))?.slice(7);
const APPLY = process.argv.includes('--apply');
/**
 * --ready: publish the rows that pass every per-row assertion and HOLD the rest by name. Only for a case
 * that already serves (its pool is non-empty), so no visible-and-empty window can open; a first
 * publication stays all-or-nothing.
 */
const READY = process.argv.includes('--ready');
const AGENT = 'rev-agent-01';
const PERSON = 'rev-0001';
const RECORDED_BY = 'human:dbamgbade@gmail.com';
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const permute = <T,>(a: T[]): T[][] => a.length <= 1 ? [a] : a.flatMap((x, i) => permute([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p]));

async function run() {
  if (!DOOR) throw new Error('pass --door=vr-NN');
  const CASE = `case-${DOOR}`;
  const caseRow = await prisma.case.findUniqueOrThrow({ where: { id: CASE },
    select: { title: true, modes: true, freeTier: true, orderInDistrict: true, questionTypeId: true, mappedQuestionTypeIds: true } });
  const TYPE = caseRow.questionTypeId;
  // A case may serve several question types (maths-01 maps calc/geom/meas/stats); publish them as one door.
  const TYPES = [TYPE, ...caseRow.mappedQuestionTypeIds];
  console.log(`PUBLISH ${DOOR} (${caseRow.title}) — ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);

  const rows = await prisma.item.findMany({ where: { questionTypeId: { in: TYPES }, pool: 'PRACTICE', status: 'DRAFT' }, orderBy: { id: 'asc' },
    select: { id: true, status: true, pool: true, stem: true, explanation: true, reviewedBy: true, authoredBy: true, answerFlaggedAt: true,
      options: { select: { content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true }, orderBy: { id: 'asc' } } } });
  requirePopulation(`publish:${DOOR}`, { [`${DOOR} practice row(s)`]: rows.length });

  const refusals: string[] = [];
  const assertions: Array<{ assertion: string; result: string; passed: boolean }> = [];
  const assert = (n: string, ok: boolean, r: string) => { assertions.push({ assertion: n, result: r, passed: ok }); if (!ok) refusals.push(`${n} — ${r}`); };

  const liveAlready = await prisma.item.count({ where: { questionTypeId: { in: TYPES }, pool: 'PRACTICE', status: 'LIVE' } });
  assert('the drafts being published are DRAFT (a case already serving adds to its pool)', rows.every((r) => r.status === 'DRAFT'), `${rows.length} DRAFT; ${liveAlready} already LIVE`);

  // 1. SIGNED, AND THE SIGNATURE RECOMPUTES AGAINST THE ROW AS IT STANDS
  const by: Record<string, number> = {}; const unsigned: string[] = [];
  for (const r of rows) {
    const sigs = await prisma.attributionEvent.findMany({ where: { recordId: r.id, action: 'SIGNED', reviewerId: { in: [PERSON, AGENT] }, subjectHash: { not: null } }, select: { subjectHash: true, reviewerId: true } });
    const canon = canonicalOrderHash(r);
    let who = sigs.find((s) => s.subjectHash === canon)?.reviewerId ?? null;
    if (!who && r.options.length <= 6) {
      const person = new Set(sigs.filter((s) => s.reviewerId === PERSON).map((s) => s.subjectHash!));
      if (person.size && permute(r.options).some((p) => { const h = pinHashes({ stem: r.stem, explanation: r.explanation, options: p }); return person.has(h.retentionIncluded) || person.has(h.retentionExcluded); })) who = PERSON;
    }
    if (who) by[who] = (by[who] ?? 0) + 1; else unsigned.push(r.id);
  }
  assert('every row carries a signature that recomputes against the row as it now stands', unsigned.length === 0,
    `${rows.length - unsigned.length} of ${rows.length} (${Object.entries(by).map(([k, v]) => `${v} by ${k}`).join(', ') || 'none'})${unsigned.length ? `; NOT covered: ${unsigned.join(', ')}` : ''}`);

  // 2. WHOLE BY itemWholeness (R41)
  const walk = (caseRow.modes as Record<string, { assetRef?: string }>)?.walk;
  const walkServes = !!walk?.assetRef && !walk.assetRef.startsWith('placeholder/');
  // An entry is attested by the person or, under R1021, by the machine reviewer — never by a placeholder
  // (`human:staff-reviewer@cluecrew.test` resolves to no Reviewer row, R94).
  const attested = new Set((await prisma.misconception.findMany({ where: { status: 'ACTIVE', approvedBy: { in: [`reviewer:${PERSON}`, `reviewer:${AGENT}`] } }, select: { id: true } })).map((m) => m.id));
  const notWhole = rows.filter((r) => !itemWholeness(r, attested, walkServes).whole).map((r) => r.id);
  assert('every row whole by itemWholeness — tags attested, every tagged option carrying its execution', notWhole.length === 0,
    `${rows.length - notWhole.length} of ${rows.length} whole${notWhole.length ? `; not whole: ${notWhole.join(', ')}` : ''}`);

  // 3. NO PUBLISH BLOCKER, NO CHILD-FACING FAULT
  const blocked = rows.map((r) => [r.id, publishBlockers(r.options, `reviewer:${AGENT}`, r.authoredBy, r.answerFlaggedAt)] as const).filter(([, b]) => b);
  assert('no row is blocked by publishBlockers', blocked.length === 0, blocked.map(([i, b]) => `${i}: ${b}`).join('; ') || '0 blocked');
  const clearances = loadClearances();
  const faults = rows.map((r) => ({ id: r.id, f: checkItemChildFacing({ id: r.id, stem: r.stem, explanation: r.explanation, options: r.options, clearedAppropriatenessTokens: clearances.get(r.id) } as never).filter(isBlocking) })).filter((x) => x.f.length);
  assert('no row reaches a child carrying a blocking child-facing fault', faults.length === 0,
    faults.map((x) => `${x.id} (${x.f[0]!.rule})`).join(', ') || '0 rows fail');

  // 4. THE FACE SERVES, THE POOL IS EMPTY BEFORE THE ACT, NOTHING HELD
  const poolBefore = liveAlready;
  assert('the face serves', caseFaceServes(caseRow), `caseFaceServes = ${caseFaceServes(caseRow)}`);
  assert('no row is held from serving', rows.every((r) => !isHeldFromServing(r.id)), `${rows.filter((r) => isHeldFromServing(r.id)).length} held`);

  const rowFail = new Set<string>([...unsigned, ...notWhole, ...blocked.map(([i]) => i), ...faults.map((x) => x.id), ...rows.filter((r) => isHeldFromServing(r.id)).map((r) => r.id)]);
  const publish = READY ? rows.filter((r) => !rowFail.has(r.id)) : rows;
  if (READY) {
    if (liveAlready === 0) refusals.push('--ready is only for a case already serving; this pool is empty');
    else refusals.splice(0, refusals.length, ...refusals.filter((r) => r.startsWith('the face serves')));
    if (publish.length === 0) refusals.push('no row passes every assertion');
    console.log(`  --ready: ${publish.length} of ${rows.length} pass every per-row assertion; ${rowFail.size} held by name`);
  }
  console.log(`  assertions: ${assertions.filter((a) => a.passed).length} of ${assertions.length} pass`);
  for (const a of assertions) console.log(`   ${a.passed ? 'ok     ' : 'REFUSED'} ${a.assertion}\n            ${a.result}`);

  let wrote = 0;
  if (refusals.length === 0 && APPLY) {
    const method = `PUBLISHED — DRAFT to LIVE in one transaction with the door's other ${publish.length - 1}, under the agent-review regime (David's ruling 2026-11-18); every row's signature recomputed, wholeness and blockers derived immediately before the write.`;
    await prisma.$transaction(async (tx) => {
      const n = await tx.item.updateMany({ where: { id: { in: publish.map((r) => r.id) }, status: 'DRAFT' },
        data: { status: 'LIVE', reviewedBy: `reviewer:${AGENT}`, reviewRecordedBy: RECORDED_BY, reviewMethod: 'agent review: drafted, proposed and reviewed by separate agents; the machine reviewer rev-agent-01 attested every change and signed every row it changed' } });
      if (n.count !== publish.length) throw new Error(`updateMany moved ${n.count}, expected ${publish.length} — rolling back`);
      await tx.attributionEvent.createMany({ data: publish.map((r) => ({ recordType: 'item', recordId: r.id, action: 'APPROVED' as const, reviewerId: AGENT,
        actor: 'agent-reviewer', recordedBy: RECORDED_BY, field: 'status', method })) });
      wrote = n.count;
    }, { timeout: 60000 });
  }
  const after = await prisma.item.count({ where: { questionTypeId: { in: TYPES }, pool: 'PRACTICE', status: 'LIVE' } });
  const outcome = refusals.length ? 'REFUSED' : APPLY ? 'PUBLISHED' : 'WOULD PUBLISH';
  const report = { kind: `${DOOR}-publication`, mode: APPLY ? 'APPLY' : 'DRY RUN', outcome, date: new Date().toISOString().slice(0, 10),
    case: { id: CASE, title: caseRow.title, paid: !caseRow.freeTier }, assertions, refusals, heldByName: READY ? [...rowFail] : [], move: { liveBefore: poolBefore, liveAfter: after, rowsMoved: wrote } };
  const body = JSON.stringify(report, null, 1);
  if (APPLY) writeFileSync(pjoin(REPO, 'content/exports', `${DOOR}-publication-${sha(body).slice(0, 16)}.json`), body);
  console.log(`\n  ${outcome}: live ${poolBefore} -> ${after}`);
}
run().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
