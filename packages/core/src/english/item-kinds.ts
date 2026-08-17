/**
 * ITEM KIND AS A DECLARED PROPERTY — Cowork's vocabulary, adopted here (Annie's ruling, 2026-08-17).
 *
 * **A CLUSTER DECLARES ITS KIND. A CHECK DECLARES WHICH KINDS IT GOVERNS. A check ABSENT from the
 * map governs EVERYTHING** — applies until ruled otherwise, never the reverse. That default is the
 * whole safety property: a new check is in scope for every kind until someone deliberately narrows
 * it, so forgetting to declare makes a check broader rather than blinder.
 *
 * WHY IT EXISTS (R163): `check:line-refs` opened with `if (!passageRef) continue;` and silently
 * skipped 18 of ENG-003's 34 items — not exempt, not unscreened, named nowhere. It was RIGHT to
 * ignore them: a punctuation-spot item has no passage by design. **NOT APPLICABLE was the correct
 * verdict and the gate had no way to say it.** R61 with the polarity reversed — there the population
 * legitimately did not exist; here it exists, the check is right to ignore it, and the silence is
 * indistinguishable from coverage. **`continue` is the `|| true` of a loop body.**
 *
 * The five properties are what a check may ASSUME of a cluster's items. `false` means DO NOT ASSUME,
 * not "never true of any item" — 16 of ENG-003's items carry a `passageRef` and the kind still
 * declares `passageAnchored: false`, because a check may not assume it of the cluster.
 */

export interface ItemKindProperties {
  /** Every item cites a passage that must resolve. */
  passageAnchored: boolean;
  /** Ids are `<district>-<cluster>-<family>-<index>`, one prefix segment. */
  singlePrefix: boolean;
  /** The id tail is a sequential index rather than a grid reference or label. */
  canonicalIds: boolean;
  /** Items carry a `mechanismLedger`. */
  mechanismLedger: boolean;
  /** Items cite a line window (`lineRefs`) that can be verified against a passage. */
  windowedItems: boolean;
}

export type ItemKind = 'comprehension' | 'spag';

export const ITEM_KINDS: Record<ItemKind, ItemKindProperties> = {
  comprehension: {
    passageAnchored: true,
    singlePrefix: true,
    canonicalIds: true,
    mechanismLedger: true,
    windowedItems: true,
  },
  /**
   * SPaG. Three mechanics under one kind, and every property is `false` because the kind is mixed:
   * cloze cites a passage and a GAP, the two spot mechanics carry their sentence in the stem and
   * cite nothing. Ids run `ENG-003-A-CZ-A1` — a sub-prefix (`A`) and a grid-reference tail.
   */
  spag: {
    passageAnchored: false,
    singlePrefix: false,
    canonicalIds: false,
    mechanismLedger: false,
    windowedItems: false,
  },
};

/** Cluster → kind. A cluster absent from this map is `comprehension`, which is the bank's default. */
export const CLUSTER_KIND: Record<string, ItemKind> = {
  'ENG-003': 'spag',
};

export function kindOfCluster(clusterId: string): ItemKind {
  return CLUSTER_KIND[clusterId] ?? 'comprehension';
}

/** The cluster prefix of an item id — `ENG-003-A-CZ-A1` → `ENG-003`. Prefix, never segmentation. */
export function clusterOf(itemId: string): string {
  return itemId.split('-').slice(0, 2).join('-');
}

export function kindOfItem(itemId: string): ItemKind {
  return kindOfCluster(clusterOf(itemId));
}

/**
 * Does this check govern this item?
 *
 * **A CHECK ABSENT FROM `CHECK_GOVERNS` GOVERNS EVERYTHING.** Returning `true` for an unknown check
 * is the ruling: applies until ruled otherwise, never the reverse.
 */
export const CHECK_GOVERNS: Record<string, readonly ItemKind[]> = {
  // Verifies that a cited line resolves in a passage. Meaningless where a kind is not windowed.
  'check:line-refs': ['comprehension'],
};

export function checkGoverns(check: string, kind: ItemKind): boolean {
  const kinds = CHECK_GOVERNS[check];
  return kinds === undefined ? true : kinds.includes(kind);
}
