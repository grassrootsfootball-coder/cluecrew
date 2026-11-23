/**
 * DOES ANY CHILD-FACING STRING STILL NAME THE LETTER N? (Annie, 2026-08-21 — R411.)
 *
 * Her fifth-return ruling changed **eighteen stems and nothing else.** The verdict option reads
 * *"No mistake"* on the screen. **Any string still naming a letter sends a child to find something
 * that is not there.**
 *
 * **THE STEMS WERE THE POPULATION SOMEBODY POINTED AT; THE LETTER IS THE PROPERTY.** A sweep scoped
 * to stems finds what was already fixed. This sweeps every child-facing string in the store.
 */
import { textsFrom } from '../packages/core/src/item-content-gate';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

/** A LONE capital N as a word — not "N" inside a name, not "n" as a variable. */
const LONE_N = /(?<![A-Za-z0-9'’-])N(?![A-Za-z0-9'’-])/;

async function main() {
  const items = await prisma.item.findMany({ include: { options: { orderBy: { id: 'asc' } } } });
  const lib = await prisma.misconception.findMany({ select: { id: true, childHint: true, description: true } });
  const rows: Array<{ where: string; text: string }> = [];

  /**
   * **SCOPED TO ITEMS THAT ACTUALLY CARRY A VERDICT OPTION.** The first run flagged VR
   * letter-series items where **N is a genuine letter of the alphabet** — a real option value and a
   * walk script correctly naming it. That is the property sweep finding the property everywhere it
   * legitimately occurs, which is the opposite failure from scoping to the eighteen stems: too wide
   * rather than too narrow, and just as useless.
   *
   * The ruling is about the VERDICT option — the one that reads "No mistake" on the screen — so the
   * population is items that have one.
   */
  const verdictItems = new Set(
    items.filter((i) => i.options.some((o) => {
      const v = ((o as { content?: { value?: unknown } }).content ?? {}).value;
      return typeof v === 'string' && /no mistake/i.test(v);
    })).map((i) => i.id),
  );
  const verdictTags = new Set<string>();
  for (const i of items) {
    if (!verdictItems.has(i.id)) continue;
    for (const o of i.options) {
      const m = (o as { misconceptionId?: string | null }).misconceptionId;
      if (m) verdictTags.add(m);
    }
  }

  for (const i of items) {
    if (!verdictItems.has(i.id)) continue;
    for (const [p, t] of textsFrom(i.stem, 'stem')) rows.push({ where: `${i.id} ${p}`, text: t });
    for (const f of ['walkScript', 'walk', 'hintCore'] as const) {
      const t = (i.explanation as Record<string, unknown>)?.[f];
      if (typeof t === 'string') rows.push({ where: `${i.id} explanation.${f}`, text: t });
    }
    for (const o of i.options) {
      const v = ((o as { content?: { value?: unknown } }).content ?? {}).value;
      if (typeof v === 'string') rows.push({ where: `${i.id} option.value`, text: v });
    }
  }
  for (const m of lib) {
    // Only entries reachable FROM a verdict item — a library hint a verdict item can serve.
    if (m.childHint && verdictTags.has(m.id)) rows.push({ where: `library:${m.id}.childHint`, text: m.childHint });
  }

  requirePopulation('check:lone-letter-n', {
    'item(s) carrying a verdict option': verdictItems.size,
    'child-facing string(s) on them': rows.length,
  });

  const hits = rows.filter((r) => LONE_N.test(r.text));
  if (hits.length === 0) {
    /**
     * **THE ZERO CARRIES ITS BEFORE-COUNT, OR IN A MONTH IT READS AS EVIDENCE NOTHING WAS EVER
     * WRONG** (Annie, 2026-08-21). She found TWO by reading, four returns apart, and this sweep
     * first ran an hour after the second was repaired. **A zero with no history is
     * indistinguishable from a population that never had the fault** — R60's discipline applied to
     * TIME rather than to population: a check may not report a zero without saying what it counted
     * over, and "over what" includes "since when".
     */
    console.log(
      '\ncheck:lone-letter-n: 0 child-facing strings name a lone letter N.\n' +
        '  BEFORE-COUNT: 2, found by reading rather than by this check — `ENG-003-A-SP-07` and\n' +
        '  `en-n-option-avoidance`, four returns apart, both repaired 2026-08-21.\n' +
        '  This sweep first ran AFTER the second repair. **The zero is a confirmation, not a\n' +
        '  discovery**, and it did not find either instance.',
    );
    await prisma.$disconnect();
    return;
  }
  console.error(`\nCHILD-FACING STRINGS NAMING A LONE LETTER N: ${hits.length}`);
  for (const h of hits) console.error(`  ${h.where}\n      ${h.text.slice(0, 130)}`);
  console.error(
    '\n  The verdict option reads "No mistake" on the screen. Each of these sends a child to find a\n' +
      '  letter that is not there — her fifth-return ruling reached eighteen stems and stopped.',
  );
  process.exitCode = 1;
  await prisma.$disconnect();
}

void main();
