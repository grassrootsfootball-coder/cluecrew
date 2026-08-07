import { describe, expect, it } from 'vitest';
import { MATHS_FAMILIES } from './families';
import { familyExecutorCoverage, familyTiers, generateSample, type Tier } from './generator';
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

  it('rebuilt families keep generation INSIDE the stated range (annie point 1)', () => {
    // The stated range must bound the output — M-geom sides and M-pct amounts, the two
    // she cited (T1 said 3–9 but emitted 13×11; T4 said 100–900 but emitted 3,800).
    const checks: Array<[string, string[]]> = [['M-geom', ['l', 'w']], ['M-pct', ['amount']]];
    for (const [id, fields] of checks) {
      const fam = MATHS_FAMILIES.find((f) => f.id === id)!;
      for (const tier of familyTiers(fam)) {
        const m = fam.ranges(tier).match(/(\d[\d,]*)\s*[–-]\s*(\d[\d,]*)/);
        if (!m) continue;
        const lo = Number(m[1]!.replace(/,/g, '')), hi = Number(m[2]!.replace(/,/g, ''));
        for (const item of generateSample(fam, tier, 30, 42)) {
          for (const field of fields) {
            const v = item.operands[field];
            if (typeof v === 'number') {
              expect(v, `${id} T${tier} ${field}=${v} outside stated ${lo}–${hi}`).toBeGreaterThanOrEqual(lo);
              expect(v, `${id} T${tier} ${field}=${v} outside stated ${lo}–${hi}`).toBeLessThanOrEqual(hi);
            }
          }
        }
      }
    }
  });

  it('executor coverage is reportable per family (annie requirement #2)', () => {
    const cov = familyExecutorCoverage(MATHS_FAMILIES.find((f) => f.id === 'M-04b')!);
    expect(cov.derived).toContain(16); // reversed-division is gate-verified
    expect(cov.derived).toContain(75);
  });
});
