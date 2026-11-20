import { describe, expect, it } from 'vitest';
import { buildDerivedVrDistractors, buildSpreadVrDistractors, checkVrDistractors, VR_EXECUTORS, vrLetterOf, type VrOperands } from './distractors';

const mag = (v: string | number) => (typeof v === 'number' || /^-?\d+$/.test(String(v)) ? Number(v) : String(v).charCodeAt(0) - 65);

describe('buildSpreadVrDistractors (R1030)', () => {
  const ids = ['vr14-step-direction', 'vr14-step-size', 'vr14-step-size'];
  // Alternate rows run backwards (negative step), as the generator now writes them (R1030).
  const rows: VrOperands[] = Array.from({ length: 12 }, (_, i) => { const step = (1 + (i % 4)) * (i % 2 ? -1 : 1); const first = 8 + i; return { kind: 'letter-analogy', first, step, answer: first + step }; });

  it('only ever uses values a tag genuinely produces, so the gate still passes', () => {
    const counts: number[] = [];
    for (const op of rows) {
      const key = vrLetterOf(op.answer!);
      const picked = buildSpreadVrDistractors(key, op, ids, 3, counts);
      expect(picked).toHaveLength(3);
      for (const d of picked) expect(VR_EXECUTORS[d.misconceptionId]!(op)).toContain(String(d.value));
      const failures = checkVrDistractors({ id: 't', operands: op, options: [{ value: key, isCorrect: true, misconceptionId: null }, ...picked.map((d) => ({ value: d.value, isCorrect: false, misconceptionId: d.misconceptionId }))] });
      expect(failures).toEqual([]);
    }
  });

  it('spreads the key across ranks where the legacy pick put it at one rank every time', () => {
    const legacy = new Set<number>(); const spread = new Set<number>(); const counts: number[] = [];
    for (const op of rows) {
      const key = vrLetterOf(op.answer!);
      const below = (ds: Array<{ value: string | number }>) => ds.filter((d) => mag(d.value) < mag(key)).length;
      if (op.step! > 0) legacy.add(below(buildDerivedVrDistractors(key, op, ['vr14-step-direction', 'vr14-step-size', 'vr14-step-size']))); // forward-only, as the bank was
      spread.add(below(buildSpreadVrDistractors(key, op, ids, 3, counts)));
    }
    expect(legacy.size).toBe(1); // the shortcut: one rank on every row
    expect(spread.size).toBeGreaterThan(1);
  });

  it('falls back to the legacy builder when there are too few values to choose from', () => {
    const op: VrOperands = { kind: 'number-series', first: 2, step: 2, answer: 10 };
    expect(buildSpreadVrDistractors(10, op, ['vr-series-off-by-one'], 3, [])).toEqual(buildDerivedVrDistractors(10, op, ['vr-series-off-by-one']));
  });
});
