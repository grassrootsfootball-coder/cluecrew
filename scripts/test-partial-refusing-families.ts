/**
 * THE FOUR PARTIAL FAMILIES, EACH DECIDED ON ITS WHOLE REFUSING SUBSET (her 203rd).
 *
 * **Wholesale refusal was a generator verdict; partial refusal is not.** Twenty-two, twenty-one,
 * eleven, fourteen and fourteen of twenty-five are MIXED populations, so the pattern grain no longer
 * carries them and three samples cannot rule a family of twenty-two. Every refusing carrier is
 * tested and every one crosses.
 *
 * Three tests, each stated before it runs:
 *  - **vr13**: can each refusing value be derived from the outer words by a statable position
 *    choice? If so the family's act is *selected the wrong letters*, not *not a word*. And the
 *    three that PERFORM are suspect the other way — a performs verdict is bounded by the lexicon
 *    that issued it, so they re-check against a fuller one.
 *  - **vr05**: where does the refusing carrier actually sit in the sentence? **If it sits at a word
 *    join, the item has a second findable word and the fault is CONTENT, not tagging.** A content
 *    fault outranks a tag fault everywhere, so this runs before any retag is considered.
 *  - **move-letter**: execute every refusing carrier against the MIRROR entry. Performs there means
 *    a swapped join — one repair for the pair, not twenty-eight readings.
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
const load = (p: string) => (existsSync(p) ? readFileSync(p, 'utf8').split('\n').map((w) => w.trim().toLowerCase()).filter(Boolean) : []);
const NARROW = new Set(load('/usr/share/dict/web2'));
const WIDER = new Set([...NARROW, ...load('/usr/share/dict/web2a'), ...load('/usr/share/dict/words'),
  // British informal and family words a web2 lexicon omits — declared, not silently appended.
  'gran', 'nan', 'mum', 'mummy', 'pram', 'telly', 'lorry', 'plait', 'kerb', 'jumper']);
const inNarrow = (s: string) => NARROW.has(s.trim().toLowerCase());
const inWider = (s: string) => WIDER.has(s.trim().toLowerCase());

/** Every way `target` can be spelled by picking letters from word1 then word2, positions stated. */
function positionsFrom(w1: string, w2: string, target: string) {
  const out: Array<{ fromFirst: number[]; fromSecond: number[] }> = [];
  const walk = (idx: number, i1: number, i2: number, p1: number[], p2: number[], phase: 1 | 2) => {
    if (out.length >= 3) return;
    if (idx === target.length) { if (p1.length && p2.length) out.push({ fromFirst: [...p1], fromSecond: [...p2] }); return; }
    if (phase === 1) {
      for (let i = i1; i < w1.length; i += 1) if (w1[i] === target[idx]) walk(idx + 1, i + 1, i2, [...p1, i], p2, 1);
      walk(idx, 0, i2, p1, p2, 2);
    } else {
      for (let i = i2; i < w2.length; i += 1) if (w2[i] === target[idx]) walk(idx + 1, i1, i + 1, p1, [...p2, i], 2);
    }
  };
  walk(0, 0, 0, [], [], 1);
  return out;
}

