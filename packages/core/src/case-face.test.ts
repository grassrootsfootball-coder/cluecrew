import { describe, expect, it } from 'vitest';
import { caseFaceServes } from './case-face';

describe('R686 — a case face fails closed', () => {
  it('an empty title renders nothing to a child', () => {
    expect(caseFaceServes({ title: '' })).toBe(false);
    expect(caseFaceServes({ title: '   ' })).toBe(false);
  });
  it('a landed face serves', () => {
    expect(caseFaceServes({ title: 'The Missing Word' })).toBe(true);
  });
});
