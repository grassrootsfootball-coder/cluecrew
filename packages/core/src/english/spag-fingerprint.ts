/**
 * WHAT A FAMILY SIGNATURE ACTUALLY DESCRIBES (annie, 2026-08-08).
 *
 * Her finding, generalised from the queue export: anything that mixes CONTENT with STATUS ages
 * silently. A family signature is exactly that mixture. It records a judgement ("every item is fair
 * at its tier") which is content and ages visibly, alongside FIGURES — depth, bank size, items per
 * tier — which are status and age invisibly. Regenerate the family and the figures are wrong while
 * the signature goes on looking valid.
 *
 * The guard is the one that made the NVR signatures work: pin what was signed with a hash, so a
 * later reader can tell whether the thing has moved.
 *
 * Two functions, deliberately separate:
 *
 *   `familyFingerprint` — the generator SURFACE: tier rules, structural parameters, ranges. This is
 *   what the reviewer read on the sample sheet and ruled on. It changes when the family's shape
 *   changes, which is what should void a signature.
 *
 *   `familyDepth` — what the generator can actually PRODUCE, measured by generating to exhaustion
 *   rather than by counting a bank. The distinction matters: the signed depth figures are sentence
 *   counts, but an N-keyed family yields two items per sentence (the error form and the no-mistake
 *   form), so the bank count and the item count are different numbers in the same units-free prose.
 *   Measuring settles it instead of arguing it.
 */
import { createHash } from 'node:crypto';
import type { Tier } from '../maths/generator';
import { assembleSpagItem, type SpagFamily } from './spag-generator';

/** Tiers the family states a rule for — the same derivation maths uses (`familyTiers`). */
export function spagFamilyTiers(family: SpagFamily): Tier[] {
  return ([1, 2, 3, 4, 5] as Tier[]).filter((t) => family.tierRule(t).trim() !== '');
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort()
        .map((k) => [k, canonical((value as Record<string, unknown>)[k])]),
    );
  }
  return value;
}

/**
 * The hash of the family's generator surface as a reviewer met it. Deterministic: the same family
 * always yields the same fingerprint, and any change to a tier rule, a structural parameter or a
 * range changes it.
 */
export function familyFingerprint(family: SpagFamily): string {
  const surface = {
    id: family.id,
    subtype: family.subtype,
    franchise: family.franchise,
    tiers: spagFamilyTiers(family).map((t) => ({
      tier: t,
      rule: family.tierRule(t),
      structural: family.structuralParams(t),
      ranges: family.numberRanges(t),
    })),
  };
  return createHash('sha256').update(JSON.stringify(canonical(surface))).digest('hex').slice(0, 16);
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface FamilyDepth {
  /** Distinct items the generator can produce at each tier it offers. */
  perTier: Record<string, number>;
  total: number;
}

/**
 * Measure depth by generating to exhaustion. `attempts` is a ceiling, not a target: these families
 * are small by construction (that is the SIZE BEFORE SERVING concern the reviewer raised), so the
 * dedup set saturates long before the ceiling.
 */
export function familyDepth(family: SpagFamily, attempts = 4000): FamilyDepth {
  const perTier: Record<string, number> = {};
  let total = 0;
  for (const tier of spagFamilyTiers(family)) {
    const seen = new Set<string>();
    const r = mulberry32(12345 + tier);
    for (let i = 0; i < attempts; i += 1) {
      try {
        const item = assembleSpagItem(family, tier, r);
        seen.add(item.dedupKey ?? item.stem);
      } catch {
        // A gate refusal is a legitimate outcome for a draw; it is not depth.
      }
    }
    perTier[`T${tier}`] = seen.size;
    total += seen.size;
  }
  return { perTier, total };
}
