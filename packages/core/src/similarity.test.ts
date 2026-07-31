import { describe, expect, it } from 'vitest';
import {
  fingerprintItem,
  hashText,
  misconceptionImportSchema,
  screenAgainstIndex,
  similarityIndexSchema,
  type SimilarityIndex,
} from './similarity';

/** Builds an index entry from text THE WAY THE GENERATOR WOULD — the test is
 *  the only place source-like text exists, and it is synthetic. */
function indexFrom(id: string, stem: unknown, options: unknown[]): SimilarityIndex {
  const fingerprint = fingerprintItem({ stem, optionContents: options });
  return { kind: 'similarity-index', ngramSize: 3, fingerprints: [{ id, ...fingerprint }] };
}

const SOURCE_STEM = {
  prompt: 'Find the letter that completes both pairs of words in the same way',
  pairs: ['crus ( ) atch', 'blus ( ) oney'],
};
const SOURCE_OPTIONS = [{ value: 'h' }, { value: 't' }, { value: 'k' }, { value: 'm' }, { value: 's' }];

describe('the similarity gate (Addendum E §3)', () => {
  const index = indexFrom('inventory-vr-042', SOURCE_STEM, SOURCE_OPTIONS);

  it('an identical item hard-fails', () => {
    const verdict = screenAgainstIndex(
      fingerprintItem({ stem: SOURCE_STEM, optionContents: SOURCE_OPTIONS }),
      index,
    );
    expect(verdict.kind).toBe('fail');
  });

  it('a lightly-reworded derivation lands in SIMILARITY_REVIEW', () => {
    const derived = {
      prompt: 'Find the letter that completes both pairs of words in the same way',
      pairs: ['brus ( ) itch', 'flus ( ) oney'],
    };
    const verdict = screenAgainstIndex(
      fingerprintItem({ stem: derived, optionContents: SOURCE_OPTIONS }),
      index,
    );
    expect(verdict.kind === 'review' || verdict.kind === 'fail').toBe(true);
  });

  it('an original item on the same TYPE clears — types are fair game (L4)', () => {
    const original = {
      prompt: 'One letter finishes the first word and starts the second. Which is it?',
      pairs: ['lam ( ) each', 'gri ( ) ottle'],
    };
    const verdict = screenAgainstIndex(
      fingerprintItem({ stem: original, optionContents: [{ value: 'p' }, { value: 'b' }, { value: 'd' }, { value: 'l' }, { value: 'n' }] }),
      index,
    );
    expect(verdict.kind).toBe('clear');
  });

  it('verdicts carry ids and scores only — no text fields exist to leak', () => {
    const verdict = screenAgainstIndex(
      fingerprintItem({ stem: SOURCE_STEM, optionContents: SOURCE_OPTIONS }),
      index,
    );
    expect(Object.keys(verdict).sort()).toEqual(['kind', 'matchedId', 'score']);
    expect(JSON.stringify(verdict)).not.toContain('completes both pairs');
  });

  it('index files validate and reject reconstructable content by shape', () => {
    expect(similarityIndexSchema.safeParse(index).success).toBe(true);
    // A file smuggling raw text where hashes belong still parses as strings —
    // the spot-audit (gate #5) is the human control for that; the schema at
    // least refuses structural surprises.
    expect(
      similarityIndexSchema.safeParse({ kind: 'similarity-index', fingerprints: [{}] }).success,
    ).toBe(false);
  });

  it('hashing is stable', () => {
    expect(hashText('crus h atch')).toBe(hashText('crus h atch'));
  });
});

describe('the misconception import contract (Addendum E §2)', () => {
  const entry = {
    id: 'vr-code-direction-reversal',
    district: 'VR',
    description: 'Child applies the letter shift in the wrong direction when decoding.',
    childHint: 'You went forwards. This code runs backwards.',
    sourcePattern: 'corpus-pattern-vr-17',
    proposedBy: 'ai-corpus:v1',
    approvedBy: null,
  };

  it('accepts the contract shape', () => {
    expect(misconceptionImportSchema.safeParse([entry]).success).toBe(true);
  });

  it('refuses pre-approved imports — approval happens in the CMS, never in a file', () => {
    expect(
      misconceptionImportSchema.safeParse([{ ...entry, approvedBy: 'human:someone' }]).success,
    ).toBe(false);
  });

  it('refuses non-corpus provenance through this door', () => {
    expect(
      misconceptionImportSchema.safeParse([{ ...entry, proposedBy: 'human:me' }]).success,
    ).toBe(false);
  });
});
