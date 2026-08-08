/**
 * RULING 3 (annie, 2026-08-08) — enter the comparison-vehicle tag; log the negation one.
 * `pnpm --filter @cluecrew/db exec dotenv -e ../../.env -- tsx ../../scripts/import-comprehension-tags.ts`
 *
 * `en-comparison-vehicle-misread` enters ACTIVE with the BOUNDARY CLAUSE she required against
 * `en-attribute-transfer`, which sits on three distractors in this same cluster. Both put a quality
 * on the wrong holder — attribute-transfer moves it BETWEEN CHARACTERS, this moves it from a
 * comparison's VEHICLE to its SUBJECT. Different remedies, so different hints.
 *
 * `en-negation-dropped` stays LOGGED, UNENTERED by her ruling — recorded here in a comment so the
 * decision is findable, not as a PROPOSED row that would look like a queue item:
 *   en-negation-dropped — child reads a negated clause as its positive ("could hardly have failed
 *   to notice" read as "did not notice"). Logged 2026-08-08, not entered.
 */
import { prisma } from '../packages/db/src/index';

const REVIEWER = 'current-reviewer';
const DAVID = 'human:david@cluecrew.test';
const METHOD = 'written review — ENG-004 comprehension pilot, annie 2026-08-08';

async function main(): Promise<void> {
  const id = 'en-comparison-vehicle-misread';
  const description = 'Child gives the quality of the thing a comparison compares TO, where the answer is the quality of the thing being described — reading the vehicle of a simile or metaphor as the subject.';
  const childHint = 'Find what is being compared to what. The meaning belongs to the first thing.';
  const boundary = 'BOUNDARY vs en-attribute-transfer: both put a quality on the wrong holder. Attribute-transfer moves it BETWEEN CHARACTERS; this moves it from a comparison\'s VEHICLE to its SUBJECT. Different remedies, different hints.';
  await prisma.misconception.upsert({
    where: { id },
    create: { id, district: 'ENGLISH', description, childHint, status: 'ACTIVE', proposedBy: REVIEWER, recordedBy: DAVID, approvedBy: REVIEWER, approvalMethod: METHOD, approvalNote: boundary, category: 'comprehension' },
    update: { description, childHint, status: 'ACTIVE', approvedBy: REVIEWER, approvalMethod: METHOD, approvalNote: boundary },
  });
  await prisma.attributionEvent.upsert({
    where: { id: `authored-${id}` },
    create: { id: `authored-${id}`, recordType: 'misconception', recordId: id, action: 'AUTHORED', actor: REVIEWER, recordedBy: DAVID, note: boundary, method: METHOD },
    update: {},
  });
  console.log(`ACTIVE  ${id}`);
  console.log('LOGGED (not entered)  en-negation-dropped — by ruling');
  await prisma.$disconnect();
}

void main();
