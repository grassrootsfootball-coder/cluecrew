/**
 * MATHS TEMPLATE FAMILY SIGN-OFF (annie, signing sitting 2026-08-07).
 * `pnpm --filter @cluecrew/db exec dotenv -e ../../.env -- tsx ../../scripts/apply-maths-template-signatures.ts`
 *
 * Records a reviewer SIGNATURE per template family via the written-review path (append-only
 * AttributionEvent, action SIGNED, actor current-reviewer). Nineteen families: six laddered
 * signed across all tiers, thirteen collapsed signed at their ruled single tier. The M-place
 * signature carries her explicit qualification — she signs that every item is a fair T2 item,
 * not that the family exercises the skill broadly.
 */
import { exportMathsMisconceptions } from './export-maths-misconceptions';
import { prisma } from '../packages/db/src/index';

const DAVID = 'human:david@cluecrew.test';
const METHOD = 'written review — maths template signing sitting';

// [familyId, signed scope, note]
const SIGNATURES: Array<[string, string, string]> = [
  // Six laddered — signed across all tiers.
  ['M-round', 'T1–T5', 'Rounding; place ladder ratified (10→1000 are different jobs).'],
  ['M-money', 'T1–T5', 'Money change/shopping; T1 one-part, T2 two-part seam fix; T3–T5 step ladder.'],
  ['M-column', 'T1–T5', 'Column subtraction; real exchange ladder (none/single/multiple/across-zero/across-two-zeros).'],
  ['M-pct', 'T1–T5', 'Percentage; shape ladder of / multiples / % change / reverse. First sitting.'],
  ['M-geom', 'T1–T5', 'Geometry calculate; perimeter/area/mixed/L-shape/notch. T5 notch fix accepted.'],
  ['M-inverse', 'T1–T5', 'Inverse reasoning; steps-to-undo ladder, order-sensitive T4, reverse mean T5. First sitting.'],
  // Thirteen collapsed — signed at the ruled single tier.
  ['M-place', 'T2', 'Value of a digit. SIGNED AS: every item is a fair T2 item — NOT that the family exercises the skill broadly. A child meeting ten of them meets two columns (thousands, hundreds). Breadth is a v2 concern, carried on the family.'],
  ['M-04a', 'T2', 'Division word problem — wrong operation. Fair T2; not a tiered ladder.'],
  ['M-04c', 'T3', 'Misread which quantity; the redundant price is deliberate (misread-quantity diagnosis).'],
  ['M-05a', 'T3', 'Unit price; two-distractor floor. Fair T3.'],
  ['M-neg', 'T2', 'Greatest of four negatives. Fair T2.'],
  ['M-convert', 'T2', 'Metric conversion ×1000. Fair T2.'],
  ['M-06b', 'T4', 'Worded fraction of an amount, two-step. Fair T4.'],
  ['M-06a', 'T2', 'Unit fraction of an amount; two-distractor floor; permanent single tier.'],
  ['M-frac', 'T4', 'Adding proper fractions, denominators 3–8. Fair T4.'],
  ['M-ratio', 'T4', 'Ratio share; moved to T4 (Year 6 statutory).'],
  ['M-stats', 'T4', 'Mean of five values; moved to T4 (Year 6).'],
  ['M-time', 'T2', 'Time interval crossing the hour; moved to T2 (Year 4).'],
  ['M-04b', 'T3', 'Reversed division; moved to T3, conditional on the bounded divisors (met).'],
];

async function main(): Promise<void> {
  for (const [familyId, scope, note] of SIGNATURES) {
    const id = `sig-${familyId}-2026-08-07`;
    await prisma.attributionEvent.upsert({
      where: { id },
      create: { id, recordType: 'maths-template-family', recordId: familyId, action: 'SIGNED', actor: 'current-reviewer', recordedBy: DAVID, field: `generator@${scope}`, note, method: METHOD },
      update: { field: `generator@${scope}`, note, method: METHOD },
    });
    console.log(`SIGNED ${familyId} @ ${scope}`);
  }
  const n = await prisma.attributionEvent.count({ where: { recordType: 'maths-template-family', action: 'SIGNED' } });
  console.log(`\n${n} maths template families signed on record (DONE-1: 19/19).`);
  await exportMathsMisconceptions(prisma); // re-export per the standing rule
  await prisma.$disconnect();
}

void main();
