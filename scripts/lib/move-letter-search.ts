/**
 * SEARCH-OVER-HAND FOR vr-08, UNDER DAVID'S FIREWALL RULING (2026-09-05).
 *
 * The ruling that makes this possible, and its exact boundary:
 *
 *   **A search may propose from the generator's own material and be measured at 3.0; it may not
 *   enumerate candidates from the frequency list. The list GATES, it does not SOURCE.**
 *
 * So `generatorMaterial()` reads the words already written into `generate-content.ts` — the
 * estate's own authored vocabulary — and the lexicon is consulted only to ACCEPT or REJECT what
 * that material proposes. Nothing here iterates the corpus. That distinction is the whole ruling:
 * a frequency list that proposes words has reached the generator, and one that judges words the
 * generator proposed has not.
 *
 * **ONE IMPLEMENTATION, SHARED (R429).** The applier and any future regeneration call this; a
 * second copy of a search is a second definition of what "valid at 3.0" means.
 */
import { readFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { isAppropriateForAChild } from '../../packages/core/src/appropriateness';
import { loadChildLexicon, type ChildLexicon } from './child-lexicon';
import { deriveList, type Derivation } from './derived-list';

const GENERATOR = pjoin(__dirname, '..', '..', 'packages', 'db', 'prisma', 'generate-content.ts');

export interface MoveLetterCandidate {
  word1: string; word2: string; key: string;
  /** The distractor whose removal leaves no first word. */
  firstWordInvalid: string;
  /** The distractor that makes no second word. */
  secondWordInvalid: string;
  left: string; made: string;
  minZipf: number; minZipfCBBC: number;
}

/**
 * Every word the generator already carries. THE SOURCE. The lexicon never enumerates.
 *
 * **AND IT IS A DERIVED LIST, SO IT NAMES ITS PARENT (R1004).** 796 of the generator's own words
 * clear the cut; a reader given only that number cannot tell how many did not, and the excluded
 * half is what decides whether a short candidate list is a fact about the corpus or about the cut.
 */
export function generatorMaterialDerived(lex: ChildLexicon): { items: string[]; derivedFrom: Derivation } {
  const src = readFileSync(GENERATOR, 'utf8');
  const quoted = src.match(/'[A-Za-z]{2,7}'/g) ?? [];
  if (quoted.length < 200) throw new Error(`read only ${quoted.length} quoted words from the generator — a short read is a broken read, not a small generator (R173)`);
  const all = [...new Set(quoted.map((s) => s.slice(1, -1).toUpperCase()))];
  return deriveList(
    { name: 'the generator\'s usable material', parent: 'every distinct 2-7 letter quoted word in generate-content.ts', rule: `known to a competent eleven-year-old at Zipf >= ${lex.cut} on SUBTLEX-UK, names excluded` },
    all, (w) => lex.knows(w),
  );
}

export function generatorMaterial(lex: ChildLexicon): string[] {
  return generatorMaterialDerived(lex).items;
}

const insertions = (w: string, l: string) => [...Array(w.length + 1).keys()].map((i) => w.slice(0, i) + l + w.slice(i));

/** Every letter of word1 that performs the task against word2, under the cut. */
export function performingLetters(w1: string, w2: string, lex: ChildLexicon): string[] {
  return [...new Set(w1)].filter((l) => lex.knows(w1.replace(l, '')) && insertions(w2, l).some((m) => lex.knows(m)));
}

/**
 * Candidates with a UNIQUE key and both distractor kinds actually available on the item's own
 * letters — a stem whose second seat cannot be built is a stem that will be tagged by hand later.
 */
export function searchMoveLetter(lex: ChildLexicon, opts: { exclude?: Set<string>; decideBare?: boolean } = {}): MoveLetterCandidate[] {
  /**
   * THE DECIDING CORPUS (Annie, 226th): where the child meets the word BARE — which is every word
   * in this district — the child-directed corpus decides and the whole corpus is background. So a
   * search for bare-word items tests `knowsBare`, not `knows`. SOW is why: 3.60 wide, 2.94 bare.
   */
  /**
   * THE CONSTRAINT SET GAINS AN APPROPRIATENESS PREDICATE ALONGSIDE WORDHOOD (Annie's 227th).
   * *"A search that proposes an unsuitable candidate and a gate that catches it is a system that
   * works and wastes; a search that cannot propose one is a system that cannot fail in this
   * direction."* It is the SAME predicate the write gate calls — one declaration, two sites, so
   * the two cannot drift (R42, R57).
   */
  const known = (w: string) => (opts.decideBare ? lex.knowsBare(w) : lex.knows(w)) && isAppropriateForAChild(w);
  const pool = generatorMaterial(lex).filter(known);
  const exclude = opts.exclude ?? new Set<string>();
  const out: MoveLetterCandidate[] = [];
  for (const w1 of pool) {
    if (w1.length < 5 || w1.endsWith('S')) continue;
    for (const w2 of pool) {
      if (w2 === w1 || w2.length < 3 || w2.length > 5 || w2.endsWith('S')) continue;
      const works = [...new Set(w1)].filter((l) => known(w1.replace(l, '')) && insertions(w2, l).some((m) => known(m)));
      if (works.length !== 1) continue;
      const key = works[0]!;
      const left = w1.replace(key, '');
      const made = insertions(w2, key).find((m) => known(m))!;
      if (made === w1 || left === w2) continue;
      const letters = [...new Set(w1)].filter((l) => l !== key);
      // A first-word-invalid seat must leave a word the child does not hold on EITHER reading —
      // a leftover known wide and unknown bare is the borderline case her 226th rules out.
      const d1 = letters.find((l) => !lex.knows(w1.replace(l, '')) && !lex.knowsBare(w1.replace(l, '')));
      const d2 = letters.find((l) => known(w1.replace(l, '')) && !insertions(w2, l).some((m) => known(m)));
      if (!d1 || !d2) continue;
      const four = [w1, w2, left, made];
      if (four.some((w) => exclude.has(w))) continue;
      const minZipf = Math.min(...four.map((w) => lex.zipf(w) ?? 0));
      const minZipfCBBC = Math.min(...four.map((w) => lex.zipfCBBC(w) ?? 0));
      if (minZipfCBBC < 3.0) continue;
      out.push({ word1: w1, word2: w2, key, firstWordInvalid: d1, secondWordInvalid: d2, left, made, minZipf, minZipfCBBC });
    }
  }
  return out.sort((a, b) => b.minZipf - a.minZipf);
}

/** Distinct picks: no word may appear in two chosen items, or the bank repeats itself (R990). */
export function pickDistinct(cands: MoveLetterCandidate[], n: number): MoveLetterCandidate[] {
  const seen = new Set<string>(); const picks: MoveLetterCandidate[] = [];
  for (const c of cands) {
    const four = [c.word1, c.word2, c.left, c.made];
    if (four.some((w) => seen.has(w))) continue;
    picks.push(c); four.forEach((w) => seen.add(w));
    if (picks.length === n) break;
  }
  return picks;
}

export { loadChildLexicon };
