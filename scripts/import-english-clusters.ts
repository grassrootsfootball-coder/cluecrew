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
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  PROPOSED_EXCEPTIONS,
  checkItemChildFacing,
  isBlocking,
  unknownCoworkKeys,
} from '../packages/core/src/index';
import { Prisma, prisma } from '../packages/db/src/index';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';

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
  options: Array<{ label?: string; content?: unknown; value?: string; isCorrect: boolean;
    misconceptionId?: string; senseTarget?: string; misconceptionExecution?: string; tagStatus?: string;
    attractorLine?: number; defeaterLine?: number; attractorQuote?: string; defeaterQuote?: string;
    windowClass?: string; a36Note?: string; defeatedByAbsence?: boolean }>;
  [key: string]: unknown;
}

/** The option envelope this store stores. Cowork owns the text; the shape is ours. */
const optionContent = (o: Draft['options'][number], i: number): { label: string; value: string } => ({
  label: o.label ?? ['A', 'B', 'C', 'D', 'E', 'F'][i] ?? String(i),
  // Two live shapes: `content` (a string or {value}) and a top-level `value`. Reading only one
  // would store an empty option and no gate would see it (R57's shape, in the envelope).
  value: typeof o.value === 'string' ? o.value
    : typeof o.content === 'string' ? o.content
      : String((o.content as { value?: unknown })?.value ?? ''),
});

/**
 * The item-level declarative fields, carried onto the stem because no column holds them yet.
 * The manifest reports WHERE each one landed, so the item-level migration stays measurable
 * rather than assumed. Absence stays absent — an undefined field is not written as null.
 */
function carriedStem(it: Draft): Record<string, unknown> {
  const stem = { ...it.stem };
  // lineRefs is NOT here: R77 ruled it ITEM level and migrate:citations moved it off the stem.
  // Carrying it back onto the stem left `Item.lineRefs` null on every re-imported row, so the
  // store and the file disagreed about the citation window on 25 of 22 ENG-001 comparisons while
  // both actually held the same numbers in different places.
  for (const k of ['passageRef', 'orderAnchor'] as const) {
    if (it[k] !== undefined && it[k] !== null) stem[k] = it[k];
  }
  return stem;
}

/**
 * A delivery is either a bare `{items}` or a `{transferStamp, payload}` envelope. The stamp's
 * sha256 is over the PAYLOAD serialised with sorted keys and no spaces — a mismatch REFUSES the
 * file rather than importing content whose transfer cannot be vouched for.
 */
function readDelivery(path: string): Draft[] {
  const raw = readFileSync(path, 'utf8');
  const parsed = JSON.parse(raw) as { items?: unknown; transferStamp?: { sha256?: string }; payload?: { items?: unknown } };
  if (!parsed.transferStamp) return (parsed.items ?? []) as Draft[];
  const ser = JSON.stringify(parsed.payload, (_k, v: unknown) => v, 0);
  void ser;
  const got = payloadHash(path);
  if (got !== parsed.transferStamp.sha256) {
    console.error(`REFUSED — ${path}: transfer stamp ${parsed.transferStamp.sha256?.slice(0, 16)} but payload hashes ${got.slice(0, 16)}`);
    process.exit(1);
  }
  return (parsed.payload?.items ?? []) as Draft[];
}

/**
 * THE STAMP'S OWN ALGORITHM, RUN BY THE INTERPRETER THAT DEFINES IT.
 *
 * The stamp is sha256 of the payload serialised with Python's `sort_keys=True,
 * separators=(",",":")`. A JavaScript reimplementation cannot be exact: `JSON.parse` turns the
 * literal `8.0` into the Number 8, and Python re-emits `8.0` where JS emits `8`. One float in
 * ENG001 was enough to make a good delivery hash differently and be refused.
 *
 * Numbers are the visible case; there is no reason to believe they are the only one. So the check
 * calls Python rather than imitating it — the declared algorithm, not a second implementation of
 * it that has to be kept in step.
 */
