/**
 * THE ENGLISH AND MATHS QUESTION TYPES — one list, read by every door that registers them (2026-11-20).
 *
 * Until now each district's types were declared privately by the script that first imported its content
 * (`scripts/import-english-items.ts`, `scripts/build-maths-district.ts`) and the seed knew only the VR
 * types. The dev database had all of them because those scripts had run against it; a FRESH database —
 * CI, a new staging copy — did not, so `seedCases` hit `Case_questionTypeId_fkey` on case-en-01 and the CI
 * run of 2026-11-19 failed at the seed before any check ran. Two doors enumerating separately is R42's
 * finding; this is the same fault between a script and the seed.
 *
 * Values are the live rows' values exactly (read from the store 2026-11-20). VR types stay in
 * `families.ts`/the seed's `VR_TYPES`, which already had one source.
 */
export interface DistrictQuestionType { id: string; name: string; mechanic: string }

export const ENGLISH_QUESTION_TYPES: readonly DistrictQuestionType[] = [
  { id: 'en-comp-retrieval', name: 'Retrieval', mechanic: 'select-one' },
  { id: 'en-comp-inference', name: 'Inference', mechanic: 'select-one' },
  { id: 'en-comp-vocab', name: 'Vocabulary in Context', mechanic: 'select-one' },
  { id: 'en-comp-technique', name: 'Writer’s Technique', mechanic: 'select-one' },
  { id: 'en-spag-spelling-spot', name: 'Spelling: spot the slip', mechanic: 'error-spot' },
  { id: 'en-spag-punct-spot', name: 'Punctuation: spot the slip', mechanic: 'error-spot' },
  { id: 'en-spag-cloze', name: 'Grammar cloze', mechanic: 'cloze' },
];

export const MATHS_QUESTION_TYPES: readonly DistrictQuestionType[] = [
  { id: 'maths-calc', name: 'Calculation', mechanic: 'forge' },
  { id: 'maths-fdp', name: 'Fractions, decimals and percentages', mechanic: 'workshop' },
  { id: 'maths-npv', name: 'Number and place value', mechanic: 'forge' },
  { id: 'maths-meas', name: 'Measurement', mechanic: 'workshop' },
  { id: 'maths-geom', name: 'Geometry', mechanic: 'shapeshop' },
  { id: 'maths-stats', name: 'Statistics', mechanic: 'datadesk' },
  { id: 'maths-rp', name: 'Ratio and proportion', mechanic: 'workshop' },
];
