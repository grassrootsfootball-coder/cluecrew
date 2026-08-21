/**
 * WHEN AN ITEM'S KEY CHANGES, RE-RUN THE CARD CHECK ON THAT ITEM (Annie, 2026-08-21 — R446).
 *
 * **One item, one comparison, at the point where the person changing the key is present.**
 *
 * `exhausted` is why. She authored *worn out* as the key in her twentieth return; the containment
 * check that found thirty-two had already run; **nothing re-examined the card, which still said
 * "completely worn out".** The repair to the item opened a leak on the card that serves it, and the
 * leak was invisible because **the check was correct and simply ran before the change.**
 *
 * **THE NARROW TRIGGER IS THIS FILE. THE WIDER ONE IS COSTED IN R447 AND NOT BUILT** — a key change
 * also moves the direction measurement, the distractor set's fairness, and any hint naming the
 * answer, and building that without the cost is how a trigger becomes a re-review nobody runs.
 */
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

/** Does the card give the key away — the key present in the card's own text? */
export function cardGivesKey(card: string, key: string): boolean {
  const c = card.toLowerCase();
  const k = key.trim().toLowerCase();
  return k.length >= 3 && c.includes(k);
}

async function main() {
  const items = await prisma.item.findMany({ include: { options: true } });
  const words = await prisma.word.findMany({ select: { id: true, headword: true, definitionChild: true } });
  const card = new Map(words.map((w) => [w.headword.toLowerCase(), w]));

  const checked: string[] = [];
  const leaks: string[] = [];
  for (const i of items) {
    /**
     * **THE HEADWORD IS `stem.words[0]`, AND MY FIRST GUESS WAS `headword`/`word`.** The population
     * came back EMPTY and `requirePopulation` refused the run — R61 working exactly as written: an
     * empty population is a pipeline failure, not a pass, and a check whose scope query is wrong
     * would otherwise have printed a clean zero over nothing.
     */
    const words = (i.stem as { words?: unknown })?.words;
    const head = Array.isArray(words) ? words[0] : undefined;
    if (typeof head !== 'string') continue;
    const w = card.get(head.toLowerCase());
    if (!w?.definitionChild) continue;
    const key = i.options.find((o) => o.isCorrect);
    const kv = ((key as { content?: { value?: unknown } } | undefined)?.content ?? {}).value;
    if (typeof kv !== 'string') continue;
    checked.push(i.id);
    if (cardGivesKey(w.definitionChild, kv)) {
      leaks.push(`  ${i.id}  headword "${w.headword}" key "${kv}"\n      card: "${w.definitionChild}"`);
    }
  }

  requirePopulation('check:key-change-cards', { 'item(s) with a headword and a card': checked.length });

  if (leaks.length === 0) {
    console.log('\ncheck:key-change-cards: no card contains its own item\'s key.');
    await prisma.$disconnect();
    return;
  }
  console.error(`\nCARD CONTAINS ITS OWN ITEM'S KEY: ${leaks.length}`);
  leaks.forEach((l) => console.error(l));
  console.error(
    '\n  Run this on ANY item whose key changes, at the moment it changes. `exhausted` passed every\n' +
      '  check that existed and leaked anyway, because the check ran before the key did.',
  );
  process.exitCode = 1;
  await prisma.$disconnect();
}

void main();
