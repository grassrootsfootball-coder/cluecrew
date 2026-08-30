/**
 * ESTATE-WIDE: DOES THE KEY PERFORM THE STEM? (R945.)
 *
 * **A mistagged distractor fires the wrong hint. A broken key marks a right answer wrong.** This is
 * R930's blind spot one seat over, and it is the more serious seat.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { checkKeyPerformsStem } from '../packages/core/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = pjoin(__dirname, '..');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const DICT = '/usr/share/dict/web2';
if (!existsSync(DICT)) throw new Error(`no lexicon at ${DICT} — refusing a blind word test (R173)`);
const W = new Set(readFileSync(DICT, 'utf8').split('\n').map((w) => w.trim().toLowerCase()).filter(Boolean));
const isWord = (s: string) => W.has(String(s).trim().toLowerCase());

async function run() {
  assertFixture('key-gate', [
    { name: 'a hidden word spanning a join performs', input: JSON.stringify(['vr-05-hidden-word', { sentence: 'A flamingo nests near water' }, 'gone']), mustBeCaught: true },
    { name: 'a key absent from its sentence REFUSES', input: JSON.stringify(['vr-05-hidden-word', { sentence: 'A flamingo nests near water' }, 'pear']), mustBeCaught: false },
    { name: 'a move-letter key that works performs', input: JSON.stringify(['vr-08-move-letter', { word1: 'BLEND', word2: 'TRAY' }, 'L']), mustBeCaught: false },
    { name: 'a correct code performs', input: JSON.stringify(['vr-19-word-number-codes', { code: { T: '2', A: '4', P: '6' }, prompt: 'Using the code, what is the code for TAP?' }, '246']), mustBeCaught: true },
    { name: 'a wrong code REFUSES', input: JSON.stringify(['vr-19-word-number-codes', { code: { T: '2', A: '4', P: '6' }, prompt: 'Using the code, what is the code for TAP?' }, '642']), mustBeCaught: false },
  ], (raw) => {
    const [qt, stem, key] = JSON.parse(raw) as [string, Record<string, unknown>, string];
    return checkKeyPerformsStem({ questionTypeId: qt, stem, keyValue: key, optionValues: [] }, isWord).verdict === 'PERFORMS';
  });

  const rows = await prisma.item.findMany({
    select: { id: true, status: true, questionTypeId: true, stem: true,
      questionType: { select: { district: true } },
      options: { select: { content: true, isCorrect: true } } },
  });
  requirePopulation('check:key-performs-stem', { 'item(s) in the estate': rows.length });

  const results = rows.map((r) => {
    const keyOpt = r.options.find((o) => o.isCorrect);
    const keyValue = keyOpt ? String((keyOpt.content as { value: unknown }).value) : '';
    const v = checkKeyPerformsStem({ questionTypeId: r.questionTypeId, stem: (r.stem ?? {}) as Record<string, unknown>,
      keyValue, optionValues: r.options.map((o) => String((o.content as { value: unknown }).value)) }, isWord);
    return { itemId: r.id, district: r.questionType.district, questionType: r.questionTypeId, status: r.status,
      key: keyValue, stem: r.stem, ...v };
  });
  const refusing = results.filter((x) => x.verdict === 'REFUSES');
  const counts = results.reduce<Record<string, number>>((a, x) => { a[x.verdict] = (a[x.verdict] ?? 0) + 1; return a; }, {});
  const byType: Record<string, { performs: number; refuses: number; undecided: number }> = {};
  for (const x of results) {
    const b = byType[x.questionType] ??= { performs: 0, refuses: 0, undecided: 0 };
    if (x.verdict === 'PERFORMS') b.performs += 1; else if (x.verdict === 'REFUSES') b.refuses += 1; else b.undecided += 1;
  }
  const unperformable = refusing.filter((x) => x.why.includes('cannot be performed at any cut') || x.why.includes('NO CORRECT ANSWER') || x.why.includes('DOES NOT APPEAR IN THE SENTENCE'));

  const full = {
    kind: 'key-performs-stem-census',
    THE_QUESTION: 'does the key perform the stem? Forty-seven gates in this estate and not one asks it.',
    andWHYITISTHEWORSESEAT: 'a mistagged distractor fires the wrong hint; a broken key marks a right answer WRONG. This is R930\'s blind spot one seat over.',
    THE_LEXICON: `${DICT}, ${W.size} entries — named, because a word test is only as good as its list`,
    counts, ofItems: results.length,
    ITEMS_WITH_NO_CORRECT_ANSWER: { count: unperformable.length,
      andWHATTHATMEANS: 'the stem cannot be performed by ANY option, or by any cut of its own material. Not a wrong key — an item with no right answer.',
      rows: unperformable.map((x) => ({ itemId: x.itemId, questionType: x.questionType, status: x.status, key: x.key, stem: x.stem, why: x.why })) },
    REFUSING: refusing.map((x) => ({ itemId: x.itemId, district: x.district, questionType: x.questionType, status: x.status, key: x.key, task: x.task, why: x.why, stem: x.stem })),
    BY_QUESTION_TYPE: byType,
    UNDECIDED_IS_A_VERDICT: 'item types whose task is semantic get no predicate and are never passed. The undecided count is the estate this gate cannot yet reach, stated rather than folded into a pass.',
  };
  const lines = refusing.map((x) => `${x.itemId}\t${x.questionType}\t${x.key}`);
  const d = digestOverText('one line per refusing key, "<itemId>\\t<questionType>\\t<key>"', lines.join('\n'));
  const withLines = { ...full, RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec };
  const artefact = { ...withLines, ...findingsDigest(withLines, ['counts', 'REFUSING', 'ITEMS_WITH_NO_CORRECT_ANSWER', 'RESULT_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('key-performs-stem-census', sha(json).slice(0, 16), 'json');
  writeFileSync(pjoin(REPO, 'content/exports', name), json);
  deliver(pjoin(REPO, 'content/exports', name), 'key-performs-stem-census');
  console.log(`\n  ${results.length} items · ${JSON.stringify(counts)}`);
  console.log(`  ITEMS WITH NO CORRECT ANSWER AT ANY CUT: ${unperformable.length}`);
  for (const x of unperformable) console.log(`     ${x.itemId}  ${x.why.slice(0, 92)}`);
  console.log('  refusing by type:');
  for (const [t, b] of Object.entries(byType)) if (b.refuses) console.log(`     ${t.padEnd(26)} refuses ${String(b.refuses).padStart(3)} of ${b.performs + b.refuses}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
