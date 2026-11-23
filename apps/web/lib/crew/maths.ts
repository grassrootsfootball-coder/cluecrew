/**
 * The Maths district registry (BUILD-DISTRICT-MATHS §2): six strands, five
 * engines, one mechanic string per engine. Kept in apps/web deliberately —
 * core's familyForType stays untouched (the build order: no core changes
 * beyond spec'd integration points), and the orchestrator consults this map
 * FIRST, falling back to core for VR.
 */

export const MATHS_FAMILIES = [
  'forge', // NUMBER FORGE — fluency, estimation duels, number lines
  'workshop', // THE WORKSHOP — word problems + the Bar Model Builder
  'markhomework', // MARK THE HOMEWORK — find the slip, then fix it
  'datadesk', // DATA DESK — tables, charts, timetables
  'shapeshop', // SHAPE SHOP — geometry by direct manipulation
] as const;

export type MathsFamily = (typeof MATHS_FAMILIES)[number];

/**
 * THE MECHANIC NAMES THE ENGINE, IN EITHER SPELLING THE STORE HAS USED (R1064). The spec named
 * mechanics `number-forge`, `data-desk`…; the district as imported stores `forge`, `datadesk`… (the
 * family names). Only the first spelling was mapped and anything else fell to `workshop`, so geometry
 * and data items would have rendered in the wrong engine, silently — R120's fault again. Both
 * spellings map now, and an unknown mechanic returns null for the caller to refuse.
 */
const FAMILY_BY_MECHANIC: Record<string, MathsFamily> = {
  'number-forge': 'forge', forge: 'forge',
  workshop: 'workshop',
  'mark-homework': 'markhomework', markhomework: 'markhomework',
  'data-desk': 'datadesk', datadesk: 'datadesk',
  'shape-shop': 'shapeshop', shapeshop: 'shapeshop',
};

/**
 * A Maths item's engine, or null when the type is not a Maths type or names no known engine.
 * WHETHER IT IS MATHS IS A FACT ABOUT THE TYPE, NOT ITS NAME (R1064): the district was imported as
 * `maths-calc`…, not the spec's `mq-*`, so a prefix test sent every Maths item to the VR map, which
 * refuses unmapped types — and the Maths case could not be played at all.
 */
export function mathsFamilyForType(
  questionTypeId: string,
  mechanic: string | null | undefined,
  district?: string | null,
): MathsFamily | null {
  const isMaths = district === 'MATHS' || questionTypeId.startsWith('mq-');
  if (!isMaths) return null;
  return FAMILY_BY_MECHANIC[mechanic ?? ''] ?? null;
}
