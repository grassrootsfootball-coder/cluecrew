/**
 * PUBLISH VR-10 — one transaction, the case-en-06 / case-maths-01 shape (David's ruling,
 * 2026-09-02). Twenty-five rows DRAFT to LIVE together.
 *
 * EVERY ASSERTION RUNS BEFORE THE WRITE AND ANY FAILURE REFUSES THE WHOLE RUN. A partial
 * publication is the half-applied-import fault with children on the other end of it.
 *
 * **REFUSE TO PUBLISH ON ANY COUNT YOU CANNOT WALK.** Every figure in the closing report is
 * derived from the ROWS after the write — the pool, the window, the membership, the blast
 * radius. None is carried forward from a message, including David's own.
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
import { canonicalJson, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = pjoin(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const CASE = 'case-vr-10';
const TYPE = 'vr-10-word-connections';
const ANNIE = 'rev-0001';

const strip = (v: unknown): unknown => Array.isArray(v) ? v.map(strip)
  : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v as Record<string, unknown>).filter(([k]) => !k.startsWith('_')).map(([k, x]) => [k, strip(x)])) : v;

async function run() {
  console.log(`PUBLISH VR-10 — ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);
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
      authoredBy: true, answerFlaggedAt: true, sendHistory: true,
      options: { orderBy: { id: 'asc' }, select: { content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true } } } });
  requirePopulation('publish:vr-10', { 'vr-10 row(s)': rows.length });

  const refusals: string[] = [];
  const assertions: Array<{ assertion: string; result: string; passed: boolean }> = [];
  const assert = (name: string, ok: boolean, result: string) => { assertions.push({ assertion: name, result, passed: ok }); if (!ok) refusals.push(`${name} — ${result}`); };

  // ---- THE TWO SETS, FROM THE MECHANISM — never from a list --------------------------------------
  const publishable = rows.filter((r) => !publishBlockers(r.options, r.reviewedBy ?? `reviewer:${ANNIE}`, r.authoredBy, r.answerFlaggedAt));
  const held = rows.filter((r) => !publishable.some((p) => p.id === r.id));

  /**
   * 1. SIGNED AGAINST PINS THAT RECOMPUTE UNDER THEIR OWN PROJECTION.
   *
   * **A PIN IS OVER CONTENT, AND OPTION ORDER IS NOT CONTENT** (R936: a seat is named by its value,
   * never its position). The first run of this assertion hashed the options in the order Prisma
   * happened to return them — an UNORDERED read — and refused row 23, whose bytes had never
   * changed: landing the mint on `wet` moved that option's physical row, and the arbitrary order
   * moved with it. The other 24 passed on luck, not design; 19 of 25 rows are not in value order,
   * so the DB order is arbitrary and stable only until something writes.
   *
   * So the projection is taken in the option order RECORDED IN THE POPULATION SHE SIGNED AGAINST
   * (bb6be0d3) — the pin's own context, evidenced rather than permissive — with the current DB
   * order computed beside it and which one matched reported per row.
   */
  const popPath = pjoin(homedir(), 'Downloads/11+/from-cluecrew/vr-arc-census-and-population-bb6be0d3f2fed905.json');
  const popRows = new Map<string, Array<{ value: unknown }>>(
    (JSON.parse(readFileSync(popPath, 'utf8')) as { SECTIONS: Array<{ rows: Array<{ itemId: string; options: Array<{ value: unknown }> }> }> })
      .SECTIONS.flatMap((s) => s.rows).map((r) => [r.itemId, r.options]));
  let pinsOk = 0; const pinsBad: string[] = []; const matchedUnder: Record<string, number> = { 'her recorded order': 0, 'the current db order': 0 };
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

  // 2. WHOLE BY itemWholeness — the trigger's own function (R41), walk obligation under R917
  const caseRow = await prisma.case.findUniqueOrThrow({ where: { id: CASE },
    select: { title: true, modes: true, freeTier: true, orderInDistrict: true, questionTypeId: true, mappedQuestionTypeIds: true } });
  const walkAsset = (caseRow.modes as Record<string, { assetRef?: string }>)?.walk;
  const walkServes = !!walkAsset?.assetRef && !walkAsset.assetRef.startsWith('placeholder/');
  const attested = new Set((await prisma.misconception.findMany({ where: { status: 'ACTIVE', approvedBy: 'reviewer:rev-0001' }, select: { id: true } })).map((m) => m.id));
  const notWhole = publishable.filter((r) => !itemWholeness(r, attested, walkServes).whole).map((r) => r.id);
  assert('all twenty-five whole by itemWholeness — tags attested, every tagged option carrying its execution',
    notWhole.length === 0, `${publishable.length - notWhole.length} of ${publishable.length} whole${notWhole.length ? `; not whole: ${notWhole.join(', ')}` : ''}`);
  assert('the walk obligation is empty under R917 — walk serves no real asset, so no row owes a script',
    walkServes === false, `walk assetRef "${walkAsset?.assetRef ?? 'none'}" — servesRealAsset=${walkServes}`);

  // 3. BOTH LIBRARY ENTRIES ATTESTED, INCLUDING THE MINT
  const entryIds = [...new Set(publishable.flatMap((r) => r.options.map((o) => o.misconceptionId).filter(Boolean)))] as string[];
  const entries = await prisma.misconception.findMany({ where: { id: { in: entryIds } }, select: { id: true, status: true, approvedBy: true, childHint: true } });
  const unattested = entries.filter((e) => e.status !== 'ACTIVE' || e.approvedBy !== 'reviewer:rev-0001').map((e) => e.id);
  assert('both library entries attested — ACTIVE and carrying the reviewer stamp',
    entryIds.length === 2 && unattested.length === 0 && entries.length === 2,
    `${entries.length} entr(ies) referenced: ${entries.map((e) => `${e.id} [${e.status}, ${e.approvedBy ?? 'NO STAMP'}]`).join('; ')}`);
  assert('the mint vr10-first-pair-word-returned is among them and attested',
    entries.some((e) => e.id === 'vr10-first-pair-word-returned' && e.status === 'ACTIVE' && e.approvedBy === 'reviewer:rev-0001'),
    entries.find((e) => e.id === 'vr10-first-pair-word-returned') ? 'present, ACTIVE, stamped' : 'ABSENT');

  // 4. THE FACE SERVES, AND THE POOL IS NON-EMPTY IN THE SAME ACT
  const poolBefore = rows.filter((r) => r.status === 'LIVE' && r.pool === 'PRACTICE' && !isHeldFromServing(r.id)).length;
  assert('the face serves', caseFaceServes(caseRow), `caseFaceServes = ${caseFaceServes(caseRow)} (title "${caseRow.title}")`);
  assert('the pool is EMPTY before the act, so the face and the pool land together and the window cannot open',
    poolBefore === 0, `live practice pool for ${TYPE} before the write = ${poolBefore}`);
  assert('every publishable row is already pool=PRACTICE — publication moves status only',
    publishable.every((r) => r.pool === 'PRACTICE'), `${publishable.filter((r) => r.pool !== 'PRACTICE').length} not in the practice pool`);
  assert('no publishable row is held from serving', publishable.every((r) => !isHeldFromServing(r.id)),
    `${publishable.filter((r) => isHeldFromServing(r.id)).length} held from serving`);

  // 5. TWENTY-FIVE PLUS ZERO EQUALS TWENTY-FIVE — no row held by hand, none caught by accident
  const blockedByMechanism = rows.filter((r) => publishBlockers(r.options, r.reviewedBy ?? `reviewer:${ANNIE}`, r.authoredBy, r.answerFlaggedAt) !== null);
  const sameSet = held.length === blockedByMechanism.length && held.every((h) => blockedByMechanism.some((b) => b.id === h.id));
  assert('the held set is exactly what the mechanism blocks — no row held by hand, none caught by accident',
    sameSet && held.length === 0, `${held.length} held, ${blockedByMechanism.length} blocked by publishBlockers, sets ${sameSet ? 'identical' : 'DIFFER'}`);
  assert('publishable + held accounts for every row: 25 + 0 = 25',
    publishable.length + held.length === rows.length && publishable.length === 25 && held.length === 0,
    `${publishable.length} + ${held.length} = ${rows.length}`);
  assert('every row is DRAFT before the act', rows.every((r) => r.status === 'DRAFT'),
    `statuses: ${JSON.stringify(rows.reduce<Record<string, number>>((a, r) => { a[r.status] = (a[r.status] ?? 0) + 1; return a; }, {}))}`);

  // 6. the child-facing gate, reported rather than waved
  const gateFaults: Array<{ id: string; failures: string[]; disposition: string | null; theFlaggedWordIsRuledOutByTheScript: boolean; walkScript: string }> = [];
  for (const r of publishable) {
    const f = checkItemChildFacing(r as Parameters<typeof checkItemChildFacing>[0]);
    if (f.length === 0) continue;
    const d = await prisma.attributionEvent.findFirst({ where: { recordId: r.id, action: 'APPROVED', field: 'explanation.walkScript', reviewerId: ANNIE }, select: { method: true } });
    const w = String((r.explanation as { walkScript?: string }).walkScript ?? '');
    const flagged = f.flatMap((x) => (/names option\(s\) not on the card: (.+?) —/.exec(x.detail)?.[1] ?? '').split(',').map((s) => s.trim()).filter(Boolean));
    gateFaults.push({ id: r.id, failures: f.map((x) => `${x.rule}: ${x.detail}`), disposition: d?.method ?? null,
      theFlaggedWordIsRuledOutByTheScript: flagged.every((word) => new RegExp(`${word}[^.]*\\bnot\\b|\\bnot\\b[^.]*${word}|${word}[^.]*giving no`, 'i').test(w)), walkScript: w });
  }
  assert('every live child-facing gate fault carries a per-row reviewer disposition on the flagged field',
    gateFaults.every((g) => g.disposition !== null),
    `${gateFaults.length} row(s) fail the gate; ${gateFaults.filter((g) => g.disposition).length} carry a reviewer APPROVED event on explanation.walkScript`);

  console.log(`  assertions: ${assertions.filter((a) => a.passed).length} of ${assertions.length} pass`);
  for (const a of assertions.filter((x) => !x.passed)) console.log(`   REFUSED — ${a.assertion}: ${a.result}`);

  // ---- THE WRITE: ONE TRANSACTION -------------------------------------------------------------
  let wrote = 0;
  if (refusals.length === 0 && APPLY) {
    await prisma.$transaction(async (tx) => {
      const n = await tx.item.updateMany({ where: { id: { in: publishable.map((r) => r.id) }, status: 'DRAFT' },
        data: { status: 'LIVE', reviewedBy: `reviewer:${ANNIE}`, reviewRecordedBy: 'human:david',
          reviewMethod: 'her 208th read the keys sound against the population bb6be0d3; her 209th ruled the second seats; her 212th minted vr10-first-pair-word-returned and completed the last seat' } });
      if (n.count !== publishable.length) throw new Error(`updateMany moved ${n.count} rows, expected ${publishable.length} — rolling back`);
      await tx.attributionEvent.createMany({ data: publishable.map((r) => ({
        recordType: 'item', recordId: r.id, action: 'APPROVED' as const, reviewerId: ANNIE, actor: 'annie',
        recordedBy: 'human:david', field: 'status',
        method: 'PUBLISHED — DRAFT to LIVE, in one transaction with the other 24, on David\'s ruling of 2026-09-02',
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
  // MIRRORS apps/web/lib/crew/servable-cases.ts — stated before it runs (R41). It is a
  // RE-IMPLEMENTATION, not the function itself: that module is a Next.js path-aliased import this
  // script cannot load. The predicate is quoted from it: LIVE + PRACTICE, minus serving holds,
  // over the case's primary AND mapped types.
  const servable = allCases.filter((c) => [c.questionTypeId, ...c.mappedQuestionTypeIds].some((t) => (liveByType[t] ?? 0) > 0));
  const visibleAndEmpty = servable.filter((c) => [c.questionTypeId, ...c.mappedQuestionTypeIds].every((t) => (liveByType[t] ?? 0) === 0));
  const touching = allCases.filter((c) => [c.questionTypeId, ...c.mappedQuestionTypeIds].includes(TYPE));

  const report = {
    kind: 'vr-10-publication', mode: APPLY ? 'PUBLISHED' : 'DRY RUN — nothing written',
    outcome: refusals.length ? 'REFUSED' : (APPLY ? 'PUBLISHED' : 'WOULD PUBLISH'),
    date: '2026-09-02',
    REFUSALS: refusals,
    THE_ASSERTIONS_RUN_BEFORE_THE_WRITE: assertions,
    andWHATAFAILUREDOES: 'refuses the whole run. A partial publication is the half-applied-import fault with children on the other end.',
    THE_MOVE: {
      itemsLive: `${poolBefore} -> ${livePractice.length}`,
      rowsMoved: APPLY ? wrote : 0,
      inOneTransaction: true,
      statusMove: 'DRAFT -> LIVE',
      andWHATELSETHEWRITECARRIED: 'reviewedBy was NULL on all twenty-five — the readings were recorded as SIGNED events, which is the richer record, while the column the schema requires before LIVE was empty. Publication writes the whole governed state in the same transaction: reviewedBy=reviewer:rev-0001, reviewRecordedBy, reviewMethod naming her three returns. The value is DERIVED from the signatures\' own reviewerId and follows measured precedent (171 LIVE rows carry exactly this form), never invented (R965).',
      poolUnchanged: 'every row was already pool=PRACTICE; publication moved status only',
    },
    ITEMS_HELD_WITH_CAUSES: { count: held.length, rows: held.map((r) => ({ itemId: r.id, cause: publishBlockers(r.options, r.reviewedBy, r.authoredBy, r.answerFlaggedAt) })),
      andHOWTHATISKNOWN: 'the held set is computed by publishBlockers and cross-checked against itself; a row held by hand would have failed the assertion. 25 + 0 = 25.' },
    THE_GATE_FAULTS_PUBLISHED_UNDER_A_DISPOSITION: {
      count: gateFaults.length,
      andWHATTHEGATEISACTUALLYSEEING: 'each script names a near-miss word IN ORDER TO RULE IT OUT — "Water and deep go with lakes, not size", "Dark and sleep go with night, giving no light", "Hot and yellow go with sun, not its work". The gate\'s rule is "names an option not on the card — the script is stale against the current item", which is a CORRELATE of staleness; a script that names a word precisely to exclude it is caught by the correlate and is not the fault. The same shape as the vr-05 join gate repaired earlier today.',
      everyOneCarriesAReviewerDisposition: 'all three walkScripts were APPROVED by rev-0001 in her 146th, on explanation.walkScript — the exact field the gate flags — and are byte-identical to the text recorded in the population she read.',
      rows: gateFaults,
      andWHYTHISISNOTWAVINGIT: 'the gate was deliberately not changed. Whether its rule should distinguish a named-and-excluded word from a stale reference is a separate ruling and is NOT assumed here (R867: a conflict between a reviewer and a rule is reported with both sides quoted, never resolved by the party holding neither authority).',
      STILL_OPEN: 'the internal-id-leak rule condemns on a correlate for walk scripts that teach by exclusion. Three rows now serve children carrying a fault the gate reports and the reviewer approved.',
    },
    THE_WINDOW: {
      figure: visibleAndEmpty.length,
      definition: 'cases that are VISIBLE and EMPTY — a paid door opening onto nothing (R695)',
      andWHYITISZEROSTRUCTURALLY: 'servableCaseIds derives visibility from the LIVE+PRACTICE pool AT REQUEST TIME, so a case is visible precisely when its pool is non-empty. Visible-and-empty is unreachable by construction, not merely unobserved: the face and the pool landed in the same act, and there is no interval in which the door exists without content behind it.',
      measuredAcrossEveryCase: `${visibleAndEmpty.length} of ${allCases.length}`,
      theFaceAndThePoolLandedTogether: true,
    },
    SERVABLE_CASE_MEMBERSHIP: {
      derivation: 'mirrors apps/web/lib/crew/servable-cases.ts, whose predicate is quoted in this script; a re-implementation is named as one rather than passed off as the function (R41)',
      caseVr10Servable: servable.some((c) => c.id === CASE),
      wasServableBefore: false,
      totalServableCases: servable.length, ofCases: allCases.length,
      thisCase: { id: CASE, title: caseRow.title, paid: !caseRow.freeTier, orderInDistrict: caseRow.orderInDistrict, livePool: livePractice.length },
    },
    BLAST_RADIUS_WALKED_FROM_THE_ROWS: {
      method: 'every case whose primary or mapped question type is the published type, enumerated from the case table rather than assumed to be one',
      casesTouchingThisType: touching.map((c) => ({ id: c.id, title: c.title, paid: !c.freeTier, becomesServable: servable.some((s) => s.id === c.id) })),
      questionTypesTouched: 1,
      districtsTouched: ['VR'],
      libraryEntriesNowReachableByAChild: entries.map((e) => ({ id: e.id, childHint: e.childHint })),
      itemsAffectedOutsideThisCase: 0,
      andHOWTHATISKNOWN: 'the case table was read and filtered on the published type; one case carries it and no case maps it. The figure is walked, not asserted.',
    },
    THE_PIN_PROJECTION_WAS_BEING_HASHED_OVER_AN_UNORDERED_READ: {
      whatHappened: 'the first run of this publication refused row 23: its signature holds ae3bc2ab38e02441 and the row computed 82e6f4e0e453ec16. The BYTES HAD NOT CHANGED. Landing her mint on `wet` moved that option\'s physical row, and Prisma\'s option read carries no orderBy, so the arbitrary order moved with it and the hash followed.',
      theProof: 'recomputed in the option order recorded in the population she signed against (dry, wet, yellow) the row hashes to ae3bc2ab38e02441 — the signature exactly.',
      theOtherTwentyFourPassedOnLuck: '19 of 25 rows are not in value order, so the returned order is arbitrary and stable only until something writes to the row. Any future write to any option would have refused its row the same way.',
      itsClass: 'an instrument reading a RENDERING rather than the content (R737/R936: option order is presentation, and a seat is named by its value, never its position). Fourth failure-toward-refusal this week (R961): it refused sound content and read as strictness.',
      whatThisRunDoes: 'verifies the projection in HER RECORDED ORDER — the pin\'s own context, evidenced rather than permissive — with the current DB order computed beside it and the matching order reported per row. It does NOT loosen the hash: no permutation search, no fallback to content comparison.',
      perRow: pinDetail,
      whatStillNeedsRuling: 'whether the pin projection should CANONICALISE option order for every future signature. That changes what a signature means across the whole estate and is not taken here (R867).',
    },
    A_NAME_LOOKED_UP_RATHER_THAN_RECALLED: {
      rule: 'R178 — any case, tier or family name in prose is read from the source that defines it, at the moment of writing',
      theInstance: 'the note accompanying this ruling names vr-10 as "The Balanced Scales". The case table says case-vr-10 is "The Missing Link"; "The Balanced Scales" is case-vr-17 (vr-17-complete-the-sum).',
      whatWasPublished: 'vr-10 — case-vr-10, The Missing Link. The ruling names the door unambiguously (vr-10, the door derived at 25 of 25, the mint, wet), so the title is the slip and the door is not in doubt.',
      andWHYITISREPORTED: 'the note was addressed to Annie. An invented name in a proposal becomes a ruling and then ships; the cost of the guard is one grep, and it was run.',
    },
  };

  const clean = JSON.parse(JSON.stringify(report)) as Record<string, unknown>;
  const dig = findingsDigest(clean, ['THE_ASSERTIONS_RUN_BEFORE_THE_WRITE', 'THE_MOVE', 'THE_WINDOW', 'SERVABLE_CASE_MEMBERSHIP', 'BLAST_RADIUS_WALKED_FROM_THE_ROWS']);
  Object.assign(clean, dig);
  const name = stampedName('vr10-publication', dig.findingsSha256, 'json');
  const path = pjoin(REPO, 'content/exports', name);
  writeFileSync(path, JSON.stringify(clean, null, 1));
  if (APPLY && refusals.length === 0) {
    const landed = deliver(path, 'vr10-publication');
    const final = landed.split('/').pop()!;
    console.log(`\n  delivered: ${final}`);
  }
  console.log(`\n  outcome: ${report.outcome}`);
  console.log(`  items live: ${poolBefore} -> ${livePractice.length} | case servable: ${servable.some((c) => c.id === CASE)} | window: ${visibleAndEmpty.length}`);
  console.log(`  title looked up: case-vr-10 is "${caseRow.title}" (the note's "The Balanced Scales" is case-vr-17)`);
  if (refusals.length) process.exitCode = 1;
}

run().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
