/**
 * ON A STEP-1 SERIES, `off-by-one` MUST NOT SELECT `answer + step` (Annie, 2026-08-21 — R478).
 *
 * **BEFORE-COUNT: 0. The fault has never occurred, and the assert is owed anyway** — which is the
 * whole reason this docstring exists (R421: a zero carries its before-count or it reads as evidence
 * nothing was ever wrong).
 *
 * **WHY IT IS OWED WITH A POPULATION OF ZERO.** The generator returns BOTH sides as candidates:
 *
 *     off-by-one:  [answer + 1, answer − 1]
 *     step-repeat: [answer + step]
 *
 * On a step-1 series `answer + step` **is** `answer + 1` — one of off-by-one's two candidates. **The
 * five step-1 items avoid the collision only because the selector happened to take `answer − 1` on
 * all five.** Nothing in the generator chooses that side. **It happens to; it is not chosen**, so the
 * collision is one generation away.
 *
 * **A check that has never fired over a fault that has never occurred is indistinguishable from one
 * pointed at nothing** — so this one states, on every run, what it is watching and why zero is the
 * expected number rather than the reassuring one.
 */
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const AZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

async function main() {
  const items = await prisma.item.findMany({ include: { options: true } });
  const series = items.filter((i) => Array.isArray((i.stem as { series?: unknown })?.series));
  const step1: string[] = [];
  const collisions: string[] = [];

  for (const i of series) {
    const s = (i.stem as { series: unknown[] }).series;
    const a = AZ.indexOf(String(s[0]).toUpperCase());
    const b = AZ.indexOf(String(s[1] ?? '').toUpperCase());
    if (a < 0 || b < 0) continue;
    const step = b - a;
    if (Math.abs(step) !== 1) continue;
    step1.push(i.id);
    const key = i.options.find((o) => o.isCorrect);
    const kv = String(((key as { content?: { value?: unknown } } | undefined)?.content ?? {}).value ?? '').toUpperCase();
    const ki = AZ.indexOf(kv);
    if (ki < 0) continue;
    const forbidden = AZ[ki + step];
    for (const o of i.options) {
      if ((o as { misconceptionId?: string | null }).misconceptionId !== 'vr-letter-series-off-by-one') continue;
      const v = String(((o as { content?: { value?: unknown } }).content ?? {}).value ?? '').toUpperCase();
      if (v === forbidden) {
        collisions.push(`  ${i.id} (${i.status})  key ${kv}, step ${step}: off-by-one selected "${v}", which is also step-repeat's letter`);
      }
    }
  }

  requirePopulation('check:step1-collision', { 'series item(s)': series.length, 'step-1 item(s)': step1.length });

  if (collisions.length === 0) {
    console.log(
      '\ncheck:step1-collision: 0 collisions over ' + step1.length + ' step-1 item(s).\n' +
        '  BEFORE-COUNT: 0 — this fault has NEVER occurred, and the assert is owed anyway.\n' +
        '  The generator offers off-by-one BOTH sides (answer+1, answer-1); step-repeat takes\n' +
        '  answer+step, which on a step-1 series IS answer+1. All ' + step1.length + ' avoid it because the\n' +
        '  selector happened to take answer-1. Nothing chooses that side.\n' +
        '  **The zero is the expected number, not a reassuring one.**',
    );
    await prisma.$disconnect();
    return;
  }
  console.error(`\nSTEP-1 TAG COLLISION: ${collisions.length}`);
  collisions.forEach((c) => console.error(c));
  process.exitCode = 1;
  await prisma.$disconnect();
}

void main();
