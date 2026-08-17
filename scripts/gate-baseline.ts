/**
 * BEFORE / AFTER FOR A CHANGE TO AN INSTRUMENT THAT ALREADY REPORTS FAILURES —
 * `pnpm gate:baseline capture <file>` then `pnpm gate:baseline diff <before> <after>`.
 *
 * **THE RULE THIS EXISTS TO MAKE CHEAP (David, 2026-08-16): any change to a gate whose output is
 * already non-zero is measured against a baseline captured BEFORE the edit.** Not a rule about
 * gates — a rule about changing instruments that already have a non-zero output, where a re-run
 * gives you a total and no way to tell which rows are new.
 *
 * Twice in one evening a correct-looking change to `checkItemChildFacing` produced faults that
 * looked like content defects and were mine:
 *   · the multi-quote gate, where every stem declaring two spans reported the others as broken;
 *   · `exemptSpans` passed raw while `quotedSpans` was filtered, which newly failed SIX items
 *     including two LIVE ones on a signed cluster.
 * Both said *"declares a quoted span that is not in the text"* — a sentence that reads as bad
 * authoring. With 49 already blocked, the after-run says 55 and points at nothing. **The next move
 * without a baseline is reading the content instead of reading your own diff.**
 *
 * It is the same lesson as the fabricated 90% divergence (R142) in a third costume: **trust the
 * diff, not the count** — and a measurement that confirms what you just did is the one to distrust.
 *
 * Deliberately dumb: it snapshots every item's blocking faults and diffs two snapshots. No
 * thresholds, no cleverness, nothing to tune.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { checkItemChildFacing, isBlocking } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';

type Snapshot = Record<string, string[]>;

async function capture(path: string): Promise<void> {
  const items = await prisma.item.findMany({
    include: { options: { orderBy: { id: 'asc' } }, questionType: { select: { mechanic: true } } },
    orderBy: { id: 'asc' },
  });
  const out: Snapshot = {};
  for (const i of items) {
    out[i.id] = checkItemChildFacing({
      id: i.id, stem: i.stem, explanation: i.explanation,
      mechanic: i.questionType.mechanic, options: i.options,
    }).filter(isBlocking).map((f) => `${f.rule}|${f.where}|${f.detail}`).sort();
  }
  writeFileSync(path, JSON.stringify(out, null, 1));
  const blocked = Object.values(out).filter((v) => v.length).length;
  console.log(`captured ${items.length} item(s) · ${blocked} with a blocking fault -> ${path}`);
  console.log('Now make the change, capture again, and diff. A total alone cannot tell you which rows moved.');
}

function diff(beforePath: string, afterPath: string): void {
  const before = JSON.parse(readFileSync(beforePath, 'utf8')) as Snapshot;
  const after = JSON.parse(readFileSync(afterPath, 'utf8')) as Snapshot;
  const ids = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort();

  const newlyPass = ids.filter((i) => (before[i]?.length ?? 0) > 0 && (after[i]?.length ?? 0) === 0);
  const newlyFail = ids.filter((i) => (before[i]?.length ?? 0) === 0 && (after[i]?.length ?? 0) > 0);
  const changed = ids.filter((i) =>
    (before[i]?.length ?? 0) > 0 && (after[i]?.length ?? 0) > 0
    && JSON.stringify(before[i]) !== JSON.stringify(after[i]));
  const gone = ids.filter((i) => before[i] && !after[i]);
  const added = ids.filter((i) => !before[i] && after[i]);

  const b = Object.values(before).filter((v) => v.length).length;
  const a = Object.values(after).filter((v) => v.length).length;
  console.log(`blocked ${b} -> ${a}   (a total, and on its own it tells you nothing)\n`);
  console.log(`  newly PASS      ${newlyPass.length}`);
  console.log(`  newly FAIL      ${newlyFail.length}`);
  console.log(`  same item, DIFFERENT faults  ${changed.length}`);
  if (gone.length || added.length) {
    console.log(`  items absent from one side: ${gone.length} gone, ${added.length} added — the POPULATION moved, so`);
    console.log('  the two snapshots are not comparable row for row. Re-capture both before reading further.');
  }

  for (const [label, list] of [['NEWLY FAIL', newlyFail], ['NEWLY PASS', newlyPass], ['CHANGED', changed]] as const) {
    if (!list.length) continue;
    console.log(`\n${label}:`);
    for (const id of list) {
      console.log(`  ${id}`);
      for (const f of (before[id] ?? []).filter((x) => !(after[id] ?? []).includes(x))) console.log(`    - ${f.slice(0, 130)}`);
      for (const f of (after[id] ?? []).filter((x) => !(before[id] ?? []).includes(x))) console.log(`    + ${f.slice(0, 130)}`);
    }
  }
  if (!newlyPass.length && !newlyFail.length && !changed.length) {
    console.log('\n  NOTHING MOVED. Every item reports exactly what it reported before.');
  } else {
    console.log('\n  READ EVERY ROW ABOVE AGAINST YOUR OWN DIFF BEFORE READING IT AS A CONTENT FAULT.');
    console.log('  Twice in one evening these were the instrument, not the content, and both said');
    console.log('  "declares a quoted span that is not in the text" — which reads as bad authoring.');
  }
}

async function main(): Promise<void> {
  const [mode, ...rest] = process.argv.slice(2);
  if (mode === 'capture' && rest[0]) { await capture(rest[0]); await prisma.$disconnect(); return; }
  if (mode === 'diff' && rest[0] && rest[1]) { diff(rest[0], rest[1]); await prisma.$disconnect(); return; }
  console.error('usage: pnpm gate:baseline capture <file>');
  console.error('       pnpm gate:baseline diff <before> <after>');
  await prisma.$disconnect();
  process.exit(1);
}

void main();
