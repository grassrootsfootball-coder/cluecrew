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
  // THE TWENTY-FIVE LIVE SEEDS (2026-08-24 — R703). The estate walk ordered on her 146th found
  // 27 more author-marked never-shippable rows beyond the thirteen: seed-vr09-* and seed-vr11-*,
  // TWENTY-FIVE OF THEM LIVE AND SERVING through case-vr-09 and case-vr-11. The hold stops them
  // at the door TODAY without a status ruling (R208: LIVE records review and that fact has not
  // changed); the status move to NEVER_SHIPPABLE is David's ruling on the membership.
  {
    itemId: 'seed-vr09-01',
    heldBy: "David's estate-walk instruction, executed 2026-08-24 (the lead outranks the audit)",
    on: '2026-08-24',
    reason: 'Author-marked "synthetic seed item — never shippable" — LIVE and serving through its case while carrying its author\'s own never-ship marker. Found by the estate walk her 146th ordered (R703).',
    liftedBy: "David's ruling on the estate-walk membership: NEVER_SHIPPABLE (the ruled state) or an explicit release.",
  },
  {
    itemId: 'seed-vr09-02',
    heldBy: "David's estate-walk instruction, executed 2026-08-24 (the lead outranks the audit)",
    on: '2026-08-24',
    reason: 'Author-marked "synthetic seed item — never shippable" — LIVE and serving through its case while carrying its author\'s own never-ship marker. Found by the estate walk her 146th ordered (R703).',
    liftedBy: "David's ruling on the estate-walk membership: NEVER_SHIPPABLE (the ruled state) or an explicit release.",
  },
  {
    itemId: 'seed-vr09-03',
    heldBy: "David's estate-walk instruction, executed 2026-08-24 (the lead outranks the audit)",
    on: '2026-08-24',
    reason: 'Author-marked "synthetic seed item — never shippable" — LIVE and serving through its case while carrying its author\'s own never-ship marker. Found by the estate walk her 146th ordered (R703).',
    liftedBy: "David's ruling on the estate-walk membership: NEVER_SHIPPABLE (the ruled state) or an explicit release.",
  },
  {
    itemId: 'seed-vr09-04',
    heldBy: "David's estate-walk instruction, executed 2026-08-24 (the lead outranks the audit)",
    on: '2026-08-24',
    reason: 'Author-marked "synthetic seed item — never shippable" — LIVE and serving through its case while carrying its author\'s own never-ship marker. Found by the estate walk her 146th ordered (R703).',
    liftedBy: "David's ruling on the estate-walk membership: NEVER_SHIPPABLE (the ruled state) or an explicit release.",
  },
  {
    itemId: 'seed-vr09-05',
    heldBy: "David's estate-walk instruction, executed 2026-08-24 (the lead outranks the audit)",
    on: '2026-08-24',
    reason: 'Author-marked "synthetic seed item — never shippable" — LIVE and serving through its case while carrying its author\'s own never-ship marker. Found by the estate walk her 146th ordered (R703).',
    liftedBy: "David's ruling on the estate-walk membership: NEVER_SHIPPABLE (the ruled state) or an explicit release.",
  },
  {
    itemId: 'seed-vr09-06',
    heldBy: "David's estate-walk instruction, executed 2026-08-24 (the lead outranks the audit)",
    on: '2026-08-24',
    reason: 'Author-marked "synthetic seed item — never shippable" — LIVE and serving through its case while carrying its author\'s own never-ship marker. Found by the estate walk her 146th ordered (R703).',
    liftedBy: "David's ruling on the estate-walk membership: NEVER_SHIPPABLE (the ruled state) or an explicit release.",
  },
  {
    itemId: 'seed-vr09-07',
    heldBy: "David's estate-walk instruction, executed 2026-08-24 (the lead outranks the audit)",
    on: '2026-08-24',
    reason: 'Author-marked "synthetic seed item — never shippable" — LIVE and serving through its case while carrying its author\'s own never-ship marker. Found by the estate walk her 146th ordered (R703).',
    liftedBy: "David's ruling on the estate-walk membership: NEVER_SHIPPABLE (the ruled state) or an explicit release.",
  },
  {
    itemId: 'seed-vr09-08',
    heldBy: "David's estate-walk instruction, executed 2026-08-24 (the lead outranks the audit)",
    on: '2026-08-24',
    reason: 'Author-marked "synthetic seed item — never shippable" — LIVE and serving through its case while carrying its author\'s own never-ship marker. Found by the estate walk her 146th ordered (R703).',
    liftedBy: "David's ruling on the estate-walk membership: NEVER_SHIPPABLE (the ruled state) or an explicit release.",
  },
  {
    itemId: 'seed-vr09-09',
    heldBy: "David's estate-walk instruction, executed 2026-08-24 (the lead outranks the audit)",
    on: '2026-08-24',
    reason: 'Author-marked "synthetic seed item — never shippable" — LIVE and serving through its case while carrying its author\'s own never-ship marker. Found by the estate walk her 146th ordered (R703).',
    liftedBy: "David's ruling on the estate-walk membership: NEVER_SHIPPABLE (the ruled state) or an explicit release.",
  },
  {
    itemId: 'seed-vr09-10',
    heldBy: "David's estate-walk instruction, executed 2026-08-24 (the lead outranks the audit)",
    on: '2026-08-24',
    reason: 'Author-marked "synthetic seed item — never shippable" — LIVE and serving through its case while carrying its author\'s own never-ship marker. Found by the estate walk her 146th ordered (R703).',
    liftedBy: "David's ruling on the estate-walk membership: NEVER_SHIPPABLE (the ruled state) or an explicit release.",
  },
  {
    itemId: 'seed-vr09-11',
    heldBy: "David's estate-walk instruction, executed 2026-08-24 (the lead outranks the audit)",
    on: '2026-08-24',
    reason: 'Author-marked "synthetic seed item — never shippable" — LIVE and serving through its case while carrying its author\'s own never-ship marker. Found by the estate walk her 146th ordered (R703).',
    liftedBy: "David's ruling on the estate-walk membership: NEVER_SHIPPABLE (the ruled state) or an explicit release.",
  },
  {
    itemId: 'seed-vr11-01',
    heldBy: "David's estate-walk instruction, executed 2026-08-24 (the lead outranks the audit)",
    on: '2026-08-24',
    reason: 'Author-marked "synthetic seed item — never shippable" — LIVE and serving through its case while carrying its author\'s own never-ship marker. Found by the estate walk her 146th ordered (R703).',
    liftedBy: "David's ruling on the estate-walk membership: NEVER_SHIPPABLE (the ruled state) or an explicit release.",
  },
  {
    itemId: 'seed-vr11-02',
    heldBy: "David's estate-walk instruction, executed 2026-08-24 (the lead outranks the audit)",
    on: '2026-08-24',
    reason: 'Author-marked "synthetic seed item — never shippable" — LIVE and serving through its case while carrying its author\'s own never-ship marker. Found by the estate walk her 146th ordered (R703).',
    liftedBy: "David's ruling on the estate-walk membership: NEVER_SHIPPABLE (the ruled state) or an explicit release.",
  },
  {
    itemId: 'seed-vr11-03',
    heldBy: "David's estate-walk instruction, executed 2026-08-24 (the lead outranks the audit)",
    on: '2026-08-24',
    reason: 'Author-marked "synthetic seed item — never shippable" — LIVE and serving through its case while carrying its author\'s own never-ship marker. Found by the estate walk her 146th ordered (R703).',
    liftedBy: "David's ruling on the estate-walk membership: NEVER_SHIPPABLE (the ruled state) or an explicit release.",
  },
  {
    itemId: 'seed-vr11-04',
    heldBy: "David's estate-walk instruction, executed 2026-08-24 (the lead outranks the audit)",
    on: '2026-08-24',
    reason: 'Author-marked "synthetic seed item — never shippable" — LIVE and serving through its case while carrying its author\'s own never-ship marker. Found by the estate walk her 146th ordered (R703).',
    liftedBy: "David's ruling on the estate-walk membership: NEVER_SHIPPABLE (the ruled state) or an explicit release.",
  },
  {
    itemId: 'seed-vr11-05',
    heldBy: "David's estate-walk instruction, executed 2026-08-24 (the lead outranks the audit)",
    on: '2026-08-24',
    reason: 'Author-marked "synthetic seed item — never shippable" — LIVE and serving through its case while carrying its author\'s own never-ship marker. Found by the estate walk her 146th ordered (R703).',
    liftedBy: "David's ruling on the estate-walk membership: NEVER_SHIPPABLE (the ruled state) or an explicit release.",
  },
  {
    itemId: 'seed-vr11-06',
    heldBy: "David's estate-walk instruction, executed 2026-08-24 (the lead outranks the audit)",
    on: '2026-08-24',
    reason: 'Author-marked "synthetic seed item — never shippable" — LIVE and serving through its case while carrying its author\'s own never-ship marker. Found by the estate walk her 146th ordered (R703).',
    liftedBy: "David's ruling on the estate-walk membership: NEVER_SHIPPABLE (the ruled state) or an explicit release.",
  },
  {
    itemId: 'seed-vr11-07',
    heldBy: "David's estate-walk instruction, executed 2026-08-24 (the lead outranks the audit)",
    on: '2026-08-24',
    reason: 'Author-marked "synthetic seed item — never shippable" — LIVE and serving through its case while carrying its author\'s own never-ship marker. Found by the estate walk her 146th ordered (R703).',
    liftedBy: "David's ruling on the estate-walk membership: NEVER_SHIPPABLE (the ruled state) or an explicit release.",
  },
  {
    itemId: 'seed-vr11-08',
    heldBy: "David's estate-walk instruction, executed 2026-08-24 (the lead outranks the audit)",
    on: '2026-08-24',
    reason: 'Author-marked "synthetic seed item — never shippable" — LIVE and serving through its case while carrying its author\'s own never-ship marker. Found by the estate walk her 146th ordered (R703).',
    liftedBy: "David's ruling on the estate-walk membership: NEVER_SHIPPABLE (the ruled state) or an explicit release.",
  },
  {
    itemId: 'seed-vr11-09',
    heldBy: "David's estate-walk instruction, executed 2026-08-24 (the lead outranks the audit)",
    on: '2026-08-24',
    reason: 'Author-marked "synthetic seed item — never shippable" — LIVE and serving through its case while carrying its author\'s own never-ship marker. Found by the estate walk her 146th ordered (R703).',
    liftedBy: "David's ruling on the estate-walk membership: NEVER_SHIPPABLE (the ruled state) or an explicit release.",
  },
  {
    itemId: 'seed-vr11-10',
    heldBy: "David's estate-walk instruction, executed 2026-08-24 (the lead outranks the audit)",
    on: '2026-08-24',
    reason: 'Author-marked "synthetic seed item — never shippable" — LIVE and serving through its case while carrying its author\'s own never-ship marker. Found by the estate walk her 146th ordered (R703).',
    liftedBy: "David's ruling on the estate-walk membership: NEVER_SHIPPABLE (the ruled state) or an explicit release.",
  },
  {
    itemId: 'seed-vr11-11',
    heldBy: "David's estate-walk instruction, executed 2026-08-24 (the lead outranks the audit)",
    on: '2026-08-24',
    reason: 'Author-marked "synthetic seed item — never shippable" — LIVE and serving through its case while carrying its author\'s own never-ship marker. Found by the estate walk her 146th ordered (R703).',
    liftedBy: "David's ruling on the estate-walk membership: NEVER_SHIPPABLE (the ruled state) or an explicit release.",
  },
  {
    itemId: 'seed-vr11-12',
    heldBy: "David's estate-walk instruction, executed 2026-08-24 (the lead outranks the audit)",
    on: '2026-08-24',
    reason: 'Author-marked "synthetic seed item — never shippable" — LIVE and serving through its case while carrying its author\'s own never-ship marker. Found by the estate walk her 146th ordered (R703).',
    liftedBy: "David's ruling on the estate-walk membership: NEVER_SHIPPABLE (the ruled state) or an explicit release.",
  },
  {
    itemId: 'seed-vr11-13',
    heldBy: "David's estate-walk instruction, executed 2026-08-24 (the lead outranks the audit)",
    on: '2026-08-24',
    reason: 'Author-marked "synthetic seed item — never shippable" — LIVE and serving through its case while carrying its author\'s own never-ship marker. Found by the estate walk her 146th ordered (R703).',
    liftedBy: "David's ruling on the estate-walk membership: NEVER_SHIPPABLE (the ruled state) or an explicit release.",
  },
  {
    itemId: 'seed-vr11-14',
    heldBy: "David's estate-walk instruction, executed 2026-08-24 (the lead outranks the audit)",
    on: '2026-08-24',
    reason: 'Author-marked "synthetic seed item — never shippable" — LIVE and serving through its case while carrying its author\'s own never-ship marker. Found by the estate walk her 146th ordered (R703).',
    liftedBy: "David's ruling on the estate-walk membership: NEVER_SHIPPABLE (the ruled state) or an explicit release.",
  },
];

const HELD = new Set(SERVING_HOLDS.map((h) => h.itemId));

export function isHeldFromServing(itemId: string): boolean {
  return HELD.has(itemId);
}
