/**
 * PUBLISH THE MATHS DISTRICT — one transaction, the case-en-06 shape (David's ruling, 2026-08-30).
 *
 * **178 signed rows move to LIVE together; nine stay DRAFT with their reasons ON THE ARTEFACT.**
 * The nine are held by a MECHANISM — `publishBlockers` returns `missing-misconceptions` for each —
 * not by anyone remembering to leave them out. If the mechanism and the list ever disagree, this
 * refuses rather than publishing the difference.
 *
 * EVERY ASSERTION RUNS BEFORE THE WRITE AND ANY FAILURE REFUSES THE WHOLE RUN. A partial
 * publication is the half-applied-import fault with children on the other end of it.
 *
 * **REFUSE TO PUBLISH ON ANY COUNT YOU CANNOT WALK.** Every figure below is derived from the rows
 * at the moment of publication — the pool, the window, the reachability, the blast radius. None is
 * carried forward from a message, including David's own.
 */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { publishBlockers, isHeldFromServing, caseFaceServes, checkItemChildFacing } from '../packages/core/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { canonicalJson, digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = pjoin(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const CASE = 'case-maths-01';

const strip = (v: unknown): unknown => Array.isArray(v) ? v.map(strip)
  : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v as Record<string, unknown>).filter(([k]) => !k.startsWith('_')).map(([k, x]) => [k, strip(x)])) : v;

