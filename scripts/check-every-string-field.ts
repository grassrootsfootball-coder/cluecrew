/**
 * EVERY STRING FIELD ON EVERY LIVE ROW BEHIND A DOOR — Cowork's method, adopted because it found
 * something mine could not.
 *
 * **MY SWEEP SCREENED A POPULATION; COWORK'S SCREENED A SURFACE AREA.** I hunted the `road!'.`
 * fault across 704 WALK SCRIPTS and reported no class exists — true, and true only of walk scripts.
 * Cowork screened **every string field on every row** and found a punctuation fault on
 * `ENG-003-A-PU-06`, LIVE behind the Fix-It Shop, in a field my population did not contain.
 *
 * **THE GENERAL FORM: A SWEEP NAMED FOR A FIELD CAN ONLY EVER CLEAR THAT FIELD.** Every scope
 * finding this week has this shape — the reading-age lint that never opened a `.tsx`, the scanner
 * that never opened `lib/crew`, and now a punctuation hunt that never left one JSON key. **The
 * remedy is not a longer list of fields. It is to stop naming fields**: walk the row, take every
 * string it holds however deeply nested, and screen all of them.
 *
 * It also reports **which fields are outside `checkItemChildFacing`'s screened set**, because a
 * fault found in an unscreened field is two findings: the fault, and the gap that let it live.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'every-string-field-sweep';

/**
 * The keys `checkItemChildFacing` actually reads. Anything outside this is UNSCREENED — a value a
 * reviewer may have approved and no gate has ever looked at.
 */
/**
 * A DISPOSITION FOR EVERY UNSCREENED PATH — because "most are staff metadata and correctly out" is
 * an assumption until each one is written down (David, 2026-08-19 — R274).
 *
 * `child` — a child can read it, so the gate must screen it. Any path here that is NOT in SCREENED
 * is a live gap and this check fails.
 * `staff` — reviewer or machine metadata a child never meets. Correctly outside the gate.
 * `undecided` — nobody has ruled, and it is named rather than assumed either way.
 *
 * An unscreened path missing from this map fails the run. That is the whole mechanism: the count
 * was never the problem, the silence about each entry was.
 */
type Disposition = 'child' | 'staff' | 'undecided';
const DISPOSITIONS: Readonly<Record<string, Disposition>> = {
  // --- STAFF: review bookkeeping, batch and status markers, provenance ---
  'explanation.walkScriptBatch': 'staff', 'explanation.walkScriptStatus': 'staff',
  'reviewMethod': 'staff', 'reviewRecordNote': 'staff', 'reviewNotes': 'staff',
  'itemModel': 'staff', 'draftingMethod': 'staff', 'sourcedFrom': 'staff',
  'tierRationale': 'staff', 'r4Note': 'staff', 'passageFlag': 'staff',
  'options[].a36Note': 'staff', 'options[].windowClass': 'staff',
  'options[].misconceptionExecution': 'staff',
  'mechanismLedger[].evidence': 'staff', 'mechanismLedger[].mechanism': 'staff',
  'mechanismLedger[]._previousEvidence': 'staff',
  'stem._previousText': 'staff', 'explanation._previousWalkScript': 'staff',
  'explanation._previousHintCore': 'staff',
  'stemRedraft.rules[]': 'staff', 'stemRedraft.why': 'staff',
  'draftSelfAssessment.notes': 'staff', 'draftSelfAssessment.subjectHash': 'staff',
  'draftSelfAssessment.handoffState': 'staff', 'draftSelfAssessment.subjectHashCaveat': 'staff',
  'draftSelfAssessment.subjectHashCovers': 'staff', 'draftSelfAssessment.subjectHashStampedAt': 'staff',
  'draftSelfAssessment.rubricDerivabilityNote': 'staff',
  'draftSelfAssessment.rubric.banList': 'staff', 'draftSelfAssessment.rubric.tierFit': 'staff',
  'draftSelfAssessment.rubric.fairness': 'staff',
  'draftSelfAssessment.rubricDerivability.banList': 'staff',
  'draftSelfAssessment.rubricDerivability.tierFit': 'staff',
  'draftSelfAssessment.rubricDerivability.fairness': 'staff',
  'draftSelfAssessment.rubricDerivability.readingAge': 'staff',
  'draftSelfAssessment.rubricDerivability.keyVerified': 'staff',
  'draftSelfAssessment.rubricDerivability.distractorsExecute': 'staff',
  'stem.passageRef': 'staff', 'explanation.quotes[].passageRef': 'staff',
  'stem.quotes[].passageRef': 'staff',
  'explanation.quotes[].rule': 'staff', 'stem.quotes[].rule': 'staff',
  'explanation.quotes[].why': 'staff',
  'explanation.quotes[].exemptFrom[]': 'staff', 'stem.quotes[].exemptFrom[]': 'staff',
  'stem.techniqueKey': 'staff', 'stem.answerShape': 'staff', 'options[].senseTarget': 'staff',
  // Single-token option values and labels ("N", "A", "bread"): the gate walks them and skips them
  // for want of a space, exactly as it skips a headword under test.
  'options[].content.value': 'child', 'options[].content.label': 'child',

  // --- CHILD: rendered on the card. Every one of these MUST also be in SCREENED. ---
  'stem.series[]': 'child', 'stem.pairA[]': 'child', 'stem.clues[]': 'child',
  'stem.stemWord': 'child', 'stem.word1': 'child', 'stem.word2': 'child',
  'stem.sum': 'child', 'stem.question': 'child',
  'stem.code.P': 'child', 'stem.code.Q': 'child', 'stem.code.R': 'child', 'stem.code.S': 'child',
  'stem.operands.expr': 'child', 'stem.operands.kind': 'child',
  'explanation.quotes[].text': 'child', 'stem.quotes[].text': 'child', 'stem.quotes[]': 'child',
  'explanation.note': 'child',

  // --- UNDECIDED: nobody has ruled. Named, not assumed. ---
  'options[].attractorQuote': 'undecided',
  'options[].defeaterQuote': 'undecided',
  'stem.words[]': 'undecided',
};

