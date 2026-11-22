/**
 * DOES THE CARRIER PERFORM THE ENTRY'S BEHAVIOUR? (Annie's 198th, and Cowork's finding.)
 *
 * **Nothing in this district has ever asked that question.** Tagging asserts a diagnosis; nobody has
 * checked that the option a tag sits on actually EXECUTES the act the entry names. Cowork reports
 * fourteen patterns whose carriers look generated from the KEY rather than from the entry's act —
 * `vr13-not-a-word` carriers that are words, `vr19-shared-letter-miss` on stems with no repeated
 * letter to miss.
 *
 * **A CLOSED SET OF DECLARED PREDICATES, AND UNDECIDABLE IS A VERDICT** (R890). Each predicate is
 * named, runs on the item's own material, and reports PERFORMS / REFUSES. A pattern whose behaviour
 * is semantic — *chose a goes-together word*, *grouped by look or sound* — gets no predicate and is
 * reported UNDECIDABLE rather than guessed at. **A test that scored the semantic patterns by
 * inference would report a number for all 23 and mean something for ten.**
 *
 * The lexicon is `/usr/share/dict/words` (BSD web2), named because a word test is only as good as
 * its list, and a carrier called "not a word" is being judged against it.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = pjoin(__dirname, '..');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const PAID = ['vr-02-two-odd-ones-out', 'vr-05-hidden-word', 'vr-08-move-letter', 'vr-10-word-connections',
  'vr-13-make-a-word', 'vr-16-opposite-meaning', 'vr-17-complete-the-sum', 'vr-18-related-numbers',
  'vr-19-word-number-codes', 'vr-20-complete-the-word', 'vr-21-same-meaning'];

const DICT = '/usr/share/dict/words';
if (!existsSync(DICT)) throw new Error(`no lexicon at ${DICT} — refusing to judge "is this a real word" without one (R173)`);
const WORDS = new Set(readFileSync(DICT, 'utf8').split('\n').map((w) => w.trim().toLowerCase()).filter(Boolean));
const isWord = (s: string) => WORDS.has(s.trim().toLowerCase());

type Verdict = { verdict: 'PERFORMS' | 'REFUSES' | 'UNDECIDABLE'; why: string };
const und = (why: string): Verdict => ({ verdict: 'UNDECIDABLE', why });

/** Each entry's act, executed on the item's own material. Named, closed, and refusing to guess. */
const PREDICATES: Record<string, (stem: Record<string, unknown>, value: string, key: string) => Verdict> = {
  'vr13-not-a-word': (_s, v) => isWord(v)
    ? { verdict: 'REFUSES', why: `the entry says the letters do NOT form a real word; "${v}" is in the lexicon` }
    : { verdict: 'PERFORMS', why: `"${v}" is not in the lexicon` },

  'vr19-shared-letter-miss': (s, v) => {
    const word = String(s.prompt ?? '').match(/code for ([A-Z]+)/)?.[1];
    if (!word) return und('the coded word could not be read from the prompt');
    const repeated = new Set([...word].filter((c, i) => word.indexOf(c) !== i));
    return repeated.size > 0
      ? { verdict: 'PERFORMS', why: `${word} repeats ${[...repeated].join(',')} — there is a shared digit to miss` }
      : { verdict: 'REFUSES', why: `${word} has NO repeated letter, so there is nothing to miss; "${v}" cannot execute this entry` };
  },

  'vr19-letter-order': (s, v, k) => {
    const rev = [...k].reverse().join('');
    return v === rev
      ? { verdict: 'PERFORMS', why: `"${v}" is the key "${k}" reversed` }
      : { verdict: 'REFUSES', why: `the entry says the digits are matched in REVERSE order; reversing the key "${k}" gives "${rev}", not "${v}"` };
  },

  'vr17-arith-slip': (_s, v, k) => {
    const d = Math.abs(Number(v) - Number(k));
    return d === 1 || d === 2
      ? { verdict: 'PERFORMS', why: `off by ${d} from the key ${k}` }
      : { verdict: 'REFUSES', why: `the entry says a slip of one or two; "${v}" is ${Number.isNaN(d) ? 'not numeric' : `off by ${d}`} from the key ${k}` };
  },

  'vr-move-letter-first-word-invalid': (s, v) => {
    const w1 = String(s.word1 ?? '');
    if (!w1 || v.length !== 1) return und('no word1 on the stem, or the option is not a single letter');
    const left = w1.replace(v, '');
    return isWord(left)
      ? { verdict: 'REFUSES', why: `removing "${v}" from ${w1} leaves "${left}", which IS a real word — the entry says it should not be` }
      : { verdict: 'PERFORMS', why: `removing "${v}" from ${w1} leaves "${left}", not a word` };
  },

  'vr-move-letter-second-word-invalid': (s, v) => {
    const w2 = String(s.word2 ?? '');
    if (!w2 || v.length !== 1) return und('no word2 on the stem, or the option is not a single letter');
    const makes = [...Array(w2.length + 1).keys()].map((i) => w2.slice(0, i) + v + w2.slice(i)).filter(isWord);
    return makes.length > 0
      ? { verdict: 'REFUSES', why: `adding "${v}" to ${w2} CAN make ${makes.join('/')}, a real word — the entry says it cannot` }
      : { verdict: 'PERFORMS', why: `no insertion of "${v}" into ${w2} makes a word` };
  },

  'vr20-common-letter': (s, v) => gapFill(s, v, 'defaulted to a common letter without testing the word'),
  'vr20-sound-alike': (s, v) => gapFill(s, v, 'sounds right but spells a non-word'),

  'vr05-single-word-only': (s, v) => {
    const sent = String(s.sentence ?? '');
    if (!sent) return und('no sentence on the stem');
    const inSingle = sent.split(/\s+/).some((w) => w.toLowerCase().replace(/[^a-z]/g, '').includes(v.toLowerCase()));
    return inSingle
      ? { verdict: 'PERFORMS', why: `"${v}" sits inside a single word of the sentence` }
      : { verdict: 'REFUSES', why: `the entry says the child searched INSIDE single words; "${v}" is inside no single word of the sentence` };
  },

  'vr05-almost-letters': (s, v) => {
    const flat = String(s.sentence ?? '').toLowerCase().replace(/[^a-z]/g, '');
    if (!flat) return und('no sentence on the stem');
    return flat.includes(v.toLowerCase())
      ? { verdict: 'REFUSES', why: `the entry says the letters are NEARLY, not exactly, in the sentence; "${v}" appears exactly` }
      : { verdict: 'PERFORMS', why: `"${v}" does not appear contiguously in the sentence` };
  },
};
function gapFill(s: Record<string, unknown>, v: string, act: string): Verdict {
  const gap = String(s.wordWithGap ?? '');
  if (!gap || v.length !== 1) return und('no wordWithGap on the stem, or the option is not a single letter');
  const made = gap.replace('_', v);
  return isWord(made)
    ? { verdict: 'REFUSES', why: `filling the gap with "${v}" makes ${made}, a real word — the entry (${act}) requires a non-word` }
    : { verdict: 'PERFORMS', why: `${made} is not a word` };
}
const SEMANTIC = ['vr02-partial-group', 'vr02-surface-link', 'vr02-real-link-wrong-rule', 'vr02-answered-the-opposite',
  'vr03-same-topic', 'vr16-synonym-pull', 'vr16-loose-opposite', 'vr21-associated-not-same', 'vr21-too-strong',
  'vr17-one-side-only', 'vr18-rule-swap', 'vr18-partial-rule', 'vr13-wrong-pieces'];

