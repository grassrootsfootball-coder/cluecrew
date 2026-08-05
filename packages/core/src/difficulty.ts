/**
 * CONTENT-DRIVEN DIFFICULTY (David's ruling, 2026-08-02 — the VR rebuild
 * backbone). Pure scoring logic; the file/DB lookups live in the db package's
 * shim, which feeds these functions the vault tier and familiarity of a word.
 *
 * Every VR generator used to set `tier = 1 + (i % 4)` — the loop index, not
 * the difficulty (corpus-decisions Entry 28). These derive tier from CONTENT.
 * VR items use tiers 1..5, so scores are banded into that range.
 */
import { syllables } from './content-gates';

/**
 * Clamp a raw score into the VR tier band 1..5.
 *
 * Was 1..4 until 2026-08-02, on the mistaken read that VR had four tiers (the
 * old generators used `1 + (i % 4)`). The ratified batch mix is five buckets
 * (…/18/2, the tail at T5) and the Word Vault is tiered 1..5, so four was a cap
 * the content had to fight. The proxy still tops out at 4 — only a vault-tiered
 * word earns 5, which is correct: T5 is a human judgement, not a guess.
 */
export function bandTier(score: number): number {
  return Math.max(1, Math.min(5, Math.round(score)));
}

/**
 * The tier a single vocabulary word earns.
 *
 * `vaultTier` is the human-set word-vault tier when the word is in the vault —
 * the trusted signal, used directly (banded). When it is absent the caller
 * passes `familiar` (is the word in common usage), and this falls back to a
 * proxy: familiarity first, then length/syllables. The proxy is second-best
 * and its weakness is known — a broad "common" list rates too many words
 * familiar — so the real fix is authoring the banks FROM the vault, at which
 * point `vaultTier` is always present and the proxy never runs.
 */
export function vocabTierFrom(word: string, opts: { vaultTier?: number; familiar: boolean }): number {
  if (opts.vaultTier !== undefined) return bandTier(opts.vaultTier);
  const key = word.toLowerCase().trim();
  const syl = syllables(key);
  if (opts.familiar) return bandTier(syl <= 1 && key.length <= 5 ? 1 : 2);
  return bandTier(syl >= 3 || key.length >= 8 ? 4 : 3);
}

/** The hardest word in a set decides the item. */
export function vocabTierOfSet(
  entries: ReadonlyArray<{ word: string; vaultTier?: number; familiar: boolean }>,
): number {
  return bandTier(Math.max(1, ...entries.map((e) => vocabTierFrom(e.word, e))));
}

/**
 * vr-15 reading-information: difficulty is the reasoning load, not vocabulary.
 * Two direct clues in reading order is the floor; a transitive step (clues out
 * of order, so the child must chain them) is harder, more people harder still.
 */
export function deductionTier(input: { clueCount: number; transitive: boolean; peopleCount: number }): number {
  return bandTier(input.clueCount - 1 + (input.transitive ? 1 : 0) + (input.peopleCount >= 4 ? 1 : 0));
}

/**
 * vr-02 odd-one-out: nearness of the odd category to the group (0 = far, 2 =
 * adjacent) plus whether the words on show are demanding vocabulary.
 */
export function categoryTier(input: { nearness: number; hardVocabulary: boolean }): number {
  return bandTier(1 + input.nearness + (input.hardVocabulary ? 1 : 0));
}
