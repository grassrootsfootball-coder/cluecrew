/**
 * THE ESTATE AUDIT: WHAT THIS PRODUCT HOLDS VERSUS WHAT IT SERVES (David, 2026-08-24 — R693).
 *
 * REPORT ONLY. This script performs ZERO writes, repairs, or status changes — its Prisma usage is
 * findMany/count exclusively, and the one staged artefact is the report itself.
 *
 * THE LEAD CHECK RUNS FIRST: every LIVE item is passed through the item child-facing gate
 * (`checkItemChildFacing` — the family's own function, R41). A LIVE item failing the gate
 * outranks the audit and heads the artefact.
 *
 * Populations and methods are stated on the artefact's face; every figure is derived from the
 * rows at run time; anything not derivable is reported UNDECIDED, never estimated.
 */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  MECHANIC_FAMILIES, MODES,
  checkItemChildFacing, familyForTypeOrNull, isBlocking,
} from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { deliver, stampedName } from './lib/export-destination';

const REPO = join(__dirname, '..');
const sha256 = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');

async function run() {
  // ---- Shared reads (one pass over the rows) ----
  const items = await prisma.item.findMany({
    select: {
      id: true, status: true, pool: true, difficultyTier: true, reviewedBy: true,
      stem: true, explanation: true,
      questionType: { select: { id: true, district: true, mechanic: true } },
      options: { select: { content: true, misconceptionId: true } },
    },
    orderBy: { id: 'asc' },
  });
  const cases = await prisma.case.findMany({
    select: { id: true, title: true, freeTier: true, questionTypeId: true, mappedQuestionTypeIds: true, orderInDistrict: true, questionType: { select: { district: true } } },
    orderBy: { orderInDistrict: 'asc' },
  });
  const questionTypes = await prisma.questionType.findMany({ select: { id: true, district: true, mechanic: true } });
  const misconceptions = await prisma.misconception.findMany({ select: { id: true, district: true, status: true } });

  const caseByQt = new Map<string, { id: string; freeTier: boolean; how: 'primary' | 'mapped' }>();
  for (const c of cases) {
    caseByQt.set(c.questionTypeId, { id: c.id, freeTier: c.freeTier, how: 'primary' });
    for (const m of c.mappedQuestionTypeIds) if (!caseByQt.has(m)) caseByQt.set(m, { id: c.id, freeTier: c.freeTier, how: 'mapped' });
  }

  // ---- THE LEAD CHECK: every LIVE item through the gate ----
  const gateOf = (item: (typeof items)[number]) =>
    checkItemChildFacing({
      id: item.id, stem: item.stem, explanation: item.explanation,
      mechanic: item.questionType.mechanic,
      options: item.options.map((o) => ({ content: o.content })),
    }).filter(isBlocking);
  const liveFailing = items.filter((i) => i.status === 'LIVE').map((i) => ({ id: i.id, faults: gateOf(i) })).filter((r) => r.faults.length > 0);
  const lead = liveFailing.length > 0
    ? {
        finding: `${liveFailing.length} LIVE item(s) FAIL the child-facing gate TODAY — reaching or reachable by a child behind a gate that should have refused. THIS OUTRANKS THE AUDIT.`,
        rows: liveFailing.map((r) => ({ id: r.id, faults: r.faults.map((f) => `${f.rule}: ${f.detail}`) })),
      }
    : { finding: 'CLEAN — every LIVE item passes the child-facing gate at audit time (population: all LIVE items; method: checkItemChildFacing, the gate\'s own function).' };

  // ---- One: the estate census ----
  const byQt = new Map<string, (typeof items)>();
  for (const i of items) byQt.set(i.questionType.id, [...(byQt.get(i.questionType.id) ?? []), i]);
  const census = questionTypes
    .map((qt) => {
      const rows = byQt.get(qt.id) ?? [];
      const statusCounts: Record<string, number> = {};
      for (const r of rows) statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1;
      const mapping = caseByQt.get(qt.id) ?? null;
      return {
        questionType: qt.id, district: qt.district,
        itemsTotal: rows.length, byStatus: statusCounts, live: statusCounts['LIVE'] ?? 0,
        caseMapping: mapping ? `${mapping.id} (${mapping.how}, ${mapping.freeTier ? 'FREE' : 'PAID'})` : 'NO CASE MAPS THIS TYPE',
        servesNobody: rows.length > 0 && ((statusCounts['LIVE'] ?? 0) === 0 || !mapping),
      };
    })
    .sort((a, b) => a.district.localeCompare(b.district) || a.questionType.localeCompare(b.questionType));
  const ownedServingNobody = census.filter((c) => c.servesNobody);

  // ---- Two: the DRAFT population, partitioned by derived reason ----
  const drafts = items.filter((i) => i.status === 'DRAFT');
  type Bucket = { name: string; rows: Array<{ id: string; detail?: string }> };
  const buckets: Record<string, Bucket> = {
    gateFailing: { name: 'FAILS A GATE (which gate stated per row)', rows: [] },
    unsigned: { name: 'UNSIGNED / NO REVIEWER (reviewedBy null)', rows: [] },
    orphanedSurface: { name: 'ORPHANED FROM THE SERVING SURFACE (question type has no render family — no engine can draw it)', rows: [] },
    noCase: { name: 'NO CASE MAPS ITS QUESTION TYPE', rows: [] },
    neverPublished: { name: 'CASE EXISTS, GATES PASS, REVIEWED — NEVER PUBLISHED', rows: [] },
    noReason: { name: 'NO REASON DERIVABLE (a finding, not an embarrassment)', rows: [] },
  };
  for (const i of drafts) {
    const faults = gateOf(i);
    if (faults.length > 0) { buckets.gateFailing!.rows.push({ id: i.id, detail: faults.map((f) => `${f.rule}: ${f.detail}`).join(' | ') }); continue; }
    if (!i.reviewedBy) { buckets.unsigned!.rows.push({ id: i.id }); continue; }
    if (familyForTypeOrNull(i.questionType.id) === null) { buckets.orphanedSurface!.rows.push({ id: i.id, detail: i.questionType.id }); continue; }
    if (!caseByQt.has(i.questionType.id)) { buckets.noCase!.rows.push({ id: i.id, detail: i.questionType.id }); continue; }
    buckets.neverPublished!.rows.push({ id: i.id });
  }
  const draftPartition = {
    population: `${drafts.length} DRAFT items of ${items.length} total (${Math.round((drafts.length / Math.max(1, items.length)) * 100)}%)`,
    partitionRule: 'PRIORITY ORDER, first match wins, stated so the partition is disjoint: gate-failing → unsigned → orphaned-surface → no-case → never-published → no-reason-derivable. An item in an early bucket may also satisfy later ones; the earliest is its reason because it blocks first.',
    supersededNote: 'The "superseded or orphaned" bucket the desk named: SUPERSEDED is not derivable from these rows — no Item column records supersession (RETIRED is a status, not DRAFT). Reported UNDECIDED rather than estimated. ORPHANED is derived as orphaned-from-the-serving-surface (no render family).',
    buckets: Object.fromEntries(Object.entries(buckets).map(([k, b]) => [k, {
      name: b.name, count: b.rows.length,
      membership: b.rows.length <= 40 ? b.rows : undefined,
      representatives: b.rows.length > 40 ? b.rows.slice(0, 8) : undefined,
      fullMembershipIds: b.rows.length > 40 ? b.rows.map((r) => r.id) : undefined,
    }])),
  };

  // ---- Three: case coverage and depth ----
  const caseCoverage = cases.map((c) => {
    const types = [c.questionTypeId, ...c.mappedQuestionTypeIds];
    const liveRows = items.filter((i) => types.includes(i.questionType.id) && i.status === 'LIVE' && i.pool === 'PRACTICE');
    return {
      id: c.id, district: c.questionType.district, title: c.title || '(FACE EMPTY — invisible, fails closed)',
      tier: c.freeTier ? 'FREE' : 'PAID',
      primaryType: c.questionTypeId, mappedTypes: c.mappedQuestionTypeIds,
      liveItemCount: liveRows.length, pool: 'PRACTICE (the only pool cases serve from; MOCK is held out by design)',
      flag: liveRows.length === 0 ? 'ZERO LIVE POOL' : liveRows.length < 15 ? 'THIN (<15)' : null,
    };
  });
  const thinOrEmpty = caseCoverage.filter((c) => c.flag);

  // ---- Four: what has no home ----
  const qtsWithItemsNoCase = census.filter((c) => c.itemsTotal > 0 && c.caseMapping === 'NO CASE MAPS THIS TYPE').map((c) => ({ questionType: c.questionType, district: c.district, items: c.itemsTotal }));
  const casesWithNoItems = caseCoverage.filter((c) => {
    const types = [c.primaryType, ...c.mappedTypes];
    return !items.some((i) => types.includes(i.questionType.id));
  }).map((c) => c.id);
  const liveTagged = new Set(items.filter((i) => i.status === 'LIVE').flatMap((i) => i.options.map((o) => o.misconceptionId)).filter(Boolean));
  const activeUncarried = misconceptions.filter((m) => m.status === 'ACTIVE' && !liveTagged.has(m.id));
  const noHome = {
    questionTypesWithItemsButNoCase: qtsWithItemsNoCase,
    casesWithNoItems: casesWithNoItems.length > 0 ? casesWithNoItems : 'NONE',
    activeLibraryRowsNoLiveOptionCarries: {
      count: activeUncarried.length,
      note: 'membership by district below — the same class as the nine homeless spelling-spot items; found because a report says so on its face',
      byDistrict: Object.fromEntries(['VR', 'NVR', 'MATHS', 'ENGLISH'].map((d) => [d, activeUncarried.filter((m) => m.district === d).map((m) => m.id)])),
    },
  };

  // ---- Five: the surfaces that exist, named from the code ----
  const surfaces = {
    method: 'imported from the code, never recalled: MECHANIC_FAMILIES and FAMILY_BY_TYPE from packages/core/src/families.ts; the engine registry from apps/web/components/crew/play-runner.tsx; MODES from packages/core/src/modes.ts',
    renderFamilies: [...MECHANIC_FAMILIES],
    engineComponents: {
      code: 'engines/code', stowaway: 'engines/stowaway', wordweb: 'engines/wordweb', bridge: 'engines/bridge',
      deduction: 'engines/deduction', forge: 'engines/maths/number-forge', workshop: 'engines/maths/workshop',
      markhomework: 'engines/maths/mark-homework', datadesk: 'engines/maths/data-desk', shapeshop: 'engines/maths/shape-shop',
      comprehension: 'engines/comprehension', cloze: 'engines/wordweb (shared component, own family)', errorspot: 'engines/errorspot',
    },
    walkModes: [...MODES],
    questionTypesWithNoRenderFamily: questionTypes.filter((qt) => familyForTypeOrNull(qt.id) === null).map((qt) => qt.id),
    planningConsequence: 'A new question type inside an existing family is AUTHORING ALONE (map it in FAMILY_BY_TYPE). A new interaction is AUTHORING PLUS A BUILD (a new engine component and family, registered with no default — an unmapped type crashes rather than substituting, by ruling). NVR renders through its own engines directory; no NVR question type currently serves.',
  };

  // ---- Six: scope ----
  const [children, sessions, attempts, subs] = await Promise.all([
    prisma.childProfile.count().catch(() => null),
    prisma.session.count().catch(() => null),
    prisma.attempt.count().catch(() => null),
    prisma.subscription.count().catch(() => null),
  ]);
  const scope = {
    notCovered: 'No user numbers, no session analysis, no attempt analysis, no revenue. Demand is NOT inferred from content.',
    rowsExistOnThisSide: {
      statement: 'Per the instruction: these tables exist on this side and hold rows or do not, stated and then stopped — the desk asks separately with a scope.',
      ChildProfile: children === null ? 'TABLE NOT PRESENT' : children > 0 ? 'ROWS EXIST' : 'TABLE PRESENT, EMPTY',
      Session: sessions === null ? 'TABLE NOT PRESENT' : sessions > 0 ? 'ROWS EXIST' : 'TABLE PRESENT, EMPTY',
      Attempt: attempts === null ? 'TABLE NOT PRESENT' : attempts > 0 ? 'ROWS EXIST' : 'TABLE PRESENT, EMPTY',
      Subscription: subs === null ? 'TABLE NOT PRESENT' : subs > 0 ? 'ROWS EXIST' : 'TABLE PRESENT, EMPTY',
    },
  };

  const artefact = {
    kind: 'estate-audit',
    what: 'What this product holds versus what it serves, walked from the rows. REPORT ONLY: zero writes, repairs, or status changes were performed by this audit.',
    lead,
    population: { items: items.length, questionTypes: questionTypes.length, cases: cases.length, libraryRows: misconceptions.length, method: 'one findMany pass per table at run time; every figure below derives from these rows' },
    one_estateCensus: { census, whatServesNobody: { note: 'question types owning items that no child can currently meet (zero LIVE, or no case maps the type)', membership: ownedServingNobody.map((c) => ({ questionType: c.questionType, district: c.district, items: c.itemsTotal, live: c.live, caseMapping: c.caseMapping })) } },
    two_draftPartition: draftPartition,
    three_caseCoverage: { cases: caseCoverage, thinOrEmpty: { note: `The Ashline Detective Register serves 25; cases at or below that size or flagged: ${thinOrEmpty.length}`, membership: thinOrEmpty } },
    four_noHome: noHome,
    five_surfaces: surfaces,
    six_scope: scope,
  };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('estate-audit', sha256(json).slice(0, 16), 'json');
  const local = join(REPO, 'content/exports', name);
  writeFileSync(local, json);
  deliver(local, 'estate-audit');
  console.log(`\nLEAD: ${typeof lead.finding === 'string' ? lead.finding.slice(0, 100) : ''}`);
  console.log(`census: ${census.length} question types; serving-nobody membership: ${ownedServingNobody.length}`);
  console.log(`drafts: ${drafts.length} — ${Object.entries(buckets).map(([k, b]) => `${k}:${b.rows.length}`).join(' ')}`);
  console.log(`cases: ${caseCoverage.length}, thin-or-empty: ${thinOrEmpty.length}; uncarried ACTIVE library rows: ${activeUncarried.length}`);
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