async function run() {
  assertFixture('carrier-performs', [
    { name: 'a real word tagged not-a-word REFUSES', input: JSON.stringify(['vr13-not-a-word', {}, 'SHOE', 'SHOP']), mustBeCaught: false },
    { name: 'a non-word tagged not-a-word PERFORMS', input: JSON.stringify(['vr13-not-a-word', {}, 'SHPE', 'SHOP']), mustBeCaught: true },
    { name: 'a code word with no repeat REFUSES shared-letter-miss', input: JSON.stringify(['vr19-shared-letter-miss', { prompt: 'Using the code, what is the code for TAP?' }, '247', '246']), mustBeCaught: false },
    { name: 'a code word WITH a repeat PERFORMS', input: JSON.stringify(['vr19-shared-letter-miss', { prompt: 'Using the code, what is the code for SEES?' }, '247', '246']), mustBeCaught: true },
    { name: 'an off-by-one PERFORMS arith-slip', input: JSON.stringify(['vr17-arith-slip', {}, '7', '6']), mustBeCaught: true },
    { name: 'an off-by-five REFUSES arith-slip', input: JSON.stringify(['vr17-arith-slip', {}, '11', '6']), mustBeCaught: false },
  ], (raw) => { const [tag, stem, v, k] = JSON.parse(raw); return PREDICATES[tag]!(stem, v, k).verdict === 'PERFORMS'; });

  const rows = await prisma.item.findMany({ where: { questionTypeId: { in: PAID }, status: 'DRAFT' },
    select: { id: true, questionTypeId: true, stem: true, options: { select: { content: true, isCorrect: true, misconceptionId: true } } } });
  const lib = new Map((await prisma.misconception.findMany({ where: { district: 'VR' }, select: { id: true, description: true } })).map((m) => [m.id, m.description]));

  const results = rows.flatMap((r) => {
    const stem = (r.stem ?? {}) as Record<string, unknown>;
    const key = String((r.options.find((o) => o.isCorrect)?.content as { value?: unknown })?.value ?? '');
    return r.options.filter((o) => !o.isCorrect && o.misconceptionId).map((o) => {
      const raw = (o.content as { value?: unknown }).value;
      const value = Array.isArray(raw) ? raw.map(String).join(',') : String(raw);
      const tag = o.misconceptionId!;
      const v = PREDICATES[tag] ? PREDICATES[tag](stem, value, key)
        : SEMANTIC.includes(tag) ? und('the entry\'s act is SEMANTIC — no predicate, and inferring one would report a number for all 23 patterns that means something for ten')
        : und('no predicate declared for this entry');
      return { itemId: r.id, case: r.questionTypeId, tag, optionValue: value, key, ...v, entryBehaviour: lib.get(tag) ?? null };
    });
  });
  requirePopulation('check:carrier-performs-entry', { 'tagged distractor option(s)': results.length });

  const byPattern: Record<string, { carriers: number; performs: number; refuses: number; undecidable: number; refusingRows: Array<{ itemId: string; optionValue: string; why: string }> }> = {};
  for (const r of results) {
    const b = byPattern[r.tag] ??= { carriers: 0, performs: 0, refuses: 0, undecidable: 0, refusingRows: [] };
    b.carriers += 1;
    if (r.verdict === 'PERFORMS') b.performs += 1;
    else if (r.verdict === 'REFUSES') { b.refuses += 1; b.refusingRows.push({ itemId: r.itemId, optionValue: r.optionValue, why: r.why }); }
    else b.undecidable += 1;
  }
  const tested = results.filter((r) => r.verdict !== 'UNDECIDABLE');
  const refusing = results.filter((r) => r.verdict === 'REFUSES');

  const full = {
    kind: 'carrier-performs-entry-census',
    THE_QUESTION: 'does the carrier perform the entry\'s behaviour? Nothing in this district has ever asked it.',
    THE_LEXICON: `${DICT} (BSD web2), ${WORDS.size} entries — named because a carrier called "not a word" is being judged against it`,
    THE_POPULATION_THIS_RAN_ON: `${results.length} tagged distractor options across the 275 DRAFT rows of the eleven paid cases. Cowork's figure of 391 tag-rows names a population this store does not hold; this one is named rather than matched (R918).`,
    counts: { tagged: results.length, testable: tested.length, performs: tested.filter((r) => r.verdict === 'PERFORMS').length, REFUSES: refusing.length, undecidable: results.length - tested.length },
    UNDECIDABLE_IS_A_VERDICT: 'thirteen patterns are semantic — chose a goes-together word, grouped by look or sound — and get no predicate. A test that scored them by inference would report a number for all 23 patterns and mean something for ten.',
    BY_PATTERN: Object.fromEntries(Object.entries(byPattern).sort((a, b) => b[1].refuses - a[1].refuses)),
    THE_REFUSING_MEMBERSHIP: refusing.map((r) => ({ itemId: r.itemId, case: r.case, tag: r.tag, optionValue: r.optionValue, key: r.key, why: r.why, entryBehaviour: r.entryBehaviour })),
  };
  const lines = refusing.map((r) => `${r.itemId}\t${r.tag}\t${r.optionValue}`);
  const d = digestOverText('one line per refusing carrier, "<itemId>\\t<tag>\\t<value>"', lines.join('\n'));
  const withLines = { ...full, RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec };
  const artefact = { ...withLines, ...findingsDigest(withLines, ['counts', 'BY_PATTERN', 'THE_REFUSING_MEMBERSHIP', 'RESULT_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('carrier-performs-entry-census', sha(json).slice(0, 16), 'json');
  writeFileSync(pjoin(REPO, 'content/exports', name), json);
  deliver(pjoin(REPO, 'content/exports', name), 'carrier-performs-entry-census');
  console.log(`\n  ${results.length} tagged carriers · testable ${tested.length} · PERFORMS ${tested.filter((r) => r.verdict === 'PERFORMS').length} · REFUSES ${refusing.length} · undecidable ${results.length - tested.length}`);
  for (const [tag, b] of Object.entries(byPattern).sort((a, b) => b[1].refuses - a[1].refuses)) {
    if (b.undecidable === b.carriers) continue;
    console.log(`   ${tag.padEnd(36)} carriers ${String(b.carriers).padStart(3)} · performs ${String(b.performs).padStart(3)} · REFUSES ${String(b.refuses).padStart(3)}`);
  }
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
