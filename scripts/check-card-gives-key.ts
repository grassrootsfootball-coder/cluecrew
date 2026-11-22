/**
 * DOES A WORD CARD GIVE AWAY ITS ITEM'S ANSWER? — every vault row against every vocabulary item.
 *
 * **THIS SHOULD HAVE EXISTED BEFORE THE FIRST CARD WAS WRITTEN** (Annie's ruling, 2026-08-19 —
 * R308). A Word card teaches a headword. A vocabulary item asks which option is closest in meaning
 * to that same headword. **If the card's own text contains the key, the card answers the item** —
 * and a child who has collected the card is not being asked a question, she is being asked to
 * remember one.
 *
 * She found eight. **The eight were the fifteen she happened to read**, so the real population was
 * never measured — this measures it.
 *
 * **THREE BANDS, AND THE THIRD IS THE HONEST LIMIT.**
 *
 *   · **CONTAINS** — the key appears in the card, whole word. `empty` inside *"Empty inside"*.
 *   · **VARIANT** — a morphological form of the key appears: `hide` against *"hiding"*, `conceal`
 *     against *"concealed"*. The card still hands over the answer; only the ending differs.
 *   · **NOT DETECTABLE HERE** — a paraphrase. A card reading *"to keep something out of sight"*
 *     answers `conceal → hide` perfectly and shares no string with it. **Containment cannot see
 *     it, and no amount of tightening the matcher will change that.** It is named as a limit on the
 *     face of the output rather than left for someone to discover from a clean run.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tierRequirementApplies } from '../packages/core/src/index';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'card-gives-key';

/**
 * Crude English stemmer. **Its first version could not match "hiding" to "hide"** — it required a
 * 4-character remainder, and `hiding` minus `ing` is three. VARIANT came back 0 and the control
 * caught it: **a zero from a matcher that cannot fire is indistinguishable from a true zero**, and
 * without the fixture it would have shipped as "no morphological variants exist".
 */
function stem(word: string): string {
  let w = word.toLowerCase().replace(/[^a-z]/g, '');
  for (const suffix of ['ingly', 'edly', 'ing', 'ies', 'ied', 'est', 'ed', 'es', 'er', 'ly', 's']) {
    if (w.length - suffix.length >= 3 && w.endsWith(suffix)) { w = w.slice(0, -suffix.length); break; }
  }
  w = w.replace(/([^aeiou])\1$/, '$1'); // running -> run
  return w.replace(/e$/, '');            // hide -> hid, so "hiding" -> "hid" agrees
}

/** Two words are variants when their stems agree and neither is trivially short. */
const isVariant = (a: string, b: string) => {
  const sa = stem(a), sb = stem(b);
  return sa.length >= 3 && sa === sb;
};

