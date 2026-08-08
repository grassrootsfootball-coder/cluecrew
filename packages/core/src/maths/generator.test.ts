import { describe, expect, it } from 'vitest';
import { MATHS_FAMILIES } from './families';
import { assembleItem, familyExecutorCoverage, familyTiers, generateSample, makeRng, structuralLadderGaps, type Tier } from './generator';
import { checkMathsNotation } from './notation';

describe('maths generator — every family emits only gated items', () => {
  for (const family of MATHS_FAMILIES) {
    const tiers = familyTiers(family);
    it(`${family.id} (${family.name}) generates 30/tier that pass the gate`, () => {
      for (const tier of tiers) {
        const items = generateSample(family, tier, 30, 12345);
        expect(items).toHaveLength(30);
        for (const item of items) {
          // key present, distractors distinct and none equals the key (DONE-5)
          const wrong = item.options.filter((o) => !o.isKey).map((o) => o.value);
          expect(item.options.filter((o) => o.isKey)).toHaveLength(1);
          expect(new Set(wrong).size).toBe(wrong.length);
          expect(wrong).not.toContain(item.key);
          // distractor floor honoured
          expect(wrong.length).toBeGreaterThanOrEqual(family.distractorFloor ?? 3);
          // notation is house style (assembleItem already gates it; re-assert)
          expect(checkMathsNotation(item.stem)).toEqual([]);
        }
      }
    });
  }

  it('composition: time-and-money T4 carries firstStepResults and a PROC-01 stop-early distractor', () => {
    const items = generateSample(MATHS_FAMILIES.find((f) => f.id === 'M-money')!, 4, 10, 99);
    for (const item of items) {
      expect(Array.isArray(item.operands.firstStepResults)).toBe(true);
      const proc = item.options.find((o) => o.processMisconceptionId?.includes('proc-01'));
      expect(proc, 'a stop-early distractor').toBeTruthy();
      // the stop-early value IS one of the composed intermediate steps
      const steps = (item.operands.firstStepResults as number[]).map(String);
      expect(steps.some((s) => Number(s) === Number(String(proc!.value).replace('£', '')))).toBe(true);
    }
  });

  it('two-distractor floor: unit-fraction and unit-price ship exactly two', () => {
    for (const id of ['M-06a', 'M-05a']) {
      const fam = MATHS_FAMILIES.find((f) => f.id === id)!;
      expect(fam.distractorFloor).toBe(2);
      // Both are COLLAPSED families, so they are asked at the single tier they declare. This line
      // read `3` before the ladder was enforced, which asked M-06a (collapsed to T2) for a T3 item
      // and got one — the test was itself relying on the gap it now helps close.
      const item = generateSample(fam, familyTiers(fam)[0]!, 1, 7)[0]!;
      expect(item.options.filter((o) => !o.isKey)).toHaveLength(2);
    }
  });

  it('the sample sheet reproduces from a seed', () => {
    const fam = MATHS_FAMILIES[0]!;
    const a = generateSample(fam, 2, 30, 2024).map((i) => i.stem);
    const b = generateSample(fam, 2, 30, 2024).map((i) => i.stem);
    expect(a).toEqual(b);
  });

  it('numberRanges is enforced — generation stays INSIDE the declared bound (annie point 1)', () => {
    // The declared range now bounds the output, for every family that declares it — the
    // two she cited included (M-geom T1 said 3–9 but emitted 13×11; M-pct T4 said 3,800).
    for (const fam of MATHS_FAMILIES.filter((f) => f.numberRanges)) {
      for (const tier of familyTiers(fam)) {
        const bounds = fam.numberRanges!(tier);
        for (const item of generateSample(fam, tier, 30, 42)) {
          for (const [key, [lo, hi]] of Object.entries(bounds)) {
            const v = item.operands[key];
            if (typeof v === 'number') {
              expect(v, `${fam.id} T${tier} ${key}=${v} outside declared ${lo}–${hi}`).toBeGreaterThanOrEqual(lo);
              expect(v, `${fam.id} T${tier} ${key}=${v} outside declared ${lo}–${hi}`).toBeLessThanOrEqual(hi);
            }
          }
        }
      }
    }
  });

  it('structural-ladder gate is clean: every multi-tier family has a real declared ladder', () => {
    // After the collapse, the magnitude-only families are single-tier (make no ladder claim)
    // and the six laddered families (M-round/M-money/M-column/M-pct/M-geom/M-inverse) each
    // differ structurally at every step. So no gaps remain.
    const gaps = structuralLadderGaps(MATHS_FAMILIES);
    expect(gaps, `unexpected ladder gaps: ${gaps.map((g) => `${g.familyId}[${g.between ?? '-'}]`).join(', ')}`).toEqual([]);
    // And the collapsed families really are single-tier.
    for (const id of ['M-06a', 'M-04a', 'M-stats']) expect(familyTiers(MATHS_FAMILIES.find((f) => f.id === id)!)).toHaveLength(1);
  });

  it('executor coverage is reportable per family (annie requirement #2)', () => {
    const cov = familyExecutorCoverage(MATHS_FAMILIES.find((f) => f.id === 'M-04b')!);
    expect(cov.derived).toContain(16); // reversed-division is gate-verified
    expect(cov.derived).toContain(75);
  });
});

/**
 * The declared-vs-enforced sweep (annie, 2026-08-08). Ten of nineteen families — every collapsed
 * one — drafted at all four tiers they do not claim, because `familyTiers` was consulted by every
 * caller but by nothing in the generator itself.
 */
describe('a declared ladder is a constraint', () => {
  it('refuses every tier a family does not declare', () => {
    for (const family of MATHS_FAMILIES) {
      const declared = familyTiers(family);
      for (const tier of [1, 2, 3, 4, 5] as Tier[]) {
        if (declared.includes(tier)) continue;
        expect(() => assembleItem(family, tier, makeRng(3))).toThrow(/is not one of them/);
      }
    }
  });
});
