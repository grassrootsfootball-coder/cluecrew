import { describe, expect, it } from 'vitest';
import { buildReplay } from './replay';

describe('worked-example replay (ratified spec addition)', () => {
  it('phrases the exact solution trace through the authored template', () => {
    const lines = buildReplay('3 * 14 + 5');
    expect(lines).toEqual([
      "Let's walk this exact one together, one calm step at a time.",
      '3 * 14 makes 42.',
      '42 + 5 makes 47.',
      'And there it is: 47. Same question — it just needed taking in steps.',
    ]);
  });

  it('never generates without its ingredients — no solution, no template, no trace', () => {
    expect(buildReplay(null)).toBeNull();
    expect(buildReplay('3 + 4', 'no-such-template')).toBeNull();
    expect(buildReplay('nonsense !')).toBeNull();
    expect(buildReplay('42')).toBeNull(); // a bare number has no steps to walk
  });
});