const tokens = (text: string) => text.toLowerCase().split(/[^a-z']+/).filter(Boolean);

async function main() {
  const words = await prisma.word.findMany();
  const vault = new Map(words.map((w) => [w.headword.toLowerCase(), w]));
  const items = await prisma.item.findMany({ include: { options: true }, orderBy: { id: 'asc' } });
  const vocab = items.filter((i) => tierRequirementApplies(i.questionTypeId) === true);
  requirePopulation('card-gives-key join', {
    'vault rows': words.length,
    'vocabulary items': vocab.length,
  });

  const findings: {
    itemId: string; questionTypeId: string; itemStatus: string;
    headword: string; cardStatus: string; key: string;
    band: 'CONTAINS' | 'VARIANT'; where: 'definitionChild' | 'sentence'; text: string;
  }[] = [];
  let joined = 0, noCard = 0;

  for (const item of vocab) {
    const headword = String((((item.stem as { words?: unknown[] }).words ?? [])[0] ?? '')).toLowerCase();
    const card = vault.get(headword);
    if (!card) { noCard += 1; continue; }
    joined += 1;
    const key = String(((item.options.find((o) => o.isCorrect)?.content ?? {}) as { value?: string }).value ?? '');
    if (!key) continue;
    const keyLower = key.toLowerCase();

    for (const field of ['definitionChild', 'sentence'] as const) {
      const text = card[field];
      if (typeof text !== 'string' || !text) continue;
      const toks = tokens(text);
      if (toks.includes(keyLower)) {
        findings.push({ itemId: item.id, questionTypeId: item.questionTypeId, itemStatus: item.status,
          headword: card.headword, cardStatus: card.status, key, band: 'CONTAINS', where: field, text });
      } else if (toks.some((t) => t !== keyLower && isVariant(t, key))) {
        findings.push({ itemId: item.id, questionTypeId: item.questionTypeId, itemStatus: item.status,
          headword: card.headword, cardStatus: card.status, key, band: 'VARIANT', where: field, text });
      }
    }
  }

  /*
   * **CONTROL ON THE VARIANT MATCHER** (R60 q2). VARIANT came back 0, and a zero from a matcher
   * that cannot fire is indistinguishable from a zero that means nothing is there. The stemmer is
   * run against a fixture — "hide" against a text carrying "hiding" — and the check refuses to
   * report if it does not catch it.
   */
  const CONTROLS: [string, string][] = [
    ['hide', 'she was hiding under the stairs'],
    ['conceal', 'he concealed the letter'],
    ['run', 'the running water'],
  ];
  const controlFires = CONTROLS.every(([key, text]) => tokens(text).some((t) => isVariant(t, key)));
  if (!controlFires) {
    console.error('CONTROL FAILED: the stemmer does not match "hiding" to "hide". VARIANT counts');
    console.error('  below carry no information. Refusing to report.');
    await prisma.$disconnect();
    process.exit(1);
  }

  const contains = findings.filter((f) => f.band === 'CONTAINS');
  const variant = findings.filter((f) => f.band === 'VARIANT');
  const affectedItems = new Set(findings.map((f) => f.itemId));

  const payload = {
    what: 'Every Word card joined to every vocabulary item that uses it as a headword, asking whether the card gives away the item key.',
    ruling: "Annie, 2026-08-19. She found eight; the eight were the fifteen she happened to read, so the population was never measured.",
    theLimit:
      'CONTAINMENT CANNOT SEE A PARAPHRASE. A card reading "to keep something out of sight" answers conceal -> hide perfectly and shares no string with it. No tightening of this matcher will catch that; it needs a reviewer, and that is a property of the question rather than a gap in the check.',
    bands: {
      CONTAINS: 'the key appears in the card as a whole word',
      VARIANT: 'a morphological form of the key appears — the card still hands over the answer, only the ending differs',
      'NOT DETECTABLE HERE': 'a synonym or paraphrase close enough that the card does the item\'s work',
    },
    denominators: {
      vaultRows: words.length,
      vocabularyItems: vocab.length,
      itemsJoinedToACard: joined,
      itemsWhoseHeadwordHasNoCard: noCard,
      findings: findings.length,
      distinctItemsAffected: affectedItems.size,
    },
    findings,
  };

  const stamp = artefactStamp(payload, new Date().toISOString(), 'content',
    'every card/key collision across the vault and the vocabulary banks, by band', ['findings']);
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, stampedName(FAMILY, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify({ stamp, ...payload }, null, 2));
  deliver(path, FAMILY);

  console.log(`\nvault rows ${words.length} · vocabulary items ${vocab.length}`);
  console.log(`  items joined to a card        : ${joined}`);
  console.log(`  headword has no card          : ${noCard}`);
  console.log(`  CONTAINS                      : ${contains.length}`);
  console.log(`  VARIANT                       : ${variant.length}`);
  console.log(`  distinct items affected       : ${affectedItems.size}`);
  for (const f of findings.slice(0, 14)) {
    console.log(`\n  [${f.band}] ${f.itemId} [${f.itemStatus}] — ${f.headword} -> key "${f.key}" (${f.cardStatus} card)`);
    console.log(`      ${f.where}: ${f.text.slice(0, 95)}`);
  }
  if (findings.length > 14) console.log(`\n  … and ${findings.length - 14} more in the file`);
  await prisma.$disconnect();
}

main();
