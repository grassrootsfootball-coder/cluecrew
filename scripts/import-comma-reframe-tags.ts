/**
 * IMPORT the two comma "needs-a-comma" distractor tags (annie, finalised 2026-08-08).
 * `pnpm --filter @cluecrew/db exec dotenv -e ../../.env -- tsx ../../scripts/import-comma-reframe-tags.ts`
 *
 * Comma was rebuilt from spot-the-mistake to "which part NEEDS a comma" (the spot form rests on
 * "no comma is acceptable here", nearly empty at phrase boundaries). The pair maps onto the
 * spelling error-spot pair conceptually but gets its OWN ids, so the signed spelling families'
 * hints ("sometimes every part is right") are untouched — that is the wrong thing to say in a
 * needs-a-comma item. The id names describe the PART (what the tagger sees), not her state of mind.
 */
import { prisma } from '../packages/db/src/index';

const REVIEWER = 'current-reviewer';
const DAVID = 'human:david@cluecrew.test';
const METHOD = 'written review — comma reframe, annie 2026-08-08';

const TAGS = [
  {
    id: 'en-comma-over-applied',
    description: 'Child chooses "for the trip" where the answer is "We packed apples pears", picking a part a comma may sit in rather than the part that must have one.',
    childHint: 'A comma can sit here. Now find the part that cannot do without one.',
  },
  {
    id: 'en-comma-not-a-comma-site',
    description: 'Child chooses "and plums" where the answer is elsewhere, picking a part where no comma could go.',
    childHint: 'Try reading it with a comma there. If it sounds wrong, look again.',
  },
];

async function main(): Promise<void> {
  for (const t of TAGS) {
    await prisma.misconception.upsert({
      where: { id: t.id },
      create: { id: t.id, district: 'ENGLISH', description: t.description, childHint: t.childHint, status: 'ACTIVE', proposedBy: REVIEWER, recordedBy: DAVID, approvedBy: REVIEWER, category: 'punctuation', approvalMethod: METHOD },
      update: { description: t.description, childHint: t.childHint, status: 'ACTIVE', recordedBy: DAVID, approvedBy: REVIEWER, approvalMethod: METHOD },
    });
    await prisma.attributionEvent.upsert({
      where: { id: `authored-${t.id}` },
      create: { id: `authored-${t.id}`, recordType: 'misconception', recordId: t.id, action: 'AUTHORED', actor: REVIEWER, recordedBy: DAVID, method: METHOD },
      update: {},
    });
    console.log(`ACTIVE  ${t.id}`);
  }
  await prisma.$disconnect();
}

void main();