async function run() {
  assertFixture('family-tests', [
    { name: 'SHOE derives from SHEEP/OPEN by stated positions', input: JSON.stringify(['SHEEP', 'OPEN', 'SHOE']), mustBeCaught: true },
    { name: 'the key SHOP derives too — position choice is not itself the fault', input: JSON.stringify(['SHEEP', 'OPEN', 'SHOP']), mustBeCaught: true },
    { name: 'a value using a letter in neither word does not derive', input: JSON.stringify(['SHEEP', 'OPEN', 'ZZZZ']), mustBeCaught: false },
    { name: 'the narrow lexicon does not hold GRAN', input: 'narrow-gran', mustBeCaught: false },
    { name: 'the wider lexicon does', input: 'wider-gran', mustBeCaught: true },
  ], (raw) => {
    if (raw === 'narrow-gran') return inNarrow('gran');
    if (raw === 'wider-gran') return inWider('gran');
    const [a, b, t] = JSON.parse(raw) as [string, string, string];
    return positionsFrom(a, b, t).length > 0;
  });

  const val = (c: unknown) => String((c as { value: unknown }).value);
  const rowsOf = async (qt: string) => prisma.item.findMany({ where: { questionTypeId: qt, status: 'DRAFT' },
    select: { id: true, stem: true, options: { orderBy: { id: 'asc' }, select: { content: true, isCorrect: true, misconceptionId: true } } }, orderBy: { id: 'asc' } });

  // ---- vr13 ------------------------------------------------------------------------------------
  const v13 = await rowsOf('vr-13-make-a-word');
  const vr13 = v13.map((r) => {
    const [w1, w2] = (r.stem as { words: [string, string] }).words;
    const key = val(r.options.find((o) => o.isCorrect)!.content);
    const c = r.options.find((o) => o.misconceptionId === 'vr13-not-a-word');
    if (!c) return null;
    const v = val(c.content);
    const pos = positionsFrom(w1, w2, v);
    return { itemId: r.id, outerWords: [w1, w2], key, carrier: v,
      isARealWordNarrow: inNarrow(v), isARealWordWider: inWider(v),
      verdictUnderTheCurrentEntry: inNarrow(v) ? 'REFUSES — it is a word' : 'performs',
      DERIVABLE_BY_POSITION: pos.length > 0,
      thePositions: pos.slice(0, 2).map((p) => `${w1}[${p.fromFirst.join(',')}] + ${w2}[${p.fromSecond.join(',')}]`),
      keyPositions: positionsFrom(w1, w2, key).slice(0, 1).map((p) => `${w1}[${p.fromFirst.join(',')}] + ${w2}[${p.fromSecond.join(',')}]`) };
  }).filter((x): x is NonNullable<typeof x> => !!x);
  const v13Refusing = vr13.filter((x) => x.isARealWordNarrow);
  const v13Performing = vr13.filter((x) => !x.isARealWordNarrow);

  // ---- vr05 ------------------------------------------------------------------------------------
  const v05 = await rowsOf('vr-05-hidden-word');
  const vr05 = v05.flatMap((r) => {
    const sentence = String((r.stem as { sentence: string }).sentence);
    const flat = sentence.toLowerCase().replace(/[^a-z]/g, '');
    const words = sentence.toLowerCase().split(/\s+/).map((w) => w.replace(/[^a-z]/g, ''));
    return r.options.filter((o) => !o.isCorrect && o.misconceptionId?.startsWith('vr05')).map((o) => {
      const v = val(o.content).toLowerCase();
      const inSingle = words.some((w) => w.includes(v));
      const contiguous = flat.includes(v);
      return { itemId: r.id, tag: o.misconceptionId!, carrier: val(o.content),
        theKey: val(r.options.find((x) => x.isCorrect)!.content), THE_SENTENCE: sentence,
        sitsInsideASingleWord: inSingle,
        SITS_AT_A_WORD_JOIN: contiguous && !inSingle,
        appearsNowhereContiguously: !contiguous,
        THE_CONTENT_QUESTION: contiguous && !inSingle
          ? 'THIS ITEM OFFERS A SECOND FINDABLE WORD AT A JOIN — a rival key. The fault is CONTENT, not tagging.'
          : null };
    });
  });
  const rivalKeys = vr05.filter((x) => x.SITS_AT_A_WORD_JOIN);

  // ---- move-letter mirror ----------------------------------------------------------------------
  const v08 = await rowsOf('vr-08-move-letter');
  const firstInvalid = (w1: string, letter: string) => !inNarrow(w1.replace(letter, ''));
  const secondInvalid = (w2: string, letter: string) =>
    ![...Array(w2.length + 1).keys()].map((i) => w2.slice(0, i) + letter + w2.slice(i)).some(inNarrow);
  const mirror = v08.flatMap((r) => {
    const { word1, word2 } = r.stem as { word1: string; word2: string };
    return r.options.filter((o) => !o.isCorrect && o.misconceptionId?.startsWith('vr-move-letter')).map((o) => {
      const L = val(o.content);
      const ownIsFirst = o.misconceptionId === 'vr-move-letter-first-word-invalid';
      const performsOwn = ownIsFirst ? firstInvalid(word1, L) : secondInvalid(word2, L);
      const performsMirror = ownIsFirst ? secondInvalid(word2, L) : firstInvalid(word1, L);
      return { itemId: r.id, word1, word2, letter: L, tag: o.misconceptionId!,
        performsItsOwnEntry: performsOwn, PERFORMS_THE_MIRROR_ENTRY: performsMirror,
        removingItLeaves: word1.replace(L, ''), removalIsAWord: inNarrow(word1.replace(L, '')),
        additionsThatMakeAWord: [...Array(word2.length + 1).keys()].map((i) => word2.slice(0, i) + L + word2.slice(i)).filter(inNarrow),
        VERDICT: performsOwn ? 'performs its own entry'
          : performsMirror ? 'SWAPPED JOIN — refuses its own entry and performs the mirror'
          : 'refuses both entries' };
    });
  });
  const refusingMirror = mirror.filter((m) => !m.performsItsOwnEntry);
  const swapped = refusingMirror.filter((m) => m.PERFORMS_THE_MIRROR_ENTRY);

  requirePopulation('test:partial-families', {
    'vr13 carrier(s)': vr13.length, 'vr05 carrier(s)': vr05.length, 'move-letter carrier(s)': mirror.length,
  });

  const full = {
    kind: 'partial-refusing-families-tested',
    TO: 'Annie — every refusing carrier, not samples.',
    THE_GRAIN: 'wholesale refusal was a generator verdict; partial refusal is not. Three samples cannot rule a family of twenty-two, so each family is decided on its whole refusing subset and the subsets cross whole.',

    VR13_SELECTED_THE_WRONG_LETTERS: {
      hypothesis: 'the family\'s act is selected-the-wrong-letters — a real and determinate slip producing real words, which is the stronger trap besides.',
      refusingUnderTheCurrentEntry: v13Refusing.length, performing: v13Performing.length,
      DERIVABLE_BY_A_STATABLE_POSITION_CHOICE: v13Refusing.filter((x) => x.DERIVABLE_BY_POSITION).length,
      ofRefusing: v13Refusing.length,
      andWHATTHATSUPPORTS: 'where the positions are statable the family retags or mints on that act under the one-act rule. This store states the positions and does not rule.',
      THE_THREE_THAT_PERFORM_RECHECKED: {
        yourPoint: 'a performs verdict is bounded by the lexicon that issued it; GRAN is the narrow zero wearing a pass.',
        rows: v13Performing.map((x) => ({ itemId: x.itemId, carrier: x.carrier, inNarrowLexicon: x.isARealWordNarrow, IN_WIDER_LEXICON: x.isARealWordWider })),
        stillPerformingUnderTheWiderLexicon: v13Performing.filter((x) => !x.isARealWordWider).length,
        theWiderLexicon: 'web2 + web2a + words, plus a declared list of British family words a US lexicon omits — named rather than appended silently',
      },
      rows: vr13,
    },

    VR05_THE_CONTENT_QUESTION_FIRST: {
      whyThisRunsBeforeANYRETAG: 'if the refusing carrier appears at a word join, the item contains a second findable word and the fault is the item offering two defensible answers. A content fault outranks a tag fault everywhere; retagging an option that is actually a rival key would bury the real fault under a resolved one.',
      carriers: vr05.length,
      SITTING_AT_A_WORD_JOIN_RIVAL_KEYS: rivalKeys.length,
      insideASingleWord: vr05.filter((x) => x.sitsInsideASingleWord).length,
      appearingNowhereContiguously: vr05.filter((x) => x.appearsNowhereContiguously).length,
      THE_SENTENCES_CROSS_WHOLE: 'every row below carries its full sentence, its key and its carrier. No retag is proposed.',
      rows: vr05,
    },

    MOVE_LETTER_CROSS_EXECUTION: {
      test: 'every refusing carrier executed against the MIRROR entry; performs there means a swapped join — one repair for the pair, not twenty-eight readings.',
      refusingItsOwnEntry: refusingMirror.length,
      PERFORMS_THE_MIRROR: swapped.length,
      refusingBoth: refusingMirror.length - swapped.length,
      andWHATTHATMEANS: swapped.length === refusingMirror.length
        ? 'EVERY refusing carrier performs the mirror entry. The fourteen-and-fourteen symmetry is a swapped join and the repair is one exchange for the pair.'
        : `${swapped.length} of ${refusingMirror.length} perform the mirror; the remainder refuse both entries and are a separate question.`,
      rows: mirror,
    },
  };
  const lines = [`vr13-derivable\t${v13Refusing.filter((x) => x.DERIVABLE_BY_POSITION).length}/${v13Refusing.length}`,
    `vr05-rival-keys\t${rivalKeys.length}/${vr05.length}`, `move-letter-swapped\t${swapped.length}/${refusingMirror.length}`];
  const d = digestOverText('the three family results joined by \\n', lines.join('\n'));
  const withLines = { ...full, RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec };
  const artefact = { ...withLines, ...findingsDigest(withLines, ['VR13_SELECTED_THE_WRONG_LETTERS', 'VR05_THE_CONTENT_QUESTION_FIRST', 'MOVE_LETTER_CROSS_EXECUTION', 'RESULT_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('partial-refusing-families-tested', sha(json).slice(0, 16), 'json');
  writeFileSync(pjoin(REPO, 'content/exports', name), json);
  deliver(pjoin(REPO, 'content/exports', name), 'partial-refusing-families-tested');
  console.log(`\n  vr13 — refusing ${v13Refusing.length}, derivable by stated positions ${v13Refusing.filter((x) => x.DERIVABLE_BY_POSITION).length}; the ${v13Performing.length} performers still perform under a wider lexicon: ${v13Performing.filter((x) => !x.isARealWordWider).length}`);
  console.log(`  vr05 — ${vr05.length} carriers · RIVAL KEYS AT A JOIN ${rivalKeys.length} · inside a single word ${vr05.filter((x) => x.sitsInsideASingleWord).length} · nowhere ${vr05.filter((x) => x.appearsNowhereContiguously).length}`);
  console.log(`  move-letter — refusing own entry ${refusingMirror.length} · PERFORMS THE MIRROR ${swapped.length} · refusing both ${refusingMirror.length - swapped.length}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
