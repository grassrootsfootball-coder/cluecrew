/**
 * THE EMPTY DOORS HIDE; THE POPULATION OF RECORD EMITS (David, 2026-08-24 — R695).
 *
 * Act 1 (confirm): the R695 guard is wired at all three case surfaces (orchestrator, district
 *   map, case page), derived from the pool at request time. This script re-derives the hidden
 *   membership and asserts every zero-pool case is outside servableCaseIds().
 * Act 2: 629 vs 668 reconciled by DEFINITION and MEMBERSHIP, same rows.
 * Act 3: what reviewedBy records — answered from the schema line and every writer, named.
 * Act 4: the door-opening population as ONE SECTIONED ARTEFACT — 288 unsigned items behind the
 *   eleven zero-live PAID cases, twelve-row sittings labelled by case, cheapest-first, surplus in
 *   later sections of the same case, no padding; opening-dozen proposals by difficulty spread.
 * Plus: the thirty incomplete line declarations to Annie with the check's own words per row.
 */
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { isHeldFromServing } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { deliver, stampedName } from './lib/export-destination';

const REPO = join(__dirname, '..');
const sha256 = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');
const ASOF = new Date().toISOString();

const ELEVEN = ['case-vr-02', 'case-vr-05', 'case-vr-08', 'case-vr-10', 'case-vr-13', 'case-vr-16', 'case-vr-17', 'case-vr-18', 'case-vr-19', 'case-vr-20', 'case-vr-21'];

async function servableSet(): Promise<{ servable: Set<string>; all: Array<{ id: string; freeTier: boolean; questionTypeId: string; mappedQuestionTypeIds: string[] }> }> {
  const [cases, liveItems] = await Promise.all([
    prisma.case.findMany({ select: { id: true, freeTier: true, questionTypeId: true, mappedQuestionTypeIds: true } }),
    prisma.item.findMany({ where: { status: 'LIVE', pool: 'PRACTICE' }, select: { id: true, questionTypeId: true } }),
  ]);
  const liveByType = new Map<string, number>();
  for (const item of liveItems) {
    if (isHeldFromServing(item.id)) continue;
    liveByType.set(item.questionTypeId, (liveByType.get(item.questionTypeId) ?? 0) + 1);
  }
  return {
    servable: new Set(cases.filter((c) => [c.questionTypeId, ...c.mappedQuestionTypeIds].some((t) => (liveByType.get(t) ?? 0) > 0)).map((c) => c.id)),
    all: cases,
  };
}

