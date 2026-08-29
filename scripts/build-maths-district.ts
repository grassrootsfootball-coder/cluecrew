/**
 * THE MATHS DISTRICT: taxonomy, import, case, tag join, hint screen — one run (R824).
 *
 * **Publication holds.** Everything lands DRAFT; nothing goes LIVE; `approvedBy` arrives as a
 * DECLARED NULL and stays null, because not one maths item has been through a reviewer and a
 * receiver must read UNSIGNED rather than UNKNOWN (the staging file's own words).
 *
 * **On "through your existing importer":** the English importer's WRAPPER does not apply — it
 * globs `ENG-*.json` and carries passage refs. Its DOOR does, and that is what is reused: the
 * shared `stemSchema` (R57 — never re-list the fields a door expects), `checkItemChildFacing`, and
 * the R758 option-column passthrough. Reusing the wrapper would have meant renaming a maths batch
 * to look like an English one, which is a lie in a filename.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkItemChildFacing, normaliseMathsNotation, stemSchema } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { beginCut, sealCut } from './lib/cut-stamp';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = join(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const STAGED = '/Users/davidb/Downloads/MATHSITEMSSTAGEDFORIMPORT.json';
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');

/**
 * THE SEVEN TYPES. `mechanic` is REQUIRED by the schema and is NOT in the staged data, so it is
 * derived where the arithmetic decides it and DECLARED where it does not. Inventory engine totals
 * decompose exactly onto group totals: SHAPE SHOP 30 = GEOM 30; DATA DESK 12 = STATS 12; NUMBER
 * FORGE 75 and THE WORKSHOP 83 = the other five. NPV 35, MEAS 32 and RP 11 each fit only one side.
 * **CALC and FDP are both 40, so the arithmetic cannot separate them** — assigned by meaning and
 * flagged, not asserted.
 */
const TYPES = [
  { id: 'maths-calc', name: 'Calculation', group: 'CALC', mechanic: 'forge', mechanicBasis: 'AMBIGUOUS BY ARITHMETIC — CALC and FDP are both 40, so the engine totals cannot separate them. Assigned by meaning: calculation is the number-forge interaction. FLAGGED, not derived.' },
  { id: 'maths-fdp', name: 'Fractions, decimals and percentages', group: 'FDP', mechanic: 'workshop', mechanicBasis: 'AMBIGUOUS BY ARITHMETIC — see maths-calc. Assigned by meaning. FLAGGED, not derived.' },
  { id: 'maths-npv', name: 'Number and place value', group: 'NPV', mechanic: 'forge', mechanicBasis: 'DERIVED — 35 fits NUMBER FORGE (75) only alongside a 40; it cannot fit THE WORKSHOP (83) with the remaining groups.' },
  { id: 'maths-meas', name: 'Measurement', group: 'MEAS', mechanic: 'workshop', mechanicBasis: 'DERIVED — 32 fits THE WORKSHOP (83) with RP 11 and a 40.' },
  { id: 'maths-geom', name: 'Geometry', group: 'GEOM', mechanic: 'shapeshop', mechanicBasis: 'DERIVED — SHAPE SHOP 30 = GEOM 30 exactly, and no other group is 30.' },
  { id: 'maths-stats', name: 'Statistics', group: 'STATS', mechanic: 'datadesk', mechanicBasis: 'DERIVED — DATA DESK 12 = STATS 12 exactly.' },
  { id: 'maths-rp', name: 'Ratio and proportion', group: 'RP', mechanic: 'workshop', mechanicBasis: 'DERIVED — 11 fits THE WORKSHOP (83) only.' },
];
const TYPE_BY_GROUP = new Map(TYPES.map((t) => [t.group, t.id]));

interface Staged { itemId: string; group: string; tier: number; stem: string; explanation: Record<string, unknown>; options: Array<{ label: string; value: string; isKey?: boolean; misconceptionId?: string | null }>; approvedBy: unknown }

