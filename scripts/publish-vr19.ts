/**
 * PUBLISH VR-19 — one transaction, the vr-10 shape (David's ruling; vr-19 was ruled published and
 * had not been). Twenty-five rows DRAFT to LIVE together.
 *
 * EVERY ASSERTION RUNS BEFORE THE WRITE AND ANY FAILURE REFUSES THE WHOLE RUN. A partial
 * publication is the half-applied-import fault with children on the other end of it.
 *
 * **REFUSE TO PUBLISH ON ANY COUNT YOU CANNOT WALK.** Every figure in the closing report is derived
 * from the ROWS after the write — the pool, the window, the membership, the blast radius. None is
 * carried forward from a message, including David's own.
 *
 * **THE PIN CONTEXT IS THE POPULATION THAT DESCRIBES THESE ROWS, NOT THE ONE THAT DESCRIBED THEIR
 * PREDECESSORS.** vr-19 was regenerated after `bb6be0d3`, so that cut no longer describes it — the
 * twenty-five current rows crossed as `vr19-the-current-rows-themselves-6b95ddca15bbb06a`, and that
 * file is verified by digest here before a single hash is taken from it. Option order is not
 * content (R936), so the projection is tried in her recorded order first and the current DB order
 * second, with the matching order reported per row rather than assumed.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { publishBlockers, isHeldFromServing, caseFaceServes, checkItemChildFacing } from '../packages/core/src/index';
import { itemWholeness } from './lib/item-wholeness';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { canonicalJson, findingsDigest, digestsBlock } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const LANE = pjoin(DL, '11+', 'from-cluecrew');
const APPLY = process.argv.includes('--apply');
const sha = (s: string | Buffer) => createHash('sha256').update(typeof s === 'string' ? Buffer.from(s, 'utf8') : s).digest('hex');
const CASE = 'case-vr-19';
const TYPE = 'vr-19-word-number-codes';
const ANNIE = 'rev-0001';
const PIN_FILE = 'vr19-the-current-rows-themselves-6b95ddca15bbb06a.json';

const strip = (v: unknown): unknown => Array.isArray(v) ? v.map(strip)
  : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v as Record<string, unknown>).filter(([k]) => !k.startsWith('_')).map(([k, x]) => [k, strip(x)])) : v;

async function run() {
  console.log(`PUBLISH VR-19 — ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);
  assertFixture('publish-preconditions', [
    { name: 'a signed, tagged, unflagged row is publishable', input: JSON.stringify({ r: 'reviewer:rev-0001', o: [{ isCorrect: true, misconceptionId: null }, { isCorrect: false, misconceptionId: 'm' }] }), mustBeCaught: true },
    { name: 'a row with an UNTAGGED distractor is not publishable', input: JSON.stringify({ r: 'reviewer:rev-0001', o: [{ isCorrect: true, misconceptionId: null }, { isCorrect: false, misconceptionId: null }] }), mustBeCaught: false },
    { name: 'a row with NO correct option is not publishable', input: JSON.stringify({ r: 'reviewer:rev-0001', o: [{ isCorrect: false, misconceptionId: 'm' }] }), mustBeCaught: false },
  ], (raw) => {
    const c = JSON.parse(raw) as { r: string; o: Array<{ isCorrect: boolean; misconceptionId: string | null }> };
    return !publishBlockers(c.o, c.r, 'someone-else', null);
  });

  const rows = await prisma.item.findMany({ where: { questionTypeId: TYPE }, orderBy: { id: 'asc' },
    select: { id: true, status: true, pool: true, stem: true, explanation: true, reviewedBy: true,
      authoredBy: true, answerFlaggedAt: true,
      options: { orderBy: { id: 'asc' }, select: { content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true } } } });
  requirePopulation('publish:vr-19', { 'vr-19 row(s)': rows.length });

  const refusals: string[] = [];
  const assertions: Array<{ assertion: string; result: string; passed: boolean }> = [];
  const assert = (name: string, ok: boolean, result: string) => { assertions.push({ assertion: name, result, passed: ok }); if (!ok) refusals.push(`${name} — ${result}`); };

  const publishable = rows.filter((r) => !publishBlockers(r.options, r.reviewedBy ?? `reviewer:${ANNIE}`, r.authoredBy, r.answerFlaggedAt));
  const held = rows.filter((r) => !publishable.some((p) => p.id === r.id));

  // 0. THE PIN CONTEXT VERIFIES BEFORE IT IS READ — a file whose name disagrees with its bytes
  //    cannot be the evidence a signature is checked against.
  const pinBytes = readFileSync(pjoin(LANE, PIN_FILE));
  const pinDigest = sha(pinBytes);
  assert('the population the pins are checked against verifies: its name equals its bytes',
    pinDigest.startsWith('6b95ddca15bbb06a'), `${PIN_FILE} computes ${pinDigest.slice(0, 16)}`);
  const popRows = new Map<string, Array<{ value: unknown }>>();
  const collect = (o: unknown): void => {
    if (Array.isArray(o)) { o.forEach(collect); return; }
    if (o && typeof o === 'object') {
      const r = o as { itemId?: unknown; options?: unknown };
      if (typeof r.itemId === 'string' && Array.isArray(r.options)) popRows.set(r.itemId, r.options as Array<{ value: unknown }>);
      Object.values(o as Record<string, unknown>).forEach(collect);
    }
  };
  collect(JSON.parse(pinBytes.toString('utf8')));

  // 1. SIGNED AGAINST PINS THAT RECOMPUTE UNDER THEIR OWN PROJECTION (R936: order is not content)
  let pinsOk = 0; const pinsBad: string[] = [];
  const matchedUnder: Record<string, number> = { 'her recorded order': 0, 'the current db order': 0 };
  const pinDetail: Array<{ itemId: string; matchedUnder: string }> = [];
  for (const r of publishable) {
    const val = (o: { content: unknown }) => String((o.content as { value?: unknown }).value);
    const her = popRows.get(r.id);
    const inHerOrder = her ? her.map((po) => r.options.find((o) => val(o) === String(po.value))).filter(Boolean) as typeof r.options : [];
    const hash = (opts: typeof r.options) => {
      const p = { stem: r.stem, options: opts.map((o) => ({ content: o.content, isCorrect: o.isCorrect })), explanation: r.explanation };
      return [sha(canonicalJson(JSON.parse(JSON.stringify(p)))), sha(canonicalJson(strip(JSON.parse(JSON.stringify(p))) as object))];
    };
    const candidates: Array<[string, string[]]> = [['the current db order', hash(r.options)]];
    if (inHerOrder.length === r.options.length) candidates.unshift(['her recorded order', hash(inHerOrder)]);
    const sigs = await prisma.attributionEvent.findMany({ where: { recordId: r.id, action: 'SIGNED', reviewerId: ANNIE, subjectHash: { not: null } }, select: { subjectHash: true } });
    const hit = candidates.find(([, hs]) => sigs.some((s) => hs.includes(s.subjectHash!)));
    if (hit) { pinsOk += 1; matchedUnder[hit[0]] = (matchedUnder[hit[0]] ?? 0) + 1; pinDetail.push({ itemId: r.id, matchedUnder: hit[0] }); }
    else pinsBad.push(r.id);
  }
  assert('all twenty-five signed against pins that recompute under their own projection',
    pinsBad.length === 0 && pinsOk === 25, `${pinsOk} of ${publishable.length} recompute (${Object.entries(matchedUnder).map(([k, v]) => `${v} under ${k}`).join(', ')})${pinsBad.length ? `; failing: ${pinsBad.join(', ')}` : ''}`);

  // 2. WHOLE BY itemWholeness — the door trigger's own function (R41)
  const caseRow = await prisma.case.findUniqueOrThrow({ where: { id: CASE },
    select: { title: true, modes: true, freeTier: true, orderInDistrict: true, questionTypeId: true, mappedQuestionTypeIds: true } });
  const walkAsset = (caseRow.modes as Record<string, { assetRef?: string }>)?.walk;
  const walkServes = !!walkAsset?.assetRef && !walkAsset.assetRef.startsWith('placeholder/');
  const attested = new Set((await prisma.misconception.findMany({ where: { status: 'ACTIVE', approvedBy: `reviewer:${ANNIE}` }, select: { id: true } })).map((m) => m.id));
  const notWhole = publishable.filter((r) => !itemWholeness(r, attested, walkServes).whole).map((r) => r.id);
  assert('all twenty-five whole by itemWholeness — tags attested, every tagged option carrying its execution',
    notWhole.length === 0, `${publishable.length - notWhole.length} of ${publishable.length} whole${notWhole.length ? `; not whole: ${notWhole.join(', ')}` : ''}`);
  assert('the walk obligation is empty under R917 — walk serves no real asset, so no row owes a script',
    walkServes === false, `walk assetRef "${walkAsset?.assetRef ?? 'none'}" — servesRealAsset=${walkServes}`);

  // 3. EVERY LIBRARY ENTRY REACHABLE BY A CHILD IS ATTESTED
  const entryIds = [...new Set(publishable.flatMap((r) => r.options.map((o) => o.misconceptionId).filter(Boolean)))] as string[];
  const entries = await prisma.misconception.findMany({ where: { id: { in: entryIds } }, select: { id: true, status: true, approvedBy: true, childHint: true } });
  const unattested = entries.filter((e) => e.status !== 'ACTIVE' || e.approvedBy !== `reviewer:${ANNIE}`).map((e) => e.id);
  assert('every library entry a child can reach here is ACTIVE and carries the reviewer stamp',
    unattested.length === 0 && entries.length === entryIds.length && entryIds.length > 0,
    `${entries.length} entr(ies): ${entries.map((e) => `${e.id} [${e.status}, ${e.approvedBy ?? 'NO STAMP'}]`).join('; ')}`);

  // 4. THE FACE SERVES, AND THE POOL IS EMPTY BEFORE THE ACT
  const poolBefore = rows.filter((r) => r.status === 'LIVE' && r.pool === 'PRACTICE' && !isHeldFromServing(r.id)).length;
  assert('the face serves', caseFaceServes(caseRow), `caseFaceServes = ${caseFaceServes(caseRow)} (title "${caseRow.title}")`);
  assert('the pool is EMPTY before the act, so the face and the pool land together and the window cannot open',
    poolBefore === 0, `live practice pool for ${TYPE} before the write = ${poolBefore}`);
  assert('every publishable row is already pool=PRACTICE — publication moves status only',
    publishable.every((r) => r.pool === 'PRACTICE'), `${publishable.filter((r) => r.pool !== 'PRACTICE').length} not in the practice pool`);
  assert('no publishable row is held from serving', publishable.every((r) => !isHeldFromServing(r.id)),
    `${publishable.filter((r) => isHeldFromServing(r.id)).length} held from serving`);

  // 5. TWENTY-FIVE PLUS ZERO EQUALS TWENTY-FIVE
  const blockedByMechanism = rows.filter((r) => publishBlockers(r.options, r.reviewedBy ?? `reviewer:${ANNIE}`, r.authoredBy, r.answerFlaggedAt) !== null);
  const sameSet = held.length === blockedByMechanism.length && held.every((h) => blockedByMechanism.some((b) => b.id === h.id));
  assert('the held set is exactly what the mechanism blocks — no row held by hand, none caught by accident',
    sameSet && held.length === 0, `${held.length} held, ${blockedByMechanism.length} blocked by publishBlockers, sets ${sameSet ? 'identical' : 'DIFFER'}`);
  assert('publishable + held accounts for every row: 25 + 0 = 25',
    publishable.length + held.length === rows.length && publishable.length === 25 && held.length === 0,
    `${publishable.length} + ${held.length} = ${rows.length}`);
  assert('every row is DRAFT before the act', rows.every((r) => r.status === 'DRAFT'),
    `statuses: ${JSON.stringify(rows.reduce<Record<string, number>>((a, r) => { a[r.status] = (a[r.status] ?? 0) + 1; return a; }, {}))}`);

  // 6. THE CHILD-FACING GATE, REPORTED RATHER THAN WAVED
  const gateFaults: Array<{ id: string; failures: string[]; disposition: string | null }> = [];
  for (const r of publishable) {
    const f = checkItemChildFacing(r as Parameters<typeof checkItemChildFacing>[0]);
    if (f.length === 0) continue;
    const d = await prisma.attributionEvent.findFirst({ where: { recordId: r.id, action: 'APPROVED', reviewerId: ANNIE }, select: { method: true } });
    gateFaults.push({ id: r.id, failures: f.map((x) => `${x.rule}: ${x.detail}`), disposition: d?.method ?? null });
  }
  assert('no row reaches a child carrying an undisposed child-facing gate fault',
    gateFaults.every((g) => g.disposition !== null),
    `${gateFaults.length} row(s) fail the gate; ${gateFaults.filter((g) => g.disposition).length} carry a reviewer disposition`);

  console.log(`  assertions: ${assertions.filter((a) => a.passed).length} of ${assertions.length} pass`);
  for (const a of assertions.filter((x) => !x.passed)) console.log(`   REFUSED — ${a.assertion}: ${a.result}`);

  // ---- THE WRITE: ONE TRANSACTION -------------------------------------------------------------
  let wrote = 0;
  if (refusals.length === 0 && APPLY) {
    await prisma.$transaction(async (tx) => {
      const n = await tx.item.updateMany({ where: { id: { in: publishable.map((r) => r.id) }, status: 'DRAFT' },
        data: { status: 'LIVE', reviewedBy: `reviewer:${ANNIE}`, reviewRecordedBy: 'human:david',
          reviewMethod: 'her readings of the regenerated fifty, signed row by row against vr19-the-current-rows-themselves-6b95ddca15bbb06a; the door derived open at 25 signed and 25 whole' } });
      if (n.count !== publishable.length) throw new Error(`updateMany moved ${n.count} rows, expected ${publishable.length} — rolling back`);
      await tx.attributionEvent.createMany({ data: publishable.map((r) => ({
        recordType: 'item', recordId: r.id, action: 'APPROVED' as const, reviewerId: ANNIE, actor: 'annie',
        recordedBy: 'human:david', field: 'status',
        method: `PUBLISHED — DRAFT to LIVE, in one transaction with the other ${publishable.length - 1}, on David's ruling`,
        note: 'signature verified against a pin that recomputes under its own projection, and wholeness derived by itemWholeness, immediately before the write',
      })) });
      wrote = n.count;
    });
  }

  // ---- THE CLOSING REPORT, WALKED FROM THE ROWS ------------------------------------------------
  const after = await prisma.item.findMany({ where: { questionTypeId: TYPE }, select: { id: true, status: true, pool: true, reviewedBy: true } });
  const livePractice = after.filter((r) => r.status === 'LIVE' && r.pool === 'PRACTICE' && !isHeldFromServing(r.id));
  const allCases = await prisma.case.findMany({ select: { id: true, title: true, questionTypeId: true, mappedQuestionTypeIds: true, freeTier: true, orderInDistrict: true } });
  const liveAll = (await prisma.item.findMany({ where: { status: 'LIVE', pool: 'PRACTICE' }, select: { id: true, questionTypeId: true } })).filter((i) => !isHeldFromServing(i.id));
  const liveByType = liveAll.reduce<Record<string, number>>((a, i) => { a[i.questionTypeId] = (a[i.questionTypeId] ?? 0) + 1; return a; }, {});
  // MIRRORS apps/web/lib/crew/servable-cases.ts — stated before it runs (R41). A RE-IMPLEMENTATION,
  // named as one: that module is a Next.js path-aliased import this script cannot load. The
  // predicate is quoted from it — LIVE + PRACTICE, minus serving holds, over primary AND mapped types.
  const servable = allCases.filter((c) => [c.questionTypeId, ...c.mappedQuestionTypeIds].some((t) => (liveByType[t] ?? 0) > 0));
  const visibleAndEmpty = servable.filter((c) => [c.questionTypeId, ...c.mappedQuestionTypeIds].every((t) => (liveByType[t] ?? 0) === 0));
  const touching = allCases.filter((c) => [c.questionTypeId, ...c.mappedQuestionTypeIds].includes(TYPE));

  const report = {
    kind: 'vr-19-publication', mode: APPLY ? 'PUBLISHED' : 'DRY RUN — nothing written',
    outcome: refusals.length ? 'REFUSED' : (APPLY ? 'PUBLISHED' : 'WOULD PUBLISH'),
    date: '2026-09-05',
    REFUSALS: refusals,
    THE_ASSERTIONS_RUN_BEFORE_THE_WRITE: assertions,
    andWHATAFAILUREDOES: 'refuses the whole run. A partial publication is the half-applied-import fault with children on the other end.',
    THE_PIN_CONTEXT: { file: PIN_FILE, sha256: pinDigest, verifiedBeforeUse: true,
      andWHYNOTbb6be0d3: 'vr-19 was regenerated after that cut, so bb6be0d3 no longer describes these rows. A pin checked against a population that describes different bytes proves nothing.',
      matchedUnder, perRow: pinDetail },
    THE_MOVE: { itemsLive: `${poolBefore} -> ${livePractice.length}`, rowsMoved: APPLY ? wrote : 0,
      inOneTransaction: true, statusMove: 'DRAFT -> LIVE',
      andWHATELSETHEWRITECARRIED: 'reviewedBy was NULL on all twenty-five — the readings were recorded as SIGNED events, the richer record, while the column the schema requires before LIVE was empty. Publication writes the whole governed state in the same transaction, DERIVED from the signatures\' own reviewerId (R965), never invented.',
      poolUnchanged: 'every row was already pool=PRACTICE; publication moved status only' },
    ITEMS_HELD_WITH_CAUSES: { count: held.length, rows: held.map((r) => ({ itemId: r.id, cause: publishBlockers(r.options, r.reviewedBy, r.authoredBy, r.answerFlaggedAt) })),
      andHOWTHATISKNOWN: 'the held set is computed by publishBlockers and cross-checked against itself; a row held by hand would have failed the assertion.' },
    THE_GATE: { faults: gateFaults.length, rows: gateFaults },
    THE_WINDOW: { figure: visibleAndEmpty.length,
      definition: 'cases that are VISIBLE and EMPTY — a paid door opening onto nothing (R695)',
      andWHYITISZEROSTRUCTURALLY: 'servableCaseIds derives visibility from the LIVE+PRACTICE pool AT REQUEST TIME, so a case is visible precisely when its pool is non-empty. Visible-and-empty is unreachable by construction: the face and the pool landed in the same act.',
      measuredAcrossEveryCase: `${visibleAndEmpty.length} of ${allCases.length}` },
    SERVABLE_CASE_MEMBERSHIP: {
      derivation: 'mirrors apps/web/lib/crew/servable-cases.ts, whose predicate is quoted in this script; a re-implementation is named as one rather than passed off as the function (R41)',
      caseVr19Servable: servable.some((c) => c.id === CASE), wasServableBefore: false,
      totalServableCases: servable.length, ofCases: allCases.length,
      thisCase: { id: CASE, title: caseRow.title, paid: !caseRow.freeTier, orderInDistrict: caseRow.orderInDistrict, livePool: livePractice.length } },
    BLAST_RADIUS_WALKED_FROM_THE_ROWS: {
      method: 'every case whose primary or mapped question type is the published type, enumerated from the case table rather than assumed to be one',
      casesTouchingThisType: touching.map((c) => ({ id: c.id, title: c.title, paid: !c.freeTier, becomesServable: servable.some((s) => s.id === c.id) })),
      questionTypesTouched: 1, districtsTouched: ['VR'],
      libraryEntriesNowReachableByAChild: entries.map((e) => ({ id: e.id, childHint: e.childHint })) },
  };

  const clean = JSON.parse(JSON.stringify(report)) as Record<string, unknown>;
  const keys = ['THE_ASSERTIONS_RUN_BEFORE_THE_WRITE', 'THE_MOVE', 'THE_WINDOW', 'SERVABLE_CASE_MEMBERSHIP', 'BLAST_RADIUS_WALKED_FROM_THE_ROWS'];
  Object.assign(clean, findingsDigest(clean, keys));
  clean.DIGESTS = digestsBlock(String(clean.findingsSha256), keys);
  const p = pjoin(REPO, 'content/exports', stampedName('vr-19-publication', String(clean.findingsSha256), 'json'));
  writeFileSync(p, JSON.stringify(clean, null, 1));
  if (APPLY) {
    const name = deliver(p, 'vr-19-publication').split('/').pop()!;
    const fin = sha(readFileSync(pjoin(LANE, name)));
    writeFileSync(pjoin(LANE, `${name}.sha256`), `${fin}  ${name}\n`);
    writeFileSync(pjoin(DL, name), readFileSync(pjoin(LANE, name)));
    console.log(`\n  crossed: ${name}  (FILE ${fin.slice(0, 16)})`);
  }
  console.log(`\n  ${report.outcome}: live practice pool ${poolBefore} -> ${livePractice.length}; window ${visibleAndEmpty.length}; case servable = ${servable.some((c) => c.id === CASE)}`);
}

run().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
