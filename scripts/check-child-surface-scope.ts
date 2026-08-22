/**
 * EVERY SURFACE A CHILD *READS* — AND THE NAME IS THE FINDING (Annie, 2026-08-21 — R541).
 *
 * **RESCOPED, NOT RENAMED-AWAY.** This covered surfaces a child READS. It never covered what a child
 * HEARS: an aria-label reached the ear and no scan in the store read an attribute except
 * `check:no-review-furniture`, whose pattern missed every interpolated one.
 *
 * **A name that asserts a scope it does not have RETIRES THE QUESTION** — nobody audits the coverage
 * of a thing called *every surface a child reads*. Third time this fortnight a word has carried more
 * than the field behind it: `ratified` meaning length-ratified (R500), `LIVE` meaning three things
 * (R184), and now a scan title meaning one modality.
 *
 * **MODALITY IS DECLARED, because it is the free dimension** — exactly as route was inside her
 * specification (R531) and direction and format were inside a match (R517).
 *
 * EVERY SURFACE A CHILD READS, AND WHICH SCANNER COVERS IT — Annie's list, 2026-08-19.
 *
 * **THREE SCOPE FINDINGS IN ONE WEEK, ALL FOUND THE SAME WAY.** The walk scripts (unreachable, so
 * never ruled child-facing), the `.tsx` literals (the reading-age lint had never opened one), and
 * the district map (`apps/web/lib/crew` was in no scanner's scope and carried a banned word). **Not
 * one was found by auditing the gates. All three were found by using them** — by authoring
 * something new and watching which gate objected.
 *
 * She called this a list rather than a question, and she is right: the answer is an enumeration and
 * the enumeration is the deliverable. **What it cannot do is find a surface nobody has thought of**
 * — it reports coverage for surfaces named here, so an unnamed surface is invisible to it exactly
 * as it was to the scanners. That limit is printed, not implied.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const REPO = resolve(import.meta.dirname, '..');

type Surface = {
  surface: string;
  where: string;
  /** Which gate reads it: vocabulary ban list, reading-age cap, the DB child-facing sweep. */
  vocab: boolean;
  readingAge: boolean;
  dbSweep: boolean;
  note?: string;
};

/**
 * Read from the scanners' own scope arrays where possible, so a scope that moves changes this
 * table rather than silently disagreeing with it.
 */
function scopesOf(file: string, constName: string): string[] {
  /*
   * COMMENTS ARE STRIPPED BEFORE THE ARRAY IS PARSED, AND THE REASON IS THIS FILE'S OWN HISTORY.
   * The first version read the raw source, and an apostrophe in a comment I had just written
   * ("the district map's own copy lives here") opened a phantom string literal — so the parser
   * returned three real scopes and four fragments of English prose, and this table reported
   * `content` and `apps/web/lib/crew` as UNSCANNED when both are in scope.
   *
   * **A reader confused by prose, for the fourth time this week** (R243, R229, R253, and now here
   * in the check written to enumerate the others). The remedy is the same one every time: strip
   * what is not code before matching, because a matcher cannot tell a sentence from a statement.
   */
  const src = stripComments(readFileSync(resolve(REPO, file), 'utf8'));
  const block = new RegExp(`${constName}\\s*=\\s*\\[([\\s\\S]*?)\\]`).exec(src);
  if (!block) throw new Error(`could not read ${constName} from ${file} — refusing to report coverage from a failed read (R173)`);
  const scopes = [...block[1]!.matchAll(/'([^']+)'/g)].map((m) => m[1]!);
  // Every entry is a repo-relative path. A fragment of prose is not, and would be a silent
  // corruption of the coverage table rather than an error.
  const bad = scopes.filter((s) => /\s/.test(s) || s === '');
  if (bad.length > 0) {
    throw new Error(`${constName} in ${file} parsed ${bad.length} non-path entr(y/ies) — the read is corrupt, not the scope list.`);
  }
  return scopes;
}

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

