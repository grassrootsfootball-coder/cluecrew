/**
 * ANNIE'S MATHS LIBRARY SITTING — phases A+B (`--apply` to write).
 *
 * Verbatim to ~/Downloads/maths-library-sitting.txt: the process axis, the six
 * splits, the earlier-six splits, the #24/#76 merge, #98-101 reframed and the
 * sixteen descriptions. Written-review path (annie AUTHORS/AMENDS, David records),
 * every child hint gated. Re-exports the library as the final step (house rule).
 */
import { checkChildFacingText, isBlocking } from '@cluecrew/core';
import { prisma } from '../packages/db/src/index';
import { exportMathsMisconceptions } from './export-maths-misconceptions';

const APPLY = process.argv.includes('--apply');
const DAVID = 'human:david@cluecrew.test';
const METHOD = 'written review — maths library sitting (annie), 2026-08-06';
const CAT = { NPV: 'Number & Place Value', CALC: 'Calculation', FDP: 'Fractions, Decimals & Percentages', MEAS: 'Measurement', GEOM: 'Geometry', STATS: 'Statistics', PROC: 'Process' };

// A — new entries (8). PROC-01 + #102-#108.
const NEW = [
  { sp: 'PROC-01', id: 'maths-proc-01-stopped-at-the-first-answer', category: CAT.PROC, axis: 'PROCESS', description: 'Child gives 32 for the mean of 7, 9, 6 and 10 where the answer is 8, adding the scores and stopping before dividing.', childHint: 'You found part of it. Now read the question again and finish.' },
  { sp: '#102', id: 'maths-102-scaled-by-the-difference', category: CAT.MEAS, description: 'Child gives £1.20 for 5 apples where the answer is £1.00, multiplying by the two extra apples rather than by five.', childHint: 'Multiply by how many you need now. Not by how many more.' },
  { sp: '#103', id: 'maths-103-scaled-by-the-original-count', category: CAT.MEAS, description: 'Child gives £0.60 for 5 apples where the answer is £1.00, finding 20p each and multiplying by three again.', childHint: 'You found one share. Now count how many you need.' },
  { sp: '#104', id: 'maths-104-gave-a-different-average', category: CAT.STATS, description: 'Child gives 4 for the mean of 7, 9, 6 and 10 where the answer is 8, giving the range instead.', childHint: 'Mean means add them up, then share. Check which one is asked.' },
  { sp: '#105', id: 'maths-105-divided-by-the-other-quantity', category: CAT.MEAS, description: 'Child gives 13p where the answer is 5p, dividing 120 by ten and 150 by six.', childHint: 'Match each price to its own pack. Keep the pairs together.' },
  { sp: '#106', id: 'maths-106-always-rounds-down', category: CAT.NPV, description: 'Child gives 3,700 for 3,762 to the nearest 100 where the answer is 3,800, chopping off the end instead of rounding.', childHint: 'Look at the next digit along. It tells you which way to go.' },
  { sp: '#107', id: 'maths-107-miscounted-across-zero', category: CAT.NPV, description: 'Child gives -4 for 4 falling by 9 where the answer is -5, counting zero as one of the nine steps.', childHint: 'Zero is a place you pass, not a step. Count the jumps.' },
  { sp: '#108', id: 'maths-108-multiplied-instead-of-dividing-by-a-fraction', category: CAT.FDP, description: 'Child gives 2 for the number of half-litre glasses in 4 litres where the answer is 8, working out four halves instead.', childHint: 'Ask how many fit inside. That is a sharing question, not a times.' },
];

// A — reclassify to the process axis (role change, wordings unchanged here; #99/#100 also reworded below).
const RECLASSIFY_PROCESS = ['#71', '#72', '#99', '#100'];
// A — retire (soft, REJECTED) with a reason.
const RETIRE = [{ sp: '#76', note: 'Absorbed into #24 (fraction-used-upside-down) — annie 2026-08-06.' }, { sp: '#86', note: 'Dissolved: uses moved to #71 and PROC-01 — annie 2026-08-06.' }];

