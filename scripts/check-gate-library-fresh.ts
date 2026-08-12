/**
 * THE EXPORTED LIBRARY COPIES MATCH THE DATABASE — `pnpm check:gate-library-fresh`
 *
 * Cowork's gates read a library from disk because they cannot reach this database. That copy is a
 * derivative, and a derivative that drifts is how an 81-entry snapshot came to be consulted for a
 * whole verification round — real verdicts, scoped to a library predating the ruling under test.
 *
 * This re-derives what the export WOULD write and compares it to what is on disk. It does not
 * write: a check that repairs the thing it checks is a build step wearing a gate's clothes, which
 * is the fault Cowork's own finalise/verify split was made to fix.
 */
import { readFileSync, existsSync } from 'node:fs';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const COPIES = [
  { path: '/Users/davidb/Downloads/11+/corpus/misconception-import.json', kind: 'gate library (English, 66)', english: true, comprehensionOnly: false },
  { path: '/Users/davidb/Downloads/11+/from-cluecrew/comprehension-library-current.json', kind: 'comprehension set (38)', english: true, comprehensionOnly: true },
];
const SPAG = ['homophone','suffix','silent','apostrophe','punctuation','comma','paired','word-class',
  'tense','conjunction','question-tag','a-an','capitalisation','multimark','over-tick','consonant',
  'subject-verb','preposition','comparative','relative-pronoun','modal','article','n-option'];

async function main(): Promise<void> {
  const rows = await prisma.misconception.findMany({
    where: { district: 'ENGLISH' }, orderBy: { id: 'asc' },
    select: { id: true, status: true, description: true, childHint: true },
  });
  requirePopulation('check:gate-library-fresh', { 'English misconceptions in the DB': rows.length });

  const failures: string[] = [];
  for (const copy of COPIES) {
    if (!existsSync(copy.path)) {
      failures.push(`${copy.kind}: MISSING at ${copy.path} — run the export`);
      continue;
    }
    const onDisk = JSON.parse(readFileSync(copy.path, 'utf8')).misconceptions as Array<{ id: string; childHint: string }>;
    const expected = copy.comprehensionOnly
      ? rows.filter((r) => r.id.startsWith('en-') && !SPAG.some((s) => r.id.includes(s)))
      : rows;
    const diskIds = new Set(onDisk.map((m) => m.id));
    const dbIds = new Set(expected.map((r) => r.id));
    const missing = [...dbIds].filter((i) => !diskIds.has(i));
    const extra = [...diskIds].filter((i) => !dbIds.has(i));
    // Text drift, not just membership: a stale hint is the drift that matters most.
    const byDisk = new Map(onDisk.map((m) => [m.id, m.childHint]));
    const moved = expected.filter((r) => byDisk.has(r.id) && byDisk.get(r.id) !== r.childHint).map((r) => r.id);
    console.log(`  ${copy.kind}: ${onDisk.length} on disk, ${expected.length} in the DB`);
    if (missing.length) failures.push(`${copy.kind}: ${missing.length} entry(ies) in the DB but NOT on disk — ${missing.slice(0, 5).join(', ')}`);
    if (extra.length) failures.push(`${copy.kind}: ${extra.length} on disk but NOT in the DB — ${extra.slice(0, 5).join(', ')}`);
    if (moved.length) failures.push(`${copy.kind}: ${moved.length} childHint(s) differ from the DB — ${moved.slice(0, 5).join(', ')}`);
  }

  if (failures.length > 0) {
    console.error(`\nEXPORTED LIBRARY STALE (${failures.length}):`);
    for (const f of failures) console.error(`  ✗ ${f}`);
    console.error(
      '\nThe gates read these copies and cannot see this database. A stale copy produces verdicts\n' +
        'that are true about the library it read and scoped to the wrong one. Re-run\n' +
        '`pnpm export:gate-library` and `pnpm export:comprehension-library`.',
    );
    await prisma.$disconnect();
    process.exit(1);
  }
  console.log('Exported library copies match the database.');
  await prisma.$disconnect();
}

void main();
