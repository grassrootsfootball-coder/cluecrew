/**
 * THE E2E SUITE MUST NOT TOUCH REAL CONTENT — `pnpm check:e2e-fixtures`
 *
 * The incident: the story e2e needed a LIVE word, reached for `brave` (a real vault card), and
 * its teardown demoted it. It was caught because someone noticed a LIVE-word count move, which
 * is not a detection mechanism (David, 2026-08-12). Three guards, because the fault has three
 * distinct shapes and only one of them is about cleanup.
 *
 *   1. FIXTURES INTACT — the seeded zz-e2e-* rows exist, are LIVE, and still say what they were
 *      seeded to say. A spec that mutates them has broken the arrangement that lets every other
 *      spec leave real content alone.
 *   2. MARKERS SWEEPABLE (static) — every Item or Word a spec CREATES must carry a provenance
 *      marker `cleanupFixtures` actually sweeps. This was a convention in a comment: story-lit
 *      used `e2e:story-lit`, which matches nothing the sweep looks for, so a run that crashed
 *      before teardown would have stranded a LIVE item with no mechanism to collect it — the
 *      exact failure the marker exists to prevent (fixtures.ts records the last one: 44 LIVE dev
 *      items, all the same test stem). Read from source, so it fails BEFORE a crash can happen.
 *   3. NO RESIDUE — nothing bearing an e2e marker survives in the database.
 *
 * Guard 3 only helps a database that persists, which is a dev machine: CI throws its database
 * away. That is deliberate — the incident happened on a dev database, and it is dev databases
 * that accumulate.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const E2E_DIR = resolve(import.meta.dirname, '../apps/web/e2e');
const FIXTURES_FILE = join(E2E_DIR, 'fixtures.ts');

/** The rows `seedE2eFixtures` creates. Specs assert against these and must never write to them. */
const FIXTURES = {
  word: { id: 'zz-e2e-fixture-word', headword: 'lantern' },
  item: { id: 'zz-e2e-fixture-item' },
} as const;

/**
 * The provenance markers `cleanupFixtures` sweeps, READ OUT OF fixtures.ts rather than restated.
 * A copy here would drift from the sweep it describes, and a guard that checks against a stale
 * copy of the rule is worse than no guard (R57, R60 question 3).
 */
