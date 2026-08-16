/**
 * THE DATABASE EMITS A MANIFEST IN COWORK'S SCHEMA — `pnpm emit:manifest`
 *
 * Two manifests with the same schema is the only thing that has ever made the two stores
 * comparable (David, 2026-08-13). Every prior comparison was a live query on one side against a
 * file of unknown vintage on the other, and six deliveries of findings rested on it.
 *
 * REGENERATED, NEVER EDITED. This is a derivative of the database, the same way the gate library
 * is. If it disagrees with the store, the store wins and this is re-run — there is no case in
 * which the right move is to edit the file.
 *
 * WHAT IT CARRIES, and why each field is here rather than obvious:
 *   · stemSha / keySha    the content hashes a comparison actually turns on.
 *   · optionCount, tier   cheap structural facts that catch a truncated or re-tiered item.
 *   · lineRefs            the citation field, sorted, or ABSENT. Two shapes exist across the two
 *                         stores (item-level on Cowork, stem-nested here); this reports WHERE it
 *                         was found so the migration is measurable rather than assumed.
 *   · declarative[]       ALL 39 of Cowork's declarative field paths, present or not, and WHERE
 *                         this store carries each one. A path is never silently skipped: an
 *                         unrecognised field REFUSES the emit, so a field Cowork adds next month
 *                         stops the pipeline instead of vanishing from the comparison.
 *   · segmentsInOptions   THE FIELD A HASH COMPARISON CANNOT SEE. The 18 error-spot items are
 *                         byte-identical across both stores and mean something different
 *                         depending on this flag. It was found by accident; a manifest without it
 *                         would compare clean over exactly the difference it exists to catch.
 *
 * NOT A GUARD. This emits; comparison is a separate step reading two manifests. Keeping them
 * apart is what stops the comparison quietly re-deriving one side from the other.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { prisma } from '../packages/db/src/index';
import {
  DECLARATIVE_FIELDS,
  MODELLED_FIELDS,
  MODELLED_PATHS,
  PROVENANCE_FIELDS,
} from '../packages/core/src/english/declarative-fields';

/** Everything the manifest tracks: the 39 declarative plus the provenance fields ruled to cross. */
const TRACKED_FIELDS = [...DECLARATIVE_FIELDS, ...PROVENANCE_FIELDS];

const DEST = process.env.MANIFEST_PATH
  ?? resolve(import.meta.dirname, '../content/exports/MANIFEST-PLATFORM-STORE.json');

const sha = (s: string): string => createHash('sha256').update(s).digest('hex');

/** Option text under either envelope, so a shape change cannot masquerade as a text change. */
const optionText = (c: unknown): string =>
  typeof c === 'string'
    ? c
    : c && typeof c === 'object' && 'value' in c
      ? String((c as { value: unknown }).value)
      : '';

/**
 * WHERE THIS STORE ACTUALLY CARRIES A DECLARATIVE FIELD, and whether it carries it at all.
 *
 * The emitter records PRESENCE and LOCATION. It does NOT classify the absence — DROPPED and
 * EMPTY are both "absent here" seen from one side, so the three-state call is a property of the
 * DIFF, not of either manifest (David's correction, 2026-08-13). An emitter that guessed would
 * manufacture a state it cannot observe.
 *
 * `foundAt` is the point of the whole exercise: `lineRefs` nested in stem here against item level
 * on Cowork is a real difference that a presence-only boolean would report as agreement.
 */
