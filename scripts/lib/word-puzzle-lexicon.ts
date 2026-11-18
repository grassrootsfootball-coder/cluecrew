/**
 * THE WORD-PUZZLE LEXICON (R1021) — the dictionary the word-puzzle gate solves against.
 *
 * Two sources, each doing the one job it can do:
 *   · `content/wordlists/en-lower.txt` decides what EXISTS as a base word (unchanged — the
 *     permissive floor `check:word-puzzles` has always used, so STILE and PARE stay words).
 *   · SUBTLEX-UK (via `loadChildLexicon`, pinned by digest) decides whether a RULE-MADE form is
 *     real: the base must carry the inflection's part of speech, or the form must be a
 *     spell-checked corpus spelling. That is what refuses LARGED and admits LARGER.
 *
 * THE CANARIES ARE THE GUARD AGAINST A BLIND EVIDENCE SOURCE (R60, R173). If the corpus read
 * goes wrong in a way that returns empty part-of-speech sets, every rule-made form would quietly
 * become a non-word and the gate would start flagging keys — through the same no-clearing-path
 * flag that motivated this file. So the loader refuses to return a lexicon that gets any of these
 * wrong, and names which one.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { makeLexicon, type InflectionEvidence } from '../../packages/core/src/word-puzzles';
import { FREQUENCY_SOURCE } from '../../packages/core/src/frequency-signal';
import { loadChildLexicon } from './child-lexicon';

/**
 * A part of speech is EVIDENCE for a base only if it is at least this share of the base's non-name
 * tagged usage. A parameter with a reason, not a tuned constant: SUBTLEX tags `old` as a verb 1
 * time in 118,978 and `cold` 1 in 25,835 — tagger noise, and taken at face value it makes "olded"
 * and "colded" words. 1% sits orders of magnitude above that noise and far below any real verb
 * use (`tie` is a verb in 33% of its tagged uses). A real form the floor costs is rescued when the
 * corpus attests the form itself as a spell-checked spelling.
 */
export const POS_SHARE_FLOOR = 0.01;

export const WORD_PUZZLE_WORDLIST = resolve(import.meta.dirname, '../../content/wordlists/en-lower.txt');

/** Known answers. TIED/LARGER is the row that was wrongly flagged on 2026-11-18. */
const CANARIES: ReadonlyArray<[string, boolean]> = [
  ['larger', true], ['largest', true], ['tied', true], ['tired', true], ['tiles', true],
  ['bigger', true], ['happier', true], ['stopped', true], ['walked', true],
  ['larged', false], ['larging', false], ['olded', false],
];

export function loadWordPuzzleLexicon(): { isWord: (w: string) => boolean; evidence: InflectionEvidence } {
  const child = loadChildLexicon();
  const evidence: InflectionEvidence = {
    source: `SUBTLEX-UK AllPoS (share >= ${POS_SHARE_FLOOR}) + Spell_check (sha256 ${FREQUENCY_SOURCE.expectedDigest?.slice(0, 12)}…)`,
    partsOfSpeech: (base) => {
      const counts = child.partsOfSpeechCounts(base);
      const total = [...counts.values()].reduce((a, b) => a + b, 0);
      return new Set([...counts].filter(([, n]) => total > 0 && n / total >= POS_SHARE_FLOOR).map(([p]) => p));
    },
    attests: (form) => child.spellChecked(form),
  };
  const isWord = makeLexicon(readFileSync(WORD_PUZZLE_WORDLIST, 'utf8').split('\n').filter(Boolean), evidence);
  const wrong = CANARIES.filter(([w, expected]) => isWord(w) !== expected);
  if (wrong.length) {
    throw new Error(
      `the word-puzzle lexicon failed its canaries — refused rather than used: ` +
        wrong.map(([w, e]) => `${w} should be ${e ? 'a word' : 'NOT a word'}`).join('; '),
    );
  }
  return { isWord, evidence };
}
