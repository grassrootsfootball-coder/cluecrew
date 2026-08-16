/**
 * THE EIGHT COMPREHENSION CLUSTERS — `pnpm import:clusters [--write]`
 *
 * CLASSIFY BEFORE WRITING, and in ONE transaction (David, 2026-08-13). The first attempt at this
 * was an item-by-item loop with no pre-flight: it wrote one item, hit a foreign-key violation on
 * the eleventh option it touched, and left a half-applied batch. That is precisely the state
 * `reviewed-guard` exists to prevent, and I had not applied my own pattern.
 *
 * THREE CLASSES, decided before a single row is written:
 *   WRITABLE   — passes the platform's child-facing gate AND every tag resolves.
 *   GATE-HELD  — fails `checkItemChildFacing`. A gate hit is REWORDED, never exempted, and the
 *                rewording is Cowork's (it authors). Reported for return, not imported.
 *   TAG-HELD   — carries a tag the library deliberately does not hold. See below.
 *
 * A FOURTH REFUSAL, ABOVE ALL THREE CLASSES: AN UNRECOGNISED KEY STOPS THE RUN. This importer
 * declared an interface of six fields and wrote five, so ten item-level keys went in one side and
 * came out of neither — `lineRefs`, `orderAnchor`, `passageRef`, `mechanismLedger` among them,
 * with nothing reporting it. R57 a fifth time. The key registry lives in `packages/core`
 * (`cowork-item-keys.ts`) so this door and the CMS door cannot drift apart, and a field Cowork
 * adds next month stops the pipeline instead of vanishing from it (David, 2026-08-13).
 *
 * WHY TAG-HELD ITEMS ARE HELD WHOLE AND NOT IMPORTED WITH A NULL TAG (David's ruling, 2026-08-13):
 * the diagnosis is what Annie ruled on. The tag is RIGHT and the hint is unverified, which is why
 * the entry is held. Nulling it would make ten correctly-tagged items look untagged, and the
 * distinction between "no diagnosis" and "diagnosis awaiting a transcription check" is the whole
 * content of the ruling.
 */
import { readFileSync } from 'node:fs';
import {
  PROPOSED_EXCEPTIONS,
  checkItemChildFacing,
  isBlocking,
  unknownCoworkKeys,
} from '../packages/core/src/index';
import { Prisma, prisma } from '../packages/db/src/index';

const DIR = '/Users/davidb/Downloads/11+/from-cluecrew';
const CLUSTERS = ['005', '006', '007', '008', '009', '010', '011', '012'];

/**
 * DELIBERATELY LOOSE. The old interface named six fields and became the filter — typing the shape
 * tightly is what made ten keys invisible. The registry decides what is known; this only names
 * what the importer must reach for directly.
 */
interface Draft {
  itemId: string; questionTypeId: string; difficultyTier: number;
  stem: Record<string, unknown>; explanation?: Record<string, unknown>; authoredBy?: string;
  passageRef?: unknown; lineRefs?: unknown; orderAnchor?: unknown;
  options: Array<{ label?: string; content: unknown; isCorrect: boolean; misconceptionId?: string;
    senseTarget?: string; misconceptionExecution?: string; tagStatus?: string }>;
  [key: string]: unknown;
}

/** The option envelope this store stores. Cowork owns the text; the shape is ours. */
const optionContent = (o: Draft['options'][number], i: number): { label: string; value: string } => ({
  label: o.label ?? ['A', 'B', 'C', 'D', 'E', 'F'][i] ?? String(i),
  value: typeof o.content === 'string' ? o.content : String((o.content as { value?: unknown })?.value ?? ''),
});

/**
 * The item-level declarative fields, carried onto the stem because no column holds them yet.
 * The manifest reports WHERE each one landed, so the item-level migration stays measurable
 * rather than assumed. Absence stays absent — an undefined field is not written as null.
 */
function carriedStem(it: Draft): Record<string, unknown> {
  const stem = { ...it.stem };
  for (const k of ['passageRef', 'lineRefs', 'orderAnchor'] as const) {
    if (it[k] !== undefined && it[k] !== null) stem[k] = it[k];
  }
  return stem;
}

