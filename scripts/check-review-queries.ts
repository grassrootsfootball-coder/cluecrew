/**
 * NOTHING THAT ANSWERS "HAS THIS BEEN REVIEWED" MAY READ THE AUTHORING PRE-REVIEW
 * — `pnpm check:review-queries`
 *
 * Cowork's `preReview` is a drafting agent's assessment of its own work. Both its verdict values
 * terminate in *a human has not looked yet*. Annie's ratification resolves to a named individual
 * through the naming path. **Two different things are both called review**, and if a query that
 * answers "has this been reviewed" can reach the first, an agent's self-assessment looks like a
 * reviewer's sign-off in the store that ships (David, 2026-08-16).
 *
 * Careful naming is not a control. This is the control, and it is the same shape as
 * `check:signing-doors`: a property of the SOURCE, checked statically, so a new reader fails on
 * the commit that adds it rather than on the day someone reads a dashboard.
 *
 * TWO LEGS, because either alone fails open:
 *   A — the column may be named only in a DECLARED DOOR. A file that touches it without being
 *       listed here has not been thought about.
 *   B — no LINE may bind it to a review-decision symbol, DOOR OR NOT. `reviewed: !!item
 *       .authoringPreReview` is the failure; a declared door that grows one is the exact confusion
 *       the ruling forbids, and leg A would wave it through on the strength of its own listing.
 *
 * LEG B IS LINE-LEVEL, NOT FILE-LEVEL, AND THAT WAS A CORRECTION. File-level cried wolf on its
 * first run: it flagged `schema.prisma` for declaring both columns in one model, flagged this gate
 * for listing the symbols as data, and flagged the import door for SELECTING `reviewedBy` in order
 * to prove it had changed no review state. Three true statements, none of them the fault. It is
 * the same shape as the bare-literal version of `check:signing-doors`, and a gate that cries wolf
 * is switched off within a week — after which it guards nothing at all.
 *
 * R60 QUESTION 2: both legs are exercised by `check-review-queries.test.ts` against synthetic
 * sources. A gate over a codebase that happens to be clean has proved nothing about itself.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');

/** The column, and Cowork's own path for it. Both are the thing being fenced. */
export const PRE_REVIEW_SYMBOLS = ['authoringPreReview', 'authoringPreReviewHash'] as const;

/**
 * Symbols that mean "a human reviewer decided something". A file naming one of these and the
 * pre-review column is asserting a relationship between them, whatever it intends.
 */
export const REVIEW_DECISION_SYMBOLS = [
  'reviewedBy',
  'reviewRecordedBy',
  'reviewMethod',
  'reviewRecordNote',
  'recordSignature',
  "action: 'SIGNED'",
  'REVIEWED',
] as const;

/**
 * THE DOORS. Each states what it does with the column; a listing without a reason is how an
 * allowlist becomes a place to put things to make the build pass.
 */
export const DECLARED_DOORS: Readonly<Record<string, string>> = {
  'packages/db/prisma/schema.prisma': 'declares the columns',
  'scripts/backfill-pre-review.ts': 'the import door — writes the claim and its subject hash',
  'scripts/check-pre-review-subject.ts': 'reports claims describing an item that has since moved',
  'scripts/check-review-queries.ts': 'this gate',
  'packages/core/src/english/cowork-item-keys.ts': 'names the column as the carriage destination for Cowork\'s preReview key',
  'packages/db/prisma/migrations/20260816112113_authoring_pre_review/migration.sql': 'the migration that added them',
  'scripts/emit-item-manifest.ts': 'records presence for the manifest; reads no value',
};

export interface Violation { file: string; leg: 'A' | 'B'; detail: string }

/** Leg A and leg B over one file's text. Exported so the canary can drive it directly. */
export function inspectSource(file: string, text: string): Violation[] {
  const names = PRE_REVIEW_SYMBOLS.filter((s) => text.includes(s));
  if (names.length === 0) return [];
  const out: Violation[] = [];
  if (!(file in DECLARED_DOORS)) {
    out.push({ file, leg: 'A', detail: `names ${names.join(', ')} but is not a declared door` });
  }
  // LINE-LEVEL: the column BOUND to a review symbol in one expression, which is the construct
  // that makes a self-assessment answer a question about a reviewer.
  text.split('\n').forEach((line, i) => {
    // Comments are excluded: prose cannot bind anything, and the sentence explaining that the
    // column is NOT reviewedBy is exactly the sentence a file like this should contain.
    const code = line.replace(/\/\/.*$/, '').replace(/^\s*\*.*$/, '').replace(/^\s*\/\*.*$/, '');
    if (!PRE_REVIEW_SYMBOLS.some((s) => code.includes(s))) return;
    const review = REVIEW_DECISION_SYMBOLS.filter((s) => code.includes(s));
    if (review.length > 0) {
      out.push({
        file, leg: 'B',
        detail: `line ${i + 1} binds the pre-review column to ${review.join(', ')}: ${code.trim().slice(0, 90)}`,
      });
    }
  });
  return out;
}

function sources(dir: string, acc: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    if (['node_modules', '.git', '.next', 'dist', 'coverage'].includes(e)) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) sources(p, acc);
    else if (['.ts', '.tsx', '.prisma', '.sql'].includes(extname(p))) acc.push(p);
  }
  return acc;
}

function main(): void {
  const files = sources(ROOT);
  const violations: Violation[] = [];
  const touching: string[] = [];
  for (const abs of files) {
    const rel = relative(ROOT, abs);
    const text = readFileSync(abs, 'utf8');
    if (PRE_REVIEW_SYMBOLS.some((s) => text.includes(s))) touching.push(rel);
    violations.push(...inspectSource(rel, text));
  }

  // R60: state the population, and make an empty one impossible to read as a pass.
  console.log(`check:review-queries: screened ${files.length} source file(s); ${touching.length} name the pre-review column.`);
  if (touching.length === 0) {
    console.error('\nREFUSED — NOT ONE FILE names the column. The gate screened nothing.');
    console.error('Either the migration has not been applied or the symbol was renamed and this');
    console.error('gate now watches a name that does not exist. That is a blind run, not a pass.');
    process.exit(1);
  }

  // Every declared door must actually exist and actually touch it, or the list is stale and the
  // next reader trusts a fence with a hole in it.
  const stale = Object.keys(DECLARED_DOORS).filter((d) => !touching.includes(d));
  if (stale.length > 0) {
    console.error(`\nREFUSED — ${stale.length} declared door(s) no longer name the column:`);
    for (const d of stale) console.error(`  x ${d} — ${DECLARED_DOORS[d]}`);
    console.error('A stale exemption is a hole nobody can see. Remove it or restore the reader.');
    process.exit(1);
  }

  for (const t of touching) console.log(`  door  ${t} — ${DECLARED_DOORS[t]}`);

  if (violations.length > 0) {
    console.error(`\n${violations.length} violation(s):`);
    for (const v of violations) console.error(`  x [leg ${v.leg}] ${v.file}: ${v.detail}`);
    console.error('\nCowork\'s preReview is a drafting agent assessing its own work. Both its verdict');
    console.error('values mean a human has NOT looked. Nothing answering "has this been reviewed" may');
    console.error('read it — read the reviewer path (AttributionEvent.reviewerId, Reviewer) instead.');
    process.exit(1);
  }
  console.log(`\nAll ${touching.length} reader(s) are declared doors, and none names a review-decision symbol.`);
}

if (process.argv[1]?.endsWith('check-review-queries.ts')) main();
