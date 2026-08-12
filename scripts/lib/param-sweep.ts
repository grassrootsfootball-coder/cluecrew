/**
 * THE PARAMETER SWEEPS — ONE IMPLEMENTATION, TWO DOORS (annie's condition, 2026-08-12).
 *
 * A fingerprint guards the DECLARED SURFACE. These sweeps are the only instrument for EMITTED
 * BEHAVIOUR, and `spag-punct-terminal-boundary` is the proof those two come apart: its declared
 * surface was intact while it emitted T4/T5 items outside its own ladder. A matching fingerprint
 * was never going to catch that.
 *
 * They had run twice in this project's history, both times because someone asked. So the
 * ASSERTION now runs in CI on the same trigger as `verify:fingerprints`, and the ARTEFACT still
 * goes to the reviewer from the export scripts. Both call the functions here — never two
 * implementations of the same sweep, which is R42's finding and it has recurred three times.
 *
 * SOURCE, STATED BEFORE THEY RUN (R41). Neither sweep re-derives anything. Each emits through the
 * district's own generator (`assembleItem` / `assembleSpagItem`) over the district's own tier
 * ladder (`familyTiers` / `spagFamilyTiers`), and the disagreement it reports is the one the
 * generator itself raises when a recomputed parameter contradicts the declared one. This module
 * counts and classifies; it does not judge what a parameter should be.
 */
import { MATHS_FAMILIES } from '../../packages/core/src/maths/families';
import { assembleItem, familyTiers, makeRng, GateError } from '../../packages/core/src/maths/generator';
import { SPAG_FAMILIES } from '../../packages/core/src/english/spag-families';
import { assembleSpagItem, SpagGateError } from '../../packages/core/src/english/spag-generator';
import { spagFamilyTiers } from '../../packages/core/src/english/spag-fingerprint';

export const MATHS_DRAWS = 400;
export const SPAG_DRAWS = 600;

export interface MathsSweepRow {
  id: string;
  tiers: string[];
  declared: string[];
  asserted: string[];
  metadataOnly: string[];
  emissions: number;
  verdict: 'ASSERTED' | 'PARTIAL' | 'DISAGREES' | 'NONE-DECLARED' | 'BLIND';
  mismatches: Array<{ detail: string; count: number }>;
}

export interface SpagSweepRow {
  id: string;
  swept: boolean;
  tiers: string[];
  declared: Record<string, Record<string, string | number>>;
  metadata: Record<string, Record<string, string | number>>;
  emissions: number;
  mismatches: Array<{ tier: number; detail: string; count: number }>;
}

/** Every signed maths family, emitted to `MATHS_DRAWS` per tier with its parameters recomputed. */
export function sweepMathsFamilies(): MathsSweepRow[] {
  return MATHS_FAMILIES.map((f) => {
    const declaredKeys = f.structuralParams ? Object.keys(f.structuralParams(familyTiers(f)[0]!)) : [];
    const mismatches = new Map<string, number>();
    let emissions = 0;
    const recomputed = new Set<string>();
    for (const tier of familyTiers(f)) {
      const r = makeRng(9001 + tier);
      for (let i = 0; i < MATHS_DRAWS; i += 1) {
        try {
          const item = assembleItem(f, tier, r);
          emissions += 1;
          if (f.recomputeParams) Object.keys(f.recomputeParams(item, tier)).forEach((k) => recomputed.add(k));
        } catch (e) {
          // A GateError naming a declared parameter IS the disagreement; anything else is a
          // legitimate refusal (range, key recompute, notation) and not this sweep's business.
          const msg = e instanceof GateError ? e.message : '';
          if (/but the emitted item has/.test(msg)) mismatches.set(msg, (mismatches.get(msg) ?? 0) + 1);
        }
      }
    }
    const metadata = declaredKeys.filter((k) => !recomputed.has(k));
    return {
      id: f.id,
      tiers: familyTiers(f).map((t) => `T${t}`),
      declared: declaredKeys,
      asserted: [...recomputed].sort(),
      metadataOnly: metadata,
      emissions,
      // BLIND first: a family that emitted nothing scored PARTIAL before, and PARTIAL is a
      // legitimate verdict meaning "a recorded judgement" (R60/R61).
      verdict: emissions === 0
        ? 'BLIND'
        : mismatches.size ? 'DISAGREES' : declaredKeys.length === 0 ? 'NONE-DECLARED' : metadata.length ? 'PARTIAL' : 'ASSERTED',
      mismatches: [...mismatches].map(([detail, count]) => ({ detail, count })),
    };
  });
}

/** Every SPaG family, emitted to `SPAG_DRAWS` per tier. */
export function sweepSpagFamilies(): SpagSweepRow[] {
  const rows: SpagSweepRow[] = [];
  for (const family of SPAG_FAMILIES) {
    const tiers = spagFamilyTiers(family);
    const declared: SpagSweepRow['declared'] = {};
    const metadata: SpagSweepRow['metadata'] = {};
    for (const t of tiers) {
      declared[`T${t}`] = family.structuralParams(t);
      if (family.metadata) metadata[`T${t}`] = family.metadata(t);
    }
    const mismatch = new Map<string, { tier: number; detail: string; count: number }>();
    let emissions = 0;
    for (const tier of tiers) {
      const r = makeRng(4242 + tier);
      for (let i = 0; i < SPAG_DRAWS; i += 1) {
        try {
          assembleSpagItem(family, tier, r);
          emissions += 1;
        } catch (e) {
          // Only a PARAMETER disagreement is a sweep finding. A gate refusal (a draw that failed
          // the child-facing check, a duplicate) is the generator working, not a false sheet.
          const msg = e instanceof SpagGateError ? e.message : String(e);
          if (/declared .* but the emitted item has|cannot recompute it/.test(msg)) {
            const k = `${tier}|${msg}`;
            const prev = mismatch.get(k);
            mismatch.set(k, { tier, detail: msg, count: (prev?.count ?? 0) + 1 });
          }
        }
      }
    }
    rows.push({
      id: family.id,
      swept: Boolean(family.recomputeParams),
      tiers: tiers.map((t) => `T${t}`),
      declared,
      metadata,
      emissions,
      mismatches: [...mismatch.values()],
    });
  }
  return rows;
}