function probe(
  path: string,
  ctx: { top: Record<string, unknown>; stem: Record<string, unknown>; explanation: Record<string, unknown>;
         options: Array<Record<string, unknown>>; optionTagCount: number },
): { present: boolean; foundAt: string | null } {
  const has = (o: unknown, k: string): boolean =>
    !!o && typeof o === 'object' && k in (o as object) && (o as Record<string, unknown>)[k] != null;
  const bare = path.replace(/\[\]$/, '');

  // Name the COLUMN, not its table. A shared label reads as a shared carrier to the collapse
  // check below — and it caught exactly that here on its first run.
  if (bare === 'difficultyTier') return { present: true, foundAt: 'Item.difficultyTier' };
  if (bare === 'questionTypeId') return { present: true, foundAt: 'Item.questionTypeId' };
  if (path === 'misconceptions[]') {
    const any = ctx.options.some((o) => o.misconceptionId != null);
    return { present: any, foundAt: any ? 'ItemOption.misconceptionId (MODELLED)' : null };
  }
  if (path === 'options[].secondaryMisconceptionId') {
    return { present: ctx.optionTagCount > 0, foundAt: ctx.optionTagCount > 0 ? 'ItemOptionTag (MODELLED)' : null };
  }
  if (bare.startsWith('options[].')) {
    const k = bare.slice(10);
    const any = ctx.options.some((o) => has(o, k));
    return { present: any, foundAt: any ? `ItemOption.${k}` : null };
  }
  if (bare.startsWith('stem.quotes[].')) {
    const k = bare.slice(14);
    const q = ctx.stem.quotes;
    const any = Array.isArray(q) && q.some((x) => has(x, k));
    return { present: any, foundAt: any ? `stem.quotes[].${k}` : null };
  }
  if (bare.startsWith('explanation.quotes[].')) {
    const k = bare.slice(21);
    const q = ctx.explanation.quotes;
    const any = Array.isArray(q) && q.some((x) => has(x, k));
    return { present: any, foundAt: any ? `explanation.quotes[].${k}` : null };
  }
  if (bare.startsWith('stem.')) {
    const k = bare.slice(5);
    return has(ctx.stem, k) ? { present: true, foundAt: `stem.${k}` } : { present: false, foundAt: null };
  }
  /**
   * Remaining paths could sit at item level OR nested in stem, and reporting WHICH is the point —
   * `lineRefs` found at `stem.lineRefs` is the migration measure, not an incidental detail.
   *
   * BUT NOT WHEN A STEM TWIN IS DECLARED. `testedTokens[]` and `stem.testedTokens[]` are the two
   * sides of a collision David ruled on (item level wins, the stem copy migrates). Searching the
   * stem for the item-level path made both rows read 9/x at `stem.testedTokens` — the winner
   * reported as present when it holds nothing, and the migration invisible. A declared stem twin
   * means the two paths are distinct fields BY RULING, so the item-level probe stays at item level.
   */
  const seg = bare.split('.');
  const root = seg[0]!;
  const hasStemTwin = TRACKED_FIELDS.some((f) => f.path.replace(/\[\]$/, '') === `stem.${bare}`);
  const holders = hasStemTwin
    ? ([['item', ctx.top]] as const)
    : ([['item', ctx.top], ['stem', ctx.stem]] as const);
  for (const [label, holder] of holders) {
    const base = holder[root];
    if (seg.length === 1) { if (has(holder, root)) return { present: true, foundAt: `${label}.${root}` }; continue; }
    if (base && typeof base === 'object') {
      let cur: unknown = base;
      let ok = true;
      for (const k of seg.slice(1)) { if (!has(cur, k)) { ok = false; break; } cur = (cur as Record<string, unknown>)[k]; }
      if (ok) return { present: true, foundAt: `${label}.${bare}` };
    }
  }
  return { present: false, foundAt: null };
}

