/**
 * The generation-side shim for content-driven difficulty. Loads the word vault
 * and the common-usage list, then delegates the scoring to @cluecrew/core
 * (`vocabTierFrom` etc.), where the pure logic lives and is tested. See
 * corpus-decisions Entry 28/29 for why tier stopped being the loop index.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  bandTier,
  categoryTier as coreCategoryTier,
  deductionTier as coreDeductionTier,
  makeLexicon,
  vocabTierFrom,
} from '@cluecrew/core';

const CONTENT = resolve(import.meta.dirname, '../../../content');

const vaultTierByWord = new Map<string, number>();
try {
  const raw = JSON.parse(readFileSync(resolve(CONTENT, 'words/words.json'), 'utf8')) as
    | { words: Array<{ headword: string; tier: number }> }
    | Array<{ headword: string; tier: number }>;
  for (const card of Array.isArray(raw) ? raw : raw.words) {
    vaultTierByWord.set(card.headword.toLowerCase(), card.tier);
  }
} catch {
  // Optional at generation time; the proxy still works without it.
}

const commonWords = new Set<string>();
try {
  for (const word of readFileSync(resolve(CONTENT, 'wordlists/common-en.txt'), 'utf8').split('\n')) {
    if (word) commonWords.add(word);
  }
} catch {
  /* proxy leans on length alone */
}

/**
 * The dictionary the insert-letter constructor uses to COMPUTE distractors that
 * complete only one word (so the tag is true and no distractor is a second
 * answer). Same list the word-puzzle gate uses, so generator and gate agree.
 */
export const isWord = makeLexicon(
  (() => {
    try {
      return readFileSync(resolve(CONTENT, 'wordlists/en-lower.txt'), 'utf8').split('\n').filter(Boolean);
    } catch {
      return [];
    }
  })(),
);

/**
 * THE COMMON-USAGE FLOOR (reviewer, 2026-08-02). The SAME list that splits
 * DEFECT from REVIEW in check-word-puzzles (content/wordlists/common-en.txt),
 * so generator and gate agree on what a child actually knows. A completion no
 * child recognises — "cruse", "clamb" — is not a completion to them, so the
 * insert-letter tags must be judged against this, not the permissive lexicon.
 */
export function isCommon(word: string): boolean {
  return commonWords.has(word.toLowerCase().trim());
}

function lookup(word: string): { word: string; vaultTier?: number; familiar: boolean } {
  const key = word.toLowerCase().trim();
  return { word, vaultTier: vaultTierByWord.get(key), familiar: commonWords.has(key) };
}

export function vocabTier(word: string): number {
  return vocabTierFrom(word, lookup(word));
}

export function vocabTierOfSet(words: readonly string[]): number {
  return bandTier(Math.max(1, ...words.map(vocabTier)));
}

/** vr-02 helper: is any word on show demanding vocabulary (tier ≥ 3)? */
export function categoryTier(input: { nearness: number; words: readonly string[] }): number {
  return coreCategoryTier({ nearness: input.nearness, hardVocabulary: vocabTierOfSet(input.words) >= 3 });
}

export const deductionTier = coreDeductionTier;
