import { describe, expect, it } from 'vitest';
import {
  initialAdaptState,
  nextItemTier,
  recordOutcome,
  selectItem,
  type AdaptState,
} from './adaptivity';

function feed(state: AdaptState, outcomes: boolean[]): AdaptState {
  return outcomes.reduce((current, correct) => recordOutcome(current, correct).state, state);
}

describe('band adjustment (P5: 70–85% rolling over last 10)', () => {
  it('steps up one tier when above the band over a full window', () => {
    const state = feed(initialAdaptState(2), Array(9).fill(true));
    const result = recordOutcome(state, true);
    expect(result.stepChange).toBe(1);
    expect(result.state.tierEstimate).toBe(3);
  });

  it('steps down when below the band', () => {
    // 5/10 with misses interleaved so consecutive-miss rules never fire first.
    const outcomes = [true, false, true, false, true, false, true, false, true];
    const state = feed(initialAdaptState(3), outcomes);
    const result = recordOutcome(state, false);
    expect(result.stepChange).toBe(-1);
    expect(result.state.tierEstimate).toBe(2);
  });

  it('never adjusts before a full window and never jumps more than one step', () => {
    const result = recordOutcome(feed(initialAdaptState(2), Array(5).fill(true)), true);
    expect(result.stepChange).toBe(0);
    const stepped = recordOutcome(feed(initialAdaptState(2), Array(9).fill(true)), true);
    expect(Math.abs(stepped.state.tierEstimate - 2)).toBe(1);
  });

  it('stays within tiers 1–5', () => {
    const top = recordOutcome(feed(initialAdaptState(5), Array(9).fill(true)), true);
    expect(top.state.tierEstimate).toBe(5);
    const outcomes = [true, false, true, false, true, false, true, false, true];
    const bottom = recordOutcome(feed(initialAdaptState(1), outcomes), false);
    expect(bottom.state.tierEstimate).toBe(1);
  });
});

describe('anti-frustration rules (hard — they outrank the band)', () => {
  it('after 2 consecutive misses: eases the next item and OFFERS a mode revisit', () => {
    let state = initialAdaptState(3);
    state = recordOutcome(state, false).state;
    const second = recordOutcome(state, false);
    expect(second.offerModeRevisit).toBe(true);
    expect(second.frustrationBreak).toBe(false);
    expect(nextItemTier(second.state, false)).toBe(2); // one tier easier
  });

  it('after 3 consecutive misses: ends the activity — never a fourth', () => {
    let state = initialAdaptState(3);
    state = recordOutcome(state, false).state;
    state = recordOutcome(state, false).state;
    const third = recordOutcome(state, false);
    expect(third.frustrationBreak).toBe(true);
  });

  it('a correct answer resets the consecutive-miss count', () => {
    let state = initialAdaptState(3);
    state = recordOutcome(state, false).state;
    state = recordOutcome(state, false).state;
    state = recordOutcome(state, true).state;
    expect(state.consecutiveMisses).toBe(0);
  });
});

describe('confidence-building open', () => {
  it('the first item of a type in a session sits one tier below estimate', () => {
    expect(nextItemTier(initialAdaptState(3), true)).toBe(2);
    expect(nextItemTier(initialAdaptState(1), true)).toBe(1); // floor
    expect(nextItemTier(initialAdaptState(3), false)).toBe(3);
  });
});

describe('selectItem', () => {
  const items = [
    { id: 'a', tier: 1 },
    { id: 'b', tier: 3 },
    { id: 'c', tier: 5 },
  ];

  it('picks the closest tier and avoids repeats', () => {
    expect(selectItem(items, 3)?.id).toBe('b');
    expect(selectItem(items, 3, new Set(['b']))?.id).not.toBe('b');
    expect(selectItem(items, 4, new Set())?.id).toBe('b');
  });

  it('returns null when the pool is exhausted', () => {
    expect(selectItem(items, 3, new Set(['a', 'b', 'c']))).toBeNull();
  });
});
