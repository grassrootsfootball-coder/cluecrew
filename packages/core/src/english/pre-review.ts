/**
 * COWORK'S preReview — AUTHORING METADATA, AND STRUCTURALLY NOT A SIGN-OFF.
 *
 * A drafting agent's assessment of its own work, on 78 items. David's ruling, 2026-08-16: it
 * crosses, on the item, **structurally unreachable from the reviewer path**.
 *
 * THE VOCABULARY ANSWERS THE QUESTION AGAINST ITSELF. Both verdict values terminate in *a human
 * has not looked yet*. `PASS_TO_HUMAN` is a READINESS CLAIM from the opposite end of the process
 * from Annie's ratification — not a lesser sign-off, and it must never be readable as one. Model
 * the two as one thing and an agent's self-assessment looks like a reviewer's sign-off in the
 * store that ships, which is the worst failure available here.
 *
 * Three things the reviewer path has that this does not, none of them incidental:
 *   · NO ACTOR. It names no agent, no version, no instance. The naming path exists to resolve a
 *     placeholder to one individual inside a held-role window; there is nothing here to resolve.
 *   · NO SEPARATION of whose judgement from who recorded it. One party does both, and there is no
 *     field for either. That separation is the working half of the design.
 *   · NO SUBJECT. Cowork's version asserts nothing about WHAT it assessed, so it survives any
 *     later edit to the item. That is the exact failure `subjectHash` was added to prevent, and
 *     carrying it across unfixed would import a known defect — so this side computes one.
 *
 * ENFORCEMENT IS NOT THIS FILE. `pnpm check:review-queries` fails any file that reads the column
 * outside its declared doors, or that mentions it alongside a review-decision symbol. Naming a
 * thing carefully is not a control; the gate is.
 */
import { createHash } from 'node:crypto';

/** The only two values Cowork emits, over all 78 items: 62 and 16 respectively. */
export const PRE_REVIEW_VERDICTS = ['PASS_TO_HUMAN', 'FIXED_THEN_PASS'] as const;
export type PreReviewVerdict = (typeof PRE_REVIEW_VERDICTS)[number];

/**
 * RUBRIC KEYS THIS REPO CAN RE-DERIVE, and the gate that does it.
 *
 * Stored on nobody's authority is fine; MISTAKEN LATER FOR FINDINGS is not (David, 2026-08-16).
 * A stored `readingAge: 7.6` reads exactly like a measurement, and anything surfacing it must say
 * that the number is a claim by the drafting agent and that this repo computes its own.
 */
export const REDERIVABLE_RUBRIC_KEYS: Readonly<Record<string, string>> = {
  readingAge: 'the reading-age lint (≤16-word cap, sentence-ending rule)',
  banList: 'pnpm scan:vocab',
  keyVerified: 'checkItemChildFacing and the key/option gates',
};

/**
 * The rubric keys that are a JUDGEMENT rather than a computation. No gate re-derives these, so
 * they are the drafting agent's opinion and nothing more — which is not a reason to drop them,
 * only a reason never to read them as verified.
 */
export const JUDGEMENT_RUBRIC_KEYS = ['distractorsExecute', 'tierFit', 'fairness'] as const;

export interface PreReviewRubric {
  keyVerified?: boolean;
  distractorsExecute?: boolean;
  readingAge?: number;
  tierFit?: string;
  fairness?: string;
  banList?: string;
}

export interface AuthoringPreReview {
  verdict: PreReviewVerdict;
  rubric: PreReviewRubric;
  notes?: string;
}

/**
 * WHAT THE PRE-REVIEW ASSESSED, fingerprinted — the field Cowork's version does not have.
 *
 * The rubric covers the key, the distractors, the reading age, the tier fit, the fairness and the
 * ban list: that is the whole child-facing item plus its tier. So the subject is the stem prompt,
 * every option's text IN STORED ORDER with its key flag, and the tier. Change any of them and the
 * assessment describes an item that no longer exists, and `pnpm check:pre-review-subject` says so
 * instead of leaving the claim attached and silent.
 *
 * Order-insensitive on object keys, because Postgres JSONB does not preserve them.
 */
export function preReviewSubjectHash(item: {
  prompt: string | null;
  tier: number;
  options: Array<{ text: string; isCorrect: boolean }>;
}): string {
  const subject = {
    prompt: item.prompt,
    tier: item.tier,
    options: item.options.map((o) => ({ isCorrect: o.isCorrect, text: o.text })),
  };
  return createHash('sha256').update(JSON.stringify(subject)).digest('hex');
}

/** A parsed pre-review, or null. Never throws — an unreadable claim is an absent claim. */
export function readPreReview(v: unknown): AuthoringPreReview | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  if (!PRE_REVIEW_VERDICTS.includes(o.verdict as PreReviewVerdict)) return null;
  return {
    verdict: o.verdict as PreReviewVerdict,
    rubric: (o.rubric ?? {}) as PreReviewRubric,
    ...(typeof o.notes === 'string' ? { notes: o.notes } : {}),
  };
}

/**
 * How to render it wherever it is surfaced. The markings travel WITH the value: a rubric key
 * printed bare is the thing the ruling forbids, and a constant nobody calls does not prevent it.
 */
export function describePreReview(p: AuthoringPreReview): string[] {
  const out = [
    `verdict ${p.verdict} — an AUTHORING readiness claim. It means a human has NOT reviewed this item.`,
  ];
  for (const [k, v] of Object.entries(p.rubric)) {
    const gate = REDERIVABLE_RUBRIC_KEYS[k];
    out.push(
      gate
        ? `  ${k}: ${JSON.stringify(v)}  [CLAIMED by the drafting agent; this repo re-derives it with ${gate}]`
        : `  ${k}: ${JSON.stringify(v)}  [the drafting agent's judgement; no gate re-derives it]`,
    );
  }
  return out;
}
