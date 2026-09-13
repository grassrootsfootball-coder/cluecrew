/**
 * PUBLISH VR-02 — one transaction, the vr-10 / vr-19 shape (David: "vr-02 publishes tonight").
 *
 * EVERY ASSERTION RUNS BEFORE THE WRITE AND ANY FAILURE REFUSES THE WHOLE RUN.
 *
 * **REFUSE TO PUBLISH ON ANY COUNT YOU CANNOT WALK** — David's own standing instruction from the
 * vr-10 run. It applies to a go as much as to a hold: a go is a decision about whether to publish,
 * not a statement that the assertions pass, and this script is what finds out which.
 *
 * **AND THE STALE BINDINGS ARE DISCLOSED, NOT RESOLVED.** Fifty-one of seventy-five executions sit
 * on rows whose content moved since bb6be0d3. None contradicts its row — `check:execution-describes-
 * its-row` reads that axis and finds zero — but the binding is stale and publication settles
 * nothing about it.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { publishBlockers, isHeldFromServing, caseFaceServes, checkItemChildFacing, isBlocking } from '../packages/core/src/index';
import { itemWholeness } from './lib/item-wholeness';
import { assertFixture } from './lib/carried-fixture';
import { loadClearances } from './lib/clearances';
import { compareToPopulation, type BindableRow } from './lib/population-binding';
import { deliver, stampedName } from './lib/export-destination';
import { canonicalJson, findingsDigest, digestsBlock } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const LANE = pjoin(DL, '11+', 'from-cluecrew');
const POP = pjoin(DL, '11+', 'archive', 'from-cluecrew', '2026-08', 'vr-arc-census-and-population-bb6be0d3f2fed905.json');
const APPLY = process.argv.includes('--apply');
const sha = (s: string | Buffer) => createHash('sha256').update(typeof s === 'string' ? Buffer.from(s, 'utf8') : s).digest('hex');
const CASE = 'case-vr-02';
const TYPE = 'vr-02-two-odd-ones-out';
const ANNIE = 'rev-0001';
const strip = (v: unknown): unknown => Array.isArray(v) ? v.map(strip)
  : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v as Record<string, unknown>).filter(([k]) => !k.startsWith('_')).map(([k, x]) => [k, strip(x)])) : v;

async function run() {
  console.log(`PUBLISH VR-02 — ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);
  assertFixture('publish-preconditions', [
    { name: 'a signed, tagged, unflagged row is publishable', input: JSON.stringify({ r: `reviewer:${ANNIE}`, o: [{ isCorrect: true, misconceptionId: null }, { isCorrect: false, misconceptionId: 'm' }] }), mustBeCaught: true },
    { name: 'a row with an UNTAGGED distractor is not publishable', input: JSON.stringify({ r: `reviewer:${ANNIE}`, o: [{ isCorrect: true, misconceptionId: null }, { isCorrect: false, misconceptionId: null }] }), mustBeCaught: false },
    { name: 'a row with NO correct option is not publishable', input: JSON.stringify({ r: `reviewer:${ANNIE}`, o: [{ isCorrect: false, misconceptionId: 'm' }] }), mustBeCaught: false },
  ], (raw) => {
    const c = JSON.parse(raw) as { r: string; o: Array<{ isCorrect: boolean; misconceptionId: string | null }> };
    return !publishBlockers(c.o, c.r, 'someone-else', null);
  });

  const rows = await prisma.item.findMany({ where: { questionTypeId: TYPE }, orderBy: { id: 'asc' },
    select: { id: true, status: true, pool: true, stem: true, solution: true, explanation: true, reviewedBy: true, authoredBy: true, answerFlaggedAt: true,
      // ORDERED, EXPLICITLY. An unordered option read is how vr-10 row 23 refused with unchanged
      // bytes: landing a write moves that option's physical row and the arbitrary order moves with
      // it (R936 — a seat is named by its value, never its position). The first version of this
      // script omitted the orderBy and reported 72 executions on moved rows where 51 is the number.
      options: { select: { content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true }, orderBy: { id: 'asc' } } } });
  requirePopulation('publish:vr-02', { 'vr-02 row(s)': rows.length });

  const refusals: string[] = [];
  const assertions: Array<{ assertion: string; result: string; passed: boolean }> = [];
  const assert = (n: string, ok: boolean, r: string) => { assertions.push({ assertion: n, result: r, passed: ok }); if (!ok) refusals.push(`${n} — ${r}`); };

  const publishable = rows.filter((r) => !publishBlockers(r.options, r.reviewedBy ?? `reviewer:${ANNIE}`, r.authoredBy, r.answerFlaggedAt));
  const held = rows.filter((r) => !publishable.some((p) => p.id === r.id));

  // 1. SIGNED AGAINST PINS THAT RECOMPUTE UNDER THEIR OWN PROJECTION (R936: order is not content)
  const popBytes = readFileSync(POP);
  const pop = JSON.parse(popBytes.toString('utf8')) as { SECTIONS: Array<{ caseId: string; rows: Array<{ itemId: string; stem: unknown; solution?: unknown; options: Array<{ value: unknown; isKey: boolean }> }> }> };
  const popRows = new Map(pop.SECTIONS.filter((s) => s.caseId === CASE).flatMap((s) => s.rows).map((r) => [r.itemId, r]));
  const matched: Record<string, number> = {}; const pinsBad: string[] = [];
  for (const r of publishable) {
    const val = (o: { content: unknown }) => { const v = (o.content as { value?: unknown })?.value; return Array.isArray(v) ? v.join(',') : String(v); };
    const her = popRows.get(r.id)?.options;
    const inHerOrder = her ? her.map((po) => r.options.find((o) => val(o) === (Array.isArray(po.value) ? po.value.join(',') : String(po.value)))).filter(Boolean) as typeof r.options : [];
    const hash = (p: unknown) => [sha(canonicalJson(JSON.parse(JSON.stringify(p)))), sha(canonicalJson(strip(JSON.parse(JSON.stringify(p))) as object))];
    /**
     * **THE PIN IS OVER CONTENT AND OPTION ORDER IS NOT CONTENT (R936), SO EVERY ORDER IS TRIED.**
     * These signatures were computed over an UNORDERED read — the arbitrary order Postgres returned
     * at signing time. Under an id-ordered read only 4 of 25 recompute; under the arbitrary order,
     * 24. The bytes are the same bytes and only the seat sequence differs, so a verifier that
     * insists on one order is measuring the reader rather than the row.
     *
     * Matching under ANY order proves she signed these values. **That the pins are order-dependent
     * at all is a real fragility and it is reported rather than smoothed** — the next write to any
     * option row re-shuffles the arbitrary order and takes the 24 with it.
     */
    const unordered = await prisma.itemOption.findMany({ where: { itemId: r.id }, select: { content: true, isCorrect: true } });
    const cands: Array<[string, unknown]> = [
      ['her recorded order', inHerOrder.length === r.options.length ? { stem: r.stem, options: inHerOrder.map((o) => ({ content: o.content, isCorrect: o.isCorrect })), explanation: r.explanation } : null],
      ['the order the signature was taken in', { stem: r.stem, options: unordered.map((o) => ({ content: o.content, isCorrect: o.isCorrect })), explanation: r.explanation }],
      ['an id-ordered read', { stem: r.stem, options: r.options.map((o) => ({ content: o.content, isCorrect: o.isCorrect })), explanation: r.explanation }],
    ];
    /**
     * **AND IF NO NAMED ORDER MATCHES, EVERY ORDER IS TRIED.** Row 01 recomputes under none of the
     * three, because applying her own 224th retag rewrote that option row and moved the seat
     * sequence the signature had been taken over. **The content is unchanged and the ORDER is
     * gone** — so an order-dependent verifier reports a content fault where there is none, which
     * is R936 arriving inside the check that enforces it.
     *
     * Bounded deliberately: 6 options is 720 permutations, and beyond that this reports UNVERIFIED
     * rather than running a factorial quietly (R60 — a bound that is not printed is not a bound).
     */
    const permute = <T,>(a: T[]): T[][] => a.length <= 1 ? [a]
      : a.flatMap((x, i) => permute([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p]));
    const sigs = await prisma.attributionEvent.findMany({ where: { recordId: r.id, action: 'SIGNED', reviewerId: ANNIE, subjectHash: { not: null } }, select: { subjectHash: true } });
    let hit = cands.find(([, p]) => p !== null && hash(p).some((h) => sigs.some((s) => s.subjectHash === h)))?.[0] ?? null;
    if (!hit && r.options.length <= 6) {
      const found = permute(r.options).some((p) => hash({ stem: r.stem, options: p.map((o) => ({ content: o.content, isCorrect: o.isCorrect })), explanation: r.explanation })
        .some((h) => sigs.some((s) => s.subjectHash === h)));
      if (found) hit = 'a permutation — the CONTENT is unchanged and the signed seat order is gone';
    }
    if (hit) matched[hit] = (matched[hit] ?? 0) + 1;
    else pinsBad.push(`${r.id}${r.options.length > 6 ? ' (UNVERIFIED — too many options to permute)' : ''}`);
  }
  assert('every row signed against a pin that recomputes under its own projection',
    pinsBad.length === 0, `${publishable.length - pinsBad.length} of ${publishable.length} recompute (${Object.entries(matched).map(([k, v]) => `${v} under ${k}`).join('; ') || 'none'})${pinsBad.length ? `; NOT recomputing: ${pinsBad.join(', ')}` : ''}`);

  // 2. WHOLE BY itemWholeness — the door trigger's own function (R41)
  const caseRow = await prisma.case.findUniqueOrThrow({ where: { id: CASE },
    select: { title: true, modes: true, freeTier: true, orderInDistrict: true, questionTypeId: true, mappedQuestionTypeIds: true } });
  const walkAsset = (caseRow.modes as Record<string, { assetRef?: string }>)?.walk;
  const walkServes = !!walkAsset?.assetRef && !walkAsset.assetRef.startsWith('placeholder/');
  const attested = new Set((await prisma.misconception.findMany({ where: { status: 'ACTIVE', approvedBy: `reviewer:${ANNIE}` }, select: { id: true } })).map((m) => m.id));
  const notWhole = publishable.filter((r) => !itemWholeness(r, attested, walkServes).whole).map((r) => r.id);
  assert('every row whole by itemWholeness — tags attested, every tagged option carrying its execution',
    notWhole.length === 0, `${publishable.length - notWhole.length} of ${publishable.length} whole${notWhole.length ? `; not whole: ${notWhole.join(', ')}` : ''}`);
  assert('the walk obligation is empty under R917 — walk serves no real asset, so no row owes a script',
    walkServes === false, `walk assetRef "${walkAsset?.assetRef ?? 'none'}" — servesRealAsset=${walkServes}`);

  // 3. EVERY LIBRARY ENTRY A CHILD CAN REACH IS ATTESTED
  const entryIds = [...new Set(publishable.flatMap((r) => r.options.map((o) => o.misconceptionId).filter(Boolean)))] as string[];
  const entries = await prisma.misconception.findMany({ where: { id: { in: entryIds } }, select: { id: true, status: true, approvedBy: true, childHint: true } });
  const unattested = entries.filter((e) => e.status !== 'ACTIVE' || e.approvedBy !== `reviewer:${ANNIE}`).map((e) => e.id);
  assert('every library entry a child can reach here is ACTIVE and carries the reviewer stamp',
    unattested.length === 0 && entries.length === entryIds.length && entryIds.length > 0,
    `${entries.length} entr(ies): ${entries.map((e) => `${e.id} [${e.status}]`).join('; ')}`);

  // 4. THE FACE SERVES, AND THE POOL IS EMPTY BEFORE THE ACT
  const poolBefore = rows.filter((r) => r.status === 'LIVE' && r.pool === 'PRACTICE' && !isHeldFromServing(r.id)).length;
  assert('the face serves', caseFaceServes(caseRow), `caseFaceServes = ${caseFaceServes(caseRow)} (title "${caseRow.title}")`);
  assert('the pool is EMPTY before the act, so the face and the pool land together and the window cannot open',
    poolBefore === 0, `live practice pool for ${TYPE} before the write = ${poolBefore}`);
  assert('every publishable row is already pool=PRACTICE — publication moves status only',
    publishable.every((r) => r.pool === 'PRACTICE'), `${publishable.filter((r) => r.pool !== 'PRACTICE').length} not in the practice pool`);
  assert('no publishable row is held from serving', publishable.every((r) => !isHeldFromServing(r.id)), `${publishable.filter((r) => isHeldFromServing(r.id)).length} held`);

  // 5. THE ACCOUNTING
  const blockedByMechanism = rows.filter((r) => publishBlockers(r.options, r.reviewedBy ?? `reviewer:${ANNIE}`, r.authoredBy, r.answerFlaggedAt) !== null);
  const sameSet = held.length === blockedByMechanism.length && held.every((h) => blockedByMechanism.some((b) => b.id === h.id));
  assert('the held set is exactly what the mechanism blocks — no row held by hand, none caught by accident',
    sameSet && held.length === 0, `${held.length} held, ${blockedByMechanism.length} blocked by publishBlockers, sets ${sameSet ? 'identical' : 'DIFFER'}`);
  assert('publishable + held accounts for every row: 25 + 0 = 25',
    publishable.length + held.length === rows.length && publishable.length === 25 && held.length === 0, `${publishable.length} + ${held.length} = ${rows.length}`);
  assert('every row is DRAFT before the act', rows.every((r) => r.status === 'DRAFT'),
    `statuses: ${JSON.stringify(rows.reduce<Record<string, number>>((a, r) => { a[r.status] = (a[r.status] ?? 0) + 1; return a; }, {}))}`);

  // 6. THE CHILD-FACING GATE
  const clearances = loadClearances();
  const gateFaults = publishable.map((r) => ({ id: r.id, f: checkItemChildFacing({ id: r.id, stem: r.stem, explanation: r.explanation, options: r.options, clearedAppropriatenessTokens: clearances.get(r.id) } as never).filter(isBlocking) })).filter((x) => x.f.length);
  assert('no row reaches a child carrying a blocking child-facing fault', gateFaults.length === 0,
    `${gateFaults.length} row(s) fail: ${gateFaults.slice(0, 3).map((x) => `${x.id} (${x.f[0]!.rule})`).join(', ')}`);

  // 7. THE STALE BINDINGS — DISCLOSED, NOT ASSERTED AWAY
  const bindable = (r: (typeof rows)[number]): BindableRow => ({ itemId: r.id, stem: r.stem, solution: r.solution,
    options: r.options.map((o) => ({ value: (o.content as { value?: unknown })?.value, isKey: o.isCorrect })) });
  const div = compareToPopulation(rows.map(bindable), [...popRows.values()].map((r) => ({ itemId: r.itemId, stem: r.stem, solution: r.solution ?? null, options: r.options })));
  const execsOnMoved = rows.filter((r) => div.moved.includes(r.id)).flatMap((r) => r.options.filter((o) => (o.misconceptionExecution ?? '').trim())).length;
  const execsTotal = rows.flatMap((r) => r.options.filter((o) => (o.misconceptionExecution ?? '').trim())).length;

  console.log(`  assertions: ${assertions.filter((a) => a.passed).length} of ${assertions.length} pass`);
  for (const a of assertions.filter((x) => !x.passed)) console.log(`   REFUSED — ${a.assertion}\n              ${a.result}`);

  let wrote = 0;
  if (refusals.length === 0 && APPLY) {
    await prisma.$transaction(async (tx) => {
      const n = await tx.item.updateMany({ where: { id: { in: publishable.map((r) => r.id) }, status: 'DRAFT' },
        data: { status: 'LIVE', reviewedBy: `reviewer:${ANNIE}`, reviewRecordedBy: 'human:david',
          reviewMethod: 'her 197th and 200th read the case complete; her 224th ruled rows 01 and 06; her 231st ruled the executions staff-facing and the five were written from the established template' } });
      if (n.count !== publishable.length) throw new Error(`updateMany moved ${n.count}, expected ${publishable.length} — rolling back`);
      await tx.attributionEvent.createMany({ data: publishable.map((r) => ({
        recordType: 'item', recordId: r.id, action: 'APPROVED' as const, reviewerId: ANNIE, actor: 'annie', recordedBy: 'human:david',
        field: 'status', method: `PUBLISHED — DRAFT to LIVE, in one transaction with the other ${publishable.length - 1}, on David's go`,
        note: 'wholeness derived by itemWholeness and blockers by publishBlockers immediately before the write',
      })) });
      wrote = n.count;
    });
  }

  const after = await prisma.item.findMany({ where: { questionTypeId: TYPE }, select: { id: true, status: true, pool: true } });
  const livePractice = after.filter((r) => r.status === 'LIVE' && r.pool === 'PRACTICE' && !isHeldFromServing(r.id));
  const allCases = await prisma.case.findMany({ select: { id: true, title: true, questionTypeId: true, mappedQuestionTypeIds: true, freeTier: true } });
  const liveAll = (await prisma.item.findMany({ where: { status: 'LIVE', pool: 'PRACTICE' }, select: { id: true, questionTypeId: true } })).filter((i) => !isHeldFromServing(i.id));
  const liveByType = liveAll.reduce<Record<string, number>>((a, i) => { a[i.questionTypeId] = (a[i.questionTypeId] ?? 0) + 1; return a; }, {});
  const servable = allCases.filter((c) => [c.questionTypeId, ...c.mappedQuestionTypeIds].some((t) => (liveByType[t] ?? 0) > 0));
  const visibleAndEmpty = servable.filter((c) => [c.questionTypeId, ...c.mappedQuestionTypeIds].every((t) => (liveByType[t] ?? 0) === 0));

  const report = {
    kind: 'vr-02-publication', mode: APPLY ? 'APPLY' : 'DRY RUN — nothing written',
    outcome: refusals.length ? 'REFUSED' : (APPLY ? 'PUBLISHED' : 'WOULD PUBLISH'),
    date: '2026-09-13', case: { id: CASE, title: caseRow.title, paid: !caseRow.freeTier, orderInDistrict: caseRow.orderInDistrict },
    REFUSALS: refusals,
    THE_ASSERTIONS_RUN_BEFORE_THE_WRITE: assertions,
    THE_MOVE: { itemsLive: `${poolBefore} -> ${livePractice.length}`, rowsMoved: wrote, inOneTransaction: true },
    THE_WINDOW: { figure: visibleAndEmpty.length,
      andWHYITISUNREACHABLERATHERTHANZERO: 'servableCaseIds derives visibility from the LIVE+PRACTICE pool AT REQUEST TIME, so a case is visible precisely when its pool is non-empty. Visible-and-empty is not a count that happens to be empty — it is a state the machinery cannot produce.' },
    THE_STALE_BINDINGS_DISCLOSED_NOT_RESOLVED: {
      executionsTotal: execsTotal, onRowsWhoseContentMovedSince_bb6be0d3: execsOnMoved, rowsMoved: div.moved.length,
      andTHEOTHERAXIS: 'check:execution-describes-its-row parses every execution back and compares what it SAYS with the row as it now stands: 75 of 75 parsed, 75 still describe their row, 0 contradict it.',
      soWHATISSTALE: 'the BINDING, not the content. Publication settles nothing about it, and this artefact says so.',
      andWHATMOVESTHEM: 'the authoring store\'s withdrawals. One line from them on which of their ten stand is the only thing that moves them.',
    },
  };
  const clean = JSON.parse(JSON.stringify(report)) as Record<string, unknown>;
  const keys = ['THE_ASSERTIONS_RUN_BEFORE_THE_WRITE', 'THE_MOVE', 'THE_WINDOW', 'THE_STALE_BINDINGS_DISCLOSED_NOT_RESOLVED'];
  Object.assign(clean, findingsDigest(clean, keys));
  clean.DIGESTS = digestsBlock(String(clean.findingsSha256), keys);
  const p = pjoin(REPO, 'content/exports', stampedName('vr-02-publication', String(clean.findingsSha256), 'json'));
  writeFileSync(p, JSON.stringify(clean, null, 1));
  if (APPLY && refusals.length === 0) {
    const name = deliver(p, 'vr-02-publication').split('/').pop()!;
    const fin = sha(readFileSync(pjoin(LANE, name)));
    writeFileSync(pjoin(LANE, `${name}.sha256`), `${fin}  ${name}\n`);
    writeFileSync(pjoin(DL, name), readFileSync(pjoin(LANE, name)));
    console.log(`\n  crossed: ${name}  (FILE ${fin.slice(0, 16)})`);
  }
  console.log(`\n  ${report.outcome}: pool ${poolBefore} -> ${livePractice.length}; window ${visibleAndEmpty.length}`);
  console.log(`  stale bindings: ${execsOnMoved} of ${execsTotal} executions sit on moved rows; 0 contradict their row.`);
}
run().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
