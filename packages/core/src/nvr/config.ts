/**
 * The ratified NVR generator parameters, TRANSCRIBED from
 * content/nvr-generator-config.json (David's corpus decisions entry 1,
 * SCP-NVR-1..5). These values are EVIDENCE, not defaults — a sync test
 * asserts this module and the content file never drift, and neither may be
 * edited without the other.
 */

export const NVR_CONFIG = {
  /** SCP-NVR-1: GL is always 5-option; the spec's 4 was corrected. */
  optionCount: 5,
  /** SCP-NVR-2, adopted verbatim. */
  densityCaps: {
    maxElementsByTier: { 1: 15, 2: 15, 3: 30, 4: 45, 5: 45 } as Record<number, number>,
  },
  /** SCP-NVR-4: teach on 2-letter codes, score on 2–3. */
  codesScaffold: { teachLetterCount: 2, scoreLetterCounts: [2, 3] as const },
  /** SCP-NVR-1/3: the six-section GL pool; codes mandatory in GL papers. */
  glSectionPool: [
    'series',
    'analogy',
    'like-classification',
    'odd-classification',
    'matrix',
    'codes',
  ] as const,
} as const;

/**
 * Seed-range exposure partitioning (spec §3): practice, Boss Rounds and
 * mock papers draw from provably disjoint ranges — the Addendum B burn
 * rule holds by construction, forever.
 */
export const SEED_RANGES = {
  practice: { from: 0, to: 10_000_000 },
  boss: { from: 10_000_000, to: 20_000_000 },
  mock: { from: 20_000_000, to: 2_147_483_647 },
} as const;

export type SeedKind = keyof typeof SEED_RANGES;

export function seedFor(kind: SeedKind, ordinal: number): number {
  const range = SEED_RANGES[kind];
  const span = range.to - range.from;
  const offset = ((ordinal % span) + span) % span;
  return range.from + offset;
}
