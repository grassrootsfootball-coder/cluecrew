/**
 * ANNIE'S MATHS LIBRARY PASS — `pnpm tsx scripts/apply-maths-annie-pass.ts --apply`.
 *
 * Applies the current reviewer's calibration-pass authoring the written-review way
 * (annie's judgement, recorded by David), each recorded as an AttributionEvent so
 * the two-person history is legible — annie AMENDS or AUTHORS over joan's library:
 *   - 11 descriptions reframed to "child gives X where the answer is Y" (arithmetic
 *     verified by hand before landing — three had errors in joan's originals);
 *   - #71 / #74 / #89 narrowed as they split;
 *   - #98-101 created (the four new ids from those splits).
 * Child hints are gated; a blocking fault refuses the whole run.
 */
import { checkChildFacingText, isBlocking } from '@cluecrew/core';
import { prisma } from '../packages/db/src/index';
import { exportMathsMisconceptions } from './export-maths-misconceptions';

const APPLY = process.argv.includes('--apply');
const DAVID = 'human:david@cluecrew.test';
const METHOD = 'written review — maths calibration pass (annie), 2026-08-06';

// 11 reframed descriptions, verbatim, keyed by sourcePattern.
const DESC: Record<string, string> = {
  '#1': 'Child gives 34 for "three hundred and four" where the answer is 304.',
  '#2': 'Child gives 3004 for "three hundred and four" where the answer is 304.',
  '#6': 'Child gives 3.4 × 10 = 3.40 where the answer is 34, applying a whole-number rule to a decimal.',
  '#11': 'Child gives 42 − 17 = 35 where the answer is 25, taking the smaller digit from the larger in each column regardless of which sits on top.',
  '#14': 'Child gives 4 + 5 = 9 + 2 where the answer is 4 + 5 = 7 + 2, reading the equals sign as an instruction to write a total rather than as a balance.',
  '#17': 'Child gives 13 ÷ 5 = 2.3 where the answer is 2.6, writing the remainder after the point as though it were a decimal.',
  '#22': 'Child gives 1/2 + 1/3 = 2/5 where the answer is 5/6.',
  '#26': 'Child gives 0.4 = 0.4% where the answer is 40%, adding the symbol without converting.',
  '#29': 'Child gives 3/8 > 2/3 where the answer is 2/3 > 3/8, comparing numerators alone.',
  '#32': 'Child gives 2:45 + 20 minutes = 2:65 where the answer is 3:05.',
  '#44': 'Child gives 130° where the answer is 50°, reading the outer scale instead of the inner one.',
};

// Narrowed as they split (description + hint), keyed by sourcePattern.
const NARROW: Record<string, { description: string; childHint: string }> = {
  '#71': { description: 'A number the question gives is never used at all.', childHint: 'List every number the question gives you. Check you have used each one.' },
  '#89': { description: 'Uses the wrong total for the shape, typically 360 for a straight line or a triangle, or 90 for a straight line.', childHint: 'Ask what the angles sit on first. A line is 180, a turn is 360.' },
  '#74': { description: 'Sees matching top numbers and concludes the fractions are the same size.', childHint: 'The top numbers match, so look at the bottoms. Smaller bottoms make bigger pieces.' },
};

// Four new ids from the splits.
const NEW = [
  { sp: '#98', id: 'maths-98-digit-dropped-in-column-work', category: 'Calculation', description: 'Sets out a column calculation using only part of one number, usually losing its highest digit.', childHint: 'Line the digits up in their columns. Every digit needs a place.' },
  { sp: '#99', id: 'maths-99-rounded-without-compensating', category: 'Calculation', description: 'Rounds to make the arithmetic easy, then gives the rounded result as the answer.', childHint: 'Rounding helps you check an answer. Work the real numbers out too.' },
  { sp: '#100', id: 'maths-100-steps-out-of-order', category: 'Geometry', description: 'Uses the correct total but performs the steps in the wrong sequence, or stops one step early.', childHint: 'Say the steps out loud in order. Then do them one at a time.' },
  { sp: '#101', id: 'maths-101-unlike-denominators-cannot-be-compared', category: 'Fractions, Decimals & Percentages', description: 'Believes fractions with different bottom numbers cannot be compared at all.', childHint: 'Any two fractions can be compared. Draw each one and see which covers more.' },
];

async function attr(recordId: string, action: 'AMENDED' | 'AUTHORED', field: string | null, note: string): Promise<void> {
  const id = `attr-misconception-${recordId}-${action}-current-reviewer`;
  await prisma.attributionEvent.upsert({
    where: { id },
    create: { id, recordType: 'misconception', recordId, action, actor: 'current-reviewer', recordedBy: DAVID, field, note, method: METHOD },
    update: { action, field, note, method: METHOD },
  });
}

async function main(): Promise<void> {
  // Gate every hint we are about to write.
  const gated = [...Object.values(NARROW), ...NEW].map((e) => e.childHint);
  const faults = gated.flatMap((h) => checkChildFacingText({ role: 'hint', label: h.slice(0, 20), text: h }).filter(isBlocking));
  if (faults.length) { console.log(`REFUSED — hint gate: ${faults[0]!.detail}`); await prisma.$disconnect(); return; }

  const ms = await prisma.misconception.findMany({ where: { district: 'MATHS' }, select: { id: true, sourcePattern: true } });
  const byNum = (sp?: string | null): string | undefined => /#(\d+)\b/.exec(sp ?? '')?.[0];
  const idOf = (n: string): string | undefined => ms.find((x) => byNum(x.sourcePattern) === n)?.id;

  let desc = 0, narrow = 0, created = 0;
  const missing: string[] = [];

  for (const [n, description] of Object.entries(DESC)) {
    const id = idOf(n); if (!id) { missing.push(n); continue; }
    if (APPLY) { await prisma.misconception.update({ where: { id }, data: { description } }); await attr(id, 'AMENDED', 'description', `Reframed to "child gives X where the answer is Y" (${n}); arithmetic verified before landing.`); }
    desc += 1;
  }
  for (const [n, patch] of Object.entries(NARROW)) {
    const id = idOf(n); if (!id) { missing.push(n); continue; }
    if (APPLY) { await prisma.misconception.update({ where: { id }, data: patch }); await attr(id, 'AMENDED', 'description+hint', `Narrowed as ${n} split; sibling id(s) created.`); }
    narrow += 1;
  }
  for (const e of NEW) {
    if (idOf(e.sp)) { missing.push(`${e.sp} already exists`); continue; }
    if (APPLY) {
      await prisma.misconception.upsert({ where: { id: e.id }, create: { id: e.id, district: 'MATHS', category: e.category, description: e.description, childHint: e.childHint, sourcePattern: e.sp, status: 'ACTIVE' }, update: { description: e.description, childHint: e.childHint, status: 'ACTIVE' } });
      await attr(e.id, 'AUTHORED', null, `New id ${e.sp} from a split of a joan entry (annie's authoring).`);
    }
    created += 1;
  }

  console.log(`${APPLY ? 'APPLIED' : '--dry-run (no --apply)'}: descriptions ${desc}/11, narrowed ${narrow}/3, created ${created}/4`);
  if (missing.length) console.log('  NOTE:', missing.join(', '));

  // House rule: a script that applies reviewer decisions re-exports the affected
  // artefact as its FINAL step, so the export follows the state change instead of
  // lagging it (the freshness stamp is a check, not the mechanism).
  if (APPLY) { const path = await exportMathsMisconceptions(prisma); console.log(`re-exported the maths library → ${path.split('/').pop()}`); }
  await prisma.$disconnect();
}

void main();
