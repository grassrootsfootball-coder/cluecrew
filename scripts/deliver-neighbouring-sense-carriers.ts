/**
 * `en-vocab-neighbouring-sense`: EVERY CARRIER, WITH THE SECOND SENSE NAMED (Annie — R614).
 *
 * **Her point: this is the entry MOST EXPOSED to a mistag in the library.** Its hint — *"More than
 * one meaning fits this word. Ask which one this sentence needs."* — is only true WHILE THE TAGGING
 * IS RIGHT. Every option wrongly moved into it gets a hint **asserting something false about its own
 * word**: a child holding a one-sense word is told it has several and sent to choose among them.
 *
 * The other entries fail softer: a mistag under `en-motive-invention` gets an irrelevant move. A
 * mistag HERE gets a false assertion, because this hint's assertion is about the WORD itself.
 *
 * **SO EACH ROW NAMES THE SECOND SENSE — the one the distractor embodies — so a mistag is VISIBLE
 * rather than inferred.** The reader asks of each row: is the tagged option genuinely another sense
 * of the SAME word? Where it is a different word, a misparse, or not a sense at all, the row is a
 * mistag and the hint is currently lying to that child. The naming is mechanical (the tagged
 * option's text IS the sense the child chose); the judgement of whether it is a real sense is hers.
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
const ENTRY = 'en-vocab-neighbouring-sense';
const FAMILY = 'neighbouring-sense-carriers';

async function main() {
  const entry = await prisma.misconception.findUniqueOrThrow({ where: { id: ENTRY } });
  const items = await prisma.item.findMany({ include: { options: { orderBy: { id: 'asc' } } } });
  const lib = new Map((await prisma.misconception.findMany({ select: { id: true, childHint: true } }))
    .map((m) => [m.id, m.childHint]));

  readFieldsByName(`deliver:${FAMILY} / item.stem`,
    items.map((i) => (i.stem ?? {}) as Record<string, unknown>), ['text', 'prompt', 'sentence', 'passageRef']);

  const carriers = items.filter((i) => i.options.some((o) => (o as { misconceptionId?: string | null }).misconceptionId === ENTRY));
  requirePopulation(`deliver:${FAMILY}`, { 'item(s) scanned': items.length, 'carrier(s)': carriers.length });

  const rows = carriers.sort((a, b) => a.id.localeCompare(b.id)).map((i) => {
    const stem = i.stem as Record<string, unknown>;
    const stemText = [stem.text, stem.prompt, stem.sentence].find((t): t is string => typeof t === 'string') ?? '';
    const asked = /what does\s+['‘"“]([^'’"”]{2,40})['’"”]\s*mean/i.exec(stemText);
    const allQuoted = [...stemText.matchAll(/['‘"“]([^'’"”]{2,40})['’"”]/g)]
      .map((m) => (m[1] ?? '').trim()).filter(Boolean).sort((a, b) => a.length - b.length);
    const headword = (asked?.[1] ?? allQuoted[0] ?? null)?.replace(/^the\s+/i, '').trim() ?? null;
    const set = threePartSet(i.options, lib);
    const tagged = set.siblings.filter((s) => s.tag === ENTRY);
    return {
      itemId: i.id,
      status: i.status,
      questionTypeId: i.questionTypeId,
      stem: stemText,
      theWord: headword,
      keySense: set.key?.value ?? null,
      /**
       * **THE SECOND SENSE, NAMED (R569).** The tagged option IS the sense the child would choose —
       * the hint claims it is another genuine sense of `theWord`. Her question per row: is it?
       */
      theSecondSenseTheTagClaims: tagged.map((t) => t.value),
      herQuestion: headword
        ? `Is each option above genuinely another sense of "${headword}"? If it is a different word, a misparse, or not a sense at all, this row is a MISTAG — and the hint is telling that child a false thing about "${headword}".`
        : 'No headword is quoted in this stem — which itself needs reading: this entry is about a word\'s senses, and an item with no quoted word may not belong here at all.',
      theSet: set,
    };
  });

  const payload = {
    what: `Every carrier of ${ENTRY}, with the second sense named per row.`,
    whyThisEntryFirst: 'The entry most exposed to a mistag in the library. Its hint asserts a property of the WORD — "More than one meaning fits this word" — so it is only true while the tagging is right. An option wrongly moved here gets a hint asserting something false about its own word; a mistag under most other entries merely gets an irrelevant move.',
    theTwoFields: { childHint: String(entry.childHint ?? ''), description: String(entry.description ?? '') },
    denominators: {
      carriers: rows.length,
      liveCarriers: rows.filter((r) => r.status === 'LIVE').length,
      rowsWithNoQuotedHeadword: rows.filter((r) => r.theWord === null).length,
    },
    rows,
  };
  const stamp = artefactStamp(payload, new Date().toISOString(), 'content',
    `every carrier of ${ENTRY} with the second sense named, for the mistag reading`,
    ['what', 'whyThisEntryFirst', 'theTwoFields', 'denominators', 'rows']);
  const path = join(REPO, 'content/exports', stampedName(FAMILY, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify({ stamp, ...payload }, null, 2));
  deliver(path, FAMILY);
  console.log(`\n${rows.length} carrier(s), ${rows.filter((r) => r.theWord === null).length} with no quoted headword.`);
  await prisma.$disconnect();
}

void main();
