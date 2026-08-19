/**
 * A REJECTION THAT LIVES ONLY IN A TABLE IS THE RETIREMENT-WITH-NO-READER FAULT AGAIN
 * (Annie's ruling, 2026-08-19 — R269).
 *
 * `en-error-spot-false-positive` is REJECTED with a rejection note, superseded by the
 * rule-over-applied / guessed-a-part split. **Nothing stops it being emitted again.** The status is
 * a fact in a row, and the next person to build an emission has to REMEMBER to pull it by hand —
 * which is the same shape as a retired artefact nobody reads, and the same shape as R86: the row
 * is not the thing, every reader of the row is the thing.
 *
 * **SO THE REFUSAL IS A STATE THE CODE CARRIES, IN THE SHAPE OF AN IMPORT GUARD.** A generator, an
 * importer or a tagger asks `refuseMisconception(id)` and gets a REASON back, not a boolean — a
 * boolean tells the caller to stop and a reason tells them what to do instead, which is the whole
 * difference between a refusal a person can act on and one they route around.
 *
 * **DERIVED FROM STATUS WHERE STATUS EXISTS, DECLARED WHERE IT DOES NOT.** The database is the
 * authority on which entries are ACTIVE, and `inactiveMisconceptions` already screens options at
 * the verdict doors. This adds the half that a status column cannot carry: **the successor.** A
 * caller refused an id needs to know what replaced it, and that is editorial, not a status.
 */

export interface Refusal {
  id: string;
  reason: string;
  /** What to use instead. Empty when the concept was dropped rather than replaced. */
  useInstead: readonly string[];
  ruledBy: string;
}

/**
 * Entries that must never be emitted, tagged or imported again, with what replaced them.
 * An id here is refused REGARDLESS of what its row says — a row can be edited back to ACTIVE by
 * hand, and that edit must not silently reopen a door a reviewer closed.
 */
export const REFUSED_MISCONCEPTIONS: readonly Refusal[] = [
  {
    id: 'en-error-spot-false-positive',
    reason:
      'Superseded by the rule-over-applied / guessed-a-part split: it hid two different children behind one tag, so a hint written for it could only be right about one of them.',
    useInstead: ['en-error-spot-rule-over-applied', 'en-error-spot-guessed-a-part'],
    ruledBy: 'annie, 2026-08-08; refusal state ruled 2026-08-19',
  },
];

const BY_ID = new Map(REFUSED_MISCONCEPTIONS.map((r) => [r.id, r]));

/** Returns the refusal when this id must not be used, or null when it may. */
export function refuseMisconception(id: string | null | undefined): Refusal | null {
  return id ? BY_ID.get(id) ?? null : null;
}

/** Every refused id an option set still carries. Empty is the passing state. */
export function refusedInOptions(
  options: ReadonlyArray<{ misconceptionId?: string | null }>,
): Refusal[] {
  const seen = new Set<string>();
  const out: Refusal[] = [];
  for (const option of options) {
    const refusal = refuseMisconception(option.misconceptionId);
    if (refusal && !seen.has(refusal.id)) { seen.add(refusal.id); out.push(refusal); }
  }
  return out;
}

/** The message a door prints. Names the successor, because a refusal without one is a dead end. */
export function refusalMessage(refusal: Refusal): string {
  return `${refusal.id} is REFUSED and must not be emitted or tagged. ${refusal.reason} `
    + (refusal.useInstead.length > 0
      ? `Use instead: ${refusal.useInstead.join(', ')}.`
      : 'The concept was dropped, not replaced.')
    + ` (${refusal.ruledBy})`;
}
