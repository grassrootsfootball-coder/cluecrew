import { describe, expect, it } from 'vitest';
import { mathsFamilyForType } from './maths';

// R1064: whether an item is Maths is a fact about its QuestionType (district), not its id; and the
// mechanic maps in either spelling the store has used, refusing (null) rather than defaulting.
describe('the Maths engine for a question type', () => {
  it('routes the imported maths-* types by district, to the engine their mechanic names', () => {
    expect(mathsFamilyForType('maths-calc', 'forge', 'MATHS')).toBe('forge');
    expect(mathsFamilyForType('maths-geom', 'shapeshop', 'MATHS')).toBe('shapeshop');
    expect(mathsFamilyForType('maths-stats', 'datadesk', 'MATHS')).toBe('datadesk');
    expect(mathsFamilyForType('maths-fdp', 'workshop', 'MATHS')).toBe('workshop');
  });

  it('still reads the spec spelling and the mq- prefix', () => {
    expect(mathsFamilyForType('mq-26', 'data-desk')).toBe('datadesk');
    expect(mathsFamilyForType('mq-01', 'number-forge', null)).toBe('forge');
  });

  it('refuses rather than defaulting: an unknown mechanic is null, a VR type is null', () => {
    expect(mathsFamilyForType('maths-geom', 'protractor', 'MATHS')).toBeNull();
    expect(mathsFamilyForType('vr-11-number-series', 'code', 'VR')).toBeNull();
  });
});
