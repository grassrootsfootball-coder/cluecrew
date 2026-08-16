/**
 * CARRY THE NINE CONTENT KEYS — `pnpm carry:content-keys [--write]`
 *
 * Eleven keys in the ENG-001/002/003 files were outside the registry. Two proved VINTAGE —
 * `passageId` and `lineRef`, identical to `passageRef`/`lineRefs` on 22 of 22 — and do not cross.
 * The other nine each hold a fact that exists nowhere else, and they cross before those files go
 * (David, 2026-08-16).
 *
 * `stemRedraft` IS SPLIT, AND THE SPLIT IS WHY THIS SCRIPT EXISTS AT ALL. Cowork ruled that `why`
 * crosses — pp-19's records a corrected misquotation, one occurrence in the entire store — and that
 * `before` does not, being superseded stem text recoverable from the 2026-08-02 snapshots.
 *
 * THE PREMISE WAS TESTED AND IT HOLDS FOR TWO OF FIVE. Searching every file on disk for each
 * `before` text: WIW-18 is in the Aug-2 `ENG001windinwillows.json`; pp-19 is in the Aug-2 review
 * pack and walk-script export; pp-08 is in a calibration-log section and an authoring skill doc.
 * **pp-11 and pp-16 appear in no artefact that is not itself a copy of `stemRedraft`.** For those
 * two, this field IS the only copy, and every location is under `~/Downloads/11+`, which carries no
 * source of truth and has been cleaned under instruction before.
 *
 * David's ruling was a disjunction: "either `before` crosses or the snapshots are promoted to
 * ARCHIVE". Promotion cannot save pp-11 and pp-16 because no snapshot holds them, so the
 * disjunction resolves one way and `before` crosses — not as an override of the ruling but as its
 * only surviving branch. It is stored under `beforePreservedPendingRuling` so the carriage is
 * visibly provisional rather than quietly reclassified as content.
 *
 * `draftingOrder` → `draftingMethod` was a rename AND a correction of my reading. I had proposed
 * dropping it as "the order the drafting pass wrote items in". Every value is the string
 * "mechanism-first (Addendum 20)" and it equals `orderAnchor` on 0 of 60 here, 0 of 251 across the
 * district. A column built to the old name would have rejected or corrupted every one.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { Prisma, prisma } from '../packages/db/src/index';

const SEARCH = [
  '/Users/davidb/Downloads/11+',
  '/Users/davidb/Downloads/11+/items',
  '/Users/davidb/Downloads/11+/from-cluecrew',
];
const DAVID = 'human:david@cluecrew.test';

/** Cowork key → column. `draftingOrder` is read under its pre-rename name; it lands renamed. */
const STRING_KEYS: Record<string, string> = {
  itemModel: 'itemModel',
  passageFlag: 'passageFlag',
  r4Note: 'r4Note',
  banListExceptionResolved: 'banListExceptionResolved',
  draftingOrder: 'draftingMethod',
};
const JSON_KEYS: Record<string, string> = {
  banListException: 'banListException',
  importDoorFix: 'importDoorFix',
  stemRedraft: 'stemRedraft',
};

const canonical = (v: unknown): string => {
  const walk = (x: unknown): unknown => {
    if (Array.isArray(x)) return x.map(walk);
    if (x && typeof x === 'object') {
      return Object.fromEntries(Object.keys(x as object).sort().map((k) => [k, walk((x as Record<string, unknown>)[k])]));
    }
    return x;
  };
  return JSON.stringify(walk(v));
};

/** `why` crosses by ruling; `before` is preserved under a name that says it is provisional. */
function shapeStemRedraft(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== 'object') return null;
  const { before, ...rest } = v as Record<string, unknown>;
  return before === undefined ? rest : { ...rest, beforePreservedPendingRuling: before };
}

