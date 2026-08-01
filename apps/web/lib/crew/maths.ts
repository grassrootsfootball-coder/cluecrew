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

const FAMILY_BY_MECHANIC: Record<string, MathsFamily> = {
  'number-forge': 'forge',
  workshop: 'workshop',
  'mark-homework': 'markhomework',
  'data-desk': 'datadesk',
  'shape-shop': 'shapeshop',
};

/** Maths QuestionType ids are `mq-` prefixed; the mechanic names the engine. */
export function mathsFamilyForType(
  questionTypeId: string,
  mechanic: string | null | undefined,
): MathsFamily | null {
  if (!questionTypeId.startsWith('mq-')) return null;
  return FAMILY_BY_MECHANIC[mechanic ?? ''] ?? 'workshop';
}
