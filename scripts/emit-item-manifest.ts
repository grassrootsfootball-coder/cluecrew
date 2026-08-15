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

async function main(): Promise<void> {
  const items = await prisma.item.findMany({
    where: { id: { startsWith: 'ENG-' } },
    include: { options: { orderBy: { id: 'asc' } }, questionType: true },
    orderBy: { id: 'asc' },
  });

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
    byCluster,
    rows,
  };
  const json = JSON.stringify(body, null, 2);
  mkdirSync(dirname(DEST), { recursive: true });
  writeFileSync(DEST, json);

  console.log(`emitted ${rows.length} rows across ${Object.keys(byCluster).length} clusters -> ${DEST}`);
  console.log(`  manifest sha256: ${sha(json).slice(0, 16)}`);
  console.log(`  ${JSON.stringify(body.counts)}`);
  console.log(`  per cluster: ${Object.entries(byCluster).map(([c, v]) => `${c}=${v.items}`).join(' ')}`);
  await prisma.$disconnect();
}

void main();
