/**
 * CONDITIONAL CONTENT-FLAG RECOMMENDATIONS (Annie's ruling, 2026-08-21 — R368).
 *
 * A flag saying *"keep"* is a verdict. A flag saying *"keep, AND do not let any question ask pupils
 * to state the reason"* is a verdict PLUS a mitigation — and **the mitigation sits exactly where a
 * reader stops reading**. Nine of 61 flags carried one, and not one of them was ever met, because
 * the obligation lived inside the sentence that stated the verdict and nothing read sentences.
 *
 * FOUR DECISIONS, three proposed and agreed, one hers:
 *
 * 1. **`KEEP_IF` is its own verdict, never `KEEP` with a note attached.** A separate word is the
 *    whole mechanism; a boolean beside `KEEP` would be skippable in exactly the way prose is.
 * 2. **`UNMET` is the written default.** *"It is the empty-array problem in a new field, and an
 *    unmet condition and an unexamined one must not share a representation."*
 * 3. **`WAIVED` requires a reason.** A waiver is a legitimate outcome; a waiver without one is a
 *    silent keep with extra steps.
 * 4. **THE CONDITION NAMES WHO CAN MEET IT — hers, and it is the one that makes the rest work.**
 *    *"A teacher note points out that the Mole is being cheeky"* has no owner, and **an obligation
 *    with no owner is UNMET by construction forever**. `owner` is required and a condition proposed
 *    without one is REFUSED AT AUTHORING — otherwise the backlog is guaranteed rather than possible.
 *
 * **THE TWO-VERDICT SPLIT, which dissolved the expensive question rather than compromising on it.**
 * The proposed `kind` enum classified by where the obligation LANDS. Useful for routing; it does not
 * answer the question that matters, **which is whether the passage is acceptable without the
 * condition**. So:
 *
 *   KEEP_IF        the condition IMPROVES a passage that is already acceptable.
 *   RETIRE_UNLESS  the passage is NOT acceptable without it.
 *
 *   Serving blocks on RETIRE_UNLESS and NOT on KEEP_IF — the honest version of the
 *   make-conditions-load-bearing position, applied only where they are load-bearing.
 *   Publishing blocks on BOTH, so the population stops growing.
 *
 * **`stream-a-03-wind-in-willows` is ruled KEEP_IF and its 22 LIVE items keep serving.** *"A child
 * reading the Mole being rude and jeering does not need a note to survive it, and Grahame's own
 * narration already calls him impatient and contemptuous."* **The expensive case was resolved by
 * ruling on the passage rather than by choosing a policy compromise, which is the right order.**
 *
 * **HER RIDER ON THE EXISTING NINE: each UNMET condition takes a date.** *"A backlog with no date is
 * the thing everyone learns to ignore, and on that date it is met, waived with a reason, or the
 * verdict is reopened."*
 */

export type FlagVerdict = 'KEEP' | 'KEEP_IF' | 'RETIRE_UNLESS' | 'RETIRE';

export type ConditionState = 'UNMET' | 'MET' | 'WAIVED';

/** Where the obligation lands. Routing only — it never decides whether serving blocks. */
export type ConditionKind = 'AUTHORING_CONSTRAINT' | 'ACCOMPANYING_MATERIAL' | 'MARK_SCHEME';

export interface FlagCondition {
  /** What must be true. Stated as an obligation, not as a hope. */
  obligation: string;
  kind: ConditionKind;
  /** REQUIRED. An obligation with no owner is UNMET by construction forever (Annie, R368). */
  owner: string;
  /**
   * REQUIRED, and hers. On this date it is met, waived with a reason, or the VERDICT REOPENS.
   * ISO `YYYY-MM-DD`. A backlog with no date is the thing everyone learns to ignore.
   */
  reviewBy: string;
  state: ConditionState;
  /** What satisfies it — an id, a file, a field. Null while UNMET. */
  metBy: string | null;
  /** Who moved it out of UNMET, and when. Null while UNMET. */
  ruledBy: string | null;
  /** REQUIRED when state is WAIVED. A waiver with no reason is a silent keep with extra steps. */
  waivedWhy: string | null;
}