function main() {
  const vocabScopes = scopesOf('scripts/scan-vocab.mjs', 'const CHILD_FACING_SCOPE');
  const readingAgeSrc = stripComments(readFileSync(resolve(REPO, 'scripts/check-reading-age.mjs'), 'utf8'));
  const readingAgeCopyRoots = [...(/const COPY_ROOTS = \[([\s\S]*?)\]/.exec(readingAgeSrc)?.[1] ?? '')
    .matchAll(/'([^']+)'/g)].map((m) => m[1]!);

  const inVocab = (p: string) => vocabScopes.some((s) => p.startsWith(s));
  const inCopyRoots = (p: string) => readingAgeCopyRoots.some((s) => p.startsWith(s));

  /**
   * THE SURFACES, ENUMERATED BY HAND AND THAT IS THE WEAK POINT. Each is a place a child reads
   * words. A surface absent from this list is invisible here — which is the same failure the list
   * documents, one level up, and the reason it is printed as a caveat every run.
   */
  const surfaces: Surface[] = [
    { surface: 'Item stems, options, hints', where: 'database (Item, ItemOption, Misconception)', vocab: false, readingAge: false, dbSweep: true, note: 'check:db-content — the DB sweep, not the file scanners' },
    { surface: 'Walk scripts', where: 'database (Item.explanation.walkScript)', vocab: false, readingAge: false, dbSweep: true, note: 'inside checkItemChildFacing since R221; serving gated on the approved set' },
    { surface: 'Word cards', where: 'content/words', vocab: inVocab('content'), readingAge: true, dbSweep: true },
    { surface: 'Case titles and narrative intros', where: 'content/cases', vocab: inVocab('content'), readingAge: true, dbSweep: true },
    { surface: 'Voice lines', where: 'content/voice', vocab: inVocab('content'), readingAge: true, dbSweep: false },
    { surface: 'Chapter prose', where: 'content/chapters', vocab: inVocab('content'), readingAge: true, dbSweep: false },
    { surface: 'Mock blueprint instruction pages', where: 'content/blueprints', vocab: inVocab('content'), readingAge: true, dbSweep: false },
    { surface: 'Crew component copy', where: 'apps/web/components/crew', vocab: inVocab('apps/web/components/crew'), readingAge: inCopyRoots('apps/web/components/crew'), dbSweep: false, note: 'reading-age added 2026-08-19 (R242)' },
    { surface: 'Crew page copy', where: 'apps/web/app/crew', vocab: inVocab('apps/web/app/crew'), readingAge: inCopyRoots('apps/web/app/crew'), dbSweep: false },
    { surface: 'District map quarter names and blurbs', where: 'apps/web/lib/crew/districts.ts', vocab: inVocab('apps/web/lib/crew'), readingAge: inCopyRoots('apps/web/lib/crew'), dbSweep: false, note: 'vocab added 2026-08-19 (R247); reading-age added 2026-08-19 (R270)' },
    { surface: 'Generated NVR prompts', where: 'packages/core/src/nvr', vocab: inVocab('packages/core/src/nvr'), readingAge: inCopyRoots('packages/core/src/nvr'), dbSweep: false, note: 'reading-age added 2026-08-19 (R270), keyed mode' },
    { surface: 'Seeded copy', where: 'packages/db/prisma/seed.ts', vocab: inVocab('packages/db/prisma/seed.ts'), readingAge: inCopyRoots('packages/db/prisma'), dbSweep: false, note: 'reading-age added 2026-08-19 (R270), keyed mode — child-facing keys only, so teacher-facing descriptions stay uncapped' },
    { surface: 'Passages a child reads', where: 'content/passages', vocab: inVocab('content'), readingAge: false, dbSweep: false, note: 'pre-1950 source text — deliberately exempt from the cap and the ceiling' },
  ];

  const mark = (b: boolean) => (b ? ' yes' : ' NO ');
  console.log('CHILD-FACING SURFACES AND SCANNER COVERAGE\n');
  console.log('  surface                                  vocab  age  dbSweep');
  console.log('  ' + '-'.repeat(66));
  for (const s of surfaces) {
    console.log(`  ${s.surface.padEnd(40)}${mark(s.vocab)}  ${mark(s.readingAge)}  ${mark(s.dbSweep)}`);
  }
  const gaps = surfaces.filter((s) => !s.vocab && !s.readingAge && !s.dbSweep);
  const partial = surfaces.filter((s) => (s.vocab || s.readingAge || s.dbSweep) && !(s.vocab && s.readingAge));

  console.log(`\n  surfaces enumerated: ${surfaces.length}`);
  console.log(`  covered by NO scanner at all: ${gaps.length}${gaps.length ? ` — ${gaps.map((g) => g.surface).join(', ')}` : ''}`);
  console.log(`  partially covered: ${partial.length}`);
  for (const p of partial) console.log(`    ${p.surface}: vocab=${p.vocab} readingAge=${p.readingAge} dbSweep=${p.dbSweep}${p.note ? ` — ${p.note}` : ''}`);

  console.log('\n  LIMIT: this table is HAND-ENUMERATED. It reports coverage for the surfaces named in');
  console.log('  it, so a surface nobody has thought of is invisible here exactly as it was to the');
  console.log('  scanners. All three scope findings this week were found by AUTHORING, not auditing.');
  if (gaps.length > 0) process.exitCode = 1;
}

main();