// B — reword description + hint (verbatim).
const REWORD: Record<string, { description: string; childHint: string; axis?: string }> = {
  '#92': { description: 'Child gives £3.00 for 5 apples where the answer is £1.00, multiplying the price of three apples by five.', childHint: 'Find the cost of just one first. Then multiply that.' },
  '#75': { description: 'Child gives 2/3 of 12 = 24 where the answer is 8, using only the numerator; or 15 divided by 3/4 = 5 where the answer is 20, using only the denominator — treating the fraction as a single number.', childHint: 'A fraction is two numbers working together. Use both.' },
  '#96': { description: 'Child gives 16 for the mean of four scores totalling 32 where the answer is 8, dividing by two instead of by four.', childHint: 'Count how many numbers you added. Divide by that.' },
  '#93': { description: 'Child gives 30p where the answer is 5p, taking £1.20 from £1.50 without finding the price of one egg.', childHint: 'The packs hold different amounts. Find the price of one first.' },
  '#88': { description: 'Child gives 19 cm for a rectangle 8 cm by 3 cm where the answer is 22 cm, adding three sides and leaving one out.', childHint: 'Walk all the way round the shape. Count every side once.' },
  '#24': { description: 'Child gives 2/3 of 12 = 18 where the answer is 8, using three halves of 12 instead of two thirds.', childHint: 'Check which number is on top. Turning it over changes the fraction.' },
  '#98': { description: 'Child gives 234 + 158 = 292 where the answer is 392, setting the sum down with only part of one number.', childHint: 'Line the digits up in their columns. Every digit needs a place.' },
  '#99': { description: 'Child gives 62 - 27 = 40 where the answer is 35, rounding both to the nearest ten and giving the rounded result.', childHint: 'Rounding helps you check an answer. Work the real numbers out too.', axis: 'PROCESS' },
  '#100': { description: 'Child gives 50 degrees where the answer is 70, halving 180 before taking away the 40.', childHint: 'Say the steps out loud in order. Then do them one at a time.', axis: 'PROCESS' },
  '#101': { description: 'Child gives "cannot tell" for 3/8 against 3/5 where the answer is 3/5, believing fractions with different bottoms cannot be compared.', childHint: 'Any two fractions can be compared. Draw each one and see which covers more.' },
};
// B — narrowed entries where the sitting gave only a hint (keep the description).
const REHINT: Record<string, string> = {
  '#65': 'Check which place the question asks for. Then look at the digit after it.',
  '#66': 'Count down past zero. The numbers keep going on the other side.',
};

// B — the sixteen descriptions (description only, verbatim §6).
const DESC16: Record<string, string> = {
  '#3': 'Child gives 3.4 + 12.56 = 12.90 where the answer is 15.96, lining up the right-most digits instead of the decimal points.',
  '#16': 'Child gives 3 divided by 12 = 4 where the answer is 0.25, treating division as working the same way round either way.',
  '#19': 'Child gives 4 cars for 21 children at 5 per car where the answer is 5, dropping the remainder instead of seeing that one child still needs a car.',
  '#21': 'Child gives 1/8 as bigger than 1/4 where the answer is 1/4, reading the bigger bottom number as the bigger share.',
  '#23': 'Child gives 1/2 = 3/4 where the answer is 1/2 = 2/4, adding two to the top and bottom instead of multiplying both by two.',
  '#25': 'Child gives 1/3 = 0.3 where the answer is 0.333..., reading the bottom number as the digit after the point.',
  '#28': 'Child gives 3/4 as a point past 3 on a number line where the answer lies between 0 and 1, reading the 3 and the 4 as two separate numbers.',
  '#30': 'Child gives 1/4 of a 20 cm ribbon as the same length as 1/4 of a 40 cm ribbon where the answers are 5 cm and 10 cm, treating a fraction as a fixed amount rather than a share of its own whole.',
  '#37': 'Child gives 1 kg = 100 g where the answer is 1,000 g, using the hundred from centimetres and metres.',
  '#40': 'Child gives the same perimeter for a 3 cm by 4 cm rectangle and a 2 cm by 6 cm rectangle where the answers are 14 cm and 16 cm, assuming equal areas force equal perimeters.',
  '#51': 'Child gives 6 cakes from 4 eggs where the answer is 8, adding two to both sides instead of doubling.',
  '#52': 'Child gives 1/3 of the counters as red for a ratio of 1:3 where the answer is 1/4, using the second number as the whole instead of the total of both.',
  '#53': 'Child gives 4 where the answer is 20, counting four pictures as four items when the key says each picture stands for five.',
  '#59': 'Child gives 10 people for a quarter of a chart of 80 where the answer is 20, carrying the count across from an identical-looking wedge on a chart of 40.',
  '#61': 'Child gives 60 for the 6 in 4,652 where the answer is 600, reading the digit one column to the right; or 6,000, reading it one column to the left.',
  '#78': 'Child gives 25% of 80 = 40 where the answer is 20, treating 25% as a half rather than a quarter.',
};

async function attr(recordId: string, action: 'AMENDED' | 'AUTHORED' | 'REASSIGNED', field: string | null, note: string): Promise<void> {
  const id = `attr-misconception-${recordId}-${action}-current-reviewer-sitting`;
  await prisma.attributionEvent.upsert({ where: { id }, create: { id, recordType: 'misconception', recordId, action, actor: 'current-reviewer', recordedBy: DAVID, field, note, method: METHOD }, update: { action, field, note, method: METHOD } });
}

