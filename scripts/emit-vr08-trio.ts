/**
 * THE vr08 TRIO: the pair is a trio, and two stems are broken beneath it.
 *
 * Every distractor classified by WHAT IT ACTUALLY DOES, not by what it is tagged: does removing the
 * letter leave a word, and does adding it make one? Four outcomes, three entries, and one that is
 * not a mistag at all — **a distractor that performs the stem is a RIVAL KEY, and that is a content
 * fault outranking every tag question here** (her 203rd).
 *
 * **THE LEXICON DECIDES SEVERAL OF THESE AND IS THEREFORE FLAGGED PER ROW.** web2 holds `THRAIN`
 * and `RIDGEL` and `HERNE`; it does not hold `GRAN`. **The same list issues false passes and false
 * refusals**, so every rival key carries the words its verdict rests on and the reader judges.
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

async function run() {
  assertFixture('trio-classify', [
    { name: 'left word + made word is a RIVAL KEY', input: JSON.stringify([true, true]), mustBeCaught: true },
    { name: 'neither is the third entry', input: JSON.stringify([false, false]), mustBeCaught: false },
    { name: 'left fails only is first-word-invalid', input: JSON.stringify([false, true]), mustBeCaught: false },
  ], (raw) => { const [l, m] = JSON.parse(raw) as [boolean, boolean]; return l && m; });

  const rows = await prisma.item.findMany({ where: { questionTypeId: 'vr-08-move-letter', status: 'DRAFT' },
    select: { id: true, stem: true, options: { orderBy: { id: 'asc' }, select: { content: true, isCorrect: true, misconceptionId: true } } }, orderBy: { id: 'asc' } });
  requirePopulation('emit:vr08-trio', { 'row(s)': rows.length });

  const carriers = rows.flatMap((r) => {
    const { word1: w1, word2: w2 } = r.stem as { word1: string; word2: string };
    return r.options.filter((o) => !o.isCorrect).map((o) => {
      const L = String((o.content as { value: unknown }).value);
      const i = w1.indexOf(L);
      if (i < 0) return { itemId: r.id, stemPair: `${w1}/${w2}`, letter: L, truth: 'the letter is not in the first word', tag: o.misconceptionId, agrees: false, restsOn: [] as string[] };
      const left = w1.slice(0, i) + w1.slice(i + 1);
      const made = [...Array(w2.length + 1).keys()].map((j) => w2.slice(0, j) + L + w2.slice(j));
      const madeWords = made.filter(isWord);
      const lOk = isWord(left); const mOk = madeWords.length > 0;
      const truth = lOk && mOk ? 'RIVAL KEY — performs the stem'
        : !lOk && !mOk ? 'both-invalid (the third entry, never used here)'
        : !lOk ? 'first-word-invalid' : 'second-word-invalid';
      const tagSays = o.misconceptionId === 'vr-move-letter-first-word-invalid' ? 'first-word-invalid'
        : o.misconceptionId === 'vr-move-letter-second-word-invalid' ? 'second-word-invalid'
        : o.misconceptionId === 'vr-move-letter-both-invalid' ? 'both-invalid (the third entry, never used here)' : String(o.misconceptionId);
      const restsOn = [lOk ? left : null, ...madeWords].filter((x): x is string => !!x);
      return { itemId: r.id, stemPair: `${w1}/${w2}`, letter: L, removalLeaves: left, additionsMakingAWord: madeWords,
        truth, tag: o.misconceptionId, tagSays, agrees: tagSays === truth,
        restsOn, restsOnAnObscureEntry: restsOn.some((x) => OBSCURE.has(x.toLowerCase())) };
    });
  });

  const tally: Record<string, number> = {};
  for (const c of carriers) tally[c.truth] = (tally[c.truth] ?? 0) + 1;
  const rivals = carriers.filter((c) => c.truth.startsWith('RIVAL'));
  const solidRivals = rivals.filter((c) => !c.restsOnAnObscureEntry);
  const distinctStems = [...new Set(solidRivals.map((c) => c.stemPair))];
  const unperformable = ['CHAIR/MOP', 'SHELF/TRAIN'];

  const full = {
    kind: 'vr08-trio-and-broken-stems',
    THE_PAIR_IS_A_TRIO: 'first-word-invalid, second-word-invalid, and **both-invalid — an entry that exists in this library and is used on no DRAFT row here.** One repair for a pair was never going to be enough.',
    carriers: carriers.length, WHAT_THEY_ACTUALLY_DO: tally,
    THE_TAG_AGREES_ON: `${carriers.filter((c) => c.agrees).length} of ${carriers.length}`,
    RIVAL_KEYS_A_CONTENT_FAULT: {
      underWeb2: rivals.length,
      restingOnAnObscureLexiconEntry: rivals.length - solidRivals.length,
      SOLID_RIVAL_KEYS: solidRivals.length, acrossDistinctStems: distinctStems.length, stems: distinctStems,
      andWHYTHISOUTRANKSTHETAG: 'a distractor that performs the stem is not a mistag — it is a second correct answer. Retagging it would bury the real fault under a resolved one.',
      rows: rivals,
    },
    THE_BROKEN_STEMS: {
      cannotBePerformedAtAnyCut: unperformable,
      'CHAIR/MOP': 'no letter of CHAIR leaves a word and makes one with MOP. Three rows carry it — 01, 13, 25 — because the bank repeats.',
      'SHELF/TRAIN': 'H leaves SELF and makes THRAIN. **This store\'s gate PASSED it, and only because web2 holds THRAIN.** Under any lexicon a child meets, no letter works and the stem is unperformable — which is your reading, and my instrument disagreed for a reason that is a fault in the instrument.',
    },
    THE_LEXICON_CUTS_BOTH_WAYS: {
      falsePass: 'THRAIN, RIDGEL, HERNE, ALY, PLUP, TWI — web2 entries no child meets, each turning a broken item into a passing one',
      falseRefusal: 'GRAN — a real word here, absent from web2, which issued a REFUSES on a sound carrier (R944)',
      soWHATISREPORTED: 'every rival key carries the words its verdict rests on, and the obscure ones are flagged. This store does not adjudicate the lexicon; it names what each verdict depends on.',
    },
  };
  const lines = carriers.map((c) => `${c.itemId}\t${c.stemPair}\t${c.letter}\t${c.truth}`);
  const d = digestOverText('one line per carrier, "<itemId>\\t<stem>\\t<letter>\\t<what it does>"', lines.join('\n'));
  const withLines = { ...full, RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec };
  const artefact = { ...withLines, ...findingsDigest(withLines, ['WHAT_THEY_ACTUALLY_DO', 'RIVAL_KEYS_A_CONTENT_FAULT', 'THE_BROKEN_STEMS', 'RESULT_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('vr08-trio-and-broken-stems', sha(json).slice(0, 16), 'json');
  writeFileSync(pjoin(REPO, 'content/exports', name), json);
  deliver(pjoin(REPO, 'content/exports', name), 'vr08-trio-and-broken-stems');
  console.log(`\n  ${carriers.length} carriers · ${JSON.stringify(tally)}`);
  console.log(`  tag agrees on ${carriers.filter((c) => c.agrees).length} of ${carriers.length}`);
  console.log(`  rival keys ${rivals.length} under web2, ${solidRivals.length} solid, across ${distinctStems.length} stems: ${distinctStems.join(', ')}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
