/**
 * The similarity gate (ADDENDUM-E §3) — the one engine piece of the corpus
 * pipeline, and it is PROTECTIVE: it exists so nothing derived from source
 * papers can enter the item bank (manifesto L4). Question TYPES are fair
 * game; question CONTENT never is.
 *
 * The index arrives as hashed n-gram + structural fingerprints per source
 * item, generated outside this repo from David's private folder. It contains
 * no reconstructable content, and nothing in this module ever handles source
 * text — comparisons are hash-set overlaps, and every result names items BY
 * ID ONLY.
 *
 * Thresholds are config, tuned in week one against known-original seed items
 * (false-positive rate) and deliberately-derived private test items
 * (detection rate). The gate protects against DERIVATION; the human reviewer
 * judges COINCIDENCE — some resemblance is inevitable when there are only so
 * many ways to ask a T1 letter-code question.
 */
import { z } from 'zod';

/** Launch defaults pending week-one tuning (Addendum E §3). */
export const SIMILARITY_THRESHOLDS = {
  /** Jaccard overlap at or above this = exact/near-exact = hard fail. */
  hardFail: 0.85,
  /** At or above this = SIMILARITY_REVIEW, blocked from REVIEWED until a
   *  reviewer clears it with a note. */
  review: 0.6,
  /** Word n-gram size fingerprints are built from. Must match the size the
   *  index generator used, or overlaps are meaningless. */
  ngramSize: 3,
} as const;

export const similarityFingerprintSchema = z.object({
  /** Opaque source reference (inventory id) — the ONLY thing errors may name. */
  id: z.string().min(1),
  ngramHashes: z.array(z.string().min(1)),
  structuralHash: z.string().min(1),
});

export const similarityIndexSchema = z.object({
  kind: z.literal('similarity-index'),
  ngramSize: z.number().int().positive(),
  fingerprints: z.array(similarityFingerprintSchema),
});

export type SimilarityFingerprint = z.infer<typeof similarityFingerprintSchema>;
export type SimilarityIndex = z.infer<typeof similarityIndexSchema>;

/** FNV-1a, hex — stable across runtimes, matches the index generator. */
export function hashText(text: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/** Pulls every string and number out of authored JSON, in stable order. */
function textParts(value: unknown, parts: string[]): void {
  if (typeof value === 'string') parts.push(value);
  else if (typeof value === 'number') parts.push(String(value));
  else if (Array.isArray(value)) for (const entry of value) textParts(entry, parts);
  else if (value && typeof value === 'object') {
    for (const key of Object.keys(value as object).sort()) {
      textParts((value as Record<string, unknown>)[key], parts);
    }
  }
}

export function normaliseItemText(stem: unknown, optionContents: unknown[]): string[] {
  const parts: string[] = [];
  textParts(stem, parts);
  for (const option of optionContents) textParts(option, parts);
  return parts
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/** An incoming item's fingerprint, built exactly the way the index was. */
export function fingerprintItem(input: {
  stem: unknown;
  optionContents: unknown[];
  ngramSize?: number;
}): { ngramHashes: string[]; structuralHash: string } {
  const words = normaliseItemText(input.stem, input.optionContents);
  const size = input.ngramSize ?? SIMILARITY_THRESHOLDS.ngramSize;
  const hashes = new Set<string>();
  for (let index = 0; index + size <= words.length; index++) {
    hashes.add(hashText(words.slice(index, index + size).join(' ')));
  }
  // Short stems still fingerprint: fall back to whole-text + word hashes.
  if (hashes.size === 0) {
    for (const word of words) hashes.add(hashText(word));
    hashes.add(hashText(words.join(' ')));
  }
  // The structural signature: shape, not words — option count and length
  // buckets catch a same-shaped rewrite whose vocabulary was swapped.
  const structure = {
    optionCount: input.optionContents.length,
    stemWords: Math.round(words.length / 5) * 5,
    numericParts: words.filter((word) => /^\d+$/.test(word)).length,
  };
  return {
    ngramHashes: [...hashes].sort(),
    structuralHash: hashText(JSON.stringify(structure)),
  };
}

export type SimilarityVerdict =
  | { kind: 'clear'; score: number }
  | { kind: 'review'; score: number; matchedId: string }
  | { kind: 'fail'; score: number; matchedId: string };

function jaccard(a: readonly string[], b: readonly string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  let intersection = 0;
  for (const hash of b) if (setA.has(hash)) intersection += 1;
  return intersection / (setA.size + new Set(b).size - intersection);
}

/**
 * Compares one incoming item against the whole index. Returns ids and scores
 * only — BY CONSTRUCTION there is no source text anywhere in this data flow,
 * so no error path can ever echo any.
 */
export function screenAgainstIndex(
  fingerprint: { ngramHashes: string[]; structuralHash: string },
  index: SimilarityIndex,
  thresholds: { hardFail: number; review: number } = SIMILARITY_THRESHOLDS,
): SimilarityVerdict {
  let best: { score: number; id: string; structural: boolean } | null = null;
  for (const entry of index.fingerprints) {
    const score = jaccard(fingerprint.ngramHashes, entry.ngramHashes);
    if (!best || score > best.score) {
      best = { score, id: entry.id, structural: entry.structuralHash === fingerprint.structuralHash };
    }
  }
  if (!best) return { kind: 'clear', score: 0 };
  const score = Math.round(best.score * 1000) / 1000;
  // Exact/near-exact: overwhelming n-gram overlap, or very high overlap on an
  // identical structural signature.
  if (score >= thresholds.hardFail || (best.structural && score >= (thresholds.hardFail + thresholds.review) / 2)) {
    return { kind: 'fail', score, matchedId: best.id };
  }
  if (score >= thresholds.review) return { kind: 'review', score, matchedId: best.id };
  return { kind: 'clear', score };
}

/** The Addendum E §2 misconception-import contract, validated on ingest. */
export const misconceptionImportSchema = z.array(
  z.object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    district: z.enum(['VR', 'NVR', 'MATHS', 'ENGLISH']),
    description: z.string().min(10).max(500),
    childHint: z.string().min(5).max(200),
    sourcePattern: z.string().min(1).max(120),
    proposedBy: z.string().regex(/^ai-corpus:/),
    approvedBy: z.null(),
  }),
);

export type MisconceptionImport = z.infer<typeof misconceptionImportSchema>;
