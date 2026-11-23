/**
 * `en-attribute-transfer`: EVERY CARRIER, WITH THE FIT QUESTION STATED (Annie, 2026-08-22 — R576).
 *
 * **The item artefact found it; only the library reading sizes it.** `threePartSet` put the tag's own
 * wording beside the option it tags, and the wording was *"Two people are being described. Check
 * which one each detail belongs to."* on an option about **painting a house**. One carrier is a
 * defect. **43 carriers with no two people is a different fact**, and the difference is the whole
 * question: is the hint WRONG FOR A FEW, or GENERAL TO NONE OF THEM?
 *
 * **AND THE ENTRY'S OWN DESCRIPTION ALREADY SAYS THE HINT IS TOO NARROW.** It reads: *"Assigns one
 * character's described attribute to another, OR THE RIGHT ATTRIBUTE AT THE WRONG VALUE."* The
 * second branch needs no second person at all. **The hint covers one half of its own definition**,
 * which is a fact about the two fields and needs no carrier read to establish.
 *
 * **THE SIGNAL IS MARKED, NEVER SCORED (R569, R94).** Whether an item "describes two people" is a
 * reading. What travels on each row is the evidence — the distinct capitalised names found in the
 * stem and options — so she can size 43 rows in the time it takes to scan a column, and disagree
 * with any of them by looking at the same thing the signal looked at.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../packages/db/src/index';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { readFieldsByName } from './lib/field-read';
import { threePartSet } from './lib/option-set';
import { requirePopulation } from './lib/population';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const FAMILY = 'attribute-transfer-carriers';
const ENTRY = 'en-attribute-transfer';

/**
 * Capitalised tokens that are not sentence-initial and are not ordinary words. A crude proxy for a
 * named person, and named as crude: it cannot see "the older rabbit" or "her mother", which are two
 * people without being two names.
 */
const NOT_A_NAME = new Set(
  ('The A An And But Or If When Where What Which Who How Why Read Find Check Look Two One This That These'
  + ' Those He She They It There Here Mr Mrs Miss His Her Their In On At To For From With Is Are Was Were'
  + ' Line Lines Some All Both Each Every Do Does Did Not No So As Then Than You Your').split(' '),
);
function namesIn(text: string): string[] {
  const out = new Set<string>();
  for (const s of text.split(/(?<=[.!?])\s+|\n/)) {
    const toks = s.trim().split(/\s+/);
    toks.forEach((raw, i) => {
      const t = raw.replace(/[^A-Za-z'-]/g, '');
      if (i === 0 || t.length < 3 || NOT_A_NAME.has(t)) return;
      if (/^[A-Z][a-z'-]+$/.test(t)) out.add(t);
    });
  }
  return [...out].sort();
}

async function main() {
  const entry = await prisma.misconception.findUniqueOrThrow({ where: { id: ENTRY } });
  const items = await prisma.item.findMany({ include: { options: { orderBy: { id: 'asc' } } } });
  const lib = new Map((await prisma.misconception.findMany({ select: { id: true, childHint: true } }))
    .map((m) => [m.id, m.childHint]));

  readFieldsByName(
    'deliver:attribute-transfer-carriers / item.stem',
    items.map((i) => (i.stem ?? {}) as Record<string, unknown>),
    ['text', 'prompt', 'sentence', 'passageRef'],
  );

  const carriers = items.filter((i) => i.options.some((o) => (o as { misconceptionId?: string | null }).misconceptionId === ENTRY));
  requirePopulation('deliver:attribute-transfer-carriers', {
    'item(s) scanned': items.length,
    [`carrier(s) of ${ENTRY}`]: carriers.length,
  });

  const rows = carriers.sort((a, b) => a.id.localeCompare(b.id)).map((i) => {
    const stem = i.stem as Record<string, unknown>;
    const stemText = [stem.text, stem.prompt, stem.sentence].find((t): t is string => typeof t === 'string') ?? '';
    const set = threePartSet(i.options, lib);
    const tagged = set.siblings.filter((s) => s.tag === ENTRY);
    const scanned = [stemText, ...set.siblings.map((s) => s.value), set.key?.value ?? ''].join(' ');
    const names = namesIn(scanned);
    return {
      itemId: i.id,
      status: i.status,
      questionTypeId: i.questionTypeId,
      stem: stemText,
      theOptionsCarryingThisEntry: tagged.map((t) => t.value),
      theSet: set,
      /** R569 — the evidence the signal ran on, so a disagreement is one look, not a re-derivation. */
      namesFoundInStemAndOptions: names,
      twoOrMoreNamedPeopleSignal: names.length >= 2,
      signalIsCrude: 'Capitalised non-sentence-initial tokens only. It cannot see "the older rabbit" '
        + 'or "her mother", which are two people without being two names — so a FALSE here is a row '
        + 'to read, never a verdict that the item has one person.',
    };
  });

  const withTwo = rows.filter((r) => r.twoOrMoreNamedPeopleSignal).length;
  const payload = {
    what: `Every carrier of ${ENTRY}, with the fit question stated.`,
    theFitQuestion: 'Does this one wording fit every item below? The hint ASSERTS a feature — that two people are being described — and an item without two people receives an instruction it cannot follow.',
    howThisWasFound: 'The item-level artefact surfaced it: threePartSet puts a tag\'s own childHint beside the option it tags, and this hint landed on an option about painting a house. One carrier is a defect; 43 carriers with no two people is a different fact, and only the library reading tells them apart.',
    theEntryContradictsItsOwnHint: {
      childHint: String(entry.childHint ?? ''),
      description: String(entry.description ?? ''),
      note: 'The description carries TWO branches — one character\'s attribute given to another, OR the right attribute at the wrong value. The second needs no second person. The hint covers one half of its own definition, and that is established from the two fields without reading a single carrier.',
    },
    theSizing: {
      carriers: rows.length,
      liveCarriers: rows.filter((r) => r.status === 'LIVE').length,
      signalledTwoOrMoreNamedPeople: withTwo,
      signalledFewerThanTwo: rows.length - withTwo,
      bound: 'The signal counts NAMES, not people. It is marked on every row with the names it found so a disagreement costs one look. It is a candidate column, not a verdict.',
    },
    questionTypesItLandsOn: [...new Set(rows.map((r) => r.questionTypeId))].sort(),
    rows,
  };
  const stamp = artefactStamp(payload, new Date().toISOString(), 'content',
    `every carrier of ${ENTRY} with the fit question and a named-people signal`,
    ['what', 'theFitQuestion', 'howThisWasFound', 'theEntryContradictsItsOwnHint', 'theSizing', 'questionTypesItLandsOn', 'rows']);
  const path = join(REPO, 'content/exports', stampedName(FAMILY, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify({ stamp, ...payload }, null, 2));
  deliver(path, FAMILY);
  console.log(
    `\n${rows.length} carrier(s): ${withTwo} signalled two or more named people, `
    + `${rows.length - withTwo} signalled fewer.`,
  );
  await prisma.$disconnect();
}

void main();