async function main(): Promise<void> {
  // Gate every hint first.
  const hints = [...NEW.map((n) => n.childHint), ...Object.values(REWORD).map((r) => r.childHint), ...Object.values(REHINT)];
  const faults = hints.flatMap((h) => checkChildFacingText({ role: 'hint', label: h.slice(0, 18), text: h }).filter(isBlocking));
  if (faults.length) { console.log(`REFUSED — hint gate: ${faults[0]!.detail}`); await prisma.$disconnect(); return; }

  const ms = await prisma.misconception.findMany({ where: { district: 'MATHS' }, select: { id: true, sourcePattern: true } });
  const idBySp = (sp: string): string | undefined => ms.find((m) => new RegExp(`(^|#)${sp.replace('#', '')}$`).test((m.sourcePattern ?? '').trim()) || (m.sourcePattern ?? '') === sp)?.id;
  const clashes = NEW.filter((n) => idBySp(n.sp));
  if (clashes.length) { console.log(`REFUSED — id clash: ${clashes.map((c) => c.sp).join(', ')}`); await prisma.$disconnect(); return; }

  let created = 0, reworded = 0, rehinted = 0, described = 0, reclassed = 0, retired = 0;
  const missing: string[] = [];

  if (APPLY) {
    for (const n of NEW) {
      await prisma.misconception.upsert({ where: { id: n.id }, create: { id: n.id, district: 'MATHS', category: n.category, description: n.description, childHint: n.childHint, sourcePattern: n.sp, status: 'ACTIVE', axis: (n as { axis?: string }).axis as never ?? null }, update: { description: n.description, childHint: n.childHint, status: 'ACTIVE', axis: (n as { axis?: string }).axis as never ?? null } });
      await attr(n.id, 'AUTHORED', null, `New entry ${n.sp} (annie's sitting).`);
      created += 1;
    }
    for (const sp of RECLASSIFY_PROCESS) { const id = idBySp(sp); if (!id) { missing.push(sp); continue; } await prisma.misconception.update({ where: { id }, data: { axis: 'PROCESS' as never } }); await attr(id, 'AMENDED', 'axis', `Reclassified topic->process (${sp}); wording unchanged.`); reclassed += 1; }
    for (const r of RETIRE) { const id = idBySp(r.sp); if (!id) { missing.push(r.sp); continue; } await prisma.misconception.update({ where: { id }, data: { status: 'REJECTED', rejectedBy: DAVID, rejectedAt: new Date(), rejectionNote: r.note } }); await attr(id, 'AMENDED', 'status', r.note); retired += 1; }
    for (const [sp, r] of Object.entries(REWORD)) { const id = idBySp(sp); if (!id) { missing.push(sp); continue; } await prisma.misconception.update({ where: { id }, data: { description: r.description, childHint: r.childHint, ...(r.axis ? { axis: r.axis as never } : {}) } }); await attr(id, 'AMENDED', 'description+hint', `Reworded ${sp} (annie's sitting).`); reworded += 1; }
    for (const [sp, h] of Object.entries(REHINT)) { const id = idBySp(sp); if (!id) { missing.push(sp); continue; } await prisma.misconception.update({ where: { id }, data: { childHint: h } }); await attr(id, 'AMENDED', 'hint', `Narrowed hint ${sp}.`); rehinted += 1; }
    for (const [sp, d] of Object.entries(DESC16)) { const id = idBySp(sp); if (!id) { missing.push(sp); continue; } await prisma.misconception.update({ where: { id }, data: { description: d } }); await attr(id, 'AMENDED', 'description', `Reframed description ${sp} (annie's sitting).`); described += 1; }
  }

  // Report what was DONE, not what was planned. The counters were being incremented and thrown
  // away while this line printed the input lengths, so a sitting that silently skipped rows still
  // reported the full count — the same asserted-vs-measured fault the generator sweep turned up.
  const done = APPLY
    ? `created ${created}, reclass ${reclassed}, retire ${retired}, reword ${reworded}, rehint ${rehinted}, desc16 ${described}`
    : `created ${NEW.length}, reclass ${RECLASSIFY_PROCESS.length}, retire ${RETIRE.length}, reword ${Object.keys(REWORD).length}, rehint ${Object.keys(REHINT).length}, desc16 ${Object.keys(DESC16).length}`;
  const planned = NEW.length + RECLASSIFY_PROCESS.length + RETIRE.length + Object.keys(REWORD).length + Object.keys(REHINT).length + Object.keys(DESC16).length;
  const applied = created + reclassed + retired + reworded + rehinted + described;
  console.log(`${APPLY ? 'APPLIED' : '--dry-run'}: ${done}`);
  if (APPLY && applied !== planned) console.log(`  SHORT: ${applied} of ${planned} rows changed — see MISSING below.`);
  if (missing.length) console.log('  MISSING ids for:', missing.join(', '));
  if (APPLY) { const path = await exportMathsMisconceptions(prisma); console.log(`re-exported → ${path.split('/').pop()}`); }
  await prisma.$disconnect();
}

void main();
