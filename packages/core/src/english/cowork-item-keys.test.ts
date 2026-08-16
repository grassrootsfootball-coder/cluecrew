/**
 * THE REFUSAL'S CANARY.
 *
 * The eight cluster files carry no unrecognised key, so the refusal passed on its first real run
 * having proved nothing — R60's second question exactly: does the check know anything it MUST
 * find? These cases are that. They run on synthetic objects; fault injection never touches a
 * reviewed row (David, 2026-08-13).
 */
import { describe, expect, it } from 'vitest';
import { COWORK_ITEM_KEYS, PROPOSED_EXCEPTIONS, unknownCoworkKeys } from './cowork-item-keys';

const draft = (): Record<string, unknown> => ({
  itemId: 'SCRATCH-01',
  questionTypeId: 'q',
  difficultyTier: 3,
  stem: { text: 'x', quotes: [] },
  explanation: { walkScript: [], hintCore: '' },
  options: [{ label: 'A', content: 'a', isCorrect: true }],
});

describe('unknownCoworkKeys', () => {
  it('passes a draft carrying only registered keys', () => {
    expect(unknownCoworkKeys(draft())).toEqual([]);
  });

  // One per level: a key added at any depth must stop the import, not slip through the level
  // the sweep happens not to visit.
  it.each([
    ['item', (d: Record<string, unknown>) => ({ ...d, coworkAddedNextMonth: 1 })],
    ['stem', (d: Record<string, unknown>) => ({ ...d, stem: { ...(d.stem as object), newStemFlag: true } })],
    ['explanation', (d: Record<string, unknown>) => ({ ...d, explanation: { ...(d.explanation as object), quotesV2: [] } })],
    // Not senseTarget: that WAS this case until it was columned on 2026-08-16, and the test went
    // red rather than quietly passing. A canary has to name a key nothing will ever register.
    ['options[]', (d: Record<string, unknown>) => ({ ...d, options: [{ label: 'A', content: 'a', isCorrect: true, optionFieldAddedNextMonth: 'x' }] })],
  ])('refuses an unregistered key at %s level', (level, mutate) => {
    const found = unknownCoworkKeys(mutate(draft()));
    expect(found).toHaveLength(1);
    expect(found[0]!.level).toBe(level);
    expect(found[0]!.itemId).toBe('SCRATCH-01');
  });

  it('names every unknown key, not just the first', () => {
    const found = unknownCoworkKeys({ ...draft(), aNewOne: 1, anotherNewOne: 2 });
    expect(found.map((f) => f.key).sort()).toEqual(['aNewOne', 'anotherNewOne']);
  });
});

describe('the registry itself', () => {
  // The carriage rule made concrete: a key that does not cross must justify itself, and the
  // justification is a REASON plus a RULING. A NOT_CARRIED entry with neither is a silent drop
  // with extra steps.
  it('gives every NOT_CARRIED key a reason AND a ruling, and every carried key a destination', () => {
    for (const [level, rules] of Object.entries(COWORK_ITEM_KEYS)) {
      for (const r of rules) {
        if (r.disposition === 'NOT_CARRIED') {
          expect(r.reason, `${level}.${r.key}`).toBeTruthy();
          expect(r.ruling, `${level}.${r.key}`).toBeTruthy();
        } else {
          expect(r.carriedAt, `${level}.${r.key}`).toBeTruthy();
        }
      }
    }
  });

  it('brings the exceptions, not the inclusions', () => {
    expect(PROPOSED_EXCEPTIONS.map((l: { level: string; key: string }) => `${l.level}.${l.key}`)).toEqual([
      'item.banListException_SHAPE_NOTE',
      'item.draftingMethod_SHAPE_NOTE',
      'item._previousOrderAnchor',
      'item.notes',
      'item.draftingOrder',
      'options[].tagStatus_SHAPE_UNRESOLVED',
      'options[]._previousMisconceptionId',
    ]);
  });
});
