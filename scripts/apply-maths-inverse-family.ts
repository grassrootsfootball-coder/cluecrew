/**
 * INVERSE-REASONING FAMILY — library changes (annie, written review 2026-08-07).
 * `pnpm --filter @cluecrew/db exec dotenv -e ../../.env -- tsx ../../scripts/apply-maths-inverse-family.ts`
 *
 * Two NEW misconceptions (her wording, verbatim) and PROC-01 WIDENED (verbatim) to cover
 * a chain worked backwards. The three reassignments (#14, #100, #72) are a GENERATOR fact —
 * the inverse-reasoning family draws them as distractors (families.ts) — not a library
 * category change, so they are not touched here. Re-exports the library as the last step.
 */
import { checkChildFacingText, isBlocking } from '@cluecrew/core';
import { exportMathsMisconceptions } from './export-maths-misconceptions';
import { prisma } from '../packages/db/src/index';

const DAVID = 'human:david@cluecrew.test';
const METHOD = 'written review — inverse-reasoning family';

const NEW = [
  {
    id: 'maths-109-ran-the-machine-forwards',
    entry: 109,
    category: 'Calculation',
    description: 'Applies the stated operation instead of its inverse when working backwards. Child gives 19 for □ + 7 = 12 where the answer is 5, adding the seven instead of taking it away.',
    childHint: 'Going backwards undoes each step. Take away where it added.',
  },
  {
    id: 'maths-110-missing-value-equals-the-average',
    entry: 110,
    category: 'Statistics',
    description: 'Assumes the unknown in a reverse-mean problem is the mean itself. Child gives 6 for the fifth number where four numbers are 4, 8, 5 and 9 and the mean is 6, and the answer is 4.',
    childHint: 'The mean is what they share out to. One number can sit above or below.',
  },
];

const PROC_DESC = 'Completes part of the chain correctly and gives that intermediate result, without carrying on to the step the question asks for. In a backwards problem the completed part may be the last operation rather than the first.';

async function audit(recordId: string, action: 'AUTHORED' | 'AMENDED', field: string, note: string): Promise<void> {
  const id = `attr-${recordId}-${field}-2026-08-07`;
  await prisma.attributionEvent.upsert({
    where: { id },
    create: { id, recordType: 'misconception', recordId, action, actor: 'current-reviewer', recordedBy: DAVID, field, note, method: METHOD },
    update: { note, method: METHOD },
  });
}

async function main(): Promise<void> {
  // Child-facing gate on every new hint (house rule: nothing skips the scanners).
  for (const m of NEW) {
    const fails = checkChildFacingText({ role: 'hint', label: m.id, text: m.childHint }).filter(isBlocking);
    if (fails.length) throw new Error(`${m.id} hint fails the child-facing gate: ${fails.map((f) => f.rule).join(', ')}`);
  }

  for (const m of NEW) {
    await prisma.misconception.upsert({
      where: { id: m.id },
      create: { id: m.id, district: 'MATHS', category: m.category, description: m.description, childHint: m.childHint, sourcePattern: `reviewer-authored #${m.entry} (inverse-reasoning family)`, status: 'ACTIVE' },
      update: { category: m.category, description: m.description, childHint: m.childHint, status: 'ACTIVE' },
    });
    await audit(m.id, 'AUTHORED', 'entry', `authored for the inverse-reasoning family (#${m.entry})`);
    console.log(`+ ${m.id}`);
  }

  await prisma.misconception.update({ where: { id: 'maths-proc-01-stopped-at-the-first-answer' }, data: { description: PROC_DESC } });
  await audit('maths-proc-01-stopped-at-the-first-answer', 'AMENDED', 'description', 'widened to cover a chain worked backwards (completed part may be the last operation)');
  console.log('~ PROC-01 description widened');

  const active = await prisma.misconception.count({ where: { district: 'MATHS', status: 'ACTIVE' } });
  console.log(`MATHS ACTIVE now: ${active}`);
  await exportMathsMisconceptions(prisma);
  await prisma.$disconnect();
}

void main();