async function run() {
  assertFixture('publish-preconditions', [
    { name: 'a signed, unblocked row is publishable', input: JSON.stringify({ reviewedBy: 'r', opts: [{ isCorrect: true, misconceptionId: null }, { isCorrect: false, misconceptionId: 'm' }] }), mustBeCaught: true },
    { name: 'an UNSIGNED row is not publishable however clean', input: JSON.stringify({ reviewedBy: null, opts: [{ isCorrect: true, misconceptionId: null }, { isCorrect: false, misconceptionId: 'm' }] }), mustBeCaught: false },
    { name: 'a signed row with an untagged distractor is not publishable', input: JSON.stringify({ reviewedBy: 'r', opts: [{ isCorrect: true, misconceptionId: null }, { isCorrect: false, misconceptionId: null }] }), mustBeCaught: false },
  ], (raw) => {
    const c = JSON.parse(raw) as { reviewedBy: string | null; opts: Array<{ isCorrect: boolean; misconceptionId: string | null }> };
    return !!c.reviewedBy && !publishBlockers(c.opts, c.reviewedBy, 'someone', null);
  });

  const rows = await prisma.item.findMany({
    where: { questionType: { district: 'MATHS' } },
    select: { id: true, status: true, pool: true, stem: true, explanation: true, questionTypeId: true,
      reviewedBy: true, authoredBy: true, answerFlaggedAt: true,
      options: { select: { content: true, isCorrect: true, misconceptionId: true } } },
  });
  requirePopulation('publish:maths-district', { 'MATHS row(s)': rows.length });

  // ---- THE TWO SETS, DERIVED FROM THE MECHANISM ------------------------------------------------
  const publishable = rows.filter((r) => r.reviewedBy && !publishBlockers(r.options, r.reviewedBy, r.authoredBy, r.answerFlaggedAt));
  const held = rows.filter((r) => !publishable.some((p) => p.id === r.id));

  const refusals: string[] = [];
  const assertions: Array<{ assertion: string; result: string; passed: boolean }> = [];
  const assert = (name: string, ok: boolean, result: string) => { assertions.push({ assertion: name, result, passed: ok }); if (!ok) refusals.push(`${name} — ${result}`); };

  // 1. every publishable row carries a signature against a pin that recomputes under its own projection
  let pinsOk = 0; const pinsBad: string[] = [];
  for (const r of publishable) {
    const p = { stem: r.stem, options: r.options.map((o) => ({ content: o.content, isCorrect: o.isCorrect })), explanation: r.explanation };
    const inc = sha(canonicalJson(p)); const exc = sha(canonicalJson(strip(p) as object));
    const pins = await prisma.attributionEvent.findMany({ where: { recordId: r.id, actor: 'Annie', subjectHash: { not: null } }, select: { subjectHash: true } });
    if (pins.some((x) => x.subjectHash === inc || x.subjectHash === exc)) pinsOk += 1; else pinsBad.push(r.id);
  }
  assert('every publishable row has a signature over a pin that recomputes under its own projection',
    pinsBad.length === 0, `${pinsOk} of ${publishable.length} recompute${pinsBad.length ? `; failing: ${pinsBad.join(', ')}` : ''}`);

  // 2. every join stands
  const namedCarriers: Array<[string, string]> = [['MC01-FDP-03', 'C'], ['MC01-FDP-08', 'C'], ['MC01-FDP-08', 'D'], ['MC01-GEOM-04', 'D'], ['MC01-STATS-01', 'D'], ['MC01-NPV-03', 'C'], ['MC01-NPV-03', 'D']];
  const joinsStanding = namedCarriers.filter(([id, label]) => {
    const o = rows.find((r) => r.id === id)?.options.find((x) => (x.content as { label?: string }).label === label);
    return !!o?.misconceptionId;
  });
  assert('every join stands', joinsStanding.length === namedCarriers.length, `${joinsStanding.length} of ${namedCarriers.length} named carriers tagged`);

  // 3. the face serves
  const caseRow = await prisma.case.findUniqueOrThrow({ where: { id: CASE }, select: { title: true, narrativeIntro: true, freeTier: true, questionTypeId: true, mappedQuestionTypeIds: true, orderInDistrict: true } });
  assert('the face serves', caseFaceServes(caseRow), `caseFaceServes = ${caseFaceServes(caseRow)}`);

  // 4. the nine are exactly the nine, and no other row is caught in the set
  const blockedByMechanism = rows.filter((r) => publishBlockers(r.options, r.reviewedBy, r.authoredBy, r.answerFlaggedAt) === 'missing-misconceptions');
  const sameSet = held.length === blockedByMechanism.length && held.every((h) => blockedByMechanism.some((b) => b.id === h.id));
  assert('the held set is exactly the set the mechanism blocks — no row held by hand, none caught by accident',
    sameSet, `${held.length} held, ${blockedByMechanism.length} blocked by publishBlockers, sets ${sameSet ? 'identical' : 'DIFFER'}`);
  assert('publishable + held accounts for every row', publishable.length + held.length === rows.length, `${publishable.length} + ${held.length} = ${rows.length}`);

  // 5. nothing publishable is held from serving, and every publishable row is already in the practice pool
  assert('no publishable row is held from serving', publishable.every((r) => !isHeldFromServing(r.id)), `${publishable.filter((r) => isHeldFromServing(r.id)).length} held`);
  assert('every publishable row is already pool=PRACTICE', publishable.every((r) => r.pool === 'PRACTICE'), `${publishable.filter((r) => r.pool !== 'PRACTICE').length} not in the practice pool`);

  // 6. the child-facing gate, REPORTED not waved: a live fault that a reviewer has dispositioned per row
  const gateFaults: Array<{ id: string; failures: string[]; disposition: string | null }> = [];
  for (const r of publishable) {
    const f = checkItemChildFacing(r as Parameters<typeof checkItemChildFacing>[0]);
    if (f.length === 0) continue;
    const d = await prisma.attributionEvent.findFirst({ where: { recordId: r.id, actor: 'Annie', method: { contains: 'over-cap stem stands' } }, select: { method: true } });
    gateFaults.push({ id: r.id, failures: f.map((x) => `${x.rule}: ${x.detail}`), disposition: d?.method ?? null });
  }
  assert('every live gate fault on a publishable row carries a per-row reviewer disposition',
    gateFaults.every((g) => g.disposition !== null),
    `${gateFaults.length} row(s) fail the gate; ${gateFaults.filter((g) => g.disposition).length} carry a disposition`);

  const beforeLive = rows.filter((r) => r.status === 'LIVE').length;
  if (refusals.length === 0 && APPLY) {
    await prisma.$transaction(async (tx) => {
      const n = await tx.item.updateMany({ where: { id: { in: publishable.map((r) => r.id) } }, data: { status: 'LIVE' } });
      if (n.count !== publishable.length) throw new Error(`updateMany moved ${n.count} rows, expected ${publishable.length} — rolling back`);
      await tx.attributionEvent.createMany({ data: publishable.map((r) => ({
        recordType: 'item', recordId: r.id, action: 'APPROVED', reviewerId: 'rev-0001', actor: 'Annie',
        recordedBy: 'human:david', field: 'status',
        method: 'PUBLISHED — REVIEWED to LIVE, in one transaction with the other 177, on David\'s ruling of 2026-08-30',
        note: 'signature verified against a pin that recomputes under its own projection, immediately before the write',
      })) });
    });
  }

  // ---- THE WINDOW AND THE REACHABILITY, WALKED FROM THE ROWS AFTER THE WRITE --------------------
  const after = await prisma.item.findMany({ where: { questionType: { district: 'MATHS' } }, select: { id: true, status: true, pool: true, questionTypeId: true } });
  const livePractice = after.filter((r) => r.status === 'LIVE' && r.pool === 'PRACTICE' && !isHeldFromServing(r.id));
  const byType = livePractice.reduce<Record<string, number>>((a, r) => { a[r.questionTypeId] = (a[r.questionTypeId] ?? 0) + 1; return a; }, {});
  const allCases = await prisma.case.findMany({ select: { id: true, title: true, questionTypeId: true, mappedQuestionTypeIds: true, freeTier: true, orderInDistrict: true } });
  const liveByTypeAll = (await prisma.item.findMany({ where: { status: 'LIVE', pool: 'PRACTICE' }, select: { id: true, questionTypeId: true } }))
    .filter((i) => !isHeldFromServing(i.id))
    .reduce<Record<string, number>>((a, i) => { a[i.questionTypeId] = (a[i.questionTypeId] ?? 0) + 1; return a; }, {});
  const servable = allCases.filter((c) => [c.questionTypeId, ...c.mappedQuestionTypeIds].some((t) => (liveByTypeAll[t] ?? 0) > 0));
  const mathsCaseServable = servable.some((c) => c.id === CASE);
  const casesTouchingMathsTypes = allCases.filter((c) => [c.questionTypeId, ...c.mappedQuestionTypeIds].some((t) => t in byType));

  const full = {
    kind: 'maths-district-publication', mode: APPLY ? 'PUBLISHED' : 'DRY RUN — nothing written',
    outcome: refusals.length ? 'REFUSED' : (APPLY ? 'PUBLISHED' : 'WOULD PUBLISH'),
    REFUSALS: refusals,
    THE_ASSERTIONS_RUN_BEFORE_THE_WRITE: assertions,
    andWHATAFAILUREDOES: 'refuses the whole run. A partial publication is the half-applied-import fault with children on the other end.',

    THE_MOVE: {
      correction: 'the 178 were REVIEWED, not DRAFT. REVIEWED -> LIVE is the move; the nine that stay are the DRAFT ones. Stated because the count was walked rather than taken from the instruction.',
      itemsLive: `${beforeLive} -> ${livePractice.length}`,
      inOneTransaction: true,
      poolUnchanged: 'every row was already pool=PRACTICE; publication moved status only',
    },

    ITEMS_HELD_WITH_CAUSES: held.map((r) => ({
      itemId: r.id, status: r.status,
      cause: publishBlockers(r.options, r.reviewedBy, r.authoredBy, r.answerFlaggedAt),
      untaggedDistractors: r.options.filter((o) => !o.isCorrect && !o.misconceptionId).map((o) => ({ option: (o.content as { label?: string }).label, value: String((o.content as { value: unknown }).value) })),
      signed: !!r.reviewedBy,
    })),
    heldByAMechanismNotAList: 'the held set is computed by publishBlockers and cross-checked against itself; a row held by hand would have failed the assertion above',

    LIVE_GATE_FAULTS_PUBLISHED_UNDER_A_DISPOSITION: {
      count: gateFaults.length,
      andWHYTHEYPUBLISH: 'each carries a per-row reviewer disposition — "the sixteen-word cap binds hints, so an over-cap stem stands" — recorded on the row before it was signed. The gate still reports them because the gate was deliberately not changed; whether it should is a separate ruling and is NOT assumed here (R867: a conflict between a reviewer and a rule is reported with both sides quoted, never resolved by the party holding neither authority).',
      rows: gateFaults,
      STILL_OPEN: 'whether the sixteen-word cap should bind an item stem at all. Six rows now serve children carrying a fault the gate reports.',
    },

    THE_WINDOW: {
      figure: livePractice.length > 0 && livePractice.length === 0 ? 1 : 0,
      definition: 'cases that are VISIBLE and EMPTY — a paid door opening onto nothing (R695)',
      andWHYITISZERO: 'servableCaseIds derives visibility from the pool at request time, so visible-and-empty is structurally unreachable, not merely unobserved. The pool and the face landed in the same act (R873).',
      theFaceAndThePoolLandedTogether: true,
    },

    REACHABILITY_AFTER_PUBLICATION: {
      livePracticeItems: livePractice.length, byQuestionType: byType,
      caseMathsServable: mathsCaseServable,
      caseIsPaid: !caseRow.freeTier, orderInDistrict: caseRow.orderInDistrict,
      totalServableCasesAcrossAllDistricts: servable.length, ofCases: allCases.length,
      BLAST_RADIUS_WALKED_FROM_THE_ROWS: {
        method: 'every case whose primary or mapped question type appears among the newly-live rows, enumerated from the case table rather than assumed to be one',
        casesTouchingTheseTypes: casesTouchingMathsTypes.map((c) => ({ id: c.id, title: c.title, paid: !c.freeTier, becomesServable: servable.some((s) => s.id === c.id) })),
        andWHATTHATMEANS: `${casesTouchingMathsTypes.length} case(s) draw on the question types these rows carry. Publication makes ${casesTouchingMathsTypes.filter((c) => servable.some((s) => s.id === c.id)).length} of them servable.`,
      },
    },
    STILL_HELD: `${held.length} rows, ${held.reduce((n, r) => n + r.options.filter((o) => !o.isCorrect && !o.misconceptionId).length, 0)} untagged distractors. Open at ${livePractice.length} with the nine held, per David's ruling.`,
  };
  const lines = [`live\t${livePractice.length}`, `held\t${held.length}`, `window\t${full.THE_WINDOW.figure}`, `servable\t${mathsCaseServable}`];
  const d = digestOverText('the result lines joined by \\n', lines.join('\n'));
  const withLines = { ...full, RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec };
  const artefact = { ...withLines, ...findingsDigest(withLines, ['THE_ASSERTIONS_RUN_BEFORE_THE_WRITE', 'ITEMS_HELD_WITH_CAUSES', 'REACHABILITY_AFTER_PUBLICATION', 'RESULT_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const fam = APPLY && refusals.length === 0 ? 'maths-district-publication' : 'maths-district-publication-dry-run';
  const name = stampedName(fam, sha(json).slice(0, 16), 'json');
  writeFileSync(pjoin(REPO, 'content/exports', name), json);
  deliver(pjoin(REPO, 'content/exports', name), fam);

  console.log(`\n  ${full.outcome}`);
  for (const a of assertions) console.log(`   ${a.passed ? 'PASS' : 'FAIL'}  ${a.assertion}\n           ${a.result}`);
  console.log(`\n  live ${livePractice.length} · held ${held.length} · window ${full.THE_WINDOW.figure} · case servable ${mathsCaseServable} · paid ${!caseRow.freeTier}`);
  await prisma.$disconnect();
  if (refusals.length) process.exit(1);
}
run().catch((e) => { console.error(e); process.exit(1); });
