import { describe, expect, it } from 'vitest';
import { screenForAChild } from './appropriateness';

// R1043: "SPAS" reached three LIVE vr-19 items as the code word a child had to encode, and no
// screen knew it. These pin the word to the screen so it cannot quietly drop off again.
describe('the disability slur that reached a child', () => {
  it('refuses every spelling, in any scope', () => {
    for (const w of ['spaz', 'SPAZZ', 'spazzy', 'SPAS']) {
      expect(screenForAChild(w, 'bare').verdict).toBe('REFUSE');
      expect(screenForAChild(`He called him a ${w}.`, 'sentence').verdict).toBe('REFUSE');
    }
  });

  it('refuses the live prompt exactly as it was served', () => {
    expect(screenForAChild('Using the code, what is the code for SPAS?', 'sentence').verdict).toBe('REFUSE');
  });
});
