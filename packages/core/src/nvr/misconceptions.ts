/**
 * The 19 corpus-proposed NVR misconception ids, TRANSCRIBED from the reviewer
 * queue (imported PROPOSED via scripts/import-corpus-misconceptions.ts,
 * corpus decisions entry 1, SCP-NVR provenance). These are David's ratified
 * analysis of 103 real papers — EVIDENCE, not defaults; the list is the
 * distractor-constructor mapping and no constructor may reference an id
 * outside it (CI-checked).
 *
 * Ids only, deliberately: descriptions and child hints live in the database
 * behind the Addendum E approval door. PROPOSED entries can be referenced by
 * constructors but CANNOT SERVE — serving.ts refuses any item whose
 * distractor tags are not all ACTIVE, and the reviewer's approval is the
 * only thing that flips one.
 */
export const NVR_MISCONCEPTION_IDS = [
  'nvr-code-nearest-box-copy',
  'nvr-code-partial-verification',
  'nvr-code-row-swap',
  'nvr-code-stale-mapping',
  'nvr-count-by-glance',
  'nvr-hidden-footprint-blocks',
  'nvr-matrix-local-copy',
  'nvr-mirror-for-rotation',
  'nvr-multi-part-tracking',
  'nvr-net-adjacency-blindspot',
  'nvr-net-mark-orientation',
  'nvr-partial-rule-match',
  'nvr-relational-rule-miss',
  'nvr-rotation-for-reflection',
  'nvr-series-phase-slip',
  'nvr-single-axis-fixation',
  'nvr-surface-similarity',
  'nvr-transform-not-applied',
  'nvr-wrong-mirror-axis',
  // Corpus confirm/refute against the tag-vocabulary gap (2026-08-05): three
  // ratified additions giving the thin turntable/net families a genuine fourth
  // distinct error. PROPOSED until the reviewer approves (they cannot serve yet).
  'nvr-rotation-wrong-direction', // turntable-rotation (also machine engines)
  'nvr-partial-reflection', // turntable-reflection — one internal element unflipped
  'nvr-net-duplicated-face', // folding-net — same motif on two faces
] as const;

export type NvrMisconceptionId = (typeof NVR_MISCONCEPTION_IDS)[number];

export function isNvrMisconceptionId(id: string): id is NvrMisconceptionId {
  return (NVR_MISCONCEPTION_IDS as readonly string[]).includes(id);
}
