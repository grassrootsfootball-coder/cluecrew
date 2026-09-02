/**
 * A SIGNATURE NAMES ITS SUBJECT, BY NAME AND BY SPEC (Annie's 216th, 2026-09-02 — R973).
 *
 * **A signature that does not say what it is over is an assertion with an unstated referent**, and
 * eleven sound rows proved the cost: one column held more than one kind of hash and a verifier
 * assuming the commonest read them as drift (R970). This is the closed set of subjects this
 * estate has ever hashed into `subjectHash`, each with the spec that reproduces it.
 *
 * **THE SET IS CLOSED AND ORDERED BY EVIDENCE, NOT BY GUESS.** A subject enters this list only
 * when a code path in this repository is known to write it. Anything a stored hash cannot be
 * reproduced under is UNKNOWN — a real state, not a gap to be filled (R98). Nothing here invents
 * a subject to complete a column.
 *
 * **AND THE SPEC IS THE VALUABLE HALF.** The name tells a reader which family a hash belongs to;
 * the spec tells them how to recompute it, which is the only thing that settles a disagreement.
 *
 * **PREVALENCE IS NOT AUTHORITY, AND THIS SET HAS NO DEFAULT** (Annie's 217th, 2026-09-02 — R974).
 * One of these shapes is the commonest in the estate because it is what the product writes when a
 * reviewer signs — **a fact about a code path, not a decision anyone made.** A majority produced
 * by one writer is an undecision dressed as a decision until someone reads it, so no entry here is
 * marked canonical by frequency, nothing falls back to a default, and a caller must name the
 * subject it actually hashed. A frequency table over these is useful and it is not a verdict.
 *
 * The one canonicity that IS declared is about ORDER WITHIN the row projection (her 216th), and it
 * is a ruling about how options are arranged before hashing — never a ruling that the row
 * projection is the canonical SUBJECT. The two questions are separate and only the first is settled.
 */
export const SIGNATURE_SUBJECTS = {
  ROW_PROJECTION_RETENTION_EXCLUDED: {
    kind: 'row-projection',
    spec: 'sha256 over canonicalJson({stem, options:[{content,isCorrect}], explanation}) with every `_`-prefixed key stripped at every depth; option order as read',
  },
  ROW_PROJECTION_RETENTION_INCLUDED: {
    kind: 'row-projection',
    spec: 'sha256 over canonicalJson({stem, options:[{content,isCorrect}], explanation}) with retention (`_`-prefixed) keys INCLUDED; option order as read',
  },
  ROW_PROJECTION_CANONICAL_ORDER: {
    kind: 'row-projection',
    spec: 'sha256 over canonicalJson({stem, options:[{content,isCorrect}], explanation}), retention stripped, OPTIONS SORTED BY VALUE — the canonical ORDER, binding on signatures made or re-made from 2026-09-02 (her 216th). "Canonical" here names the arrangement of options, NOT a claim that the row projection is the canonical subject (R974).',
  },
  EXECUTION_TEXT: {
    kind: 'execution-text',
    spec: 'sha256 over the misconceptionExecution string, utf8, exactly as stored — the subject of the fifteen ruled by derivation under her 206th',
  },
  DRAFT_ASSESSMENT: {
    kind: 'draft-assessment',
    spec: 'sha256 over JSON.stringify({prompt, tier, options:[{isCorrect,text}]}) — NOT canonical JSON, no stem, no explanation, `text` rather than `content`. What the in-platform admin review surface writes when a reviewer signs (draftAssessmentSubjectHash). THE COMMONEST SHAPE A REVIEWER SIGNS THROUGH IS STILL ONLY THE DEFAULT VALUE OF A FIELD, not the canonical subject (R974)',
  },
} as const;

export type SignatureSubjectName = keyof typeof SIGNATURE_SUBJECTS;

export interface SubjectDerivation {
  /** The named subject, or null when nothing reproduces the stored hash. */
  subject: SignatureSubjectName | null;
  kind: string | null;
  spec: string | null;
  /** How the finding was reached — always a re-derivation, never a label read off the row. */
  derivedBy: 'RE-DERIVED — the stored hash was reproduced under this spec' | 'UNKNOWN — no declared subject reproduces this hash';
}

export const UNKNOWN_SUBJECT: SubjectDerivation = {
  subject: null, kind: null, spec: null,
  derivedBy: 'UNKNOWN — no declared subject reproduces this hash',
};

/**
 * Derive a signature's subject by RE-DERIVATION: the caller supplies the candidate hashes it can
 * compute for this row, and the first that reproduces the stored value names the subject.
 *
 * The caller computes rather than this function, because the candidates need the row, the
 * recorded order and the executions — and a helper that fetched those itself would be a second
 * place where the projections live (R429).
 */
export function deriveSubject(
  storedHash: string,
  candidates: ReadonlyArray<{ subject: SignatureSubjectName; hash: string }>,
): SubjectDerivation {
  const hit = candidates.find((c) => c.hash === storedHash);
  if (!hit) return UNKNOWN_SUBJECT;
  const s = SIGNATURE_SUBJECTS[hit.subject];
  return { subject: hit.subject, kind: s.kind, spec: s.spec, derivedBy: 'RE-DERIVED — the stored hash was reproduced under this spec' };
}
