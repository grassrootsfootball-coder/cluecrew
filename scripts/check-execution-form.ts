/**
 * check:execution-form — EVERY EXECUTION CONFORMS TO ITS FAMILY'S DECLARED FORM (R1020).
 *
 * **Declare, then conform, then compare.** A family with no declared form is reported UNCHECKED and
 * never as conforming: the whole point of the declaration is that a disk cannot pass by agreeing
 * with itself.
 */
import { prisma } from '../packages/db/src/index';
import { DECLARED_FORMS, UNDECLARED_FAMILIES, UNDECLARED_NOTE, factsFor } from './lib/execution-forms';
import { seatOf } from './lib/seat-state';
import { requirePopulation } from './lib/population';
import { assertFixture } from './lib/carried-fixture';

async function main() {
  console.log('check:execution-form — declare, then conform, then compare.');
  const f = DECLARED_FORMS['vr02-partial-group']!;
  assertFixture('execution-form', [
    { name: 'the declared build reproduces its own worked example', mustBeCaught: false,
      input: JSON.stringify({ group: ['square', 'triangle', 'star'], odd: ['circle', 'oval'], oddInSeat: 'oval', memberInSeat: 'triangle', expect: f.workedExample.text }) },
    { name: 'a sentence in another form does not conform', mustBeCaught: true,
      input: JSON.stringify({ group: ['square', 'triangle', 'star'], odd: ['circle', 'oval'], oddInSeat: 'oval', memberInSeat: 'triangle', expect: 'The group of three is square, triangle and star, so the two odd ones out are circle and oval. x' }) },
  ], (raw) => {
    const c = JSON.parse(raw) as { group: string[]; odd: string[]; oddInSeat: string; memberInSeat: string; expect: string };
    return f.build(c) !== c.expect;
  });

  const rows = await prisma.item.findMany({ where: { questionTypeId: 'vr-02-two-odd-ones-out' }, orderBy: { id: 'asc' },
    select: { id: true, stem: true, options: { select: { content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true }, orderBy: { id: 'asc' } } } });
  requirePopulation('check:execution-form', { 'row(s)': rows.length, 'declared form(s)': Object.keys(DECLARED_FORMS).length });

  let conform = 0; const deviates: string[] = []; const unchecked: Record<string, number> = {};
  for (const r of rows) {
    const key = r.options.find((o) => o.isCorrect);
    if (!key) continue;
    const words = ((r.stem as { words?: unknown[] }).words ?? []).map(String);
    const odd = seatOf(key.content).split(',').map((s) => s.trim());
    for (const o of r.options) {
      const text = (o.misconceptionExecution ?? '').trim();
      if (!text || !o.misconceptionId) continue;
      const form = DECLARED_FORMS[o.misconceptionId];
      if (!form) { unchecked[o.misconceptionId] = (unchecked[o.misconceptionId] ?? 0) + 1; continue; }
      const built = form.build(factsFor(words, odd, seatOf(o.content)));
      if (built === text) conform += 1;
      else deviates.push(`${r.id} ${seatOf(o.content)}\n      declared: ${built.slice(0, 100)}\n      found:    ${text.slice(0, 100)}`);
    }
  }

  console.log(`  ${conform} execution(s) conform to a declared form; ${deviates.length} deviate.`);
  const un = Object.entries(unchecked);
  if (un.length) {
    console.log(`  ${un.reduce((a, [, n]) => a + n, 0)} execution(s) in ${un.length} UNDECLARED famil(ies) — UNCHECKED, not conforming:`);
    for (const [k, n] of un) console.log(`    ${n.toString().padStart(3)}  ${k}`);
    console.log(`  ${UNDECLARED_NOTE}`);
    for (const k of UNDECLARED_FAMILIES) if (!(k in unchecked)) console.log(`    (${k} is named undeclared and carries no execution here)`);
  }
  if (deviates.length === 0) { console.log('\n  Every execution in a declared family matches the declaration, built from its own row.'); return; }
  console.error(`\n  REFUSED — ${deviates.length} execution(s) do not match their family's declared form:`);
  for (const d of deviates.slice(0, 6)) console.error(`    ${d}`);
  process.exitCode = 1;
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
