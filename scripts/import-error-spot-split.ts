/**
 * SPLIT the error-spot false-positive tag into two (annie, 2026-08-08).
 * `pnpm --filter @cluecrew/db exec dotenv -e ../../.env -- tsx ../../scripts/import-error-spot-split.ts`
 *
 * `en-error-spot-false-positive` hid two different children behind one tag. The near-miss flag
 * the generator already sets separates them, so each earns its own tag and its own hint:
 *   · a NEAR-MISS part is picked by a child over-applying a real rule → rule-over-applied;
 *   · a PLAIN part is picked by a child who assumes something must be wrong → guessed-a-part.
 * guessed-a-part is a close relative of en-n-option-avoidance (guessing a part is half of what
 * the N-avoider does) and is worded as its pair. The single tag is superseded (REJECTED).
 */
import { prisma } from '../packages/db/src/index';

const REVIEWER = 'current-reviewer';
const DAVID = 'human:david@cluecrew.test';
const METHOD = 'written review — annie authoring sitting 2026-08-08';

const SPLIT = [
  {
    id: 'en-error-spot-rule-over-applied',
    description: 'Child gives "They packed the last few bags" where the answer is elsewhere, treating the doubled consonant as a mistake.',
    childHint: 'That pattern is often a clue. Here the word is already correct.',
  },
  {
    id: 'en-error-spot-guessed-a-part',
    description: 'Child gives "The hall was warm and quiet" where the answer is elsewhere, choosing a part with nothing wrong in it.',
    childHint: 'Sometimes every part is right. Checking each one is the whole job.',
  },
];

async function main(): Promise<void> {
  for (const e of SPLIT) {
    await prisma.misconception.upsert({
      where: { id: e.id },
      create: { id: e.id, district: 'ENGLISH', description: e.description, childHint: e.childHint, status: 'ACTIVE', proposedBy: REVIEWER, recordedBy: DAVID, approvedBy: REVIEWER, category: 'error-spot', approvalMethod: METHOD },
      update: { description: e.description, childHint: e.childHint, status: 'ACTIVE', recordedBy: DAVID, approvedBy: REVIEWER, approvalMethod: METHOD },
    });
    await prisma.attributionEvent.upsert({
      where: { id: `authored-${e.id}` },
      create: { id: `authored-${e.id}`, recordType: 'misconception', recordId: e.id, action: 'AUTHORED', actor: REVIEWER, recordedBy: DAVID, method: METHOD },
      update: {},
    });
    console.log(`ACTIVE  ${e.id}`);
  }
  // Supersede the single tag — never served, so a clean REJECT.
  await prisma.misconception.update({
    where: { id: 'en-error-spot-false-positive' },
    data: { status: 'REJECTED', rejectedBy: REVIEWER, rejectedAt: new Date(), rejectionNote: 'Superseded by the rule-over-applied / guessed-a-part split (annie, 2026-08-08).' },
  });
  console.log('REJECTED en-error-spot-false-positive (superseded by the split)');
  await prisma.$disconnect();
}

void main();
