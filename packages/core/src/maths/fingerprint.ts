/**
 * WHAT A MATHS FAMILY SIGNATURE DESCRIBES (David, 2026-08-09, closing R40 #5).
 *
 * The SPaG district got this on 2026-08-08 and the maths district did not, which is the whole
 * finding: everything built that week — assert the sheet, pin the signature, notice the move —
 * stopped at a district boundary. Nineteen signed maths families could move with nothing to
 * notice, while `AttributionEvent.subjectHash` sat there empty for want of a function to fill it.
 *
 * Deliberately a SEPARATE function from `familyFingerprint` in english/spag-fingerprint.ts rather
 * than one generic over `LadderedFamily`. Unifying them would change the SPaG hash and silently
 * un-pin all thirteen signatures annie ruled on yesterday — a refactor that voids signatures is
 * exactly the move R34 forbids. Two functions, one idea, no signature disturbed.
 *
 * The surface is what the reviewer met on the sample sheet: the tiers offered, and per tier the
 * rule, the structural parameters and the number ranges. Plus the family-level facts that change
 * what an item IS — its shape, its collapse, and its distractor floor (a two-distractor family
 * shows the child three options where the others show four).
 */
import { createHash } from 'node:crypto';
import { familyTiers, type MathsFamily, type Tier } from './generator';

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
 * The hash of a maths family's generator surface. Deterministic, and it moves when any of the
 * declared surface moves — which is what should void a signature.
 */
export function mathsFamilyFingerprint(family: MathsFamily): string {
  const surface = {
    id: family.id,
    shape: family.shape,
    collapsed: family.collapsed ?? null,
    distractorFloor: family.distractorFloor ?? null,
    tiers: familyTiers(family).map((t: Tier) => ({
      tier: t,
      rule: family.tierRule(t),
      structural: family.structuralParams ? family.structuralParams(t) : null,
      ranges: family.numberRanges ? family.numberRanges(t) : null,
    })),
  };
  return createHash('sha256').update(JSON.stringify(canonical(surface))).digest('hex').slice(0, 16);
}
