import { describe, expect, it } from 'vitest';
import { EVENT_NAMES, assertEvent, isEventName } from './events';

describe('canonical event names', () => {
  it('are unique and snake_case', () => {
    expect(new Set(EVENT_NAMES).size).toBe(EVENT_NAMES.length);
    for (const name of EVENT_NAMES) expect(name).toMatch(/^[a-z]+(_[a-z]+)*$/);
  });

  it('include the BUILD-PHASE-1 §6 starting set', () => {
    for (const required of [
      'session_started',
      'session_ended',
      'case_opened',
      'mode_selected',
      'attempt_submitted',
      'case_cracked',
      'word_collected',
      'rank_up',
      'warmup_completed',
    ]) {
      expect(isEventName(required)).toBe(true);
    }
  });
});

describe('assertEvent', () => {
  it('rejects unknown names', () => {
    expect(() =>
      assertEvent({ name: 'made_up_event' as never, props: {} }),
    ).toThrow(/Unknown event name/);
  });

  it('rejects props that look like free text', () => {
    expect(() =>
      assertEvent({
        name: 'attempt_submitted',
        childId: 'c1',
        props: { note: 'x'.repeat(200) },
      }),
    ).toThrow(/free text/);
  });

  it('accepts IDs and enums', () => {
    expect(
      assertEvent({
        name: 'attempt_submitted',
        childId: 'c1',
        props: { itemId: 'item_123', correct: true, latencyMs: 4100, context: 'case_practice' },
      }).name,
    ).toBe('attempt_submitted');
  });
});
