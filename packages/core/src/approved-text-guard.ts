/**
 * APPROVED TEXT IS NEVER SHORTENED TO FIT A CAP — it REFUSES and REPORTS (David's ruling,
 * 2026-08-19, per Cowork's specification — R213).
 *
 * **THE TRIM WAS NEVER A LINE OF CODE. IT WAS A LOOP**, and that is why two stores looked for a
 * truncating function and neither found one. `export:hints-to-reword` selects every ACTIVE hint
 * that fails the 16-word child-facing cap and hands it out to be reworded — its own copy says
 * *"These are hints you approved on the written review"* — the rewording happens off-store, and a
 * shorter value comes back through an importer that accepts it. Nomination, rewrite, import: the
 * cap did the choosing, a human or agent did the cutting, and no single step looked like a trim.
 *
 * **SO THE DISABLE GOES ON THE WRITE, NOT ON THE THRESHOLD.** Raising the limit or exempting one
 * batch leaves the mechanism intact and only moves the next victim. On any text carrying an
 * APPROVAL MARKER, a write that SHORTENS refuses and reports the over-length instead.
 *
 * WHAT COUNTS AS AN APPROVAL MARKER: `approvedBy`, or `textProvenance.hintAuthoredBy`,
 * `.hintAuthority`, `.approvedByPerson`. Any one of them means a person's judgement is attached to
 * these exact words, and R203's boundary applies — the words are the value, and a shorter copy of
 * them is a different value wearing the same approval.
 */

export interface ApprovalMarkers {
  approvedBy?: unknown;
  textProvenance?: unknown;
}

export function carriesApprovalMarker(row: ApprovalMarkers): boolean {
  if (row.approvedBy) return true;
  const tp = row.textProvenance as Record<string, unknown> | null | undefined;
  if (!tp || typeof tp !== 'object') return false;
  return Boolean(tp.hintAuthoredBy) || Boolean(tp.hintAuthority) || Boolean(tp.approvedByPerson);
}

const words = (s: string): number => s.trim().split(/\s+/).filter(Boolean).length;

export interface TrimRefusal {
  id: string;
  field: string;
  beforeWords: number;
  afterWords: number;
  lost: number;
  reason: string;
}

/**
 * Returns a refusal when the write would SHORTEN approved text; null when the write may proceed.
 *
 * **LENGTHENING AND REWORDING AT EQUAL LENGTH ARE NOT REFUSED.** The fault is words DISAPPEARING
 * from text a person approved; a redraft she asked for is the reason this path exists at all.
 */
/**
 * THE ONE THING THIS GUARD CANNOT SEE, MADE VISIBLE INSTEAD OF ASSUMED (2026-08-19 — R257).
 *
 * The refusal message has always named its own exception: *"if this text must change, it changes by
 * THE APPROVER'S OWN REDRAFT, recorded as her act"*. **There was no way to say that.** So when
 * Annie's eleven amended hints arrived — her authored strings, verified against her own return by
 * hash — the guard refused one of them, because her redraft is a word shorter than the text it
 * replaces and **an approver's shorter redraft and a machine's fit-to-cap trim are the same shape.**
 *
 * The distinction is not in the text. It is in WHO AUTHORED THE NEW STRING, which only the caller
 * knows. So the caller may declare it — and the declaration is deliberately expensive:
 *
 *   · it must name the AUTHORITY: the reviewer's document and its hash, not a boolean;
 *   · it is checked for shape here, so `approverRedraft: true` alone will not do it;
 *   · a caller that omits it gets the refusal, which is the safe default and the common case.
 *
 * This is the `emergencyOverridePilotFile` pattern: an exception a human must type on purpose,
 * carrying its reason into the record, rather than a flag that quietly widens the gate.
 */
export interface ApproverRedraft {
  /** The reviewer identity this store records — never a bare display name (R203). */
  approvedBy: string;
  /** The document the redraft comes from, and its digest. Prose alone is not authority. */
  authority: string;
}

/** A declaration is only a declaration if it carries something checkable. */
export function isApproverRedraft(value: unknown): value is ApproverRedraft {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<ApproverRedraft>;
  return typeof v.approvedBy === 'string' && v.approvedBy.trim() !== ''
    && typeof v.authority === 'string' && /sha256\s+[0-9a-f]{32,}/i.test(v.authority);
}

export function refuseApprovedTrim(input: {
  id: string;
  field?: string;
  before: string | null | undefined;
  after: string;
  row: ApprovalMarkers;
  /** Declared ONLY when the new string is the approver's own, with her document and its hash. */
  approverRedraft?: unknown;
}): TrimRefusal | null {
  const { id, before, after, row } = input;
  const field = input.field ?? 'childHint';
  if (!before || !carriesApprovalMarker(row)) return null;
  if (isApproverRedraft(input.approverRedraft)) return null;
  const b = words(before);
  const a = words(after);
  if (a >= b) return null;
  return {
    id, field, beforeWords: b, afterWords: a, lost: b - a,
    reason:
      `REFUSED: ${b - a} word(s) would be cut from APPROVED text. The cap reports over-length; it `
      + 'never shortens. If this text must change, it changes by the approver\'s own redraft, '
      + 'recorded as her act — not by a fit-to-cap rewrite (R213).',
  };
}

/** Throwing form, for a one-shot ruling applier that should abort rather than continue. */
export function assertNoApprovedTrim(input: Parameters<typeof refuseApprovedTrim>[0]): void {
  const refusal = refuseApprovedTrim(input);
  if (refusal) throw new Error(`${refusal.id}.${refusal.field}: ${refusal.reason}`);
}
