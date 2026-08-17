/**
 * DOES EACH CLOZE ITEM CLAIM A GAP THAT EXISTS, ONCE? — `pnpm check:cloze-gaps`
 *
 * Three arms, and the third is the one that matters.
 *
 * **1. RANGE** — the claimed gap is within the vehicle's gaps.
 * **2. UNIQUENESS** — no `(vehicle, gap)` pair claimed twice. Range alone passes two items both
 *    claiming gap 3, and a gap answered by two items is a gap one of them is wrong about.
 * **3. AGAINST THE TEXT, NOT THE DECLARED COUNT** (Cowork's addition). `gapCount` is a number in the
 *    vehicle's own file, and **a declared number checked against nothing is the shape this week has
 *    been about.** Counting the markers in the body closes the case where `gapCount` itself drifts.
 *    Both are reported; the TEXT is the authority and `gapCount` is checked against it.
 *
 * **THE MARKER IS `___(1)___` AND COUNTING `___` DOUBLES IT.** Three underscores either side, so a
 * naive `/___/g` finds 16 markers in an 8-gap vehicle — measured, not assumed. Cowork caught this
 * before it reported a disagreement that does not exist, and it is the compound-signal fault again:
 * an instrument measuring something ADJACENT to the property under test.
 *
 * **WHICH FIELD IT READ IS NAMED ON EVERY RUN.** Cowork has migrated `gapRef` → `gapIndex`; this
 * store still holds `gapRef` on all 16. The check reads either and SAYS WHICH — so when the
 * migration crosses, it cannot go on reading the old field while reporting success. That is R164 and
 * R167's lesson: a field that moves is not migrated until every reader has moved, and a reader that
 * does not say which field it read cannot tell you it hasn't.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const PASSAGES = resolve(import.meta.dirname, '../content/passages');

/** `___(1)___` — the whole marker, never a bare run of underscores. */
const MARKER = /_{3}\((\d+)\)_{3}/g;

function markersIn(body: string): number[] {
  return [...body.matchAll(MARKER)].map((m) => Number(m[1]));
}

async function main(): Promise<void> {
  const items = await prisma.item.findMany({
    where: { questionTypeId: 'en-spag-cloze' },
    select: { id: true, stem: true, status: true },
    orderBy: { id: 'asc' },
  });
  requirePopulation('check:cloze-gaps', { 'cloze items': items.length });

  const vehicles = new Map<string, { gapCount?: number; body?: string }>();
  for (const f of readdirSync(PASSAGES).filter((f) => f.endsWith('.json'))) {
    try { vehicles.set(f.replace(/\.json$/, ''), JSON.parse(readFileSync(join(PASSAGES, f), 'utf8'))); }
    catch { /* an unreadable vehicle is reported as unresolved below */ }
  }

  const faults: string[] = [];
  const claimed = new Map<string, string[]>();
  let readGapIndex = 0;
  let readGapRef = 0;
  let noField = 0;

  // ARM 3 FIRST: the vehicles themselves, because an item cannot be judged against a vehicle whose
  // own declared count disagrees with its own text.
  const vehicleReport: string[] = [];
  for (const [id, v] of [...vehicles].sort()) {
    if (typeof v.body !== 'string' || typeof v.gapCount !== 'number') continue;
    const marks = markersIn(v.body);
    const contiguous = marks.every((n, i) => n === i + 1);
    const bare = (v.body.match(/_{3}/g) ?? []).length;
    vehicleReport.push(
      `  ${id}: gapCount ${v.gapCount} · ${marks.length} marker(s) in the text`
      + `${contiguous ? ', contiguous 1..' + marks.length : ', NOT CONTIGUOUS: ' + JSON.stringify(marks)}`
      + `  (bare ___ runs: ${bare} — counting those would say ${bare})`,
    );
    if (marks.length !== v.gapCount) {
      faults.push(`vehicle ${id}: declares gapCount ${v.gapCount}, text carries ${marks.length} marker(s)`);
    }
    if (!contiguous) faults.push(`vehicle ${id}: markers are not contiguous from 1 — ${JSON.stringify(marks)}`);
  }

  for (const item of items) {
    const stem = (item.stem ?? {}) as Record<string, unknown>;
    // EITHER FIELD, AND THE ONE USED IS COUNTED. Never silently one.
    let gap: number | null = null;
    if (typeof stem.gapIndex === 'number') { gap = stem.gapIndex; readGapIndex += 1; }
    else if (typeof stem.gapRef === 'number') { gap = stem.gapRef; readGapRef += 1; }
    else { noField += 1; faults.push(`${item.id}: claims no gap — neither gapIndex nor gapRef`); continue; }

    const ref = typeof stem.passageRef === 'string' ? stem.passageRef : null;
    const v = ref ? vehicles.get(ref) : undefined;
    if (!v || typeof v.body !== 'string') {
      faults.push(`${item.id}: vehicle '${ref ?? '(none)'}' does not resolve`);
      continue;
    }
    // ARM 1 — RANGE, against the TEXT's markers rather than the declared count.
    const marks = markersIn(v.body);
    if (!marks.includes(gap)) {
      faults.push(`${item.id}: claims gap ${gap}; ${ref} carries markers ${JSON.stringify(marks)}`);
    }
    // ARM 2 — UNIQUENESS.
    const key = `${ref}#${gap}`;
    claimed.set(key, [...(claimed.get(key) ?? []), item.id]);
  }

  for (const [key, ids] of claimed) {
    if (ids.length > 1) faults.push(`gap ${key} claimed by ${ids.length} items: ${ids.join(', ')}`);
  }

  console.log(`check:cloze-gaps: ${items.length} cloze item(s) · ${vehicleReport.length} vehicle(s)\n`);
  console.log('  VEHICLES — declared count against the text\'s own markers:');
  for (const r of vehicleReport) console.log(r);
  console.log(`\n  FIELD READ: ${readGapIndex} via stem.gapIndex · ${readGapRef} via stem.gapRef`
    + `${noField ? ` · ${noField} with neither` : ''}`);
  if (readGapRef > 0 && readGapIndex === 0) {
    console.log('    Cowork has migrated to `gapIndex`; this store still holds `gapRef` on every row.');
    console.log('    Named rather than absorbed: a reader that does not say which field it read cannot');
    console.log('    tell you the migration has not crossed.');
  }
  console.log(`\n  ${faults.length} fault(s)`);
  for (const f of faults) console.log(`    x ${f}`);
  if (faults.length === 0) {
    console.log('    Every claimed gap exists in its vehicle\'s text and is claimed exactly once.');
  }
  await prisma.$disconnect();
  process.exit(faults.length === 0 ? 0 : 1);
}

void main();
