/**
 * SPaG generator-family SIGN-OFF (annie's SPaG signing sitting).
 * `pnpm --filter @cluecrew/db exec dotenv -e ../../.env -- tsx ../../scripts/apply-spag-signatures.ts`
 *
 * Records a reviewer SIGNATURE per SPaG family via the written-review path (append-only
 * AttributionEvent, action SIGNED, actor current-reviewer). The M-place pattern: the
 * qualification sits WITH the signature, not in a side note — annie signs that every item the
 * family emits is fair at its tier and the ladder is honest, NOT that a child can practise it
 * without repetition (the bank is 24 sentences, 6 per rung, so a tier emits six distinct items).
 */
import { prisma } from '../packages/db/src/index';

const DAVID = 'human:david@cluecrew.test';
const METHOD = 'written review — SPaG signing sitting 2026-08-08';

// [familyId, signed scope, note]
const SIGNATURES: Array<[string, string, string]> = [
  ['spag-spell-homophone-by-sound', 'T1–T4', 'Homophones. SIGNED AS: every item the family emits is a fair item at its tier and the near-miss ladder (0/1/2/3, derived-and-verified) is honest — NOT that a child can practise without repetition. The bank is 24 verified sentences (6 per rung); with dedup-by-sentence a tier emits six distinct items, so two sittings exhaust a tier. Bank depth is a SERVING concern, carried on the family (same shape as the M-place qualification), to be sized before volume. T5 out of scope (SPaG ceiling T4).'],
];

async function main(): Promise<void> {
  for (const [familyId, scope, note] of SIGNATURES) {
    const id = `sig-${familyId}-2026-08-08`;
    await prisma.attributionEvent.upsert({
      where: { id },
      create: { id, recordType: 'spag-template-family', recordId: familyId, action: 'SIGNED', actor: 'current-reviewer', recordedBy: DAVID, field: `generator@${scope}`, note, method: METHOD },
      update: { field: `generator@${scope}`, note, method: METHOD },
    });
    console.log(`SIGNED ${familyId} @ ${scope}`);
  }
  const n = await prisma.attributionEvent.count({ where: { recordType: 'spag-template-family', action: 'SIGNED' } });
  console.log(`\n${n} SPaG family signature(s) on record.`);
  await prisma.$disconnect();
}

void main();