async function main(): Promise<void> {
  const items = await prisma.item.findMany({
    where: { id: { startsWith: 'ENG-' } },
    include: { options: { orderBy: { id: 'asc' } }, questionType: true },
    orderBy: { id: 'asc' },
  });

  // The MODELLED carrier for options[].secondaryMisconceptionId. Counted, not assumed.
  const tags = await prisma.itemOptionTag.findMany({ select: { optionId: true } });
  const optionToItem = new Map(items.flatMap((it) => it.options.map((o) => [o.id, it.id] as const)));
  const tagsByItem = new Map<string, number>();
  for (const t of tags) {
    const iid = optionToItem.get(t.optionId);
    if (iid) tagsByItem.set(iid, (tagsByItem.get(iid) ?? 0) + 1);
  }

  const rows = items.map((it) => {
    const stem = (it.stem ?? {}) as Record<string, unknown>;
    const prompt = typeof stem.prompt === 'string' ? stem.prompt
      : typeof stem.text === 'string' ? stem.text : null;
    const key = it.options.find((o) => o.isCorrect);

    // WHERE lineRefs lives is part of the record, not a detail. `stem` here, `item` on Cowork.
    const stemRefs = Array.isArray(stem.lineRefs) ? (stem.lineRefs as number[]) : null;
    return {
      id: it.id,
      cluster: it.id.slice(0, 7),
      questionTypeId: it.questionTypeId,
      mechanic: it.questionType.mechanic,
      status: it.status,
      tier: it.difficultyTier,
      // null, not '', when the field is absent. Absence must not read as an empty prompt.
      stemSha: prompt === null ? null : sha(prompt),
      stemAbsent: prompt === null,
      optionCount: it.options.length,
      keySha: key ? sha(optionText(key.content)) : null,
      keyAbsent: !key,
      optionShape: it.options.every((o) => typeof o.content === 'object') ? 'object'
        : it.options.every((o) => typeof o.content === 'string') ? 'string' : 'mixed',
      lineRefs: stemRefs ? [...stemRefs].sort((a, b) => a - b) : null,
      lineRefsLocation: stemRefs ? 'stem' : 'ABSENT',
      segmentsInOptions: stem.segmentsInOptions === true,
      // Presence + location for all 39. `null` foundAt means ABSENT HERE — not DROPPED; the diff
      // decides that, because DROPPED and EMPTY are indistinguishable from one side.
      declarative: Object.fromEntries(
        TRACKED_FIELDS.map((f) => [
          f.path,
          probe(f.path, {
            top: it as unknown as Record<string, unknown>,
            stem,
            explanation: ((it.stem as { explanation?: unknown })?.explanation
              ?? (it as unknown as { explanation?: unknown }).explanation
              ?? {}) as Record<string, unknown>,
            options: it.options as unknown as Array<Record<string, unknown>>,
            optionTagCount: tagsByItem.get(it.id) ?? 0,
          }),
        ]),
      ) as Record<string, { present: boolean; foundAt: string | null }>,
    };
  });

  const byCluster: Record<string, { items: number; itemIds: string[] }> = {};
  for (const r of rows) {
    byCluster[r.cluster] ??= { items: 0, itemIds: [] };
    byCluster[r.cluster]!.items += 1;
    byCluster[r.cluster]!.itemIds.push(r.id);
  }

  const body = {
    kind: 'item-manifest',
    schema: 'cowork-manifest-v1',
    source: 'cluecrew-platform-db',
    emittedAt: new Date().toISOString(),
    counts: {
      items: rows.length,
      clusters: Object.keys(byCluster).length,
      stemAbsent: rows.filter((r) => r.stemAbsent).length,
      keyAbsent: rows.filter((r) => r.keyAbsent).length,
      carryingLineRefs: rows.filter((r) => r.lineRefs !== null).length,
      segmentsInOptions: rows.filter((r) => r.segmentsInOptions).length,
      optionShapeString: rows.filter((r) => r.optionShape === 'string').length,
      optionShapeMixed: rows.filter((r) => r.optionShape === 'mixed').length,
    },
    /**
     * ONE LINE PER DECLARATIVE FIELD: how many rows here carry it, against Cowork's count, and
     * where. This is the object the comparison reads; `rows[].declarative` is the evidence under it.
     */
    declarativeFields: TRACKED_FIELDS.map((f) => {
      const carrying = rows.filter((r) => r.declarative[f.path]?.present);
      const locations = [...new Set(carrying.map((r) => r.declarative[f.path]!.foundAt!))].sort();
      return {
        path: f.path,
        weight: f.weight,
        coworkCount: f.coworkCount,
        platformCount: carrying.length,
        foundAt: locations,
        modelled: MODELLED_PATHS.has(f.path),
        class: DECLARATIVE_FIELDS.includes(f) ? 'declarative' : 'provenance',
        note: f.note ?? null,
      };
    }),
    /** Declared, never inferred — a field misfiled MODELLED hides a real loss. */
    modelledRegistry: MODELLED_FIELDS,
    byCluster,
    rows,
  };
  /**
   * REFUSE ON A COLLAPSED CARRIER. Two declared paths resolving to one location means the emitter
   * has read one fact and reported it as two — the shape of the testedTokens collision, which read
   * clean until the numbers were compared side by side. MODELLED paths are exempt: they are
   * DECLARED to share a carrier, which is the whole content of the declaration.
   */
  const seen = new Map<string, string>();
  const collapsed: string[] = [];
  for (const f of body.declarativeFields) {
    if (f.modelled || f.foundAt.length === 0) continue;
    for (const loc of f.foundAt) {
      const prev = seen.get(loc);
      if (prev) collapsed.push(`${prev} and ${f.path} both resolve to ${loc}`);
      else seen.set(loc, f.path);
    }
  }
  if (collapsed.length > 0) {
    console.error(`\nREFUSED — ${collapsed.length} declared field(s) share a carrier with another:`);
    for (const c of collapsed) console.error(`  x ${c}`);
    console.error('One fact reported as two. Nothing was written.');
    await prisma.$disconnect();
    process.exit(1);
  }

  const json = JSON.stringify(body, null, 2);
  mkdirSync(dirname(DEST), { recursive: true });
  writeFileSync(DEST, json);

  console.log(`emitted ${rows.length} rows across ${Object.keys(byCluster).length} clusters -> ${DEST}`);
  console.log(`  manifest sha256: ${sha(json).slice(0, 16)}`);
  console.log(`  ${JSON.stringify(body.counts)}`);
  console.log(`  per cluster: ${Object.entries(byCluster).map(([c, v]) => `${c}=${v.items}`).join(' ')}`);

  const df = body.declarativeFields;
  const absent = df.filter((f) => f.platformCount === 0);
  console.log(`\n  declarative fields carried: ${df.length - absent.length} of ${df.length} (${absent.length} absent here)`);
  for (const f of df.filter((x) => x.platformCount > 0)) {
    console.log(`    ok ${f.path.padEnd(38)} ${String(f.platformCount).padStart(3)}/${f.coworkCount} @ ${f.foundAt.join(', ')}${f.modelled ? '  [MODELLED]' : ''}`);
  }
  for (const f of absent) {
    console.log(`    -- ${f.path.padEnd(38)}   0/${f.coworkCount}  ${f.weight.toUpperCase()}${f.modelled ? '  [MODELLED, unpopulated]' : ''}`);
  }
  await prisma.$disconnect();
}

void main();
