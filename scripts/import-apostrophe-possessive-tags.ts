/**
 * IMPORT the apostrophe-possessive distractor tags (annie, ruled 2026-08-08).
 * `pnpm --filter @cluecrew/db exec dotenv -e ../../.env -- tsx ../../scripts/import-apostrophe-possessive-tags.ts`
 *
 * ONE O-tag, not two. The O-site collapse (every O is a natural attributive) made the
 * attributive/plural-misplaced split cosmetic: in `the teachers lounge` nothing belongs to
 * anyone — the plural DESCRIBES the lounge — so both children are reading a modifier as an
 * owner, differing only in the modifier's number. Same misconception with a parameter = one tag.
 *
 * `en-apostrophe-not-a-site` is the structural parallel of `en-comma-not-a-comma-site`, needed
 * because P3 requires every wrong option to carry a misconception and annie ruled only on the
 * O-site tag. FLAGGED to the reviewer for confirmation.
 */
import { prisma } from '../packages/db/src/index';

const REVIEWER = 'current-reviewer';
const DAVID = 'human:david@cluecrew.test';
const METHOD = 'written review — apostrophe-possessive reframe, annie 2026-08-08';

const TAGS = [
  {
    id: 'en-apostrophe-attributive',
    description: 'Child chooses "the teachers lounge" where the answer is "my brother\'s coat", reading a noun before a noun as showing ownership when it is describing. Modifier number (singular "school gate" / plural "teachers lounge") is a parameter, not a second misconception.',
    childHint: 'A noun can describe another without owning it. Find the part that shows belonging.',
    status: 'ACTIVE' as const,
    note: 'MERGED from the drafted attributive/plural-misplaced pair (annie 2026-08-08): once every O site is a natural attributive, the split was on a surface feature, not two misunderstandings.',
  },
  {
    id: 'en-apostrophe-not-a-site',
    description: 'Child chooses "was chained to the rail" where the answer is elsewhere, picking a part with no noun-before-noun and nothing that could belong to anyone.',
    childHint: 'Nothing here belongs to anyone. Look for a part that shows belonging.',
    status: 'PROPOSED' as const,
    note: 'Structural parallel of en-comma-not-a-comma-site, added because P3 requires a tag on every distractor; annie ruled only on the O-site tag. For her confirmation.',
  },
];

async function main(): Promise<void> {
  for (const t of TAGS) {
    const active = t.status === 'ACTIVE';
    await prisma.misconception.upsert({
      where: { id: t.id },
      // A PROPOSED row may carry no approvalNote (the DB requires an approver alongside one).
      create: { id: t.id, district: 'ENGLISH', description: t.description, childHint: t.childHint, status: t.status, proposedBy: REVIEWER, category: 'punctuation', ...(active ? { recordedBy: DAVID, approvedBy: REVIEWER, approvalMethod: METHOD, approvalNote: t.note } : {}) },
      update: { description: t.description, childHint: t.childHint, status: t.status, ...(active ? { approvedBy: REVIEWER, approvalMethod: METHOD, approvalNote: t.note } : {}) },
    });
    console.log(`${t.status.padEnd(8)} ${t.id}`);
  }
  // The merged-away draft never shipped; ensure it cannot be referenced.
  const stale = await prisma.misconception.findUnique({ where: { id: 'en-apostrophe-plural-misplaced' } });
  if (stale) {
    await prisma.misconception.update({ where: { id: 'en-apostrophe-plural-misplaced' }, data: { status: 'REJECTED', rejectedBy: REVIEWER, rejectedAt: new Date(), rejectionNote: 'Merged into en-apostrophe-attributive (annie 2026-08-08) — the O-site collapse made the split cosmetic.' } });
    console.log('REJECTED en-apostrophe-plural-misplaced (merged)');
  }
  await prisma.$disconnect();
}

void main();
