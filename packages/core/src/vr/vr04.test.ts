import { describe, expect, it } from 'vitest';
import { checkVr04Row, screenBareCard, selectVr04Distractors, VR04_NEVER_ADD, type Vr04Row } from './vr04';

describe('vr-04 constructor machinery (annie 2026-08-06)', () => {
  it('bare-card screen refuses a two-sense headword at T1-T3', () => {
    expect(screenBareCard('BRISK')).not.toBeNull();
    expect(screenBareCard('fair')).not.toBeNull();
    expect(screenBareCard('timid')).toBeNull();
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
});
