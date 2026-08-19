/**
 * DUP-BY-CONSTRUCTION — question types whose items legitimately share text, by design.
 *
 * **RULED IN, 2026-08-19: `en-spag-cloze` is the THIRD dup-by-construction type, keyed on question
 * type** (Annie via David). Sixteen items over two vehicles: every item sharing a vehicle shares
 * its carrier text byte-for-byte, because the vehicle IS the item's body — a duplicate-text
 * detector that does not know this flags the whole bank against itself.
 *
 * **THE FIRST TWO MEMBERS ARE NOT NAMED HERE, DELIBERATELY.** The taxonomy is Cowork's artefact and
 * its earlier members never crossed; writing my guess of them into a constant would be a fabricated
 * fact wearing a schema (R178 — a name in prose is looked up, never recalled, and there is nothing
 * here to look it up in). They join this list when the taxonomy crosses, by import and not by
 * memory. Until then, any detector consuming this list knows it is PARTIAL, and says so.
 */
export const DUP_BY_CONSTRUCTION_TYPES: ReadonlyArray<{ questionTypeId: string; shares: string; ruled: string }> = [
  {
    questionTypeId: 'en-spag-cloze',
    shares: 'the carrier vehicle text — every item on one vehicle holds the same body',
    ruled: 'annie via David, 2026-08-19 (third member; first two live in Cowork\'s taxonomy and have not crossed)',
  },
];
