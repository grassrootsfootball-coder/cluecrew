/**
 * THE RETURN DOCUMENT — a ruling becomes a FILE at the moment it is made.
 *
 * Annie raised the attribution gap in August and restated it on 2026-08-16, after two days spent
 * trying to evidence six approvals she had genuinely given:
 *
 *   "The approvals are real. They were given in the review conversation, item by item, with
 *    reasons. What does not exist is an artefact — the record of them is the exchange and not a
 *    file… That will keep happening until rulings have a channel."
 *
 * EVERY DOOR IN THIS REPO WRITES STATE AND LEAVES THE REASONING IN THE CONVERSATION. `status` moves
 * to ACTIVE, `approvedBy` gets a name, an AttributionEvent records that a thing happened — and the
 * WHY, which is the only part a future reader cannot reconstruct, is nowhere. That is the whole gap,
 * and it is a property of the code rather than of anyone's diligence.
 *
 * WHAT THIS IS NOT. It is not a general provenance system, not a workflow, and not a replacement for
 * the conversation. It is one shape — the one she has now used twice and which worked both times —
 * rendered at the moment of the verdict, hashed, and pinned to the event.
 *
 * WHY THE SHAPE MATTERS. Her `annie-eng028-return.md` and `annie-approval-batch-return.md` share a
 * structure that survived two transfers between agents without drift:
 *   · an AUTHORED FIELD is marked as authored, and is read from the file rather than retyped;
 *   · the verdict is a ruling per subject, not a status flag;
 *   · the reasoning travels with the verdict rather than in a covering note.
 * Reproducing that shape is the point. `en-vocab-dominant-sense` is the only hint that survived the
 * drift which caught everything else, and it survived because it arrived in this shape.
 *
 * THE HASH IS COMPUTED AT WRITE TIME, OVER THE BYTES ACTUALLY WRITTEN (R88: an artefact's stamp must
 * come from the same projection it delivers). Rendering twice and hashing the second render is the
 * fault R88 names; the writer hashes the string it passes to the filesystem and nothing else.
 */

export interface ReviewerRuling {
  /** The thing ruled on — an item id, a misconception id, a template key. */
  subject: string;
  /** Her verdict, in the vocabulary of the door that asked. */
  verdict: string;
  /**
   * HER REASONING, AN AUTHORED FIELD. Rendered verbatim under an explicit heading so that a later
   * reader — or a transfer to another agent — can read it from the file rather than from an account
   * of it. Empty is permitted and is rendered as an explicit absence, never omitted: a ruling with
   * no reason recorded is a fact about the ruling.
   */
  reasoning?: string;
  /** What the value was before, when the ruling changed one. Optional. */
  changedFrom?: string;
  /** What the value is now, when the ruling set one. Optional. */
  changedTo?: string;
}

export interface ReviewerReturnInput {
  /** Her display name, resolved through the naming path — never a role placeholder (R65/R94). */
  reviewerName: string;
  /** The Reviewer row id her signature resolves to. */
  reviewerId: string;
  /** Who typed it in. NEVER merged with the reviewer, even when they are the same person. */
  recordedBy: string;
  /** What this return covers, as a reader would name it: "ENG-001", "approval batch". */
  scope: string;
  /** ISO timestamp. Passed in, never read from the clock here, so the renderer stays pure. */
  at: string;
  rulings: ReviewerRuling[];
  /** Anything she said about the batch as a whole. Authored field, same treatment. */
  standingNote?: string;
}

/** Marks an authored field so a later reader knows to read it, not to paraphrase it. */
const AUTHORED = '(authored field — read from this file, do not retype)';

/**
 * Render her return document. PURE: no clock, no filesystem, no database. The caller supplies `at`
 * and writes the bytes, which is what lets this be tested and what keeps the hash honest.
 */
export function renderReviewerReturn(input: ReviewerReturnInput): string {
  const L: string[] = [];
  L.push(`# ${input.scope} — reviewer return`);
  L.push(`**Reviewer: ${input.reviewerName} (${input.reviewerId}). ${input.at}.**`);
  L.push(`**Recorded by: ${input.recordedBy}.** Whose judgement and who typed it are separate and stay separate.`);
  L.push('');
  L.push('*Written by the review door at the moment the verdict was given. The reasoning below is'
    + ' hers, recorded as she gave it rather than reconstructed afterwards.*');
  L.push('');
  L.push('---');
  L.push('');

  if (input.rulings.length === 0) {
    // AN EMPTY RETURN IS A CONTRADICTION IN TERMS and is rendered as one rather than as a blank
    // document that reads like a completed review (R60: a zero has to be loud).
    L.push('## NO RULINGS RECORDED');
    L.push('');
    L.push('**This document should not exist.** A return is written when a verdict is given, and no'
      + ' verdict reached it. Treat this as a fault in the door, not as a review that found nothing.');
    L.push('');
    return `${L.join('\n')}\n`;
  }

  for (const r of input.rulings) {
    L.push(`## \`${r.subject}\``);
    L.push('');
    L.push(`**Verdict:** ${r.verdict}`);
    if (r.changedFrom !== undefined || r.changedTo !== undefined) {
      L.push('');
      L.push(`**Changed:** ${r.changedFrom ?? '(nothing recorded)'} → ${r.changedTo ?? '(nothing recorded)'}`);
    }
    L.push('');
    L.push(`### reasoning ${AUTHORED}`);
    L.push('');
    // Absence is rendered, never elided. "No reason given" and "reason not asked for" are different
    // facts and neither is an empty string.
    L.push(r.reasoning?.trim()
      ? r.reasoning.trim()
      : '*No reasoning recorded with this verdict. The door accepted it without one.*');
    L.push('');
    L.push('---');
    L.push('');
  }

  if (input.standingNote?.trim()) {
    L.push(`## Standing note ${AUTHORED}`);
    L.push('');
    L.push(input.standingNote.trim());
    L.push('');
    L.push('---');
    L.push('');
  }

  L.push(`*Signed as reviewer by ${input.reviewerName} (${input.reviewerId}), recorded by`
    + ` ${input.recordedBy}, ${input.at}. ${input.rulings.length} ruling(s).*`);
  return `${L.join('\n')}\n`;
}

/** The filename a return takes. Stable and sortable; the hash is appended by the writer. */
export function reviewerReturnBasename(scope: string, at: string): string {
  const slug = scope.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  return `return-${slug}-${at.slice(0, 10)}`;
}
