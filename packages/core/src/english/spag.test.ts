import { describe, expect, it } from 'vitest';
import { familyTiers, makeRng } from '../maths/generator';
import { assembleSpagItem, generateSpagSample, spagLadderGaps } from './spag-generator';
import { SPAG_FAMILIES as FAMILIES } from './spag-families';

describe('SPaG families on the maths engine', () => {
  it('is exactly the eleven franchises (4 spelling + 4 punctuation + 3 cloze)', () => {
    expect(FAMILIES).toHaveLength(11);
    const bySub = FAMILIES.reduce<Record<string, number>>((m, f) => ({ ...m, [f.subtype]: (m[f.subtype] ?? 0) + 1 }), {});
    expect(bySub).toEqual({ spelling: 4, punctuation: 4, cloze: 3 });
  });

  it('every multi-tier family declares a real structural ladder (gate green)', () => {
    expect(spagLadderGaps(FAMILIES)).toEqual([]);
  });

  it('every served tier generates 6 distinct, gated items', () => {
    for (const f of FAMILIES) {
      for (const t of familyTiers(f)) {
        const items = generateSpagSample(f, t, 6, 1);
        expect(items).toHaveLength(6);
        for (const item of items) {
          // exactly one key; every wrong option carries a misconception (P3)
          expect(item.options.filter((o) => o.isKey)).toHaveLength(1);
          for (const o of item.options.filter((o) => !o.isKey)) expect(o.misconceptionId).toBeTruthy();
          // no option repeats or ties the key
          const values = item.options.map((o) => o.value);
          expect(new Set(values).size).toBe(values.length);
        }
      }
    }
  });

  it('enforces its declared number ranges — an out-of-range param throws', () => {
    const f = FAMILIES.find((x) => x.subtype === 'spelling')!;
    const tier = familyTiers(f)[0]!;
    const bad = { ...f, draft: (t: typeof tier, r: () => number) => ({ ...f.draft(t, r), params: { letters: 99, segments: 4 } }) };
    expect(() => assembleSpagItem(bad, tier, makeRng(1))).toThrow(/outside stated range/);
  });

  it('homophones (rebuilt): coherent single sentence, false-positive tags, structural ladder', () => {
    const f = FAMILIES.find((x) => x.id === 'spag-spell-homophone-by-sound')!;
    expect(familyTiers(f)).toEqual([1, 2, 3, 4]); // reaches T1, ceilings at T4 (SPaG cap)
    const SPELLING_FRANCHISES = ['en-double-consonant-boundary', 'en-unstressed-suffix-vowel', 'en-silent-letter-dropped'];
    for (const t of familyTiers(f)) {
      for (const item of generateSpagSample(f, t, 6, 2)) {
        for (const o of item.options.filter((x) => !x.isKey)) {
          // a correct part is tagged false-positive, never a mis-describing spelling franchise
          expect(SPELLING_FRANCHISES).not.toContain(o.misconceptionId);
          expect(['en-error-spot-false-positive', 'en-n-option-avoidance']).toContain(o.misconceptionId);
        }
      }
    }
    // the ladder is carried by structural dials, and adjacent tiers differ in one
    const p1 = f.structuralParams!(1), p2 = f.structuralParams!(2), p3 = f.structuralParams!(3), p4 = f.structuralParams!(4);
    expect(p1.nKeyed).not.toBe(p2.nKeyed); // T1→T2: N-keying
    expect(p2.nearMissParts).not.toBe(p3.nearMissParts); // T2→T3: proximity
    expect(p3.nearMissParts).not.toBe(p4.nearMissParts); // T3→T4: proximity
  });

  it('rejects an untagged distractor (P3)', () => {
    const f = FAMILIES.find((x) => x.subtype === 'cloze')!;
    const tier = familyTiers(f)[0]!;
    const bad = {
      ...f,
      draft: (t: typeof tier, r: () => number) => {
        const d = f.draft(t, r);
        return { ...d, options: d.options.map((o, i) => (i === 1 ? { ...o, misconceptionId: null } : o)) };
      },
    };
    expect(() => assembleSpagItem(bad, tier, makeRng(1))).toThrow(/no misconception tag/);
  });
});
