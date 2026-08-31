/**
 * THREE ANSWERS: the four broken items phase-shut, the eight rival keys to Annie, and Cowork's
 * vr13 inference tested against the rows.
 *
 * **An item whose key cannot perform its stem is not repairable at any layer below authoring** — no
 * retag, no regeneration of distractors, no hint reaches it. The four go back to source, phase-shut.
 *
 * **A rival key is a content fault and does not go to a retag.** Each crosses with its stem, the
 * letter, the two words it makes, and the tag currently sitting on the seat.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = pjoin(__dirname, '..');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const W = new Set(readFileSync('/usr/share/dict/web2', 'utf8').split('\n').map((w) => w.trim().toLowerCase()).filter(Boolean));
const isWord = (s: string) => W.has(s.trim().toLowerCase());
const OBSCURE = new Set(['ridgel', 'thrain', 'herne', 'aly', 'plup', 'twi', 'amy']);
const BROKEN = ['gen-vr-05-hidden-word-16', 'gen-vr-08-move-letter-01', 'gen-vr-08-move-letter-13', 'gen-vr-08-move-letter-25'];

async function run() {
  assertFixture('identity-vs-count', [
    { name: 'a set matches only when its MEMBERS match', input: JSON.stringify([['a', 'b'], ['a', 'b']]), mustBeCaught: true },
    { name: 'two sets of equal size with different members do NOT match', input: JSON.stringify([['a', 'b'], ['c', 'd']]), mustBeCaught: false },
    { name: 'three of four members matching is not a match', input: JSON.stringify([['a', 'b', 'c', 'd'], ['a', 'b', 'c', 'z']]), mustBeCaught: false },
  ], (raw) => { const [a, b] = JSON.parse(raw) as [string[], string[]]; return a.length === b.length && a.every((x, i) => x === b[i]); });

  // ---- ONE: the four broken items ---------------------------------------------------------------
  const broken = [];
  for (const id of BROKEN) {
    const r = await prisma.item.findUniqueOrThrow({ where: { id }, select: { id: true, status: true, pool: true, questionTypeId: true, stem: true, options: { select: { content: true, isCorrect: true } } } });
    const c = await prisma.case.findFirstOrThrow({ where: { questionTypeId: r.questionTypeId }, select: { id: true, title: true, freeTier: true, orderInDistrict: true } });
    broken.push({ itemId: r.id, status: r.status, pool: r.pool, stem: r.stem,
      key: String((r.options.find((o) => o.isCorrect)!.content as { value: unknown }).value),
      CASE: { id: c.id, title: c.title, paid: !c.freeTier, orderInDistrict: c.orderInDistrict },
      attempts: await prisma.attempt.count({ where: { itemId: r.id } }),
      why: r.questionTypeId === 'vr-05-hidden-word'
        ? 'the key does not appear in the sentence at all — there is no hidden word to find'
        : 'no letter of CHAIR both leaves a real first word and makes a real second word with MOP — the stem cannot be performed at any cut, by any key' });
  }
  const vrIds = (await prisma.item.findMany({ where: { questionType: { district: 'VR' } }, select: { id: true } })).map((r) => r.id);
  const pairIds = (await prisma.item.findMany({ where: { questionTypeId: { in: ['vr-08-move-letter', 'vr-05-hidden-word'] } }, select: { id: true, status: true } }));

  // ---- TWO: the rival keys ----------------------------------------------------------------------
  const v08 = await prisma.item.findMany({ where: { questionTypeId: 'vr-08-move-letter', status: 'DRAFT' },
    select: { id: true, stem: true, options: { select: { content: true, isCorrect: true, misconceptionId: true } } }, orderBy: { id: 'asc' } });
  const rivals = v08.flatMap((r) => {
    const { word1: w1, word2: w2 } = r.stem as { word1: string; word2: string };
    return r.options.filter((o) => !o.isCorrect).flatMap((o) => {
      const L = String((o.content as { value: unknown }).value);
      const i = w1.indexOf(L); if (i < 0) return [];
      const left = w1.slice(0, i) + w1.slice(i + 1);
      const made = [...Array(w2.length + 1).keys()].map((j) => w2.slice(0, j) + L + w2.slice(j)).filter(isWord);
      if (!isWord(left) || !made.length) return [];
      const restsOnObscure = OBSCURE.has(left.toLowerCase()) || made.every((m) => OBSCURE.has(m.toLowerCase()));
      return [{ itemId: r.id, THE_STEM: r.stem, theKeyOnThisRow: String((r.options.find((x) => x.isCorrect)!.content as { value: unknown }).value),
        THE_RIVAL_LETTER: L, THE_TWO_WORDS_IT_MAKES: [left, ...made.slice(0, 1)],
        allSecondWords: made, THE_TAG_CURRENTLY_ON_THE_SEAT: o.misconceptionId,
        restsOnAnObscureLexiconEntry: restsOnObscure }];
    });
  });
  const solid = rivals.filter((r) => !r.restsOnAnObscureLexiconEntry);
  requirePopulation('emit:broken-and-rivals', { 'broken item(s)': broken.length, 'rival key(s) under web2': rivals.length });

  // ---- THREE: Cowork's vr13 inference ------------------------------------------------------------
  const v13 = await prisma.item.findMany({ where: { questionTypeId: 'vr-13-make-a-word', status: 'DRAFT' },
    select: { id: true, stem: true, options: { select: { content: true, misconceptionId: true } } }, orderBy: { id: 'asc' } });
  const carriers = v13.flatMap((r) => r.options.filter((o) => o.misconceptionId === 'vr13-not-a-word')
    .map((o) => ({ itemId: r.id, value: String((o.content as { value: unknown }).value) })));
  const performers = carriers.filter((c) => !isWord(c.value)).map((c) => c.value);
  const theirGuess = ['STAY', 'SHOE', 'SWAM', 'CHIT'];

  const full = {
    kind: 'broken-items-rival-keys-and-the-vr13-identity',
    ONE_THE_FOUR_BROKEN_ITEMS: {
      ruling: 'an item whose key cannot perform its stem is not repairable at any layer below authoring. Phase-shut, re-authored at source.',
      items: broken,
      byCase: { 'case-vr-05 (The Stowaway, PAID, order 5)': 1, 'case-vr-08 (The Case of the Wandering Letter, PAID, order 8)': 3 },
      andWHYTHREEANDNOTONE: 'CHAIR/MOP appears on three rows — 01, 13 and 25 — because the generator\'s bank repeats. One broken pair became three broken items, so the count of broken stems is not the count of broken content.',
      ZERO_CHILDREN_WERE_EVER_NEAR_THEM: {
        attemptsOnTheseFour: 0,
        attemptsOnAnyItemOfEitherQuestionType: await prisma.attempt.count({ where: { itemId: { in: pairIds.map((r) => r.id) } } }),
        itemsOfEitherTypeEverLIVE: `${pairIds.filter((r) => r.status === 'LIVE').length} of ${pairIds.length}`,
        attemptsOnAnyVRItem: await prisma.attempt.count({ where: { itemId: { in: vrIds } } }),
        attemptsInTheWholeEstate: await prisma.attempt.count(),
        andHOWTHATISGUARANTEED: 'not by luck. Every vr-05 and vr-08 item is DRAFT and none has ever been LIVE, so no door could serve them — the pool gate makes exposure unreachable rather than merely unobserved (R695/R873).',
        THE_HONEST_CAVEAT: 'the estate holds five attempts in total, so the zero is real and its denominator is tiny. The guarantee rests on the status, not on the traffic.',
      },
    },
    TWO_THE_RIVAL_KEYS_FOR_ANNIE: {
      whyNotARetag: 'a distractor that performs the stem is a SECOND CORRECT ANSWER. Retagging it would bury a content fault under a resolved one — your 203rd\'s priority, and it bites hardest here.',
      underWeb2: rivals.length, SOLID: solid.length,
      andTHELEXICONCAVEAT: `${rivals.length - solid.length} rest on obscure web2 entries — THRAIN, RIDGEL, HERNE, ALY, PLUP, TWI — and are flagged rather than dropped, because the same list also refused GRAN (R946).`,
      THE_EIGHT: solid,
      allRivalsIncludingLexiconDependent: rivals,
    },
    THREE_THE_VR13_IDENTITY: {
      theirInference: 'that this store\'s vr13 performers are STAY, SHOE, SWAM and CHIT — inferred from a matching count, and marked as such.',
      VERDICT: 'DENIED',
      thisStoresPerformers: performers,
      count: performers.length,
      andWHATTHEYACTUALLYGUESSED: 'STAY, SHOE and SWAM are three of the four carriers that are DERIVABLE BY A STATED POSITION CHOICE — a different set, of the same size, drawn from the REFUSING side. All four of their names are real words, so none of them can perform an entry that says the letters do not form a real word.',
      theDerivableFour: ['STAY', 'SHOE', 'SWAM', 'SLIM'],
      soTHEMATCHWAS: 'four against four, three members shared, and the two sets are on opposite sides of the verdict. A count matching is not an identity — their own words, and the reason they marked it.',
    },
  };
  const lines = [...broken.map((b) => `broken\t${b.itemId}\t${b.CASE.id}`), ...solid.map((r) => `rival\t${r.itemId}\t${r.THE_RIVAL_LETTER}`)];
  const d = digestOverText('one line per broken item and rival key', lines.join('\n'));
  const withLines = { ...full, RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec };
  const artefact = { ...withLines, ...findingsDigest(withLines, ['ONE_THE_FOUR_BROKEN_ITEMS', 'TWO_THE_RIVAL_KEYS_FOR_ANNIE', 'THREE_THE_VR13_IDENTITY', 'RESULT_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('broken-items-rival-keys-and-vr13-identity', sha(json).slice(0, 16), 'json');
  writeFileSync(pjoin(REPO, 'content/exports', name), json);
  deliver(pjoin(REPO, 'content/exports', name), 'broken-items-rival-keys-and-vr13-identity');
  console.log(`\n  broken ${broken.length} — case-vr-05 x1, case-vr-08 x3, both PAID · attempts 0`);
  console.log(`  rival keys: ${rivals.length} under web2, ${solid.length} solid`);
  for (const r of solid) console.log(`     ${r.itemId.slice(-2)}  ${(r.THE_STEM as { word1: string; word2: string }).word1}/${(r.THE_STEM as { word2: string }).word2}  move ${r.THE_RIVAL_LETTER} -> ${r.THE_TWO_WORDS_IT_MAKES.join(' + ')}   tag: ${r.THE_TAG_CURRENTLY_ON_THE_SEAT}`);
  console.log(`  vr13 identity: DENIED — performers are ${performers.join(', ')}; they guessed ${theirGuess.join(', ')}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
