/**
 * THE MATHS HINT MEMBERSHIP — the tranche machinery's first emission (David, 2026-08-24, on her
 * order ruling — R676).
 *
 * Population, stated: every MATHS-district library row (the misconception library), PLUS every
 * serving maths hint wording whichever store's rows serve — an item-level hint serves where
 * `chooseHint` returns 'item' (hintCore present, read by a named reviewer, not ruled to the
 * library); otherwise the ACTIVE library entry serves through the option's misconception tag.
 * Method: reads the live database; serving decided by CALLING THE FAMILY'S OWN FUNCTIONS
 * (`chooseHint`, `resolveLibraryHint` — R41: never a re-derivation); the over-cap marking calls
 * `checkChildFacingText` itself, the gate's own arithmetic.
 *
 * Per row: wording VERBATIM, sha256 over its UTF-8 bytes (her confirmation-form rule, R672),
 * reach as MEMBERSHIP (live item ids and their cases, never a bare count), reachable-first
 * ordering — fit is hardest where reach is widest. Rows whose wording exceeds the sixteen-word
 * sentence cap are MARKED, and the artefact states the standing rule on its face: THE CAP GATES
 * WRITES, NEVER SERVING (her seventh) — so nobody re-fights it at reading time.
 */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkChildFacingText, chooseHint, isBlocking, type HintSource } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { deliver, stampedName } from './lib/export-destination';
import { requirePopulation } from './lib/population';

const REPO = join(__dirname, '..');
const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

function capMarks(label: string, text: string) {
  const faults = checkChildFacingText({ role: 'hint', label, text })
    .filter(isBlocking)
    .filter((f) => f.rule === 'sentence-length');
  return faults.map((f) => f.detail);
}

