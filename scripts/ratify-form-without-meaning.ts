/**
 * `vr-form-without-meaning` — ratified AS STORED, in the parenthesised form (annie, 2026-08-08).
 * `pnpm --filter @cluecrew/db exec dotenv -e ../../.env -- tsx ../../scripts/ratify-form-without-meaning.ts`
 *
 * Her ruling: her file was the TRANSCRIPT of what she wrote, not the RECORD of what was approved,
 * and where those differ the record wins. Same shape as the transform ruling itself — apply the
 * transform, do not reimpose the text.
 *
 * Her readability note is carried ON THE ENTRY rather than acted on: brackets are not neutral in
 * child-facing copy, and the suspended clause is slightly harder for a nine-year-old than the comma
 * version. It passes the gate and stands. A candidate if anyone ever does a pass on hint
 * READABILITY rather than COMPLIANCE — which is a different job from the one the gate does.
 */
import { prisma } from '../packages/db/src/index';

const ID = 'vr-form-without-meaning';
const REVIEWER = 'current-reviewer';
const DAVID = 'human:david@cluecrew.test';
const METHOD = 'written review — VR hint ratification 2026-08-08';
const NOTE =
  'Ratified AS STORED, in the parenthesised form: the reviewer\'s file was the transcript of what she ' +
  'wrote, not the record of what was approved, and where those differ the record wins (same as the ' +
  'transform ruling). READABILITY NOTE, carried not acted on: brackets are not neutral in child-facing ' +
  'copy — "Read the whole sentence (or picture the word written in a book)" asks a nine-year-old to hold ' +
  'a suspended clause, slightly harder than the comma version. Passes the gate and stands; a candidate ' +
  'for any future pass on hint READABILITY rather than compliance.';

async function main(): Promise<void> {
  const before = await prisma.misconception.findUnique({ where: { id: ID } });
  if (!before) { console.log(`MISSING ${ID}`); return; }
  await prisma.misconception.update({
    where: { id: ID },
    data: { status: 'ACTIVE', approvedBy: REVIEWER, recordedBy: DAVID, approvalMethod: METHOD, approvalNote: NOTE },
  });
  await prisma.attributionEvent.upsert({
    where: { id: `approved-${ID}` },
    create: { id: `approved-${ID}`, recordType: 'misconception', recordId: ID, action: 'APPROVED', actor: REVIEWER, recordedBy: DAVID, note: NOTE, method: METHOD },
    update: { note: NOTE },
  });
  const after = await prisma.misconception.findUnique({ where: { id: ID } });
  console.log(`${ID}: ${before.status} -> ${after?.status}`);
  console.log(`hint (unchanged): ${after?.childHint}`);
  await prisma.$disconnect();
}

void main();