async function main(): Promise<void> {
  const write = process.argv.includes('--write');

  const claims = new Map<string, Record<string, unknown>>();
  const conflicts: string[] = [];
  const optionTags: Array<{ itemId: string; label: string; misconceptionId: string }> = [];

  for (const dir of SEARCH) {
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      if (!name.endsWith('.json')) continue;
      const raw = readFileSync(join(dir, name), 'utf8');
      let parsed: unknown;
      try { parsed = JSON.parse(raw); } catch { continue; }
      const items = (parsed as { items?: unknown }).items;
      if (!Array.isArray(items)) continue;
      const sha = createHash('sha256').update(raw).digest('hex').slice(0, 16);
      let carried = 0;
      for (const it of items as Array<Record<string, unknown>>) {
        if (typeof it?.itemId !== 'string') continue;
        const held = claims.get(it.itemId) ?? {};
        for (const key of [...Object.keys(STRING_KEYS), ...Object.keys(JSON_KEYS)]) {
          const v = it[key];
          if (v === undefined || v === null || v === '') continue;
          const shaped = key === 'stemRedraft' ? shapeStemRedraft(v) : v;
          if (held[key] !== undefined && canonical(held[key]) !== canonical(shaped)) {
            conflicts.push(`${it.itemId}.${key}: copies disagree (${sha})`);
            continue;
          }
          held[key] = shaped;
          carried += 1;
        }
        for (const [i, o] of (Array.isArray(it.options) ? it.options : []).entries()) {
          const sec = (o as Record<string, unknown>)?.secondaryMisconceptionId;
          if (typeof sec === 'string' && sec) {
            const label = String((o as { label?: unknown }).label ?? ['A', 'B', 'C', 'D', 'E', 'F'][i] ?? i);
            if (!optionTags.some((t) => t.itemId === it.itemId && t.label === label)) {
              optionTags.push({ itemId: it.itemId, label, misconceptionId: sec });
            }
          }
        }
        if (Object.keys(held).length) claims.set(it.itemId, held);
      }
      if (carried > 0) console.log(`  sha ${sha}  ${carried.toString().padStart(3)} value(s)  ${name}`);
    }
  }

  if (conflicts.length > 0) {
    console.error(`\nREFUSED — ${conflicts.length} value(s) disagree between copies:`);
    for (const c of conflicts.slice(0, 10)) console.error(`  x ${c}`);
    await prisma.$disconnect();
    process.exit(1);
  }

  const rows = await prisma.item.findMany({
    where: { id: { in: [...claims.keys()] } },
    select: {
      id: true, itemModel: true, passageFlag: true, r4Note: true, banListException: true,
      banListExceptionResolved: true, importDoorFix: true, stemRedraft: true, draftingMethod: true,
      options: { select: { id: true, content: true } },
    },
  });
  const byId = new Map(rows.map((r) => [r.id, r]));

  const updates: Array<{ id: string; data: Record<string, unknown>; keys: string[] }> = [];
  const perKey: Record<string, number> = {};
  const absent: string[] = [];
  for (const [id, held] of claims) {
    const row = byId.get(id);
    if (!row) { absent.push(id); continue; }
    const data: Record<string, unknown> = {};
    const keys: string[] = [];
    for (const [src, col] of Object.entries({ ...STRING_KEYS, ...JSON_KEYS })) {
      if (held[src] === undefined) continue;
      const cur = (row as unknown as Record<string, unknown>)[col];
      if (cur !== null && cur !== undefined) {
        if (canonical(cur) !== canonical(held[src])) conflicts.push(`${id}.${col}: db and file disagree`);
        continue;
      }
      data[col] = held[src];
      keys.push(col);
      perKey[col] = (perKey[col] ?? 0) + 1;
    }
    if (keys.length) updates.push({ id, data, keys });
  }

  // The MODELLED carrier: a second tag per option, which the schema has held with 0 rows.
  const tagPlans: Array<{ optionId: string; misconceptionId: string; itemId: string }> = [];
  const unmatchedTags: string[] = [];
  const knownMis = new Set((await prisma.misconception.findMany({ select: { id: true } })).map((m) => m.id));
  for (const t of optionTags) {
    const row = byId.get(t.itemId);
    if (!row) { unmatchedTags.push(`${t.itemId}: item not in the database`); continue; }
    if (!knownMis.has(t.misconceptionId)) { unmatchedTags.push(`${t.itemId}/${t.label}: ${t.misconceptionId} is not in the library`); continue; }
    const opt = row.options.find((o) => String((o.content as { label?: unknown })?.label ?? '') === t.label);
    if (!opt) { unmatchedTags.push(`${t.itemId}/${t.label}: no option with that label`); continue; }
    tagPlans.push({ optionId: opt.id, misconceptionId: t.misconceptionId, itemId: t.itemId });
  }

  console.log(`\n${claims.size} item(s) carry at least one of the nine · ${rows.length} present in the database`);
  for (const [k, v] of Object.entries(perKey).sort()) console.log(`  ${k.padEnd(26)} ${v}`);
  console.log(`  secondaryMisconceptionId -> ItemOptionTag: ${tagPlans.length}`);
  if (absent.length) console.log(`  ${absent.length} claimed item(s) are not in the database`);
  if (unmatchedTags.length) {
    console.log(`\n${unmatchedTags.length} secondary tag(s) could not be placed:`);
    for (const u of unmatchedTags) console.log(`  ? ${u}`);
  }
  if (conflicts.length > 0) {
    console.error(`\nREFUSED — ${conflicts.length} value(s) present on both sides and disagreeing:`);
    for (const c of conflicts) console.error(`  x ${c}`);
    await prisma.$disconnect();
    process.exit(1);
  }
  if (updates.length === 0 && tagPlans.length === 0) {
    console.log('\nNothing to carry: every value the source holds is already present.');
    await prisma.$disconnect();
    return;
  }
  if (!write) {
    console.log('\nDry run. Re-run with --write to apply.');
    await prisma.$disconnect();
    return;
  }

  await prisma.$transaction([
    ...updates.map((u) => prisma.item.update({ where: { id: u.id }, data: u.data as Prisma.ItemUpdateInput })),
    ...tagPlans.map((t) => prisma.itemOptionTag.create({
      // PROCESS, not TOPIC: TOPIC is the legacy single tag already held on ItemOption
      // .misconceptionId, and a second tag in the same role would collide on @@unique.
      data: { optionId: t.optionId, misconceptionId: t.misconceptionId, role: 'PROCESS' },
    })),
  ]);
  for (const u of updates) {
    await prisma.attributionEvent.create({
      data: {
        recordType: 'item', recordId: u.id, action: 'AMENDED',
        actor: DAVID, recordedBy: DAVID, field: u.keys.join(', '),
        method: 'Nine content keys carried, 2026-08-16',
        note:
          `Carried ${u.keys.join(', ')} from the Cowork source unchanged. Each holds a fact that ` +
          'exists nowhere else; passageId and lineRef were the two of eleven that proved vintage ' +
          'and did not cross. No child-facing text changed.',
      },
    });
  }

  const after = await prisma.item.findMany({
    where: { id: { in: updates.map((u) => u.id) } },
    select: {
      id: true, itemModel: true, passageFlag: true, r4Note: true, banListException: true,
      banListExceptionResolved: true, importDoorFix: true, stemRedraft: true, draftingMethod: true,
    },
  });
  const planById = new Map(updates.map((u) => [u.id, u]));
  let ok = 0;
  for (const r of after) {
    const u = planById.get(r.id)!;
    if (u.keys.every((k) => canonical((r as unknown as Record<string, unknown>)[k]) === canonical(u.data[k]))) ok += 1;
  }
  const tagCount = await prisma.itemOptionTag.count();
  console.log(`\nVERIFIED by re-reading all ${after.length} rows:`);
  console.log(`  holding every carried value: ${ok} of ${after.length}`);
  console.log(`  ItemOptionTag rows now: ${tagCount} (was 0)`);
  await prisma.$disconnect();
}

void main();
