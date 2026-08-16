/**
 * A PRE-REVIEW THAT DESCRIBES AN ITEM THAT HAS SINCE MOVED — `pnpm check:pre-review-subject`
 *
 * Cowork's `preReview` asserts nothing about WHAT it assessed, so it survives any later edit and
 * goes on making its claim about an item that no longer exists. That is the exact failure
 * `subjectHash` was added to prevent on `AttributionEvent`, and carrying it across unfixed would
 * import a known defect (David, 2026-08-16). This side computes a hash at import; this reads it.
 *
 * IT REPORTS, IT DOES NOT REPAIR. A superseded claim is not a wrong value to correct — it is a
 * statement whose subject changed, and the only honest resolutions are to re-assess or to drop it.
 * Silently re-hashing would make the claim true again by moving the goalposts, which is worse than
 * the defect being closed.
 *
 * NOT A REVIEW QUERY. It answers "does this claim still describe its subject", never "has this
 * been reviewed" — and it is a declared door in `check:review-queries` on exactly that basis.
 */
import { draftAssessmentSubjectHash, readDraftSelfAssessment } from '../packages/core/src/index';
import { Prisma, prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const textOf = (c: unknown): string =>
  typeof c === 'string' ? c
    : c && typeof c === 'object' && 'value' in c ? String((c as { value: unknown }).value) : '';

async function main(): Promise<void> {
  const items = await prisma.item.findMany({
    // Prisma.DbNull, not `null`: on a Json column a bare null is the JSON value null, not
    // SQL NULL. It happened to return the right 78 rows; the type was telling the truth anyway.
    where: { draftSelfAssessment: { not: Prisma.DbNull } },
    include: { options: { orderBy: { id: 'asc' } } },
    orderBy: { id: 'asc' },
  });

  // Not a population that may legitimately be empty: 78 items hold a claim. An empty run means
  // the column was renamed or the backfill was reverted, and either is a pipeline failure.
  requirePopulation('check:pre-review-subject', { 'items holding an authoring pre-review': items.length });

  const superseded: string[] = [];
  const noHash: string[] = [];
  const unreadable: string[] = [];
  for (const it of items) {
    if (readDraftSelfAssessment(it.draftSelfAssessment) === null) { unreadable.push(it.id); continue; }
    if (!it.draftSelfAssessmentHash) { noHash.push(it.id); continue; }
    const stem = (it.stem ?? {}) as Record<string, unknown>;
    const prompt = typeof stem.prompt === 'string' ? stem.prompt
      : typeof stem.text === 'string' ? stem.text : null;
    const now = draftAssessmentSubjectHash({
      prompt, tier: it.difficultyTier,
      options: it.options.map((o) => ({ text: textOf(o.content), isCorrect: o.isCorrect })),
    });
    if (now !== it.draftSelfAssessmentHash) superseded.push(it.id);
  }

  console.log(`check:pre-review-subject: ${items.length} item(s) hold an authoring pre-review.`);
  console.log(`  still describing their subject: ${items.length - superseded.length - noHash.length - unreadable.length}`);

  if (unreadable.length > 0) {
    console.error(`\n${unreadable.length} claim(s) do not parse as a pre-review:`);
    for (const id of unreadable) console.error(`  x ${id}`);
    process.exitCode = 1;
  }
  if (noHash.length > 0) {
    // An unfingerprinted claim is Cowork's defect reproduced here — a claim with no subject.
    console.error(`\n${noHash.length} claim(s) carry NO subject hash, so nothing can say what they were about:`);
    for (const id of noHash) console.error(`  x ${id}`);
    console.error('This is the imported defect, not a new one. Re-run `pnpm backfill:pre-review`.');
    process.exitCode = 1;
  }
  if (superseded.length > 0) {
    console.error(`\n${superseded.length} pre-review(s) describe an item that has since changed:`);
    for (const id of superseded) console.error(`  x ${id}`);
    console.error('\nThe stem, an option or the tier moved after the claim was made. Re-assess the item');
    console.error('or drop the claim — re-hashing it here would make it true by moving its subject.');
    process.exitCode = 1;
  }
  if (!superseded.length && !noHash.length && !unreadable.length) {
    console.log(`\nAll ${items.length} still describe the item they were made about.`);
  }
  await prisma.$disconnect();
}

void main();