export interface ConditionalFlag {
  element: string;
  verdict: FlagVerdict;
  /** The justification, with no obligation hidden inside it. */
  why: string;
  /** Present when and only when the verdict is conditional. */
  condition?: FlagCondition;
}

const CONDITIONAL: ReadonlySet<FlagVerdict> = new Set<FlagVerdict>(['KEEP_IF', 'RETIRE_UNLESS']);

export const isConditional = (verdict: FlagVerdict): boolean => CONDITIONAL.has(verdict);

/**
 * **REFUSED AT AUTHORING** — the four decisions enforced at the point a flag is written, which is
 * the only point where the person who knows the answer is present.
 *
 * Returns the reasons a flag cannot be authored. Empty means it may be.
 */
export function refuseFlagAtAuthoring(flag: ConditionalFlag): string[] {
  const refusals: string[] = [];
  const c = flag.condition;

  if (isConditional(flag.verdict)) {
    if (!c) {
      refusals.push(
        `verdict is ${flag.verdict} but no condition is present. A conditional verdict without a `
        + 'condition is a KEEP that has been given a longer name.',
      );
      return refusals;
    }
    if (!c.owner?.trim()) {
      refusals.push(
        'condition has no owner. An obligation with nobody to meet it is UNMET by construction '
        + 'forever, so the backlog is guaranteed rather than possible (Annie, R368).',
      );
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(c.reviewBy ?? '')) {
      refusals.push(
        'condition has no reviewBy date (YYYY-MM-DD). On that date it is met, waived with a reason, '
        + 'or the verdict reopens. A backlog with no date is the thing everyone learns to ignore.',
      );
    }
    if (!c.obligation?.trim()) refusals.push('condition has no obligation stated.');
  } else if (c) {
    refusals.push(
      `verdict is ${flag.verdict} but a condition is attached. An unconditional verdict carrying an `
      + 'obligation is the prose fault in a field: the reader takes the verdict and never reaches it.',
    );
  }

  if (c?.state === 'WAIVED' && !c.waivedWhy?.trim()) {
    refusals.push('state is WAIVED with no waivedWhy. A waiver without a reason is a silent keep with extra steps.');
  }
  if (c?.state === 'MET' && !c.metBy?.trim()) {
    refusals.push('state is MET with no metBy. What satisfied it must be nameable, or MET is an assertion.');
  }
  if (c && c.state !== 'UNMET' && !c.ruledBy?.trim()) {
    refusals.push(`state is ${c.state} with no ruledBy. Only a person moves a condition out of UNMET.`);
  }

  return refusals;
}

/** A condition authored today, before anyone has ruled on it. UNMET is WRITTEN, never inferred. */
export function newCondition(
  obligation: string,
  kind: ConditionKind,
  owner: string,
  reviewBy: string,
): FlagCondition {
  return { obligation, kind, owner, reviewBy, state: 'UNMET', metBy: null, ruledBy: null, waivedWhy: null };
}

/**
 * **SERVING BLOCKS ON `RETIRE_UNLESS` ONLY.** The passage is not acceptable without the condition,
 * so an unmet one means a child is reading something a reviewer did not clear.
 *
 * `KEEP_IF` does NOT block serving: the condition improves a passage that is already acceptable, and
 * un-serving it would punish a child for an obligation an adult has not discharged.
 */
export function blocksServing(flag: ConditionalFlag): boolean {
  return flag.verdict === 'RETIRE_UNLESS' && flag.condition?.state === 'UNMET';
}

/**
 * **PUBLISHING BLOCKS ON BOTH.** Nothing new ships carrying an unmet condition of either kind, so
 * the population stops growing while the existing backlog drains by decision rather than by outage.
 */
export function blocksPublishing(flag: ConditionalFlag): boolean {
  return isConditional(flag.verdict) && flag.condition?.state === 'UNMET';
}

/** Past its `reviewBy` and still UNMET: the verdict reopens. Not a warning — a state change. */
export function verdictReopens(flag: ConditionalFlag, today: string): boolean {
  const c = flag.condition;
  return Boolean(c && c.state === 'UNMET' && c.reviewBy < today);
}