async function main(): Promise<void> {
  const write = process.argv.includes('--write');
  // `--file <path>` imports one delivery instead of the eight clusters, same door, same gate.
  const fileArg = process.argv.indexOf('--file');
  const drafts: Draft[] = fileArg > -1
    ? (JSON.parse(readFileSync(process.argv[fileArg + 1]!, 'utf8')).items as Draft[])
    : CLUSTERS.flatMap((c) =>
      (JSON.parse(readFileSync(`${DIR}/eng${c}-draft.json`, 'utf8')).items as Draft[]));

  const known = new Set((await prisma.misconception.findMany({ select: { id: true } })).map((m) => m.id));
  const types = new Map((await prisma.questionType.findMany({ select: { id: true, mechanic: true } }))
    .map((q) => [q.id, q.mechanic]));
  const present = new Set((await prisma.item.findMany({
    where: { id: { in: drafts.map((d) => d.itemId) } }, select: { id: true } })).map((i) => i.id));

  const writable: Draft[] = [];
  const gateHeld: Array<{ id: string; detail: string }> = [];
  const tagHeld: Array<{ id: string; tags: string[] }> = [];
  const already: string[] = [];

  /**
   * THE UNRECOGNISED-KEY REFUSAL, run over every draft BEFORE anything else is decided. It stops
   * the whole run rather than skipping an item: skipping is the behaviour that lost the fields.
   */
  const unknown = drafts.flatMap((d) => unknownCoworkKeys(d as unknown as Record<string, unknown>));
  if (unknown.length > 0) {
    const byKey = new Map<string, string[]>();
    for (const u of unknown) {
      const k = `${u.level}.${u.key}`;
      byKey.set(k, [...(byKey.get(k) ?? []), u.itemId]);
    }
    console.error(`\nREFUSED — ${byKey.size} key(s) the registry does not name, on ${unknown.length} occurrence(s):`);
    for (const [k, ids] of [...byKey].sort()) {
      console.error(`  x ${k}  on ${ids.length} item(s), first ${ids[0]}`);
    }
    console.error('\nNothing was read further and nothing was written. Add each key to');
    console.error('packages/core/src/english/cowork-item-keys.ts with a disposition — a key with no');
    console.error('decision recorded against it is how ten fields were lost silently.');
    await prisma.$disconnect();
    process.exit(1);
  }

  for (const it of drafts) {
    if (present.has(it.itemId)) { already.push(it.itemId); continue; }
    const mechanic = types.get(it.questionTypeId);
    if (!mechanic) { gateHeld.push({ id: it.itemId, detail: `questionType ${it.questionTypeId} does not exist` }); continue; }
    const faults = checkItemChildFacing({ id: it.itemId, stem: it.stem, explanation: it.explanation ?? {},
      mechanic, options: it.options }).filter(isBlocking);
    const missingTags = [...new Set(it.options
      .filter((o) => !o.isCorrect && o.misconceptionId && !known.has(o.misconceptionId))
      .map((o) => o.misconceptionId!))];
    // Both classes are reported: an item can be in either or both, and collapsing them would
    // hide a gate hit behind a tag hold or the reverse.
    if (faults.length) gateHeld.push({ id: it.itemId, detail: faults.map((f) => `[${f.rule}] ${f.detail}`).join('; ') });
    if (missingTags.length) tagHeld.push({ id: it.itemId, tags: missingTags });
    if (!faults.length && !missingTags.length) writable.push(it);
  }

  console.log(`${drafts.length} drafted · ${writable.length} WRITABLE · ${gateHeld.length} gate-held · `
    + `${tagHeld.length} tag-held · ${already.length} already present`);
  const both = gateHeld.filter((g) => tagHeld.some((t) => t.id === g.id));
  console.log(`  (${both.length} item(s) in BOTH held classes)`);
  if (gateHeld.length) {
    console.log('\nGATE-HELD — reword and return through Cowork, never exempt:');
    for (const g of gateHeld) console.log(`  ✗ ${g.id}: ${g.detail}`);
  }
  if (tagHeld.length) {
    console.log('\nTAG-HELD — the library deliberately does not hold these tags (R66 transcription ruling):');
    for (const t of tagHeld) console.log(`  · ${t.id}: ${t.tags.join(', ')}`);
  }

  // Everything Cowork holds crosses unless a reason can be named. These are the named reasons —
  // the list to bring to a ruling is the EXCEPTIONS, never the inclusions.
  console.log(`\nPROPOSED EXCEPTIONS — ${PROPOSED_EXCEPTIONS.length} key(s) proposed as NOT crossing, awaiting a ruling:`);
  for (const l of PROPOSED_EXCEPTIONS) console.log(`  ? ${l.level}.${l.key}: ${l.reason}`);

  if (!write) { console.log('\nDry run. Re-run with --write to apply.'); await prisma.$disconnect(); return; }

  // ONE TRANSACTION. Either every writable item lands or none does.
  await prisma.$transaction(writable.map((it) => prisma.item.create({
    data: { id: it.itemId, questionTypeId: it.questionTypeId, difficultyTier: it.difficultyTier,
      stem: carriedStem(it) as object, explanation: (it.explanation ?? {}) as object,
      // Provenance crosses. Absence stays absent — an undefined field is written as null, never
      // as an empty string, so "not stated" and "stated as nothing" stay distinguishable.
      clusterPosition: (it.clusterPosition as number | undefined) ?? null,
      tierRationale: (it.tierRationale as string | undefined) ?? null,
      sourcedFrom: (it.sourcedFrom as string | undefined) ?? null,
      // Prisma.DbNull, not JS null: on a Json column a bare null is the JSON VALUE null, which is
      // not the same as no value at all. Absence must stay absence — the same rule as `?? ''`.
      mechanismLedger: (it.mechanismLedger ?? Prisma.DbNull) as Prisma.InputJsonValue,
      // READ, not asserted. This was the literal 'ai-draft:cowork-okafor-v1', which matched the
      // file on all 96 — a guess that happened to be right, writing a provenance column.
      status: 'DRAFT', authoredBy: it.authoredBy ?? 'ai-draft:cowork-okafor-v1',
      options: { create: it.options.map((o, i) => ({ content: optionContent(o, i), isCorrect: o.isCorrect,
        misconceptionId: o.isCorrect ? null : (o.misconceptionId ?? null),
        senseTarget: o.senseTarget ?? null,
        misconceptionExecution: o.misconceptionExecution ?? null,
        tagStatus: o.tagStatus ?? null })) } },
  })));
  console.log(`\nLANDED ${writable.length} item(s) as DRAFT in one transaction.`);
  await prisma.$disconnect();
}

void main();