async function run() {
  const lib = await prisma.misconception.findMany({
    where: { district: 'MATHS' },
    // Description beside the wording: her seventh's delivery form is text and description side by
    // side, and the tranche cannot cut without it (the desk's addition, second emission).
    select: { id: true, childHint: true, description: true, status: true, approvedBy: true },
  });
  requirePopulation(lib, 'MATHS library rows — the maths misconception library must not be empty');
  const byStatus = lib.reduce((a: Record<string, number>, r) => ((a[r.status] = (a[r.status] ?? 0) + 1), a), {});
  console.log(`library population: ${lib.length} MATHS-district rows (${JSON.stringify(byStatus)})`);

  // Cases hang off QuestionType, not Item: an item reaches a child through its type's cases.
  const items = await prisma.item.findMany({
    where: { questionType: { district: 'MATHS' } },
    select: {
      id: true, status: true, explanation: true,
      questionType: { select: { id: true, cases: { select: { id: true } } } },
      options: { select: { misconceptionId: true } },
    },
  });
  console.log(`item population: ${items.length} MATHS-district items read (all statuses; reach counts LIVE only)`);
  // THE EMPTY SERVING SURFACE IS STRUCTURAL, NOT A SCAN FAILURE (R61): declare it from the
  // schema-level fact, so a zero below cannot be read as a blind instrument.
  const qtByDistrict = await prisma.questionType.groupBy({ by: ['district'], _count: true });
  const mathsQts = qtByDistrict.find((q) => q.district === 'MATHS')?._count ?? 0;

  const reach = new Map<string, { items: Set<string>; cases: Set<string> }>();
  const itemHintRows: Array<Record<string, unknown>> = [];
  for (const item of items) {
    const live = item.status === 'LIVE';
    const choice = chooseHint(item.explanation as HintSource | null);
    if (choice.serves === 'item') {
      itemHintRows.push({
        kind: 'item-hint', itemId: item.id, cases: item.questionType.cases.map((c) => c.id), itemStatus: item.status,
        wording: choice.text, wordingSha256: sha256(choice.text),
        servesBecause: { readBy: choice.readBy, authority: choice.authority },
        supersedes: 'the library hint on this item (one hint, not two)',
        overSixteenWordSentences: capMarks(item.id, choice.text),
      });
    }
    if (!live) continue;
    for (const o of item.options) {
      if (!o.misconceptionId) continue;
      const r = reach.get(o.misconceptionId) ?? { items: new Set<string>(), cases: new Set<string>() };
      r.items.add(item.id);
      for (const c of item.questionType.cases) r.cases.add(c.id);
      reach.set(o.misconceptionId, r);
    }
  }

  const libraryRows = lib.map((m) => {
    const r = reach.get(m.id);
    const liveItems = [...(r?.items ?? [])].sort();
    const cases = [...(r?.cases ?? [])].sort();
    return {
      kind: 'library', id: m.id, status: m.status, approvedBy: m.approvedBy,
      description: m.description,
      wording: m.childHint, wordingSha256: sha256(m.childHint),
      servesToday: m.status === 'ACTIVE' && liveItems.length > 0,
      reach: { liveItems, cases, liveItemCount: liveItems.length, caseCount: cases.length },
      overSixteenWordSentences: capMarks(m.id, m.childHint),
    };
  }).sort((a, b) => a.id.localeCompare(b.id));

  // DERIVED, never copied: the approvedBy distribution over the ACTIVE rows, so the artefact she
  // reads against states what the field actually holds.
  const activeApprovedBy = libraryRows.filter((r) => r.status === 'ACTIVE')
    .reduce((a: Record<string, number>, r) => { const k = r.approvedBy ?? 'null'; a[k] = (a[k] ?? 0) + 1; return a; }, {});

  const servingLibrary = libraryRows.filter((r) => r.servesToday).length;
  const overCap = [...libraryRows, ...itemHintRows].filter((r) => (r.overSixteenWordSentences as string[]).length > 0).length;

  const artefact = {
    kind: 'maths-hint-membership',
    what: 'Every MATHS library row plus every serving maths item-level hint wording, verbatim with per-row sha256, reach as membership, reachable-first. The tranche machinery reads this; the desk cuts tranche one at reading size.',
    countDisagreement: `THE DESK CITED 107 LIBRARY ROWS; THIS STORE MEASURES ${lib.length} (${Object.entries(byStatus).map(([s, n]) => `${n} ${s}`).join(', ')}). The membership below is ALL rows, untrimmed — a cited count never edits a measured membership (R595); the desk resolves which population its 107 named.`,
    servingSurfaceDeclaration: mathsQts === 0
      ? `LEGITIMATELY EMPTY, DECLARED (R61): the serving store holds ZERO MATHS question types (present: ${qtByDistrict.map((q) => `${q._count} ${q.district}`).join(', ')}), so no maths item exists, no option tags a maths library id, and no maths hint reaches a child today. Every zero reach below is structural, not a blind scan. The membership is the review population for the tranche; reach arrives when the maths serving surface does.`
      : `MATHS question types exist (${mathsQts}); reach below is live measurement.`,
    population: {
      libraryRows: lib.length,
      libraryRowsByStatus: byStatus,
      libraryRowsServingToday: servingLibrary,
      itemHintRowsServing: itemHintRows.length,
      mathsItemsRead: items.length,
      unit: 'rows (library) and items (item hints); reach counted in LIVE items and their cases',
    },
    method: "live database read; serving decided by the family's own functions (chooseHint / the ACTIVE-status filter), never a re-derivation; over-cap marking by checkChildFacingText itself",
    standingCapNote: 'THE SIXTEEN-WORD SENTENCE CAP GATES WRITES, NEVER SERVING (her seventh). A row marked over-cap here serves exactly as it stands; the mark is review material for the next authored change, not a serving defect. Stated here so nobody re-fights it at reading time.',
    ordering: 'DETERMINISTIC BY ID, and the criterion is stated because the alternative would be composed: reach is uniformly zero (the serving surface is structurally empty, below), so reachable-first ordering would order 111 equal keys by accident and present the accident as meaning. Id order is the only ordering the data itself supplies. Item-hint rows would follow the library rows; today there are none.',
    approvedByDistributionOverActive: activeApprovedBy,
    overCapRowCount: overCap,
    libraryRows,
    itemHintRows,
  };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('maths-hint-membership', sha256(json).slice(0, 16), 'json');
  const local = join(REPO, 'content/exports', name);
  writeFileSync(local, json);
  deliver(local, 'maths-hint-membership');
  console.log(`\nserving library rows: ${servingLibrary}; item-hint rows serving: ${itemHintRows.length}; over-cap marked: ${overCap}`);
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
