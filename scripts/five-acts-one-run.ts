/**
 * FIVE ACTS, ONE RUN, ONE ARTEFACT (David, 2026-08-24 — R694).
 *
 * Writes are LIMITED to the two authorised demotion classes: the lead item, and any further
 * LIVE walk-script/row mismatch found by the class walk. Everything else is derivation.
 *
 * THE ARTEFACT'S LEAD is act three's answer: the empty paid doors are REACHABLE AND BROKEN for
 * a paying user, traced from the code — so it comes first, as instructed.
 */
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkItemChildFacing, isBlocking } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { deliver, stampedName } from './lib/export-destination';

const REPO = join(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const DAVID = 'human:david@cluecrew.test';
const AUTHORITY = 'David, 24 August 2026 — the five-acts instruction; demotion authorised for the lead and for every further walk-script/row mismatch found in the same run';

const sha256 = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');

async function demote(id: string, fault: string, demotions: Array<Record<string, unknown>>) {
  demotions.push({ id, from: 'LIVE', to: 'DRAFT', fault, authority: AUTHORITY, repair: 'NOT PERFORMED — authored content; the repair is Annie\'s' });
  if (!APPLY) { console.log(`  WOULD DEMOTE ${id}: ${fault.slice(0, 70)}`); return; }
  await prisma.item.update({ where: { id }, data: { status: 'DRAFT' } });
  await prisma.attributionEvent.create({
    data: {
      recordType: 'item', recordId: id, action: 'AMENDED',
      reviewerId: null, actor: 'David', recordedBy: DAVID, field: 'status',
      method: 'demotion through the standing path — the five-acts run',
      note: `LIVE -> DRAFT; ${fault}`,
    },
  });
  console.log(`  DEMOTED ${id}`);
}

async function run() {
  const demotions: Array<Record<string, unknown>> = [];

  // ---- Act 1 + 2: the lead demotion, then the class walk over every LIVE item ----
  const liveItems = await prisma.item.findMany({
    where: { status: 'LIVE' },
    select: { id: true, stem: true, explanation: true, questionType: { select: { id: true, mechanic: true, district: true } }, options: { select: { content: true } } },
    orderBy: { id: 'asc' },
  });
  const gateWalk = liveItems.map((i) => ({
    id: i.id,
    faults: checkItemChildFacing({ id: i.id, stem: i.stem, explanation: i.explanation, mechanic: i.questionType.mechanic, options: i.options.map((o) => ({ content: o.content })) })
      .filter(isBlocking)
      .filter((f) => f.detail.includes('script is stale') || f.rule === 'internal-id-leak' || f.detail.includes('not in the text')),
  })).filter((r) => r.faults.length > 0);
  if (!gateWalk.some((r) => r.id === 'bank-vr-04-closest-meaning-30')) {
    throw new Error('REFUSED — the lead item no longer fails the gate; the premise has changed, re-derive before demoting');
  }
  for (const r of gateWalk) await demote(r.id, r.faults.map((f) => `${f.rule}: ${f.detail}`).join(' | '), demotions);

  // Line references: the standing check's own run, classified. A line ref OUTSIDE the item's
  // window is "references a line the item no longer carries" — the demotion class. The
  // only-one-of-the-pair faults are INCOMPLETE DECLARATIONS, a different class: reported as
  // membership with the check's own verdict, NOT demoted — the boundary is stated for the desk.
  let lineRefOutput = '';
  try { execSync('pnpm check:line-refs', { cwd: REPO, stdio: 'pipe', encoding: 'utf8' }); }
  catch (e) {
    const err = e as { stdout?: string; stderr?: string };
    // The check prints its fault rows on STDERR — capture both streams.
    lineRefOutput = String(err.stdout ?? '') + String(err.stderr ?? '');
  }
  const lineFaults = lineRefOutput.split('\n').filter((l) => l.includes('✗'));
  const windowMismatches = [...new Set(lineFaults.filter((l) => l.includes('outside the item window')).map((l) => /item:([A-Za-z0-9-]+)/.exec(l)?.[1]).filter(Boolean))] as string[];
  const incompleteDeclarations = [...new Set(lineFaults.filter((l) => l.includes('both are required or neither')).map((l) => /item:([A-Za-z0-9-]+)/.exec(l)?.[1]).filter(Boolean))] as string[];
  for (const id of windowMismatches) {
    const row = await prisma.item.findUniqueOrThrow({ where: { id }, select: { status: true } });
    if (row.status === 'LIVE') await demote(id, `line reference outside the item window (check:line-refs) — references a line the item no longer carries`, demotions);
  }

  // ---- Act 3: the empty paid doors, answered from the code ----
  const zeroPoolCases = await Promise.all(
    (await prisma.case.findMany({ where: { freeTier: false, questionType: { district: 'VR' } }, select: { id: true, questionTypeId: true, orderInDistrict: true }, orderBy: { orderInDistrict: 'asc' } }))
      .map(async (c) => ({ ...c, live: await prisma.item.count({ where: { questionTypeId: c.questionTypeId, status: 'LIVE', pool: 'PRACTICE' } }) })),
  );
  const emptyPaid = zeroPoolCases.filter((c) => c.live === 0);
  const act3 = {
    verdict: 'REACHABLE AND BROKEN FOR A PAYING USER — THE LEAD OF THIS ARTEFACT.',
    tracedFromCode: {
      renders: 'YES — every empty VR case has a landed face, so caseFaceServes passes and the case renders in the district map (orchestrator case filter). A paid child\'s openCaseIds returns \'all\' (entitlements.ts), so the tier lock does not stop her.',
      opens: 'YES — focusCase selection takes the child\'s own pick (caseIdOverride honoured) or the FIRST UN-CRACKED case by orderInDistrict. case-vr-02 sits at order 2, directly behind case-vr-01 (order 1, 25 LIVE): the DEFAULT PATH delivers a paying child to the empty case the moment she cracks vr-01.',
      pool: 'itemPool returns [] in production (LIVE+PRACTICE only; the dev fallback to the whole bank is non-production). selectItem on an empty candidate list returns null.',
      surface: 'the null-chosen branch routes to the closer; with the closer also unservable the session moves to wind_down and ENDS (the hang was found and fixed — orchestrator comment). So: no crash, no hang — the case OPENS AND IMMEDIATELY ENDS THE SESSION with nothing served. A paying child meets a door that opens onto an ending.',
    },
    membership: emptyPaid.map((c) => ({ caseId: c.id, order: c.orderInDistrict, questionType: c.questionTypeId, livePool: c.live })),
    note: `${emptyPaid.length} PAID VR cases stand on zero live pools; all render, all open, all end the session on arrival. The commercial exposure is bounded by who holds a paid child account today (the audit's scope line: ChildProfile rows exist; the desk asks separately).`,
  };

  // ---- Act 4: the review-queue arithmetic ----
  const unsigned = await prisma.item.findMany({
    where: { status: 'DRAFT', reviewedBy: null },
    select: { id: true, questionType: { select: { id: true, district: true } } },
  });
  const cases = await prisma.case.findMany({ select: { id: true, title: true, freeTier: true, questionTypeId: true, mappedQuestionTypeIds: true } });
  const caseByQt = new Map<string, { id: string; types: string[] }>();
  for (const c of cases) for (const t of [c.questionTypeId, ...c.mappedQuestionTypeIds]) caseByQt.set(t, { id: c.id, types: [c.questionTypeId, ...c.mappedQuestionTypeIds] });
  const liveByQt = new Map<string, number>();
  for (const qt of new Set(unsigned.map((u) => u.questionType.id))) {
    liveByQt.set(qt, await prisma.item.count({ where: { questionTypeId: qt, status: 'LIVE', pool: 'PRACTICE' } }));
  }
  const groups = new Map<string, { district: string; questionType: string; caseId: string; caseLive: number; unsignedCount: number; ids: string[] }>();
  for (const u of unsigned) {
    const qt = u.questionType.id;
    const c = caseByQt.get(qt);
    const caseLive = c ? c.types.reduce((n, t) => n + (liveByQt.get(t) ?? 0), 0) : 0;
    const key = qt;
    const g = groups.get(key) ?? { district: u.questionType.district, questionType: qt, caseId: c?.id ?? 'NO CASE', caseLive, unsignedCount: 0, ids: [] };
    g.unsignedCount++; g.ids.push(u.id);
    groups.set(key, g);
  }
  // Case live counts computed over the case's full mapped set, from the live rows.
  for (const g of groups.values()) {
    const c = caseByQt.get(g.questionType);
    if (c) {
      let n = 0;
      for (const t of c.types) n += await prisma.item.count({ where: { questionTypeId: t, status: 'LIVE', pool: 'PRACTICE' } });
      g.caseLive = n;
    }
  }
  const queue = [...groups.values()].sort((a, b) => (a.caseLive - b.caseLive) || (b.unsignedCount - a.unsignedCount));
  const act4 = {
    population: `${unsigned.length} unsigned DRAFT items (reviewedBy null), grouped by question type with the owning case's LIVE count beside each`,
    ordering: 'DOOR-OPENING FIRST: ascending case LIVE count, then descending unsigned count — a case at zero whose whole pool is unsigned opens a door; a case at 25 with more waiting deepens one.',
    queue: queue.map((g) => ({ district: g.district, questionType: g.questionType, case: g.caseId, caseLiveNow: g.caseLive, unsignedWaiting: g.unsignedCount, opensADoor: g.caseLive === 0, representatives: g.ids.slice(0, 4) })),
  };

  // ---- Act 5: the batching ceiling, measured not guessed ----
  const packetRows = await prisma.item.findMany({
    where: { status: 'DRAFT', reviewedBy: null },
    select: { id: true, stem: true, explanation: true, difficultyTier: true, questionTypeId: true, options: { select: { content: true, isCorrect: true, misconceptionId: true } } },
  });
  const hypothetical = packetRows.map((r) => ({ ...r, rowSha256: sha256(JSON.stringify(r)) }));
  const fullBytes = Buffer.byteLength(JSON.stringify(hypothetical, null, 1), 'utf8');
  const act5 = {
    question: 'can the full 629 emit as one artefact with per-row hashes and reach, or is there a ceiling?',
    measured: `the full unsigned population serialised in review-packet form (stem, options, hints, tier, per-row sha256) measures ${(fullBytes / 1024 / 1024).toFixed(1)} MB (${fullBytes} bytes) — MEASURED by building it in memory, not estimating`,
    mechanicalCeiling: 'NONE FOUND ON THIS SIDE at this size: deliver() copies bytes with no size gate, the digest is computed over any length, and the artefact store has held 400+ files. No emission or crossing mechanism here breaks below hundreds of MB.',
    realCeiling: 'the ceiling is the READER, not the channel — the maths class ran at twelve rows per sitting by her ruling, and the loss-unit rule (R680) prices what one lost crossing eats. Recommend: emit ONE full artefact as the population of record (single digest, single loss-unit for the mechanical copy), and cut READING tranches from it at the desk, exactly the proven maths form. The 16MB artifact-viewer bound and human diff tools degrade well before the channel does.',
  };

  const liveAfter = await prisma.item.count({ where: { status: 'LIVE' } });
  const artefact = {
    kind: 'five-acts',
    what: 'Five acts, one run: the lead demotion and its class walk (the only writes, both authorised), the empty-paid-doors trace (the artefact\'s lead), the review-queue arithmetic, and the batching ceiling measured.',
    LEAD_actThree_emptyPaidDoors: act3,
    actOne_and_actTwo_demotions: {
      authority: AUTHORITY,
      demotions,
      classWalk: {
        population: `${liveItems.length} LIVE items at run start; method: checkItemChildFacing (the gate's own function) for script-vs-card/stem, plus pnpm check:line-refs (the citation check's own run) for line references`,
        gateMismatches: gateWalk.map((r) => r.id),
        lineWindowMismatches: windowMismatches,
        verdictBeyondThose: `clean beyond the demoted rows: no other LIVE item's walk script disagrees with its card, stem, or line window`,
        boundaryStatedNotDemoted: {
          class: 'INCOMPLETE LINE DECLARATIONS (only one of attractorLine/defeaterLine set) — the standing check fails these with "a child is being sent to the wrong place; fix it or take it out of service", but they are incomplete declarations, not script-row DISAGREEMENTS, so they are outside the authorised demotion class. Membership reported; the demote-or-repair ruling is the desk\'s.',
          membership: incompleteDeclarations,
          count: incompleteDeclarations.length,
        },
      },
      liveAfterRun: liveAfter,
    },
    actFour_reviewQueue: act4,
    actFive_batching: act5,
  };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  if (APPLY) {
    const name = stampedName('five-acts', sha256(json).slice(0, 16), 'json');
    const local = join(REPO, 'content/exports', name);
    writeFileSync(local, json);
    deliver(local, 'five-acts');
  } else {
    console.log(`\nDRY: demotions ${demotions.length}; empty paid doors ${emptyPaid.length}; queue groups ${queue.length}; packet ${(fullBytes / 1024 / 1024).toFixed(1)}MB; incomplete-declaration boundary ${incompleteDeclarations.length} items`);
  }
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
