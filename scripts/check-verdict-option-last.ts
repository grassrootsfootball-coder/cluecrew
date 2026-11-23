/**
 * A VERDICT OPTION IS LAST ON EVERY CARD A CHILD CAN BE SERVED — asserted through the real shuffle,
 * for many children, never drawn from the authored order.
 *
 * **ANNIE'S RULING, 2026-08-19 (R251), AND HER REASON FOR WANTING AN ASSERT.** `no word is needed`
 * is the last option on both cards that carry it TODAY, in authored order. **That is precisely why
 * it had to be asserted rather than drawn**: the property holds by accident of authoring, cloze
 * options shuffle, and the shuffle is free to break it on any child's next session. A card whose
 * opening choice is *no word is needed* hands the child a verdict before she has read a single
 * candidate.
 *
 * **IT RUNS THE SERVING FUNCTION, NOT A COPY OF IT** (R60 question 3). `shuffleOptionsForChild` is
 * imported from the serving path, so a change that reintroduces the fault fails here even if this
 * file is never touched.
 *
 * **AND IT REFUSES TO PASS BLIND** (R60 questions 1 and 2). It requires that the population of
 * verdict-carrying items be non-empty, and it requires a CONTROL — at least one such item on a
 * SHUFFLING family. An item on a family exempt from shuffle (error-spot) satisfies the property
 * trivially, so a run that saw only those would be reporting a guarantee it never tested.
 */
import { isVerdictOption } from '../packages/core/src/index';
import { shuffleOptionsForChild, optionsAreOrderedByConstruction } from '../apps/web/lib/crew/shuffle';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

/** Enough children that a 3- or 4-option card would land the verdict first many times over. */
const CHILDREN = Array.from({ length: 200 }, (_, i) => `synthetic-child-${i}`);

const valueOf = (option: { content: unknown }): unknown => {
  const content = option.content as { value?: unknown } | null;
  return content?.value ?? option.content;
};

async function main() {
  const items = await prisma.item.findMany({
    // The SERVING order (orchestrator.ts and mocks.ts read options `orderBy: { id: 'asc' }`). Read
    // unordered, an ordered-by-construction item comes back in Postgres's physical order, which moves
    // whenever an option row is rewritten: ENG-003-A-SP-08's OPT-D was, and the check reported 200
    // faults on a card every child is served correctly (R1053).
    select: { id: true, questionTypeId: true, status: true, stem: true, options: { select: { id: true, content: true }, orderBy: { id: 'asc' } } },
    orderBy: { id: 'asc' },
  });
  const carrying = items.filter((i) => i.options.some((o) => isVerdictOption(valueOf(o))));
  requirePopulation('verdict-option position', {
    'items screened': items.length,
    'items carrying a verdict option': carrying.length,
  });

  /**
   * THE CONTROL IS SYNTHETIC, BECAUSE A LIVE ONE EVAPORATES THE DAY THE BANK CHANGES (R254).
   *
   * The first version required at least one verdict item on a SHUFFLING family — a live instance.
   * That control is real information and it is not a control: retire the two cloze cards, or move
   * every N-carrying VR type onto an exempt family, and the requirement is silently unmeetable
   * while the check goes on passing. **A control that depends on the fault's population still
   * existing disappears exactly when the codebase gets it right.**
   *
   * So the mechanism is fired at a fixture: a synthetic item whose verdict option is authored
   * FIRST, pushed through the real `shuffleOptionsForChild`. If it does not come back last, the
   * pin is broken and nothing below this line means anything.
   */
  const fixture = [
    { id: 'f-verdict', content: { label: 'A', value: 'no word is needed' } },
    { id: 'f-one', content: { label: 'B', value: 'because' } },
    { id: 'f-two', content: { label: 'C', value: 'although' } },
  ];
  const fixtureServed = shuffleOptionsForChild(fixture, 'control-child', 'control-item', {});
  if (fixtureServed[fixtureServed.length - 1]!.id !== 'f-verdict') {
    console.error('CONTROL FAILED: the pin did not move a synthetic verdict option to last.');
    console.error(`  served order: ${fixtureServed.map((o) => o.id).join(', ')}`);
    console.error('  The mechanism is broken, so the bank result below carries no information.');
    await prisma.$disconnect();
    process.exit(1);
  }

  // Live coverage is reported as INFORMATION, not as the control — it says how much of the bank
  // this run actually exercised, which a passing control does not.
  const shuffling = carrying.filter((i) => !optionsAreOrderedByConstruction(i.stem));
  if (shuffling.length === 0) {
    console.log('  NOTE: no verdict-carrying item is on a shuffling family today, so the bank half');
    console.log('  of this run is trivially satisfied. The synthetic control above still proves the');
    console.log('  mechanism works. This is a coverage gap, not a pass with nothing behind it.');
  }

  const faults: string[] = [];
  let draws = 0;
  for (const item of carrying) {
    for (const child of CHILDREN) {
      const served = shuffleOptionsForChild(item.options, child, item.id, item.stem);
      draws += 1;
      const verdictIndices = served
        .map((o, index) => (isVerdictOption(valueOf(o)) ? index : -1))
        .filter((index) => index >= 0);
      const expected = Array.from(
        { length: verdictIndices.length },
        (_, k) => served.length - verdictIndices.length + k,
      );
      if (verdictIndices.join(',') !== expected.join(',')) {
        faults.push(
          `${item.id} (${item.questionTypeId}), child ${child}: verdict option(s) served at ` +
            `${verdictIndices.join(',')} of ${served.length}, expected ${expected.join(',')}`,
        );
      }
    }
  }

  console.log('verdict-option position — through the real serving shuffle');
  console.log(`  items screened: ${items.length}`);
  console.log(`  carrying a verdict option: ${carrying.length}`);
  console.log(`    of those, on a SHUFFLING family (the ones this can actually test): ${shuffling.length}`);
  for (const i of shuffling) {
    const which = i.options.filter((o) => isVerdictOption(valueOf(o))).map((o) => String(valueOf(o)));
    console.log(`      ${i.id.padEnd(20)} ${i.questionTypeId.padEnd(22)} "${which.join('", "')}"`);
  }
  console.log(`    on a family exempt from shuffle (trivially satisfied): ${carrying.length - shuffling.length}`);
  console.log(`  draws simulated: ${draws} (${CHILDREN.length} children)`);

  if (faults.length > 0) {
    console.error(`\n${faults.length} FAULT(S) — showing the first 5:`);
    for (const f of faults.slice(0, 5)) console.error(`  - ${f}`);
    await prisma.$disconnect();
    process.exit(1);
  }
  console.log('\n  0 faults. No child can be served a card whose verdict option comes before a candidate.');
  await prisma.$disconnect();
}

main();
