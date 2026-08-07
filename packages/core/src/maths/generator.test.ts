import { describe, expect, it } from 'vitest';
import { MATHS_FAMILIES } from './families';
import { familyExecutorCoverage, familyTiers, generateSample, structuralLadderGaps, type Tier } from './generator';
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
      const item = generateSample(fam, 3, 1, 7)[0]!;
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

  it('structural-ladder gate: signed ladder families pass; magnitude-only families are flagged', () => {
    const gaps = structuralLadderGaps(MATHS_FAMILIES);
    const flagged = new Set(gaps.map((g) => g.familyId));
    // The three signed families declare a distinct structural parameter at every step.
    for (const id of ['M-pct', 'M-geom', 'M-inverse']) expect(flagged.has(id), `${id} should pass the ladder gate`).toBe(false);
    // A representative magnitude-only family (annie's hollow example) is caught.
    expect(flagged.has('M-06a')).toBe(true);
    expect(flagged.has('M-column')).toBe(true);
  });

  it('executor coverage is reportable per family (annie requirement #2)', () => {
    const cov = familyExecutorCoverage(MATHS_FAMILIES.find((f) => f.id === 'M-04b')!);
    expect(cov.derived).toContain(16); // reversed-division is gate-verified
    expect(cov.derived).toContain(75);
  });
});
