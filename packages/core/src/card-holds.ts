/**
 * WORD CARDS HELD FROM SERVING BECAUSE THEY GIVE AWAY AN ITEM'S KEY (Annie's ruling, 2026-08-19 —
 * R314). **Her ruling was general: do not publish a Word card whose definition contains the key of
 * any item it serves.** All 32 findings are held, not the eight she happened to read.
 *
 * **HELD AT THE DOOR, NOT DEMOTED BY STATUS** — the same shape as `SERVING_HOLDS`. A card's status
 * records a REVIEW decision; a hold records a SERVING one, and collapsing them would lose the fact
 * that these cards were properly approved for what they say and are withdrawn for what they reveal.
 *
 * **WHAT A HOLD DOES, MEASURED RATHER THAN ASSUMED.** Word cards and items serve from separate
 * queries — `collectCards` reads `Word` where status is LIVE; items read `Item`. **There is no join
 * between them at serving time**, so holding a card:
 *
 *   · removes it from the Word Vault collect pool — a child stops being offered it;
 *   · removes it from the word-review distractor pool, which draws from the same table;
 *   · **does NOT stop the vocabulary item serving.** The 15 LIVE items keep serving.
 *
 * **AND THAT IS THE SAFE DIRECTION.** The leak runs card → item: a child who has collected the card
 * can answer the item from memory. Withdrawing the card closes the leak and leaves the question
 * intact. A child in the meantime meets the item **without ever having been handed its answer**,
 * which is what the item was written to ask.
 */

export interface CardHold {
  headword: string;
  /** The item keys this card's own text contains. */
  gives: readonly string[];
  band: 'CONTAINS' | 'VARIANT';
  heldBy: string;
  on: string;
  liftedBy: string;
}

export const CARD_HOLDS: readonly CardHold[] = [
  ['ancient', ['old'], 'CONTAINS'], ['benevolent', ['kind'], 'CONTAINS'],
  ['chilly', ['cold'], 'CONTAINS'], ['conceal', ['hide'], 'CONTAINS'],
  ['generous', ['giving'], 'VARIANT'], ['jovial', ['cheerful'], 'CONTAINS'],
  ['luminous', ['glowing'], 'CONTAINS'], ['shiny', ['bright'], 'CONTAINS'],
  ['sturdy', ['strong'], 'CONTAINS'], ['swift', ['fast'], 'CONTAINS'],
  ['tidy', ['neat'], 'CONTAINS'], ['timid', ['shy'], 'CONTAINS'],
  ['amend', ['change'], 'CONTAINS'], ['amiable', ['friendly'], 'CONTAINS'],
  ['bold', ['brave', 'daring'], 'CONTAINS'], ['genuine', ['real'], 'CONTAINS'],
  ['hollow', ['empty'], 'CONTAINS'], ['hostile', ['unfriendly'], 'CONTAINS'],
  ['transparent', ['clear'], 'CONTAINS'], ['trivial', ['unimportant'], 'CONTAINS'],
].map(([headword, gives, band]) => ({
  headword: headword as string,
  gives: gives as string[],
  band: band as 'CONTAINS' | 'VARIANT',
  heldBy: 'annie',
  on: '2026-08-19',
  liftedBy: 'a redraft that teaches the word without containing the key, signed by her. The redraft alone does not lift it — an unsigned card is a populated field, not a decision.',
}));

const HELD = new Set(CARD_HOLDS.map((h) => h.headword.toLowerCase()));

/** True when this Word card must not be served, whatever its status says. */
export function isCardHeld(headword: string): boolean {
  return HELD.has(headword.toLowerCase());
}
