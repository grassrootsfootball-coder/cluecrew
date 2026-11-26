/**
 * PROPERTY TESTS FOR THE MATHS GENERATORS (R1075). `generator.test.ts` checks one fixed seed per
 * family; these draw the seed, so a family that is clean on seed 12345 and broken on some other
 * seed fails here, and fast-check prints the seed that breaks it.
 *
 * SOURCES (the rule that a verifier names what it calls before it runs):
 *   · the key: `evalArithmetic(item.solution)`, the engine's own evaluator, the same one
 *     `assembleItem` uses; compared with `answersEqual`, also the engine's own.
 *   · notation: `checkMathsNotation`, the house-notation gate.
 *   · ranges: the family's own `numberRanges(tier)`.
 *   · tiers: `familyTiers(family)`, never a hand list.
 * Nothing here re-derives a property the family already defines.
 */
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { answersEqual, evalArithmetic } from './executors';
import { MATHS_FAMILIES } from './families';
import { assembleItem, familyTiers, GateError, generateSample, makeRng, type GenMathsItem, type Tier } from './generator';
import { checkMathsNotation } from './notation';

const RUNS = 25;
const DRAWS_PER_SEED = 30;

/**
 * THE PROPERTY IS THE GATE'S, NOT THE SAMPLER'S. `assembleItem` may refuse a draw (it throws
 * GateError); what must hold for every seed is that nothing it RETURNS is wrong. The first version
 * asserted `generateSample` never gives up, and it does: M-column T4/T5 refuse ~95% of draws (too
 * few distractors survive), so 160 attempts sometimes yield 3 of 4. That is a sampler-budget
 * finding recorded in R1075, not an item fault; no runtime path calls the sampler.
 */
function draws(family: (typeof MATHS_FAMILIES)[number], tier: Tier, seed: number): GenMathsItem[] {
  const r = makeRng(seed);
  const out: GenMathsItem[] = [];
  for (let i = 0; i < DRAWS_PER_SEED; i++) {
    try {
      out.push(assembleItem(family, tier, r));
    } catch (e) {
      if (!(e instanceof GateError)) throw e;
    }
  }
  return out;
}

describe('maths generators: properties over drawn seeds', () => {
  it('canary: the population is not empty', () => {
    expect(MATHS_FAMILIES.length).toBeGreaterThan(0);
  });

  for (const family of MATHS_FAMILIES) {
    for (const tier of familyTiers(family) as Tier[]) {
      it(`${family.id} T${tier}: every item the gate lets out is keyed, distinct and in range, for any seed`, () => {
        let emitted = 0;
        fc.assert(
          fc.property(fc.integer({ min: 1, max: 2_000_000 }), (seed) => {
            const items = draws(family, tier, seed);
            emitted += items.length;
            const bounds = family.numberRanges?.(tier);
            for (const item of items) {
              const keys = item.options.filter((o) => o.isKey);
              expect(keys).toHaveLength(1);
              expect(keys[0]!.value).toBe(item.key);
              if (item.solution !== null) {
                const computed = evalArithmetic(item.solution);
                expect(computed, `${family.id} T${tier} seed ${seed}: "${item.solution}"`).not.toBeNull();
                expect(answersEqual(String(computed), item.key), `${family.id} T${tier} seed ${seed}: ${item.solution} = ${computed}, key ${item.key}`).toBe(true);
              }
              const wrong = item.options.filter((o) => !o.isKey).map((o) => o.value);
              expect(wrong.length).toBeGreaterThanOrEqual(family.distractorFloor ?? 3);
              expect(wrong.some((v) => answersEqual(v, item.key))).toBe(false);
              expect(wrong.some((v, i) => wrong.findIndex((w) => answersEqual(v, w)) !== i)).toBe(false);
              expect(checkMathsNotation(item.stem)).toEqual([]);
              for (const [k, [lo, hi]] of Object.entries(bounds ?? {})) {
                const v = item.operands[k];
                if (typeof v === 'number') {
                  expect(v).toBeGreaterThanOrEqual(lo);
                  expect(v).toBeLessThanOrEqual(hi);
                }
              }
            }
          }),
          { numRuns: RUNS },
        );
        // A tier that never emits would pass every property above by checking nothing.
        expect(emitted, `${family.id} T${tier} emitted nothing in ${RUNS * DRAWS_PER_SEED} draws`).toBeGreaterThan(0);
      });
    }
  }

  it('a seed reproduces its sample exactly, for any family, tier and seed', () => {
    const cases = MATHS_FAMILIES.flatMap((f) => familyTiers(f).map((t) => ({ f, t })));
    fc.assert(
      fc.property(fc.integer({ min: 0, max: cases.length - 1 }), fc.integer({ min: 1, max: 2_000_000 }), (i, seed) => {
        const { f, t } = cases[i]!;
        const a = generateSample(f, t, 3, seed);
        const b = generateSample(f, t, 3, seed);
        expect(b).toEqual(a);
      }),
      { numRuns: 40 },
    );
  });
});
