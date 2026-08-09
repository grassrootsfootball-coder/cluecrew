import { describe, expect, it } from 'vitest';
import { familyTiers, makeRng } from '../maths/generator';
import type { Tier } from '../maths/generator';
import { assembleSpagItem, generateSpagSample, spagLadderGaps } from './spag-generator';
import { familyFingerprint, spagFamilyTiers } from './spag-fingerprint';
import { SPAG_FAMILIES as FAMILIES, HOMOPHONE_BANK, nonErrorNearMiss, DOUBLE_BANK, esNonErrorNearMiss, partHasDouble, SUFFIX_BANK, partHasSuffix, SILENT_BANK, partHasSilent, CONTRACTION_BANK, partHasContraction } from './spag-families';

describe('SPaG families on the maths engine', () => {
  it('is thirteen families (4 spelling + 5 punctuation + 4 cloze) — two families SPLIT in two', () => {
    // R14: apostrophe holds two properties, so two question types (contraction binary → spot-form;
    // possessive permissive → reframe). R18: connectives and tags sit at opposite ends of the parse
    // ladder and test different skills (meaning vs syntax), so they split too.
    expect(FAMILIES).toHaveLength(13);
    const bySub = FAMILIES.reduce<Record<string, number>>((m, f) => ({ ...m, [f.subtype]: (m[f.subtype] ?? 0) + 1 }), {});
    expect(bySub).toEqual({ spelling: 4, punctuation: 5, cloze: 4 });
  });

  it('every multi-tier family declares a real structural ladder (gate green)', () => {
    // The R31 gap is CLOSED by R32. `spag-cloze-tense` briefly had no declared ladder, because
    // `optionsThatParse` — the only thing separating its T2 from its T4 — had failed R31's
    // recomputability test and moved to metadata. Now every option declares whether it parses,
    // the count recomputes from the emitted item, so it is back on the asserted sheet and the
    // ladder stands again on the dimension that was always doing the work.
    expect(spagLadderGaps(FAMILIES)).toEqual([]);
  });

  it('every served tier generates its honest per-tier count of distinct, gated items', () => {
    for (const f of FAMILIES) {
      // Honest per-tier counts: double 4/rung (child-usable key pool); comma 4/tier (the R-well
      // is narrow — rung-2 keyed items are all lists, so the opening-construction cap limits it);
      // the rest 6.
      // Possessive 4/tier too: the R-well is three narrow well types (R16).
      // Cloze families take their honest bank depth, which differs per tier (R18: no fabricated
      // ladder — tense supplies 4 items at T2 and only 2 at T4).
      const CLOZE: Record<string, Record<number, number>> = {
        'spag-cloze-word-class': { 2: 6 }, 'spag-cloze-tense': { 2: 8, 4: 7 },
        'spag-cloze-connectives': { 3: 6 }, 'spag-cloze-tags': { 2: 8 },
      };
      const base = f.id === 'spag-punct-apostrophe-contraction' ? 3
        : ['spag-spell-double-consonant-boundary', 'spag-punct-comma-needs', 'spag-punct-apostrophe-possessive',
           'spag-punct-terminal-boundary', 'spag-punct-speech'].includes(f.id) ? 4 : 6;
      for (const t of familyTiers(f)) {
        const n = CLOZE[f.id]?.[t] ?? base;
        const items = generateSpagSample(f, t, n, 1);
        expect(items).toHaveLength(n);
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

  it('spelling banks (R13 via the shared factory): near-miss VERIFIED, keys distinct (rule 7)', () => {
    const banks: Array<[typeof DOUBLE_BANK, (p: string) => boolean, number]> = [
      [SUFFIX_BANK, partHasSuffix, 6], [SILENT_BANK, partHasSilent, 6], [DOUBLE_BANK, partHasDouble, 4],
    ];
    for (const [bank, lookup, perRung] of banks) {
      for (const s of bank) expect(esNonErrorNearMiss(s, lookup)).toBe(s.intended); // derived == declared
      const buckets = bank.reduce<Record<number, number>>((m, s) => ({ ...m, [s.intended]: (m[s.intended] ?? 0) + 1 }), {});
      expect(buckets).toEqual({ 0: perRung, 1: perRung, 2: perRung, 3: perRung });
      // rule 7 — the errored token is distinct across the whole family bank
      expect(new Set(bank.map((s) => s.klass)).size).toBe(bank.length);
    }
  });

  it('contraction: every set-member in a clean part is a REVIEWED near-miss (pair-correctness)', () => {
    // annie 2026-08-08: a contraction trap word can be genuinely WRONG for the sentence (`they're`
    // with no plural referent), which the lookup cannot catch — so each is reviewed per sentence
    // (nmVerified), and the parts the lookup flags in clean positions must exactly equal that set.
    for (const s of CONTRACTION_BANK) {
      const flagged = s.parts.map((p, i) => [p, i] as const).filter(([p, i]) => i !== s.errorIndex && partHasContraction(p)).map(([, i]) => i);
      expect(flagged).toEqual(s.nmVerified ?? []);
    }
    expect(new Set(CONTRACTION_BANK.map((s) => s.klass)).size).toBe(CONTRACTION_BANK.length); // rule 7
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

/**
 * The artefact audit's catch (annie, 2026-08-08): a declared tier ladder was enforced nowhere.
 * `tiers` reached only `tierRule`, so a family signed as T1–T3 drafted at T4 and T5 without
 * complaint. These pin both halves — the ladder is refused outside itself, and the fingerprint
 * that a signature will carry actually moves when the family does.
 */
describe('family ladder and fingerprint', () => {
  it('refuses a tier the family states no rule for', () => {
    const terminal = FAMILIES.find((f) => f.id === 'spag-punct-terminal-boundary')!;
    expect(spagFamilyTiers(terminal)).toEqual([1, 2, 3]);
    expect(() => assembleSpagItem(terminal, 5, makeRng(1))).toThrow(/not part of its ladder/);
  });

  it('produces items at every tier it does declare', () => {
    for (const family of FAMILIES) {
      for (const tier of spagFamilyTiers(family)) {
        expect(() => generateSpagSample(family, tier, 1, 7)).not.toThrow();
      }
    }
  });

  it('fingerprints are stable, distinct, and move when the family moves', () => {
    const seen = new Map<string, string>();
    for (const family of FAMILIES) {
      const fp = familyFingerprint(family);
      expect(familyFingerprint(family)).toBe(fp); // deterministic
      expect(seen.has(fp)).toBe(false); // distinct across families
      seen.set(fp, family.id);
    }
    const one = FAMILIES[0]!;
    const retiered = { ...one, tierRule: (t: Tier) => (t === 1 ? '' : one.tierRule(t)) };
    expect(familyFingerprint(retiered)).not.toBe(familyFingerprint(one));
  });
});
