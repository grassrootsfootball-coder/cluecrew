/**
 * SERVING HOLDS — an item the reviewer has stopped at the DOOR, not demoted in the record.
 *
 * **THE HOLD LIVES AT THE SERVING PATH, NEVER AS A STATUS CHANGE** (Annie's ruling, 2026-08-19 —
 * R208). `status: LIVE` records that a reviewer signed the item off, and that fact has not changed;
 * what changed is that it must not reach a child until a condition she named is met. Demoting the
 * status would erase a true fact about review to express a fact about serving — the two-senses
 * conflation (R184) committed in the write direction.
 *
 * A held item stays PUBLISHED and stops being SERVABLE. Every door that selects items consults this
 * list, and `check:serving-path`'s census reads it too, so the SERVABLE column reports what the
 * doors actually do rather than what the columns alone would predict.
 *
 * **EVERY HOLD NAMES ITS LIFT CONDITION** — a hold with no address is a PENDING with no `awaiting`
 * (R207), and this list refuses the shape by construction: `liftedBy` is required.
 */

export interface ServingHold {
  itemId: string;
  heldBy: string;
  on: string;
  reason: string;
  /** The condition that returns the item to serving. Named, never "until further notice". */
  liftedBy: string;
}

/**
 * LIFTED HOLDS stay recorded here — a hold that vanishes is a silent lift, and the silent rename
 * of 16 August is why nothing in this file is ever silently removed.
 *
 * ENG-028-PR-06 — held 2026-08-19 (R208), LIFTED 2026-08-19 by Annie's fourth return
 * (`annie-eng003-fourth-return.md`, sha256 3724df8f2c6c1678…, pinned in content/evidence). Her
 * words, verbatim, which were the lift condition: "Receipt is confirmed by this document, which
 * was the release condition. PR-06 is released." Defect 24 dissolved end to end.
 */
export const LIFTED_HOLDS: readonly (ServingHold & { liftedOn: string; liftedByArtefact: string })[] = [
  {
    itemId: 'ENG-028-PR-06',
    heldBy: 'annie (relayed by David, 2026-08-19)',
    on: '2026-08-19',
    reason: 'Two-span item against a 5-7 line viewport (R185), reachable by free children.',
    liftedBy: 'Annie\'s fourth return — receipt of the fifth still confirmed in writing.',
    liftedOn: '2026-08-19',
    liftedByArtefact: 'annie-eng003-fourth-return.md sha256 3724df8f2c6c1678…',
  },
];

export const SERVING_HOLDS: readonly ServingHold[] = [
  // Empty since 2026-08-19: the one hold (ENG-028-PR-06) was LIFTED by her fourth return and its
  // full record moved to LIFTED_HOLDS above. An empty list here is a fact, not a gap.
];

const HELD = new Set(SERVING_HOLDS.map((h) => h.itemId));

export function isHeldFromServing(itemId: string): boolean {
  return HELD.has(itemId);
}
