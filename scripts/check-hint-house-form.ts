/**
 * THE HOUSE FORM, AND THE TWO DISEASES (Annie, 2026-08-22 — R596/R597).
 *
 * > **An item hint names what a WRONG ANSWER is doing, rather than what the right one is.**
 *
 * **The form is DESCRIPTIVE before it is prescriptive, and that is why it is worth measuring before
 * it becomes an authoring rule.** If the strongest hints already take the shape, the rule is being
 * read off the corpus rather than imposed on it — and a rule read off good practice survives
 * arguments a rule invented in a meeting does not.
 *
 * **THE ASSERTION SUBSET IS CHECKABLE, AND IT IS THE PR-07 FAULT.** A hint saying *"Two of these are
 * reasons no line gives"* asserts a COUNT over the option set. The count can be wrong, and on PR-07
 * it was: **three distractors, three arguable, and a child who counts and gets three has been told
 * something false by the hint meant to help her — and she is the careful child.** Her rule from two
 * returns earlier: **an assertion in a hint is checked against what the child can choose.** This is
 * its first authored instance, and the number is now compared to the real option set on every run.
 *
 * **THE TWO DISEASES (R597).** One word, two reviews, two failure catalogues:
 *
 *     ITEM HINTS     fail at roughly one third. Shouted capitals, dashes, coaching the key, and
 *                    asserting things about the option set. Written by somebody looking at ONE item.
 *     LIBRARY HINTS  fail at roughly two thirds. Generality, and assertions about populations their
 *                    authors could not see. Written by somebody looking at NO item.
 *
 * Neither rate is a quality judgement about its author. **They are different diseases of different
 * vantage points**, and a single "hint review" would have mixed them.
 */
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

/** Names a wrong answer: option deixis, or a negation applied to a candidate reading. */
const DEIXIS = /\b(these|one of them|the others|neither)\b/i;
const NEGATES = /\b(is not|are not|not the|not a |not about|not what|never does|does not|is no |, not )\b/i;
/** Asserts a COUNT over the option set — the checkable subset. */
const COUNT_CLAIM = /\b(one|two|three|four|both)\s+of\s+(these|them)\b/i;
const NUMBER: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, both: 2 };

async function main() {
  const items = await prisma.item.findMany({ where: { status: 'LIVE' }, include: { options: { orderBy: { id: 'asc' } } } });
  const withHint = items.filter((i) => {
    const h = (i.explanation as { hintCore?: unknown } | null)?.hintCore;
    return typeof h === 'string' && h.trim() !== '';
  }).sort((a, b) => a.id.localeCompare(b.id));

  requirePopulation('check:hint-house-form', {
    'LIVE item(s)': items.length,
    'carrying an item hint — THE POPULATION': withHint.length,
  });

  const bySeries = new Map<string, { n: number; form: number }>();
  const claims: string[] = [];
  let takesForm = 0;

  for (const i of withHint) {
    const hint = String((i.explanation as { hintCore: string }).hintCore);
    const series = i.id.match(/-([A-Z]+)-\d+$/)?.[1] ?? '?';
    const e = bySeries.get(series) ?? { n: 0, form: 0 };
    e.n++;
    if (DEIXIS.test(hint) || NEGATES.test(hint)) { e.form++; takesForm++; }
    bySeries.set(series, e);

    const m = COUNT_CLAIM.exec(hint);
    if (!m) continue;
    const asserted = NUMBER[(m[1] as string).toLowerCase()] as number;
    const distractors = i.options.filter((o) => !o.isCorrect).length;
    const verdict = asserted > distractors
      ? `IMPOSSIBLE — asserts ${asserted} of an option set with only ${distractors} distractor(s)`
      : asserted === distractors
        ? `spans every distractor (${distractors}) — true only if all of them share the property`
        : `asserts ${asserted} of ${distractors} distractor(s) — the child can count, and a different count is a false statement to her`;
    claims.push(`  COUNT CLAIM  ${i.id}\n      hint: ${hint}\n      ${verdict}`);
  }

  console.log(`\n  THE HOUSE FORM — hints naming what a WRONG ANSWER is doing: ${takesForm} of ${withHint.length}`);
  for (const [k, v] of [...bySeries].sort((a, b) => b[1].form - a[1].form)) {
    if (v.form > 0) console.log(`      ${k.padEnd(6)} ${v.form} of ${v.n}`);
  }
  console.log(
    '  A PROXY: option deixis, or a negation applied to a candidate reading. It cannot see a hint\n'
    + '  that names a wrong move without negating anything, so this is a FLOOR on the house form and\n'
    + '  never a ceiling.',
  );

  console.log(`\n  ASSERTIONS OVER THE OPTION SET — checkable against what the child can choose: ${claims.length}`);
  for (const c of claims) console.log(`${c}`);
  if (claims.length === 0) {
    console.log('      (none) — and a clean run here says only that no hint asserts a COUNT. It says\n'
      + '      nothing about assertions of other kinds, which `check:hint-asserts-feature` screens.');
  }

  console.log(
    '\n  THE TWO DISEASES — one word, two reviews (R597):\n'
    + '      ITEM HINTS    written by somebody looking at ONE item. Failure: shouted capitals,\n'
    + '                    dashes, coaching the key, asserting things about the option set.\n'
    + '      LIBRARY HINTS written by somebody looking at NO item. Failure: generality, and\n'
    + '                    assertions about populations their authors could not see.\n'
    + '      Neither rate is a judgement about its author. They are diseases of different vantage\n'
    + '      points, and one combined "hint review" would have mixed them.',
  );
  await prisma.$disconnect();
}

void main();
