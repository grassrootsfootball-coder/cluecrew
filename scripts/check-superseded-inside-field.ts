/**
 * IS A SUPERSEDED VALUE STORED INSIDE THE FIELD IT SUPERSEDES? (David, 2026-08-21 — R358; FAILS from R1042.)
 *
 * `_previousText` inside `stem`, `_previousWalkScript` inside `explanation`, `_previousValue` inside an
 * option's `content`: **anything walking the container reads the superseded value as live** — and the
 * child-facing gate walks exactly those containers. The gate skips them (`isSuperseded` in
 * item-content-gate.ts); that is a reader-side guard and not a repair.
 *
 * R1042 carried out the migration R358 deferred: every such value moved to the `superseded` sibling
 * column (`scripts/move-superseded-outside-field.ts`), the shape Cowork adopted. So this now FAILS on
 * any instance, at ANY depth, in `stem`, `explanation` or any option's `content`. The first version
 * looked at the top level of two containers and so never saw `stem.quotes[n]._previousText` or the
 * 116 option `_previousValue`s — a check reporting a subset as the population (R595).
 *
 * The fix for a new instance is never to rename the key: move the old value into `superseded` (the
 * helpers are in `scripts/lib/superseded.ts`), or leave it to the door's changeset and git (R1041).
 */
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';
import { assertFixture } from './lib/carried-fixture';
import { findInside, readColumn, describe, type SupersededEntry } from './lib/superseded';

/**
 * HELD, NOT MOVED — FROZEN BY ID, WITH THE EXACT COUNT (R1042). The reviewed door declined to re-sign
 * these three: the test word SPAS is a British playground slur, so the LIVE content needs a new word,
 * which is an authoring decision and not this migration's. Moving their keys would stop the existing
 * pin reproducing with nothing signed in its place, so they stay where they are until the word is
 * replaced through a door — then their `_`-keys move with it and the entry is deleted.
 * Printed on every run. A NEW instance on any other row fails; a count that changes on one of these
 * fails; an entry that no longer matches anything fails as stale, so the freeze cannot outlive its cause.
 */
const HELD: Record<string, { instances: number; why: string }> = {
  // Empty since 2026-11-23: the three SPAS rows were rewritten through the vr19-spas door (R1048)
  // and their keys moved out with the rewrite. A new entry needs a named reviewer HOLD behind it.
};

async function main() {
  // R721: a carried fixture, so the instrument is proven before its zero is read.
  assertFixture<{ stem: unknown; content: unknown }>('check:superseded-inside-field', [
    { name: 'top-level _previousText beside text', input: { stem: { text: 'New.', _previousText: 'Old.' }, content: {} }, mustBeCaught: true },
    { name: 'nested inside a quotes array', input: { stem: { quotes: [{ text: 'a' }, { text: 'b', _previousText: 'c' }] }, content: {} }, mustBeCaught: true },
    { name: 'inside an option content', input: { stem: {}, content: { value: 'x', _previousValue: 'y' } }, mustBeCaught: true },
    { name: 'a clean row is caught by nothing', input: { stem: { text: 'Which word?', quotes: [{ text: 'a' }] }, content: { value: 'x', label: 'A' } }, mustBeCaught: false },
  ], (r) => findInside(r.stem, 'stem').length + findInside(r.content, 'content').length > 0);

  const items = await prisma.item.findMany({
    select: { id: true, status: true, stem: true, explanation: true, superseded: true,
      options: { select: { id: true, content: true, superseded: true }, orderBy: { id: 'asc' } } },
  });
  const options = items.reduce((n, i) => n + i.options.length, 0);
  requirePopulation('check:superseded-inside-field', { 'item(s) screened': items.length, 'option(s) screened': options });

  const found: Array<{ itemId: string; id: string; status: string; e: SupersededEntry }> = [];
  let historyEntries = 0;
  for (const i of items) {
    for (const e of [...findInside(i.stem, 'stem'), ...findInside(i.explanation, 'explanation')]) found.push({ itemId: i.id, id: i.id, status: i.status, e });
    historyEntries += readColumn(i.superseded).entries.length;
    for (const o of i.options) {
      for (const e of findInside(o.content, 'content')) found.push({ itemId: i.id, id: `${i.id} option ${o.id}`, status: i.status, e });
      historyEntries += readColumn(o.superseded).entries.length;
    }
  }

  console.log(`\ncheck:superseded-inside-field: screened ${items.length} items and ${options} options at every depth of stem, explanation and option content.`);
  console.log(`  History held OUTSIDE the containers, in the superseded column: ${historyEntries} entr${historyEntries === 1 ? 'y' : 'ies'}.`);

  const perItem = found.reduce((m, f) => m.set(f.itemId, (m.get(f.itemId) ?? 0) + 1), new Map<string, number>());
  const stale = Object.entries(HELD).filter(([id, h]) => perItem.get(id) !== h.instances);
  const heldNow = Object.keys(HELD).filter((id) => perItem.get(id) === HELD[id]!.instances);
  if (heldNow.length) {
    console.log(`  HELD, NOT MOVED — ${heldNow.length} row(s), frozen by id and count:`);
    for (const id of heldNow) console.log(`    ${id}: ${HELD[id]!.instances} instance(s) — ${HELD[id]!.why}`);
  }
  if (stale.length) {
    console.error(`\n  STALE HELD ENTRY — ${stale.length}: the frozen count no longer matches the row. If the row was repaired, delete its entry; if it grew, that is a new instance.`);
    for (const [id, h] of stale) console.error(`    ${id}: frozen at ${h.instances}, found ${perItem.get(id) ?? 0}`);
    process.exitCode = 1;
  }
  const fresh = found.filter((f) => !heldNow.includes(f.itemId));
  if (fresh.length === 0) {
    console.log(`  0 superseded values inside the field they supersede, outside the ${heldNow.length} held row(s).`);
    await prisma.$disconnect();
    return;
  }

  const byShape = new Map<string, string[]>();
  for (const f of fresh) {
    const shape = describe(f.e).replace(/\[\d+\]/g, '[]');
    byShape.set(shape, [...(byShape.get(shape) ?? []), `${f.id} (${f.status})`]);
  }
  console.error(`\nSUPERSEDED VALUE STORED INSIDE ITS OWN CONTAINER: ${fresh.length} instance(s), ${byShape.size} shape(s) — FAIL (R358, R1042)`);
  for (const [shape, ids] of [...byShape].sort()) {
    console.error(`  ${shape}\n      ${ids.length}: ${ids.slice(0, 6).join(', ')}${ids.length > 6 ? ' …' : ''}`);
  }
  console.error(
    '\n  Anything walking the container reads these as LIVE. Move the old value into the row\'s `superseded`\n' +
      '  column (scripts/lib/superseded.ts), or drop it and rely on the door changeset and git (R1041).\n' +
      '  Renaming the key does not fix it: every `_`-key at any depth is the same fault.',
  );
  process.exitCode = 1;
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