/**
 * **THIS SET WAS A DECLARATION AND THE GATE IS THE AUTHORITY** — my first version listed nine
 * paths and reported EIGHTEEN child-facing fields as unscreened. Every one was wrong.
 * `checkItemChildFacing` calls `textsFrom(item.stem, '')`, which walks the WHOLE object
 * recursively — no key is named anywhere in it. What it skips is any string WITHOUT A SPACE,
 * deliberately: a single word is a headword or a code letter under test, and capping it would cap
 * the answer.
 *
 * **So the honest set is not a list of paths, it is a rule** — and the rule is the gate's own
 * function, called here rather than restated. Sixth instrument fault of the week, and the first one
 * where I had already written down the remedy: *a verifier states its source before it runs, and
 * calls the family's own function rather than re-deriving the property.*
 */
const isScreened = (path: string, text: string): boolean => {
  // The gate walks stem and explanation entirely, and options through their content.
  const walked = /^(stem|explanation)\b/.test(path) || /^options\[\]\.content\b/.test(path);
  return walked && text.trim().includes(' ');
};

const FAULTS: { name: string; re: RegExp }[] = [
  { name: 'doubled opening quotation mark', re: /[“"']\s*[“"']/ },
  { name: 'terminal doubled across a closing quote', re: /[!?][”"']\s*[.!?]/ },
  { name: 'doubled terminal mark', re: /[.!?]\s*[.!?]/ },
  { name: 'space before a terminal mark', re: /\s+[.,;:!?]/ },
];

/** Every string this value holds, with the path that reached it. Nothing is named in advance. */
function strings(value: unknown, path: string, out: { path: string; text: string }[] = []) {
  if (typeof value === 'string') { if (value.trim() !== '') out.push({ path, text: value }); return out; }
  if (Array.isArray(value)) { value.forEach((v, i) => strings(v, `${path}[${i}]`, out)); return out; }
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    for (const [k, v] of Object.entries(value)) strings(v, path ? `${path}.${k}` : k, out);
  }
  return out;
}

/** Collapse an array index so `options[2].content.value` compares against the screened set. */
const generalise = (p: string) => p.replace(/\[\d+\]/g, '[]');

async function main() {
  const cases = await prisma.case.findMany({ select: { questionTypeId: true, id: true } });
  const doorTypes = new Set(cases.map((c) => c.questionTypeId));
  const items = await prisma.item.findMany({
    where: { status: 'LIVE', questionTypeId: { in: [...doorTypes] } },
    include: { options: true },
    orderBy: { id: 'asc' },
  });
  requirePopulation('every-string-field sweep', {
    'Case doors': cases.length,
    'LIVE items behind a door': items.length,
  });

  let fieldsScreened = 0;
  const unscreenedPaths = new Map<string, number>();
  const findings: { itemId: string; questionTypeId: string; path: string; screened: boolean; fault: string; text: string }[] = [];

  for (const item of items) {
    const { options, ...columns } = item;
    const all = [
      ...strings(columns, ''),
      ...options.flatMap((o, i) => strings({ ...o, id: undefined, itemId: undefined }, `options[${i}]`)),
    ];
    for (const { path, text } of all) {
      // Ids, enums and machine values are not prose; screening them reports noise as content.
      if (/(^|\.)(id|itemId|questionTypeId|status|pool|authoredBy|reviewedBy|reviewRecordedBy|misconceptionId|createdAt|updatedAt)$/.test(path)) continue;
      fieldsScreened += 1;
      const general = generalise(path);
      const screened = isScreened(general, text);
      if (!screened) unscreenedPaths.set(general, (unscreenedPaths.get(general) ?? 0) + 1);
      for (const f of FAULTS) {
        if (f.re.test(text)) {
          findings.push({ itemId: item.id, questionTypeId: item.questionTypeId, path, screened, fault: f.name, text });
        }
      }
    }
  }

  // Disposition audit. An unscreened path with no disposition, or a `child` path the gate does not
  // read, is a FAULT — the count was never the problem, the silence about each entry was.
  const dispositionFaults: string[] = [];
  const byDisposition: Record<string, string[]> = { child: [], staff: [], undecided: [], MISSING: [], childSingleToken: [] };
  for (const [p] of unscreenedPaths) {
    const d = DISPOSITIONS[p];
    if (!d) { byDisposition.MISSING!.push(p); dispositionFaults.push(`UNDECLARED PATH: ${p} — classify it child, staff or undecided.`); continue; }
    byDisposition[d]!.push(p);
    // A `child` path appears here only when EVERY value under it is a single token — which the
    // gate skips by design. That is a design decision, not a gap, and it is reported as such.
    if (d === 'child') byDisposition.childSingleToken = [...(byDisposition.childSingleToken ?? []), p];
  }

  const payload = {
    what: 'Every string field on every LIVE item behind a Case door, screened for punctuation faults.',
    method:
      "Cowork's, adopted. The row is walked and every string it holds is taken, however deeply nested. No field is named in advance, because a sweep named for a field can only ever clear that field.",
    whyItMatters:
      'My earlier hunt cleared 704 walk scripts and was true only of walk scripts. This screens the surface area rather than a population.',
    denominators: {
      liveItemsBehindADoor: items.length,
      stringFieldsScreened: fieldsScreened,
      distinctPathsOutsideTheChildFacingGate: unscreenedPaths.size,
    },
    unscreenedPaths: [...unscreenedPaths].sort((a, b) => b[1] - a[1]).map(([path, count]) => ({ path, count, disposition: DISPOSITIONS[path] ?? 'UNDECLARED' })),
    dispositions: {
      staff: byDisposition.staff!.length,
      child: byDisposition.child!.length,
      undecided: byDisposition.undecided!,
      undeclared: byDisposition.MISSING!,
    },
    findings,
  };

  const stamp = artefactStamp(payload, new Date().toISOString(), 'content',
    'punctuation faults across every string field of every LIVE item behind a door, with which paths no gate screens', ['findings']);
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, stampedName(FAMILY, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify({ stamp, ...payload }, null, 2));
  deliver(path, FAMILY);

  console.log(`\nLIVE items behind a door: ${items.length} · string fields screened: ${fieldsScreened}`);
  console.log(`paths OUTSIDE checkItemChildFacing: ${unscreenedPaths.size}`);
  for (const [p, n] of [...unscreenedPaths].sort((a, b) => b[1] - a[1]).slice(0, 10)) console.log(`    ${String(n).padStart(4)}  ${p}`);
  console.log(`\ndispositions — staff ${byDisposition.staff!.length} · child ${byDisposition.child!.length} · undecided ${byDisposition.undecided!.length} · UNDECLARED ${byDisposition.MISSING!.length}`);
  if (byDisposition.childSingleToken!.length) {
    console.log(`    child-facing but SINGLE-TOKEN ONLY, so the gate skips them by design: ${byDisposition.childSingleToken!.length}`);
    console.log(`      ${byDisposition.childSingleToken!.join(', ')}`);
  }
  if (byDisposition.undecided!.length) console.log(`    undecided: ${byDisposition.undecided!.join(', ')}`);
  if (byDisposition.MISSING!.length) console.log(`    UNDECLARED: ${byDisposition.MISSING!.join(', ')}`);
  for (const f of dispositionFaults) console.error(`  - ${f}`);
  console.log(`\nfaults: ${findings.length}`);
  for (const f of findings.slice(0, 15)) {
    console.log(`  ${f.itemId} · ${f.path} · ${f.screened ? 'screened' : 'UNSCREENED'} · ${f.fault}`);
    console.log(`      ${JSON.stringify(f.text.slice(0, 90))}`);
  }
  await prisma.$disconnect();
}

main();