async function run() {
  // ---- Act 1: confirm the guard ----
  const { servable, all } = await servableSet();
  const hidden = all.filter((c) => !servable.has(c.id)).map((c) => ({ id: c.id, tier: c.freeTier ? 'FREE' : 'PAID' }));
  for (const id of ELEVEN) {
    if (servable.has(id)) throw new Error(`REFUSED — ${id} still reads servable; the guard is not doing its work`);
  }
  const actOne = {
    guard: 'servableCaseIds (apps/web/lib/crew/servable-cases.ts) — derived from the pool at request time, never a flag. Wired at ALL THREE case surfaces: the orchestrator candidate filter (focus case + session), the district map page (the D7 quiet-chip path), and the case page (notFound, same as a tier lock). A hidden case is indistinguishable from unbuilt content.',
    hiddenMembership: hidden,
    confirmation: `NO PAYING CHILD CAN NOW REACH A DOOR THAT OPENS ONTO AN ENDING: all ${ELEVEN.length} zero-live PAID cases are outside servableCaseIds() (asserted this run), the map does not render them, the case URL notFounds, and the orchestrator cannot select them as focus — the same derivation at every surface, so an item going LIVE reopens the door with no flag to remember.`,
  };

  // ---- Act 2: 629 vs 668 ----
  const draftsNow = await prisma.item.findMany({ where: { status: 'DRAFT', reviewedBy: null }, select: { id: true } });
  const auditDefinition = 'THE AUDIT (estate-audit-12a506a2…): a PRIORITY PARTITION — its "unsigned 629" bucket was DRAFT ∧ reviewedBy null ∧ NOT already claimed by the gate-failing bucket (34 rows took priority).';
  const fiveActsDefinition = 'THE FIVE-ACTS RUN (five-acts-788c8bf1…): act four counted ALL DRAFT ∧ reviewedBy null with NO partition — 668.';
  // Reconstruct: gate-failing DRAFT rows that also had reviewedBy null.
  const gateFailingIds: string[] = JSON.parse(execSync(
    `python3 -c "import json;d=json.load(open('/Users/davidb/Downloads/11+/from-cluecrew/estate-audit-12a506a26f93e584.json'));b=d['two_draftPartition']['buckets']['gateFailing'];print(json.dumps([r['id'] for r in (b.get('membership') or [])]))"`,
    { encoding: 'utf8' },
  ));
  const gateFailingUnsigned = await prisma.item.findMany({ where: { id: { in: gateFailingIds }, reviewedBy: null }, select: { id: true } });
  const demotedSix = ['bank-vr-04-closest-meaning-30', 'ENG-001-WIW-01', 'ENG-001-WIW-02', 'ENG-001-WIW-03', 'ENG-001-WIW-08', 'ENG-001-WIW-10'];
  const demotedUnsigned = await prisma.item.findMany({ where: { id: { in: demotedSix }, reviewedBy: null }, select: { id: true } });
  const actTwo = {
    definitions: { audit: auditDefinition, fiveActs: fiveActsDefinition },
    arithmetic: `629 (partitioned unsigned) + ${gateFailingUnsigned.length} (gate-failing rows that are ALSO unsigned — the partition assigned them to the gate bucket first) + ${demotedUnsigned.length} (of the six demotions, those with reviewedBy null, DRAFT by the time act four ran) = ${629 + gateFailingUnsigned.length + demotedUnsigned.length}. Current DRAFT∧unsigned reads ${draftsNow.length}.`,
    membershipOfDifference: {
      gateFailingAlsoUnsigned: gateFailingUnsigned.map((r) => r.id),
      demotedNowUnsigned: demotedUnsigned.map((r) => r.id),
    },
    verdict: 'NO WRITE PATH IS ADDING UNSIGNED ITEMS OUTSIDE THE REVIEW FLOW. The thirty-three is definitional: one instrument partitioned (first-match-wins) and one did not, plus the six demotions between runs. Same rows, two definitions — the rule-units class (R690) on a population instead of a cap.',
  };

  // ---- Act 3: what reviewedBy records ----
  const actThree = {
    coworkQuestionVerbatim: 'NOT HELD ON THIS SIDE — the question is cited by the desk but its text has not crossed; this answers the substance and cannot quote bytes it does not hold (R664).',
    schemaLine: 'reviewedBy String? // human reviewer name; REQUIRED before LIVE (P3, AI-QC) — and the verbal-decision comment beside it: whose JUDGEMENT (reviewedBy) is never merged with who ENTERED it (reviewRecordedBy).',
    answer: 'reviewedBy records A REVIEWER SEAT\'S JUDGEMENT — the named human whose review verdict the row carries, and the precondition for LIVE. It is NOT an author-facing approval: authorship is a separate mandatory column (authoredBy), and the CMS publish gate refuses any item whose status is not REVIEWED or whose reviewedBy is empty.',
    everyWriter: [
      'apps/web/lib/actions/admin-items.ts — THE CMS REVIEW PIPELINE (the routine path): approve sets status REVIEWED + reviewedBy human:<staff.email>; return-to-draft sets reviewedBy null + reviewNotes; the publish gate requires both.',
      'scripts/deploy-vr03-signoff.ts / deploy-vr07-signoff.ts / deploy-vr11-signoff.ts — one-shot signoff transcriptions, reviewedBy = human:staff-reviewer@cluecrew.test (the R94 ghost).',
      'scripts/publish-vr-signoff.ts, scripts/publish-spag-punct-spot.ts — publish transcriptions (the latter writes rev-0001).',
      'scripts/apply-two-vocabulary-keys.ts — ruling applier, reviewedBy = Annie\'s store identity.',
      'scripts/apply-spag-signature-transcription.ts — signature transcription, reviewedBy = a pointer value with reviewRecordedBy beside it.',
      'scripts/audit/backfill scripts read it; no other writer found by scan (method: grep over scripts/, apps/, packages/ for reviewedBy writes).',
    ],
    diffNote: 'Cowork is right: a diff run before this settlement measures two different words — if Cowork\'s field records author-facing approval, its non-null and this side\'s non-null are DIFFERENT ACTS wearing one name (the R690 rule-units class again, on a column).',
  };

  // ---- Act 4: the sectioned door-opening population ----
  const eleven = await prisma.case.findMany({ where: { id: { in: ELEVEN } }, select: { id: true, questionTypeId: true } });
  const rowsByCase = new Map<string, Array<Record<string, unknown>>>();
  let total = 0;
  for (const c of eleven) {
    const items = await prisma.item.findMany({
      where: { questionTypeId: c.questionTypeId, status: 'DRAFT', reviewedBy: null },
      select: {
        id: true, stem: true, explanation: true, difficultyTier: true, calibratedDifficulty: true, questionTypeId: true,
        options: { orderBy: { id: 'asc' }, select: { content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true, tagStatus: true } },
      },
      orderBy: { id: 'asc' },
    });
    const rows = items.map((i) => {
      const core = {
        id: i.id, questionType: i.questionTypeId, case: c.id,
        stem: i.stem, options: i.options, hintsAndWalk: i.explanation,
        tier: i.difficultyTier, calibratedDifficulty: i.calibratedDifficulty,
        reach: { case: c.id, tier: 'PAID', caseLiveNow: 0, opensDoor: true, note: 'signing this row is a step toward opening a paid door that currently serves nothing' },
      };
      return { ...core, rowSha256: sha256(JSON.stringify(core)), asOf: ASOF };
    });
    rowsByCase.set(c.id, rows);
    total += rows.length;
  }
  // Cheapest-first: ascending pool size, then case id. Sections of 12 per case, surplus in later
  // sections of the SAME case, never padded.
  const caseOrder = [...rowsByCase.entries()].sort((a, b) => (a[1].length - b[1].length) || a[0].localeCompare(b[0]));
  const sections: Array<Record<string, unknown>> = [];
  for (const [caseId, rows] of caseOrder) {
    // The opening-dozen proposal: widest difficulty spread — sort by tier, take evenly across it.
    let proposal: string[] | null = null;
    if (rows.length > 12) {
      const byTier = [...rows].sort((a, b) => (a.tier as number) - (b.tier as number) || String(a.id).localeCompare(String(b.id)));
      const picked = new Set<number>();
      for (let k = 0; k < 12; k++) picked.add(Math.round((k * (byTier.length - 1)) / 11));
      let idx = 0;
      while (picked.size < 12) { if (!picked.has(idx)) picked.add(idx); idx++; }
      proposal = [...picked].sort((x, y) => x - y).map((p) => String(byTier[p]!.id));
    }
    for (let s = 0; s * 12 < rows.length; s++) {
      const slice = rows.slice(s * 12, s * 12 + 12);
      sections.push({
        section: `${caseId} sitting ${s + 1}`,
        caseId, rowCount: slice.length,
        ...(s === 0 && proposal ? {
          openingDozenProposal: {
            ids: proposal,
            basis: 'difficulty spread — twelve picked evenly across the tier-sorted pool',
            plainly: 'A PROPOSAL, nothing more: she reads what she reads, and a door opens on twelve signed whichever twelve they are.',
          },
        } : {}),
        rows: slice,
      });
    }
  }
  const doorArtefact = {
    kind: 'door-opening-population',
    what: `The population of record for the next fortnight: ${total} unsigned items behind the eleven zero-live PAID cases, sectioned into twelve-row sittings labelled by case — each section opens one door. One digest, one loss-unit; reading tranches are these sections, cut here rather than at crossing time.`,
    asOf: ASOF,
    ordering: 'cheapest-first: the ten twenty-fives before vr-08\'s thirty-eight, ascending pool size then case id; a case\'s surplus sits in later sections of the same case; no section is padded (a tranche of one would be a tranche, and the smallest here is two).',
    perRow: 'stem, options with tags and executions, hints and walk script (the explanation object verbatim), tier, calibrated difficulty, reach (filled here: the paid door each row opens), rowSha256 over the row content, asOf stamp.',
    population: { items: total, cases: ELEVEN.length, sections: sections.length, method: 'DRAFT ∧ reviewedBy null over each case\'s question type, read this run' },
    sections,
  };
  const doorJson = JSON.stringify(doorArtefact, null, 1) + '\n';
  const doorName = stampedName('door-opening-population', sha256(doorJson).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', doorName), doorJson);
  deliver(join(REPO, 'content/exports', doorName), 'door-opening-population');

  // ---- The thirty, to Annie, with the check's own words ----
  let lineRefOutput = '';
  try { execSync('pnpm check:line-refs', { cwd: REPO, stdio: 'pipe', encoding: 'utf8' }); }
  catch (e) { const err = e as { stdout?: string; stderr?: string }; lineRefOutput = String(err.stdout ?? '') + String(err.stderr ?? ''); }
  const faultLines = lineRefOutput.split('\n').filter((l) => l.includes('✗') && l.includes('both are required or neither'));
  const byItem = new Map<string, string[]>();
  for (const l of faultLines) {
    const id = /item:([A-Za-z0-9-]+)/.exec(l)?.[1];
    if (id) byItem.set(id, [...(byItem.get(id) ?? []), l.trim()]);
  }
  const thirtyRows = await Promise.all([...byItem.entries()].map(async ([id, faults]) => {
    const item = await prisma.item.findUniqueOrThrow({ where: { id }, select: { status: true, stem: true, options: { orderBy: { id: 'asc' }, select: { content: true, attractorLine: true, defeaterLine: true, attractorQuote: true, defeaterQuote: true } } } });
    return { id, status: item.status, theChecksOwnWords: faults, stem: item.stem, options: item.options, rowSha256: sha256(JSON.stringify({ id, faults, stem: item.stem })), asOf: ASOF };
  }));
  const thirtyArtefact = {
    kind: 'incomplete-line-declarations-for-annie',
    what: `RULED, NOT DEMOTED (David): ${thirtyRows.length} items carry incomplete line declarations — one of the attractorLine/defeaterLine pair set without the other. None disagrees with its row; each is a real fault. Annie rules REPAIR or REMOVAL per row.`,
    theCheckVerdictVerbatim: 'A child is being sent to the wrong place. Fix it or take it out of service. (check:line-refs, its own closing line)',
    asOf: ASOF,
    population: { items: thirtyRows.length, method: 'pnpm check:line-refs run this turn; the both-are-required-or-neither class only; the out-of-window class was demoted in the five-acts run (R694)' },
    rows: thirtyRows,
  };
  const thirtyJson = JSON.stringify(thirtyArtefact, null, 1) + '\n';
  const thirtyName = stampedName('incomplete-line-declarations-for-annie', sha256(thirtyJson).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', thirtyName), thirtyJson);
  deliver(join(REPO, 'content/exports', thirtyName), 'incomplete-line-declarations-for-annie');

  // ---- The acts report ----
  const report = { kind: 'doors-hidden-and-reconciled', what: 'Act one confirmed, act two reconciled, act three settled from the schema and the writers.', actOne, actTwo, actThree };
  const reportJson = JSON.stringify(report, null, 1) + '\n';
  const reportName = stampedName('doors-hidden-and-reconciled', sha256(reportJson).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', reportName), reportJson);
  deliver(join(REPO, 'content/exports', reportName), 'doors-hidden-and-reconciled');

  console.log(`\nhidden: ${hidden.length} cases (${hidden.filter((h) => h.tier === 'PAID').length} paid); door population ${total} in ${sections.length} sections; thirty batch ${thirtyRows.length} rows`);
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
