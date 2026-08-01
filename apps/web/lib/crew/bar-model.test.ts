import { describe, expect, it } from 'vitest';
import {
  addBar,
  emptyModel,
  labelBar,
  matchesReference,
  splitBar,
  toggleUnknown,
  type ReferenceBar,
} from './bar-model';

/** "Ava has 3 boxes of 4 pencils; Ben has some pencils; together 20." */
const REFERENCE: ReferenceBar[] = [
  { parts: 3, partValue: 4 },
  { parts: 1, unknown: true },
];

function build() {
  let state = addBar(addBar(emptyModel()));
  const [first, second] = state.bars;
  state = splitBar(splitBar(state, first!.id, 1), first!.id, 1); // 3 parts
  state = labelBar(state, first!.id, 4);
  state = toggleUnknown(state, second!.id);
  return state;
}

describe('the Bar Model Builder check (BUILD-DISTRICT-MATHS §3)', () => {
  it('matches a model that tells the story, regardless of bar order', () => {
    const state = build();
    expect(matchesReference(state, REFERENCE).ok).toBe(true);
    expect(matchesReference(state, [...REFERENCE].reverse()).ok).toBe(true);
  });

  it('catches a missing quantity kindly', () => {
    const verdict = matchesReference(addBar(emptyModel()), REFERENCE);
    expect(verdict.ok).toBe(false);
    expect(verdict.note).toContain('more quantities than your model');
  });

  it('catches structural drift — parts, labels, the unknown', () => {
    let state = build();
    state = splitBar(state, state.bars[0]!.id, 1); // now 4 parts, story says 3
    expect(matchesReference(state, REFERENCE).ok).toBe(false);

    let unlabelled = build();
    unlabelled = labelBar(unlabelled, unlabelled.bars[0]!.id, 5);
    expect(matchesReference(unlabelled, REFERENCE).ok).toBe(false);

    let noUnknown = build();
    noUnknown = toggleUnknown(noUnknown, noUnknown.bars[1]!.id);
    expect(matchesReference(noUnknown, REFERENCE).ok).toBe(false);
  });

  it('splits clamp to 1–12 parts', () => {
    let state = addBar(emptyModel());
    const id = state.bars[0]!.id;
    state = splitBar(state, id, -1);
    expect(state.bars[0]!.parts).toBe(1);
    for (let i = 0; i < 20; i += 1) state = splitBar(state, id, 1);
    expect(state.bars[0]!.parts).toBe(12);
  });
});
