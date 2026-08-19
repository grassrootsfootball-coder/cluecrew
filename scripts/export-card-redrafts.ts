/**
 * TWENTY-ONE CARD REDRAFTS, FOR ANNIE — proposed, and NONE published.
 *
 * **`humble` IS THE MODEL, IN HER NAMING**: *"not boasting about yourself, even when you have done
 * well"* teaches the word **without ever reaching for `modest`**. Every redraft below is written to
 * that standard: define the word from the child's side of it, and never through the option the item
 * is asking her to pick.
 *
 * **NOT PUBLISHED ON THE REDRAFT ALONE, AND THAT IS THE FINDING ITSELF.** These are unsigned cards.
 * The whole discovery is that **a populated field is not a decision** — a machine-drafted
 * definition and an approved one are indistinguishable in a table. Writing my redraft into the
 * card would make the same mistake one turn after recording it.
 *
 * **EACH IS GATED TWICE**: against the child-facing rules, and against the property that caused the
 * hold — the redraft must not contain the key or any morphological variant of it. A redraft that
 * reintroduces the leak is refused here rather than found by her.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { CARD_HOLDS, checkChildFacingText, isBlocking } from '../packages/core/src/index';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'card-redrafts-for-annie';

/** House style already applied: a lower-case fragment, no terminal stop (R311). */
const REDRAFTS: Record<string, string> = {
  ancient: 'from a time thousands of years before now',
  benevolent: 'wanting good things to happen to other people',
  chilly: 'cool enough that you would want a coat',
  conceal: 'to put something where nobody will find it',
  generous: 'happy to share what you have with others',
  jovial: 'full of good humour and quick to laugh',
  luminous: 'shining with a soft light of its own',
  shiny: 'catching the light so that it gleams',
  sturdy: 'solidly made and not easily broken',
  swift: 'moving with great speed',
  tidy: 'with everything put away in its own place',
  timid: 'easily frightened and slow to speak up',
  amend: 'to put right a small part of something',
  amiable: 'easy to like and pleasant to be with',
  bold: 'willing to do what others would find frightening',
  genuine: 'exactly what it claims to be, not a copy',
  hollow: 'having nothing inside, like a tube or a shell',
  hostile: 'behaving towards you as an enemy would',
  transparent: 'you can see straight through it',
  trivial: 'so small that it hardly matters',
};

function stem(word: string): string {
  let w = word.toLowerCase().replace(/[^a-z]/g, '');
  for (const s of ['ingly', 'edly', 'ing', 'ies', 'ied', 'est', 'ed', 'es', 'er', 'ly', 's']) {
    if (w.length - s.length >= 3 && w.endsWith(s)) { w = w.slice(0, -s.length); break; }
  }
  return w.replace(/([^aeiou])\1$/, '$1').replace(/e$/, '');
}
const tokens = (t: string) => t.toLowerCase().split(/[^a-z']+/).filter(Boolean);

async function main() {
  const words = await prisma.word.findMany({ where: { headword: { in: Object.keys(REDRAFTS) } } });
  requirePopulation('card redrafts', { 'holds': CARD_HOLDS.length, 'cards found': words.length });

  const rows = CARD_HOLDS.map((hold) => {
    const card = words.find((w) => w.headword.toLowerCase() === hold.headword);
    const proposed = REDRAFTS[hold.headword]!;
    const toks = tokens(proposed);
    // The property that caused the hold, re-asserted on the redraft.
    const reintroduced = hold.gives.filter((k) =>
      toks.includes(k.toLowerCase()) || toks.some((t) => stem(t) === stem(k)));
    const faults = checkChildFacingText({
      role: 'word-card', label: hold.headword, text: proposed, headwordInOwnCard: hold.headword,
    }).filter(isBlocking);
    return {
      headword: hold.headword,
      cardStatus: card?.status ?? 'NOT FOUND',
      tier: card?.tier ?? null,
      givesAwayKeys: hold.gives,
      band: hold.band,
      replaces: card?.definitionChild ?? null,
      proposed,
      stillContainsKey: reintroduced,
      gateVerdict: faults.length === 0 && reintroduced.length === 0 ? 'PASSES' : 'BLOCKED',
      gateFaults: faults.map((f) => `${f.rule}: ${f.detail}`),
    };
  });

  const payload = {
    what: 'Redrafts for the twenty-one held Word cards. PROPOSED — none written.',
    theModel: "humble: 'not boasting about yourself, even when you have done well' — it teaches the word without ever reaching for modest.",
    notPublishedOnTheRedraftAlone:
      'These are unsigned cards, and the whole finding is that a populated field is not a decision. Writing a redraft in would repeat the mistake one turn after recording it.',
    gatedTwice: 'Against the child-facing rules, and against the property that caused the hold — no redraft may contain its key or a morphological variant of it.',
    houseStyle: 'Lower-case fragment, no terminal stop (R311), already applied across the vault.',
    denominators: {
      holds: CARD_HOLDS.length,
      redrafts: rows.length,
      passing: rows.filter((r) => r.gateVerdict === 'PASSES').length,
      liveCards: rows.filter((r) => r.cardStatus === 'LIVE').length,
    },
    rows,
  };

  const stamp = artefactStamp(payload, new Date().toISOString(), 'content',
    'twenty-one proposed card redrafts with the string each replaces and its gate verdict', ['rows']);
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, stampedName(FAMILY, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify({ stamp, ...payload }, null, 2));
  deliver(path, FAMILY);

  console.log(`\nredrafts ${rows.length} · passing ${payload.denominators.passing} · LIVE cards ${payload.denominators.liveCards}`);
  for (const r of rows.filter((x) => x.gateVerdict !== 'PASSES')) {
    console.log(`  BLOCKED ${r.headword}: ${[...r.stillContainsKey.map((k) => `still contains "${k}"`), ...r.gateFaults].join(' | ')}`);
  }
  for (const r of rows.slice(0, 5)) console.log(`    ${r.headword.padEnd(12)} "${r.replaces}" -> "${r.proposed}"`);
  await prisma.$disconnect();
}

main();
