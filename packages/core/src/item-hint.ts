/**
 * WHICH HINT A CHILD SEES ON A MISS (Annie's ruling, 2026-08-21 — R388).
 *
 * **An item hint serves ONLY if a named reviewer has read it. Otherwise the library hint serves
 * exactly as today.** 7 of 373 are read; **none of the 366 reaches a child on the strength of being
 * plumbed.** Nothing regresses, nothing unread ships, and the backlog drains by READING rather than
 * by outage — **the pin applied at the moment a field is wired, rather than after.**
 *
 * **WHERE IT SERVES, IT SUPERSEDES. A child sees ONE hint, not two.** Her reason: an item hint is
 * authored knowing that item's ACTUAL options and ACTUAL trap, while a library hint must be true of
 * every carrier — and her first ledger row is the proof of what that costs.
 *
 * **THE GATE IS THE WIRING, NOT A SEPARATE STEP.** A plumbing change that shipped first and gated
 * afterwards would put 366 unread strings one deploy away from a child, and the gap between the two
 * commits is exactly where this kind of content escapes.
 */

export interface HintSource {
  /** The item's own hint, if it carries one. */
  hintCore?: unknown;
  /** Who read it. A NAME, not a flag — an unattested hint does not serve. */
  hintAuthoredBy?: unknown;
  /** Where the reading is recorded, so the attribution can be checked rather than trusted. */
  hintAuthority?: unknown;
  /**
   * An explicit ruling about WHICH hint serves. `'library'` withholds the item hint however well
   * attested it becomes — a decision that must outrank the authorship fields, or improving the
   * wording silently overturns the ruling against serving it (R601).
   */
  hintServes?: unknown;
}

export type HintChoice =
  | { serves: 'item'; text: string; readBy: string; authority: string }
  | { serves: 'library'; why: 'no item hint' | 'item hint not read by a named reviewer' };

/**
 * **A NAME, AND A PLACE THE READING IS RECORDED.** Both, because a bare name is an assertion and a
 * bare citation is unattributed — R94's conflation in a serving decision, where it would put an
 * agent's words in front of a child under a reviewer's authority.
 */
export function chooseHint(explanation: HintSource | null | undefined): HintChoice {
  const e = explanation ?? {};
  const text = typeof e.hintCore === 'string' ? e.hintCore.trim() : '';
  if (text === '') return { serves: 'library', why: 'no item hint' };

  /**
   * **AN EXPLICIT RULING TO WITHHOLD OUTRANKS THE AUTHORSHIP FIELDS (Annie, PU-08 — R601).**
   *
   * `ENG-003-A-PU-08` carries `hintServes: 'library'` and `hintRuledBy: 'Annie'` — *"The library
   * hint is better here. An item hint earns its place by saying something the general one cannot."*
   * **Nothing read that field.** The row served the library hint anyway, but only because its
   * authorship fields happened to be absent — **the decision and the outcome agreed by accident.**
   *
   * **And the accident was one amendment from breaking.** Applying an amendment to an item hint sets
   * `hintAuthoredBy` and `hintAuthority`, which is exactly how four hints moved into service this
   * week. Amend PU-08's wording without noticing, and her ruling to withhold it is silently
   * overridden by the act of improving the text she ruled against serving.
   */
  const ruledServes = typeof e.hintServes === 'string' ? e.hintServes.trim() : '';
  if (ruledServes === 'library') {
    return { serves: 'library', why: 'ruled to serve the library hint on this item' };
  }

  const readBy = typeof e.hintAuthoredBy === 'string' ? e.hintAuthoredBy.trim() : '';
  const authority = typeof e.hintAuthority === 'string' ? e.hintAuthority.trim() : '';
  if (readBy === '' || authority === '') {
    return { serves: 'library', why: 'item hint not read by a named reviewer' };
  }
  return { serves: 'item', text, readBy, authority };
}

/** The string to serve, given the item's explanation and the library hint behind the chosen option. */
export function hintToServe(
  explanation: HintSource | null | undefined,
  libraryHint: string | null | undefined,
): string | undefined {
  const choice = chooseHint(explanation);
  // SUPERSEDES, never appends. One hint, not two — a child who has just got something wrong is
  // least able to read two things.
  return choice.serves === 'item' ? choice.text : (libraryHint ?? undefined);
}