async function run() {
  const cutBeganAt = beginCut();
  assertFixture('maths-district', [
    { name: 'a known group maps to a type', input: 'CALC', mustBeCaught: true },
    { name: 'so does the smallest group', input: 'RP', mustBeCaught: true },
    { name: 'an English group does not', input: 'WIW', mustBeCaught: false },
    { name: 'an empty group does not', input: '', mustBeCaught: false },
  ], (g) => TYPE_BY_GROUP.has(g));

  const src = JSON.parse(readFileSync(STAGED, 'utf8')) as { items: Staged[]; population: Record<string, unknown> };
  const items = src.items;
  requirePopulation('build:maths-district', { 'staged maths items': items.length, 'question types to create': TYPES.length });

  // ---- ONE: the taxonomy ----
  const typeReport = [];
  for (const t of TYPES) {
    const existing = await prisma.questionType.findUnique({ where: { id: t.id } });
    if (!existing && APPLY) await prisma.questionType.create({ data: { id: t.id, district: 'MATHS', name: t.name, mechanic: t.mechanic } });
    typeReport.push({ ...t, action: existing ? 'ALREADY PRESENT' : (APPLY ? 'CREATED' : 'WOULD CREATE') });
  }

  // ---- TWO: the import, through the shared door ----
  const imported: string[] = []; const refused: Array<Record<string, unknown>> = [];
  for (const it of items) {
    const typeId = TYPE_BY_GROUP.get(it.group);
    if (!typeId) { refused.push({ itemId: it.itemId, why: `group ${it.group} maps to no type` }); continue; }
    /**
      * **AN IMPORT DOOR NORMALISES THEN GATES** (CLAUDE.md, HOUSE NOTATION). The first run refused
      * 38 items, most on `money-word` — "5.00 pounds" where the house form is "£5.00". That is the
      * rule's declared normalisation, not a content fault, and normalising at the door is what the
      * rule says to do. The degree sign is REPORTED, never auto-inserted (a bare "C" may be a
      * label), so anything it catches still refuses.
      */
    const stem = { text: normaliseMathsNotation(it.stem) };
    const explanation = Object.fromEntries(Object.entries(it.explanation ?? {}).map(([k, v]) => [k, typeof v === 'string' ? normaliseMathsNotation(v) : v]));
    const parsed = stemSchema.safeParse(stem);
    if (!parsed.success) { refused.push({ itemId: it.itemId, why: `stemSchema: ${parsed.error.issues.map((i) => i.message).join('; ')}` }); continue; }
    const options = it.options.map((o) => ({ content: { value: normaliseMathsNotation(o.value), label: o.label } }));
    const faults = checkItemChildFacing({ id: it.itemId, stem, explanation, options });
    if (faults.length) { refused.push({ itemId: it.itemId, why: 'child-facing gate', faults: faults.map((f) => `${f.where} — ${f.rule}: ${f.detail}`) }); continue; }
    if (APPLY) {
      await prisma.$transaction(async (tx) => {
        await tx.item.upsert({
          where: { id: it.itemId },
          create: { id: it.itemId, questionType: { connect: { id: typeId } }, difficultyTier: it.tier, stem, explanation: explanation as object, status: 'DRAFT', authoredBy: 'maths staging import', reviewedBy: null },
          update: { difficultyTier: it.tier, stem, explanation: explanation as object },
        });
        await tx.itemOption.deleteMany({ where: { itemId: it.itemId } });
        await tx.itemOption.createMany({ data: it.options.map((o) => ({ itemId: it.itemId, content: { value: normaliseMathsNotation(o.value), label: o.label }, isCorrect: o.isKey === true, misconceptionId: o.misconceptionId ?? null })) });
      });
    }
    imported.push(it.itemId);
  }

  // ---- THREE: the case ----
  let caseReport: Record<string, unknown> = { id: 'case-maths-01' };
  const existingCase = await prisma.case.findUnique({ where: { id: 'case-maths-01' } });
  if (!existingCase && APPLY && imported.length) {
    await prisma.case.create({ data: {
      id: 'case-maths-01', questionTypeId: 'maths-calc', title: '',
      narrativeIntro: { state: 'EMPTY — the face lands ONLY through scripts/lib/case-face.ts, Annie-approved with her return digest as authority. An empty face renders nothing (caseFaceServes).' },
      modes: { state: 'EMPTY — authored with the face' },
      orderInDistrict: 1, freeTier: false, mappedQuestionTypeIds: TYPES.map((t) => t.id),
    } });
  }
  caseReport = { id: 'case-maths-01', district: 'MATHS via maths-calc', paid: 'freeTier false', face: 'EMPTY — fails closed, invisible to every child until an Annie-approved wording lands', mapped: TYPES.map((t) => t.id), action: existingCase ? 'ALREADY PRESENT' : (APPLY && imported.length ? 'CREATED' : 'WOULD CREATE') };

  // ---- FOUR: the tag-to-library join ----
  const attested = new Set((await prisma.misconception.findMany({ where: { district: 'MATHS' }, select: { id: true } })).map((m) => m.id));
  const tagUse = new Map<string, string[]>();
  for (const it of items) for (const o of it.options) if (o.misconceptionId) tagUse.set(o.misconceptionId, [...(tagUse.get(o.misconceptionId) ?? []), it.itemId]);
  const unattested = [...tagUse.entries()].filter(([id]) => !attested.has(id)).map(([id, on]) => ({ tag: id, usedOnItems: on.length, examples: on.slice(0, 4) }));

  // ---- FIVE: the hint screen ----
  const hintFaults = [];
  for (const it of items) {
    const hint = normaliseMathsNotation(String((it.explanation ?? {}).hintCore ?? ''));
    if (!hint) continue;
    const f = checkItemChildFacing({ id: it.itemId, stem: { text: 'x' }, explanation: { hintCore: hint }, options: [] });
    if (f.length) hintFaults.push({ itemId: it.itemId, hint, faults: f.map((x) => `${x.rule}: ${x.detail}`) });
  }

  const cut = await sealCut(prisma, cutBeganAt);
  const payload = {
    kind: 'maths-district-build',
    mode: APPLY ? 'APPLIED' : 'DRY RUN — nothing written',
    THE_CUT: cut,
    PUBLICATION_HOLDS: 'every item lands DRAFT; nothing is flipped LIVE; the case face is EMPTY and fails closed.',
    THE_DECLARED_NULL_AND_WHERE_IT_LANDED: '**Item has no `approvedBy` field** — that column is on Misconception. An Item\'s signature field is `reviewedBy`, so the declared null lands there, written explicitly rather than omitted. The distinction the staging file drew is preserved: a receiver reads UNSIGNED, not UNKNOWN. **Not one maths item has been through a reviewer.**',
    ONE_THE_TAXONOMY: { created: typeReport, mechanicNote: 'the schema requires a mechanic and the staged data carries none. Derived from the inventory\'s engine totals where the arithmetic decides it; DECLARED and flagged where it does not — CALC and FDP are both 40 and cannot be separated by counting.' },
    TWO_THE_IMPORT: { staged: items.length, imported: imported.length, refused: refused.length, refusals: refused, door: 'the shared stemSchema (R57) and checkItemChildFacing — the English importer\'s DOOR, not its wrapper. Its wrapper globs ENG-*.json and carries passage refs; renaming a maths batch to satisfy that would be a lie in a filename.' },
    THREE_THE_CASE: caseReport,
    FOUR_THE_TAG_JOIN: { distinctTagsUsed: tagUse.size, attestedEntriesInLibrary: attested.size, TAGS_POINTING_AT_NOTHING: unattested.length ? unattested : 'NONE — every misconception tag on every staged item resolves to an attested MATHS library entry.' },
    FIVE_THE_HINT_SCREEN: { hintsScreened: items.filter((i) => (i.explanation ?? {}).hintCore).length, FAULTS: hintFaults.length ? hintFaults : 'NONE — every maths hint passes the house rules.', note: 'no gate in either store had ever screened maths text. This is the first run.' },
  };
  const lines = [`types\t${TYPES.length}`, `imported\t${imported.length}`, `refused\t${refused.length}`, `unattested-tags\t${unattested.length}`, `hint-faults\t${hintFaults.length}`];
  const d = digestOverText('the summary lines joined by \\n, each "<what>\\t<count>"', lines.join('\n'));
  const full = { ...payload, SUMMARY_LINES: lines, summarySha256: d.value, summarySha256Spec: d.spec };
  const artefact = { ...full, ...findingsDigest(full, ['ONE_THE_TAXONOMY', 'TWO_THE_IMPORT', 'THREE_THE_CASE', 'FOUR_THE_TAG_JOIN', 'FIVE_THE_HINT_SCREEN', 'SUMMARY_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const fam = APPLY ? 'maths-district-build' : 'maths-district-build-dry-run';
  const name = stampedName(fam, sha(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), fam);
  console.log(`${APPLY ? 'APPLIED' : 'DRY RUN'} — types ${TYPES.length} | imported ${imported.length}, refused ${refused.length} | unattested tags ${unattested.length} | hint faults ${hintFaults.length}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
