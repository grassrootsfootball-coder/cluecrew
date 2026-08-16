/**
 * WHAT REFUSES A VERDICT — the conditions the review door checks, in one place both the door and
 * any checker can call.
 *
 * These lived as private functions inside `apps/web/lib/actions/admin-items.ts`. A district-wide
 * "how many items would refuse a verdict today" cannot be answered without them, and answering it
 * by REIMPLEMENTING the conditions is precisely the fault R41 names: a re-derivation instead of the
 * family's own code, reported as if it were a measurement of the family. M-column's recompute did
 * that and manufactured 69 disagreements against a signed sheet.
 *
 * So the door and the checker call the SAME functions, and the checker names them when it runs.
 *
 * SEVEN ROUTES reach a refusal at `markReviewedAction`, which is the FIRST verdict — everything
 * downstream (SIGNED, LIVE) is gated behind it, so this is the set that matters for "can she rule
 * on this item at all":
 *
 *   unanswerable            `answerFlaggedAt` set — the item's own rule does not produce its key.
 *   no-correct-option       no option is marked correct.
 *   missing-misconceptions  a distractor carries no diagnosis.
 *   own-item                the reviewer authored it. DEPENDS ON WHO IS REVIEWING, unlike the rest.
 *   similarity-review       flagged by ADDENDUM-E §3 and not yet cleared with a note.
 *   unapproved-misconception  a tag is not ACTIVE. ONE ROUTE IN CODE, TWO CAUSES IN THE STORE —
 *                           PROPOSED (never approved) and RETIRED (approved, then withdrawn) are
 *                           indistinguishable here and are not the same problem for a reviewer.
 *                           A checker that reports them as one number hides which half is hers.
 *   child-facing-copy       `checkItemChildFacing` raises a blocking fault.
 *
 * The order below is the order the door applies them, and it SHORT-CIRCUITS: an item failing three
 * routes reports the first. A survey wanting all of an item's faults must call each condition
 * separately rather than reading this function's single answer.
 */

/**
 * The four structural blockers, exactly as the door applies them, first match wins.
 *
 * `reviewer` is the acting reviewer's actor string; pass `null` to evaluate every route EXCEPT
 * `own-item`, which cannot be decided without knowing who is asking.
 */
export function publishBlockers(
  options: Array<{ isCorrect: boolean; misconceptionId: string | null }>,
  reviewer: string | null,
  authoredBy: string,
  /**
   * THE ANSWERABILITY FLAG (David's ruling, 2026-08-02). Set by `pnpm check:word-puzzles` when an
   * item's own stated rule does not produce its key — no valid answer at all, or a different one.
   *
   * There is no clearing path and that is deliberate. A similarity flag is a judgement a reviewer
   * can make: coincidence or derivation. This is not a judgement. The child cannot answer the
   * question correctly, so a signature saying otherwise would only record that someone did not
   * check. The flag lifts when the item is fixed and the gate stops setting it.
   *
   * Checked here rather than at each call site because all three routes to REVIEWED already run
   * this, and a fourth route added later gets it for free.
   */
  answerFlaggedAt?: Date | null,
): string | null {
  if (answerFlaggedAt) return 'unanswerable';
  if (!options.some((option) => option.isCorrect)) return 'no-correct-option';
  if (options.some((option) => !option.isCorrect && !option.misconceptionId)) {
    return 'missing-misconceptions';
  }
  if (reviewer && reviewer === authoredBy) return 'own-item';
  return null;
}

/**
 * The tag blocker. The door asks the database for a COUNT of ACTIVE rows among the ids and refuses
 * when it falls short; this takes the same decision from a status lookup so a caller screening a
 * whole district reads the library once instead of once per item.
 *
 * Returns the ids that are NOT active — empty means no refusal. The CAUSE (PROPOSED, RETIRED, or
 * a tag with no row at all) is the caller's to report, and reporting it is the point: the door
 * collapses all three into one error string and a reviewer needs to know which she is looking at.
 */
export function inactiveMisconceptions(
  options: Array<{ misconceptionId?: string | null }>,
  statusById: ReadonlyMap<string, string>,
): string[] {
  const ids = [...new Set(options.map((o) => o.misconceptionId).filter(Boolean))] as string[];
  return ids.filter((id) => statusById.get(id) !== 'ACTIVE');
}
