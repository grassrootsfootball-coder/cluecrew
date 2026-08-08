import { describe, expect, it } from 'vitest';
import { familyTiers, makeRng } from '../maths/generator';
import { assembleSpagItem, generateSpagSample, spagLadderGaps } from './spag-generator';
import { SPAG_FAMILIES as FAMILIES, HOMOPHONE_BANK, nonErrorNearMiss } from './spag-families';

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

  it('homophones bank: near-miss count is VERIFIED (derived == intended), not declared', () => {
    // annie's third-district catch: a declared count must equal what the words actually carry.
    for (const s of HOMOPHONE_BANK) expect(nonErrorNearMiss(s)).toBe(s.intended);
    const buckets = HOMOPHONE_BANK.reduce<Record<number, number>>((m, s) => ({ ...m, [s.intended]: (m[s.intended] ?? 0) + 1 }), {});
    expect(buckets).toEqual({ 0: 6, 1: 6, 2: 6, 3: 6 }); // enough at each rung to sample cleanly
  });

  it('homophones (rebuilt): split tags, item-level ladder, no N at T1, no repeated sentence, pair-share', () => {
    const f = FAMILIES.find((x) => x.id === 'spag-spell-homophone-by-sound')!;
    expect(familyTiers(f)).toEqual([1, 2, 3, 4]); // reaches T1, ceilings at T4 (SPaG cap)
    const SPELLING_FRANCHISES = ['en-double-consonant-boundary', 'en-unstressed-suffix-vowel', 'en-silent-letter-dropped', 'en-homophone-by-sound'];
    const LEGAL = ['en-error-spot-rule-over-applied', 'en-error-spot-guessed-a-part', 'en-n-option-avoidance'];
    for (const t of familyTiers(f)) {
      const items = generateSpagSample(f, t, 6, 2);
      // no stimulus twice — a child is never handed one item's answer by another
      expect(new Set(items.map((i) => i.dedupKey)).size).toBe(items.length);
      // no error pair beyond a third of the sample
      const pairCounts = items.reduce<Record<string, number>>((m, i) => ({ ...m, [i.diversityKey!]: (m[i.diversityKey!] ?? 0) + 1 }), {});
      expect(Math.max(...Object.values(pairCounts))).toBeLessThanOrEqual(2);
      for (const item of items) {
        for (const o of item.options.filter((x) => !x.isKey)) {
          expect(SPELLING_FRANCHISES).not.toContain(o.misconceptionId);
          expect(LEGAL).toContain(o.misconceptionId);
        }
      }
    }
    // The ladder is near-miss proximity ALONE, distinct at every tier (0,1,2,3), item-level.
    expect([1, 2, 3, 4].map((t) => f.structuralParams!(t as 1).nearMissParts)).toEqual([0, 1, 2, 3]);
    expect(f.structuralParams!(1).nKeyed).toBeUndefined(); // N-keying is a distribution, not a rung
    // T1's rung is 0; an N-keyed item is never 0-near-miss, so T1 carries no "No mistake" key.
    expect(generateSpagSample(f, 1, 6, 2).some((i) => i.key === 'No mistake')).toBe(false);
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