function sweptMarkers(): { prefixes: string[]; exact: string[] } {
  const source = readFileSync(FIXTURES_FILE, 'utf8');
  const block = source.slice(source.indexOf('export async function cleanupFixtures'));
  const prefixes = [...block.matchAll(/authoredBy:\s*\{\s*startsWith:\s*'([^']+)'/g)].map((m) => m[1]!);
  const exact = [...block.matchAll(/authoredBy:\s*'([^']+)'/g)].map((m) => m[1]!);
  return { prefixes, exact };
}

function isSwept(marker: string, swept: ReturnType<typeof sweptMarkers>): boolean {
  return swept.prefixes.some((p) => marker.startsWith(p)) || swept.exact.includes(marker);
}

/**
 * MARKERS THAT MUST NOT BECOME SWEEPABLE — declared, with the reason, not inferred (R61's shape).
 *
 * A spec may need to create a row carrying a marker that names REAL provenance, because the thing
 * under test IS that provenance path. Making such a marker sweepable would be catastrophic rather
 * than tidy: `ai-draft:cowork-okafor-v1` is on 183 live word cards and 78 items, and a sweep on it
 * would delete the vault. So the requirement for these is the opposite — clean up by explicit id,
 * and say so here.
 */
const DECLARED_UNSWEPT: Array<{ spec: string; marker: string; reason: string }> = [
  {
    spec: 'word-draft-door.spec.ts',
    marker: 'ai-draft:cowork-okafor-v1',
    reason:
      'REAL provenance: 183 live word cards and 78 items carry it. The spec creates one row with ' +
      'it deliberately, to drive the DRAFT door against the real import marker. MUST NOT be swept ' +
      '— a sweep would delete the vault. Removed by explicit id in beforeAll and afterAll.',
  },
  {
    spec: 'word-draft-door.spec.ts',
    marker: 'ai-draft:test',
    reason:
      'Names the ai-draft provenance class the DRAFT door gates on, without colliding with a real ' +
      'model id. Removed by explicit id in beforeAll and afterAll.',
  },
];

async function main(): Promise<void> {
  const failures: string[] = [];
  const swept = sweptMarkers();

  // The sweep's own markers must be readable, or every marker below would "pass" by vacuum.
  if (swept.prefixes.length === 0 && swept.exact.length === 0) {
    console.error(
      'CHECK ABORTED: no provenance markers found in cleanupFixtures. Either the sweep was\n' +
        'removed or this parser no longer matches it — every spec would pass without being tested.',
    );
    process.exit(1);
  }

  // --- 1. Fixtures intact ----------------------------------------------------
  const word = await prisma.word.findUnique({ where: { id: FIXTURES.word.id } });
  const item = await prisma.item.findUnique({
    where: { id: FIXTURES.item.id },
    include: { options: true },
  });
  if (!word) failures.push(`fixture word ${FIXTURES.word.id} is MISSING — re-run the seed`);
  else {
    if (word.status !== 'LIVE') failures.push(`fixture word ${FIXTURES.word.id} is ${word.status}, not LIVE — a spec mutated it`);
    if (word.headword !== FIXTURES.word.headword) failures.push(`fixture word headword is "${word.headword}", seeded as "${FIXTURES.word.headword}"`);
  }
  if (!item) failures.push(`fixture item ${FIXTURES.item.id} is MISSING — re-run the seed`);
  else {
    if (item.status !== 'LIVE') failures.push(`fixture item ${FIXTURES.item.id} is ${item.status}, not LIVE — a spec mutated it`);
    if (item.options.length !== 4) failures.push(`fixture item has ${item.options.length} options, seeded with 4`);
  }

  // --- 2. Every marker a spec creates with is sweepable (static) --------------
  const specs = readdirSync(E2E_DIR).filter((f) => f.endsWith('.spec.ts'));
  requirePopulation('check:e2e-fixtures', { 'e2e spec files': specs.length });
  let creates = 0;
  const declaredSeen = new Set<string>();
  const indeterminate: string[] = [];
  for (const spec of specs) {
    const source = readFileSync(join(E2E_DIR, spec), 'utf8');
    const calls = [...source.matchAll(/prisma\.(item|word)\.(create|upsert|createMany)\s*\(/g)];
    for (const call of calls) {
      creates += 1;
      // The marker, if any, inside this call's data block — bounded so the next call's marker
      // cannot be borrowed to make this one look compliant.
      const window = source.slice(call.index!, call.index! + 1400);
      // Both quote styles. A template literal contributes the STATIC PREFIX before its first
      // `${`, which is what a startsWith sweep would match on: `human:e2e-mock-${label}@…` is
      // swept by `human:e2e-`, and treating it as unmarked would be crying wolf — a check that
      // cries wolf gets switched off, which this repo has already learned once.
      const markers = [
        ...[...window.matchAll(/authoredBy:\s*'([^']+)'/g)].map((m) => m[1]!),
        ...[...window.matchAll(/authoredBy:\s*`([^`]*)`/g)].map((m) => m[1]!.split('${')[0]!),
      ].filter((m) => m.length > 0);
      const line = source.slice(0, call.index!).split('\n').length;
      if (markers.length === 0) {
        failures.push(
          `${spec}:${line} creates a ${call[1]} with NO authoredBy — nothing can sweep it if the run crashes`,
        );
        continue;
      }
      for (const marker of new Set(markers)) {
        if (isSwept(marker, swept)) continue;
        // INDETERMINATE, not broken: an interpolated marker whose STATIC prefix is itself a
        // prefix of a swept prefix (`human:` under `human:e2e-`) is swept iff the interpolation
        // continues correctly — which this cannot see, and `fixtureEmail()` guarantees it does.
        // Calling that a failure would be crying wolf; guard 3 catches it for real if it ever
        // stops being true, because residue is residue whatever the marker looks like.
        if (swept.prefixes.some((p) => p.startsWith(marker))) {
          indeterminate.push(`${spec}:${line} "${marker}\${…}" — swept only if the interpolation stays under "${swept.prefixes.find((p) => p.startsWith(marker))}"`);
          continue;
        }
        const declared = DECLARED_UNSWEPT.find((d) => d.spec === spec && d.marker === marker);
        if (declared) {
          declaredSeen.add(`${declared.spec}|${declared.marker}`);
          // A declared marker is cleaned by id, so the spec must actually delete by id.
          if (!/\.deleteMany\(\s*\{\s*where:\s*\{\s*id:/.test(source)) {
            failures.push(
              `${spec}:${line} declares "${marker}" as deliberately unswept, but the spec never ` +
                'deletes by id — the declaration promises a cleanup that does not exist',
            );
          }
          continue;
        }
        failures.push(
          `${spec}:${line} creates a ${call[1]} as "${marker}", which cleanupFixtures does NOT sweep ` +
            `(it sweeps ${swept.prefixes.map((p) => `${p}*`).concat(swept.exact).join(', ')}). ` +
            'Use a sweepable marker, or declare it in DECLARED_UNSWEPT with the reason.',
        );
      }
    }
  }
  console.log(`  ${creates} item/word creation(s) across ${specs.length} spec(s), all markers checked.`);
  if (declaredSeen.size > 0) {
    console.log(`  ${declaredSeen.size} marker(s) declared deliberately unswept (real provenance), each cleaned by id.`);
  }
  for (const note of indeterminate) console.log(`  interpolated: ${note}`);

  // --- 3. No residue ---------------------------------------------------------
  const residueWhere = {
    OR: [
      ...swept.prefixes.map((p) => ({ authoredBy: { startsWith: p } })),
      ...swept.exact.map((e) => ({ authoredBy: e })),
    ],
  };
  const strayItems = await prisma.item.findMany({ where: residueWhere, select: { id: true, status: true } });
  const strayWords = await prisma.word.findMany({ where: residueWhere, select: { id: true, status: true } });
  for (const row of strayItems) failures.push(`RESIDUE: item ${row.id} (${row.status}) bears an e2e marker and was never swept`);
  for (const row of strayWords) failures.push(`RESIDUE: word ${row.id} (${row.status}) bears an e2e marker and was never swept`);

  if (failures.length > 0) {
    console.error(`\nE2E FIXTURE GUARD FAILED (${failures.length}):`);
    for (const f of failures) console.error(`  ✗ ${f}`);
    console.error(
      '\nA spec must assert against the seeded zz-e2e-* fixtures, or create rows with a marker\n' +
        'cleanupFixtures sweeps. Promoting or editing real content to make a test pass is what\n' +
        'demoted a live vault card, and a count nobody was watching is how it was found.',
    );
    await prisma.$disconnect();
    process.exit(1);
  }
  console.log(
    'E2E fixture guard passed: fixtures intact and LIVE, every creation marker sweepable, no residue.',
  );
  await prisma.$disconnect();
}

void main();
