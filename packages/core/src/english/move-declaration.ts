/**
 * THE MOVE DECLARATION — a structural surface for what a tag does.
 *
 * Cowork's proposal, 2026-08-16, built as the library half only. `ENG-001-WIW-14` B carried
 * `en-attribute-transfer` while its own note described the quality of a COMPARISON being carried to
 * the subject. Every content word in that note is ordinary; nothing is vague or missing. **It
 * disagrees with its tag STRUCTURALLY — about what moves, from what, to what — and two strings can
 * share their whole vocabulary and still contradict each other on that.** A similarity score cannot
 * reach it: the one that surfaced this flagged 298 options to find it.
 *
 *   `en-attribute-transfer`         → quality / character / character
 *   `en-comparison-vehicle-misread` → quality / vehicle / subject
 *
 * Indistinguishable in prose, one glance apart as triples. That is the whole proposal.
 *
 * THREE STATES, NOT TWO. `null` on the column means NOT YET DECLARED; a `not-displacement` record
 * means someone looked and it is not a displacement, with the reason. Collapsing those two is R98 —
 * unknown recorded as absent — in a new field, and the second is the more common outcome so it
 * cannot be the silent one.
 *
 * THE LISTS ARE CLOSED, AND CLOSING THEM IS THE POINT. A free-text slot is a sentence with extra
 * steps and drifts exactly as the descriptions did. A role the list lacks is added DELIBERATELY,
 * once, with a reason recorded — never written in as a phrase. **A list that grows by a third while
 * being filled is a list that is really free text**, and that is a finding about the shape rather
 * than a detail of the filling.
 */

/** WHAT IS DISPLACED. Cowork's nine, plus additions recorded in `MOVE_VOCABULARY_ADDITIONS`. */
export const MOVE_WHAT = [
  'quality', 'event', 'motive', 'sense', 'referent', 'relation', 'voice', 'time', 'purpose',
] as const;

/** THE ROLES IT MOVES BETWEEN. Cowork's eleven, plus recorded additions. */
export const MOVE_ROLE = [
  'character', 'window', 'whole-text', 'vehicle', 'subject', 'conjunct',
  'speaker', 'narrator', 'reader', 'writer', 'question',
] as const;

export type MoveWhat = (typeof MOVE_WHAT)[number];
export type MoveRole = (typeof MOVE_ROLE)[number];

export type MoveDeclaration =
  | { kind: 'displacement'; what: MoveWhat; from: MoveRole; to: MoveRole }
  /** Someone looked and the error is not a displacement. The reason is the fact worth holding. */
  | { kind: 'not-displacement'; reason: string };

/**
 * EVERY ADDITION TO THE CLOSED LISTS, WITH WHAT FORCED IT.
 *
 * Empty is the good outcome. Each entry is a case the original vocabulary could not express, named
 * by the entry that forced it — so the cost of the shape is visible rather than absorbed.
 */
export const MOVE_VOCABULARY_ADDITIONS: ReadonlyArray<{
  slot: 'what' | 'role'; value: string; forcedBy: string; reason: string;
}> = [];

export function isMoveWhat(v: string): v is MoveWhat {
  return (MOVE_WHAT as readonly string[]).includes(v);
}
export function isMoveRole(v: string): v is MoveRole {
  return (MOVE_ROLE as readonly string[]).includes(v);
}

/** Validate a stored declaration. Returns the faults; empty means well-formed. */
export function checkMoveDeclaration(id: string, value: unknown): string[] {
  if (value === null || value === undefined) return [];
  const m = value as Partial<MoveDeclaration> & Record<string, unknown>;
  if (m.kind === 'not-displacement') {
    return typeof m.reason === 'string' && m.reason.trim()
      ? []
      : [`${id}: not-displacement with no reason — "someone looked and it is not one" is the fact, and it needs saying`];
  }
  if (m.kind !== 'displacement') return [`${id}: kind must be 'displacement' or 'not-displacement', found ${JSON.stringify(m.kind)}`];
  const faults: string[] = [];
  if (typeof m.what !== 'string' || !isMoveWhat(m.what)) faults.push(`${id}: what=${JSON.stringify(m.what)} is not in the closed list`);
  if (typeof m.from !== 'string' || !isMoveRole(m.from)) faults.push(`${id}: from=${JSON.stringify(m.from)} is not in the closed list`);
  if (typeof m.to !== 'string' || !isMoveRole(m.to)) faults.push(`${id}: to=${JSON.stringify(m.to)} is not in the closed list`);
  return faults;
}

/** The triple as a comparable key. Two entries sharing one are duplicates or the vocabulary is coarse. */
export function moveKey(m: MoveDeclaration): string | null {
  return m.kind === 'displacement' ? `${m.what}/${m.from}/${m.to}` : null;
}
