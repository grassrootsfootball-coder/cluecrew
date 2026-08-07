/**
 * VOCABULARY-IN-CONTEXT — SEMI-generable from the two-sense vault (David, 2026-08-08).
 *
 * The vault holds 67 two-sense cards (`twoMeanings`), each with sense A, sense B and their
 * word classes. Annie's two-part bare-card screen (vr04) already governs which distractors
 * are legal: a two-sense headword MAY be a bare card, but any distractor correct in the
 * headword's OTHER sense is a second correct answer and is forbidden. That screen is exactly
 * what makes a two-sense card safe to serve, so vocab-in-context is built ON it.
 *
 * Why SEMI, not fully, generable: the vault stores the two senses as glosses, not as
 * synonym lists. The generator supplies the STRUCTURE (headword + which sense is under test)
 * and the SCREEN (reusing `checkVr04Row` + the per-card other-sense forbid), but the key
 * synonym and the candidate distractors are authored — the vault gives no synonyms to draw
 * from. So this module assembles + screens a candidate row and reports eligibility; it does
 * not invent words. A card whose senses leave no surviving bare key (the FAIR problem) is
 * flagged for a carrier (T4–T5) instead, the vr04 ruling.
 */
import { VR04_NEVER_ADD, checkVr04Row, forbiddenFor, type Vr04Row } from '../vr/vr04';

/** The two-sense vault fields this module needs (a subset of the `word` row). */
export interface TwoSenseCard {
  headword: string;
  tier: number;
  definitionChild: string; // sense A
  wordClass?: string | null;
  senseBDefinition?: string | null; // sense B — the other meaning the screen must fence off
  senseBWordClass?: string | null;
  likelierKnown?: 'A' | 'B' | string | null;
}

/** Is this card a usable vocab-in-context seed — does it actually carry two senses. */
export function isTwoSenseSeed(card: TwoSenseCard): boolean {
  return Boolean(card.senseBDefinition && card.senseBDefinition.trim() && card.definitionChild.trim());
}

export interface VocabCandidate {
  /** The sense under test — A (default) or B. The OTHER sense is the one to fence off. */
  senseUnderTest?: 'A' | 'B';
  /** Authored synonym of the sense under test — the key. */
  key: string;
  /** Authored distractor words (screened here). Tag any that live in the other sense so the
   *  screen can reject them explicitly; untagged ones still hit the never-add / forbid set. */
  distractors: string[];
  /** Words correct in the OTHER sense — authored from the sense-B gloss (the vault has no
   *  synonym list). These are the hard block: a near-synonym generator reaches for them first. */
  otherSenseWords: string[];
}

export interface VocabScreenResult {
  ok: boolean;
  errors: string[];
  /** The screened row, when ok — a bare vr04 row ready to serve. */
  row?: Vr04Row;
}

/**
 * Screen a candidate vocab-in-context item built from a two-sense card. Bare card (no
 * carrier), so the two-part screen applies in full: any distractor correct in the other
 * sense is forbidden. Returns the vr04 errors (empty = legal) plus the assembled row.
 */
export function screenVocabItem(card: TwoSenseCard, cand: VocabCandidate): VocabScreenResult {
  const errors: string[] = [];
  if (!isTwoSenseSeed(card)) return { ok: false, errors: [`"${card.headword}" is not a two-sense seed (missing a sense)`] };

  const forbidden = new Set([...forbiddenFor(card.headword), ...cand.otherSenseWords.map((w) => w.toLowerCase())]);
  const row: Vr04Row = {
    n: 0,
    tier: card.tier,
    headword: card.headword,
    key: cand.key,
    carrier: null, // bare — the whole point of the two-part screen
    distractors: cand.distractors.map((w) => ({ word: w, diagnosis: forbidden.has(w.toLowerCase()) ? 'OM' : 'WS' })),
  };

  // Explicit other-sense forbid (the per-card extension of vr04's curated list).
  for (const d of cand.distractors) {
    if (forbidden.has(d.toLowerCase())) errors.push(`two-sense: "${d}" is correct in the OTHER sense of "${card.headword}" — a second correct answer; forbidden`);
    if (VR04_NEVER_ADD.has(d.toLowerCase())) errors.push(`never-add: "${d}" is a defensible second answer, not a distractor`);
  }
  // Plus the shared vr04 machinery (OM-on-bare block, curated forbids, key echoes).
  errors.push(...checkVr04Row(row));

  const deduped = [...new Set(errors)];
  return { ok: deduped.length === 0, errors: deduped, row: deduped.length === 0 ? row : undefined };
}

export interface VocabCoverage {
  totalTwoSense: number;
  byTier: Record<number, number>;
  headwords: string[];
}

/** Eligibility report: how many vault cards can seed a vocab-in-context item, by tier. */
export function vocabSeedCoverage(cards: TwoSenseCard[]): VocabCoverage {
  const seeds = cards.filter(isTwoSenseSeed);
  const byTier: Record<number, number> = {};
  for (const c of seeds) byTier[c.tier] = (byTier[c.tier] ?? 0) + 1;
  return { totalTwoSense: seeds.length, byTier, headwords: seeds.map((c) => c.headword).sort() };
}
