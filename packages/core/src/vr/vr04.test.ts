import { describe, expect, it } from 'vitest';
import { checkVr04Row, flagNearSynonymHeadwords, forbiddenFor, selectVr04Distractors, VR04_NEVER_ADD, type Vr04Row } from './vr04';

describe('vr-04 constructor machinery (annie 2026-08-06)', () => {
  it('two-part screen: a two-sense headword is fine; a distractor in its other sense is blocked', () => {
    // GLOOMY may sit on a bare card; "dark" (the "gloomy room" sense) may not tag it.
    const clean: Vr04Row = { n: 1, tier: 2, headword: 'gloomy', key: 'miserable', distractors: [{ word: 'grumpy', diagnosis: 'SH' }] };
    expect(checkVr04Row(clean)).toEqual([]);
    const other: Vr04Row = { ...clean, distractors: [{ word: 'dark', diagnosis: 'OF' }] };
    expect(checkVr04Row(other).some((e) => e.includes('two-sense'))).toBe(true);
    expect(forbiddenFor('feeble').has('unconvincing')).toBe(true);
  });
  it('the-other-meaning is refused on a bare card, allowed with a carrier', () => {
    const bare: Vr04Row = { n: 1, tier: 2, headword: 'recede', key: 'retreat', distractors: [{ word: 'fade', diagnosis: 'OM' }] };
    expect(checkVr04Row(bare).some((e) => e.includes('the-other-meaning'))).toBe(true);
    const carried: Vr04Row = { ...bare, tier: 4, carrier: 'They waited for the floodwater to RECEDE.' };
    expect(checkVr04Row(carried)).toEqual([]);
  });
  it('never-add blocks a defensible second answer as a distractor', () => {
    const row: Vr04Row = { n: 1, tier: 5, headword: 'stoic', key: 'unemotional', carrier: 'She stayed STOIC.', distractors: [{ word: 'calm', diagnosis: 'SC' }] };
    expect(checkVr04Row(row).some((e) => e.includes('never-add'))).toBe(true);
    expect(VR04_NEVER_ADD.has('composed')).toBe(true);
  });
  it('scarcity-aware selection keeps OM, drops from the abundant tags', () => {
    const pool = [{ word: 'a', diagnosis: 'WS' as const }, { word: 'b', diagnosis: 'SH' as const }, { word: 'c', diagnosis: 'OF' as const }, { word: 'd', diagnosis: 'OM' as const }];
    const kept = selectVr04Distractors(pool, 3);
    expect(kept.some((d) => d.diagnosis === 'OM')).toBe(true);
    expect(kept).toHaveLength(3);
  });
  it('near-synonym flag surfaces the cross-tier pair WITH both option sets, and never blocks', () => {
    const swift: Vr04Row = { n: 2, tier: 1, headword: 'swift', key: 'speedy', distractors: [{ word: 'frantic', diagnosis: 'WS' }, { word: 'sudden', diagnosis: 'SH' }, { word: 'early', diagnosis: 'SC' }] };
    const rapid: Vr04Row = { n: 9, tier: 2, headword: 'rapid', key: 'quick', distractors: [{ word: 'speedy', diagnosis: 'WS' }, { word: 'hurried', diagnosis: 'SH' }, { word: 'brisk', diagnosis: 'OF' }] };
    const brave: Vr04Row = { n: 1, tier: 1, headword: 'brave', key: 'fearless', distractors: [{ word: 'reckless', diagnosis: 'WS' }] };
    const bold: Vr04Row = { n: 15, tier: 2, headword: 'bold', key: 'daring', distractors: [{ word: 'reckless', diagnosis: 'WS' }] };
    const flags = flagNearSynonymHeadwords([swift, rapid, brave, bold]);
    // both cross-tier pairs surface — Annie rules, the flag does not
    expect(flags).toHaveLength(2);
    const fast = flags.find((f) => f.group === 'fast')!;
    expect(fast.a.options).toContain('speedy'); // swift's key
    expect(fast.b.options).toEqual(['quick', 'speedy', 'hurried', 'brisk']); // rapid's full set, tightened
    expect(flags.some((f) => f.group === 'courage')).toBe(true);
    // same tier is not a paired-design flag (that is the separate same-tier finding)
    expect(flagNearSynonymHeadwords([swift, { ...rapid, tier: 1 }])).toEqual([]);
  });
});