function payloadHash(path: string): string {
  const src = 'import json,hashlib,sys;'
    + 'd=json.load(open(sys.argv[1]));'
    + 's=json.dumps(d["payload"],sort_keys=True,separators=(",",":"),ensure_ascii=False).encode();'
    + 'print(hashlib.sha256(s).hexdigest())';
  return execFileSync('python3', ['-c', src, path], { encoding: 'utf8' }).trim();
}

const RECEIPT_DIR = resolve(import.meta.dirname, '../content/exports');

/**
 * THE REFUSAL RECEIPT — every id this door turned away, and why.
 *
 * A refusal used to reach stdout and nowhere else. Cowork emitted 344 items, 330 landed, 14 were
 * refused, and NOTHING told it which: a re-emission was silently partial by default, and its only
 * route to knowing was diffing manifests and reading absence as evidence — the inference that
 * already produced one false correction.
 *
 * Deliberately small. Not a schema change, not a state on the row, not a class in
 * `check:return-leg`: a file naming the id, the door, and the reason. Written on EVERY run and
 * labelled with its mode, so a dry run cannot be mistaken for a record of what actually happened.
 */
function writeReceipt(r: {
  mode: 'applied' | 'dry-run'; files: string[];
  gateHeld: Array<{ id: string; detail: string }>; tagHeld: Array<{ id: string; tags: string[] }>;
  duplicatesDropped: number; drafted: number; writable: number;
}): void {
  const refusals = [
    ...r.gateHeld.map((g) => ({ itemId: g.id, door: 'checkItemChildFacing', reason: g.detail })),
    ...r.tagHeld.map((t) => ({
      itemId: t.id, door: 'misconception library',
      reason: `tagged ${t.tags.join(', ')}, which the library does not hold`,
    })),
  ].sort((a, b) => a.itemId.localeCompare(b.itemId));

  const generatedAt = new Date().toISOString();
  const stamp = artefactStamp(refusals, generatedAt, 'status', 'every item this import refused, with the door and the reason', ['refusals']);
  const body = {
    kind: 'import-receipt',
    mode: r.mode,
    note: r.mode === 'dry-run'
      ? 'DRY RUN — nothing was written. This is what WOULD be refused, not what was.'
      : 'Applied. These ids were refused at the door and did NOT land; everything else did.',
    generatedAt,
    stamp,
    sourceFiles: r.files.map((f) => f.split('/').pop()),
    counts: { drafted: r.drafted, landed: r.writable, refused: refusals.length, duplicatesDropped: r.duplicatesDropped },
    refusals,
  };
  mkdirSync(RECEIPT_DIR, { recursive: true });
  const path = join(RECEIPT_DIR, stampedName('import-receipt', stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify(body, null, 2));
  deliver(path, 'import-receipt');
  console.log(`\nReceipt: ${refusals.length} refusal(s) named for Cowork (${r.mode}).`);
}

async function main(): Promise<void> {
  const write = process.argv.includes('--write');
  // `--file <path>` imports one delivery instead of the eight clusters, same door, same gate.
  const fileArg = process.argv.indexOf('--file');
  const files = fileArg > -1 ? process.argv.slice(fileArg + 1).filter((a) => !a.startsWith('--')) : [];
  const raw: Draft[] = files.length
    ? files.flatMap((f) => readDelivery(f))
    : CLUSTERS.flatMap((c) =>
      (JSON.parse(readFileSync(`${DIR}/eng${c}-draft.json`, 'utf8')).items as Draft[]));
  // ONE ROW PER ITEM ID, LAST FILE WINS. ENG-002-pp-23 arrives in both its own delivery and the
  // ENG002 re-emission; creating it twice failed the primary key and took the whole batch with it.
  // A later file supersedes an earlier one, which is the same precedence the re-emissions carry.
  const deduped = new Map<string, Draft>();
  for (const d of raw) deduped.set(String(d.itemId), d);
  const dropped = raw.length - deduped.size;
  if (dropped > 0) console.log(`  ${dropped} duplicate item id(s) across deliveries; later file wins.`);
  const drafts: Draft[] = [...deduped.values()];

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

  // `--replace`: a re-emission SUPERSEDES the delivery of the same name (David, 2026-08-16).
  // Replace, never merge — the existing row is deleted and rebuilt from the new payload, so a
  // field the re-emission drops does not survive from the old one.
  const replace = process.argv.includes('--replace');
  for (const it of drafts) {
    if (present.has(it.itemId) && !replace) { already.push(it.itemId); continue; }
    const mechanic = types.get(it.questionTypeId);
    if (!mechanic) { gateHeld.push({ id: it.itemId, detail: `questionType ${it.questionTypeId} does not exist` }); continue; }
    // GATE THE ENVELOPE THIS STORE USES, not the one the delivery happens to arrive in. The gate
    // reads `content.value`; this delivery carries a top-level `value`, so handing it the raw
    // options threw on every item. Normalise first, gate second, write third — the same order the
    // door already applies to everything else.
    const faults = checkItemChildFacing({ id: it.itemId, stem: it.stem, explanation: it.explanation ?? {},
      mechanic,
      options: it.options.map((o, i) => ({ ...o, content: optionContent(o, i) })),
    }).filter(isBlocking);
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

  writeReceipt({ mode: write ? 'applied' : 'dry-run', files, gateHeld, tagHeld, duplicatesDropped: dropped, drafted: drafts.length, writable: writable.length });

  if (!write) { console.log('\nDry run. Re-run with --write to apply.'); await prisma.$disconnect(); return; }

  // ONE TRANSACTION. Either every writable item lands or none does.
  await prisma.$transaction([
    ...(replace
      ? [prisma.item.deleteMany({ where: { id: { in: writable.filter((w) => present.has(w.itemId)).map((w) => w.itemId) } } })]
      : []),
    ...writable.map((it) => prisma.item.create({
    data: { id: it.itemId, questionTypeId: it.questionTypeId, difficultyTier: it.difficultyTier,
      stem: carriedStem(it) as object, explanation: (it.explanation ?? {}) as object,
      // Provenance crosses. Absence stays absent — an undefined field is written as null, never
      // as an empty string, so "not stated" and "stated as nothing" stay distinguishable.
      lineRefs: (it.lineRefs ?? Prisma.DbNull) as Prisma.InputJsonValue,
      clusterPosition: (it.clusterPosition as number | undefined) ?? null,
      draftingMethod: ((it.draftingMethod ?? it.draftingOrder) as string | undefined) ?? null,
      itemModel: (it.itemModel as string | undefined) ?? null,
      passageFlag: (it.passageFlag as string | undefined) ?? null,
      r4Note: (it.r4Note as string | undefined) ?? null,
      banListExceptionResolved: (it.banListExceptionResolved as string | undefined) ?? null,
      banListException: (it.banListException ?? Prisma.DbNull) as Prisma.InputJsonValue,
      stemRedraft: (it.stemRedraft ?? Prisma.DbNull) as Prisma.InputJsonValue,
      importDoorFix: (it.importDoorFix ?? Prisma.DbNull) as Prisma.InputJsonValue,
      testedTokens: (it.testedTokens ?? Prisma.DbNull) as Prisma.InputJsonValue,
      draftSelfAssessment: (it.draftSelfAssessment ?? Prisma.DbNull) as Prisma.InputJsonValue,
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
        tagStatus: o.tagStatus ?? null,
        attractorLine: o.attractorLine ?? null, defeaterLine: o.defeaterLine ?? null,
        attractorQuote: o.attractorQuote ?? null, defeaterQuote: o.defeaterQuote ?? null,
        windowClass: o.windowClass ?? null, a36Note: o.a36Note ?? null,
        defeatedByAbsence: o.defeatedByAbsence ?? null })) } },
    })),
  ]);
  console.log(`\nLANDED ${writable.length} item(s) as DRAFT in one transaction.`);
  await prisma.$disconnect();
}

void main();
