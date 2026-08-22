import { describe, expect, it } from 'vitest';
import { axesTableCanary, readContentFlags } from './passage-content';

const GOOD = {
  axis: 'physical-peril-no-lasting-harm',
  element: 'a rising tide',
  severity: 'mild',
  disposition: 'keep',
  condition: null,
  conditionMetBy: null,
  reason: 'survivable, ordinary, ends safely',
  judgedBy: 'Annie',
  judgedAt: '2026-08-22',
};

describe('the contentFlags reader (R627/R628, standard DRAFT-1)', () => {
  it('the canary holds at 19+7 — a blind transcription fails every caller', () => {
    expect(axesTableCanary().holds).toBe(true);
  });

  it('a standard-shape flag on a ruled axis with a named judge parses', () => {
    const r = readContentFlags({ id: 'p', contentFlags: [GOOD], extract: 'text' });
    expect(r.standardFlags).toHaveLength(1);
    expect(r.refusals).toHaveLength(0);
  });

  it('§1: an axis not in her table refuses, and the refusal routes to the reviewer in its own text', () => {
    const r = readContentFlags({ id: 'p', contentFlags: [{ ...GOOD, axis: 'a-new-axis' }], extract: 't' });
    expect(r.refusals[0]?.code).toBe('UNKNOWN_AXIS');
    expect(r.refusals[0]?.detail).toContain('a new axis is a ruling, not a write');
  });

  it('§2: a role-word is not a name and refuses identically to an absent judge', () => {
    const roleWord = readContentFlags({ id: 'p', contentFlags: [{ ...GOOD, judgedBy: 'reviewer' }], extract: 't' });
    const absent = readContentFlags({ id: 'p', contentFlags: [{ ...GOOD, judgedBy: undefined }], extract: 't' });
    expect(roleWord.refusals[0]?.code).toBe('UNJUDGED_FLAG');
    expect(absent.refusals[0]?.code).toBe('UNJUDGED_FLAG');
  });

  it('§4: keep-conditional with a null condition refuses at write', () => {
    const r = readContentFlags({ id: 'p', contentFlags: [{ ...GOOD, disposition: 'keep-conditional' }], extract: 't' });
    expect(r.refusals[0]?.code).toBe('CONDITION_MISSING');
  });

  it('§4: a laid-but-unmet condition refuses only AT USE — laying before meeting is legitimate', () => {
    const flag = { ...GOOD, disposition: 'keep-conditional', condition: 'a teacher note exists' };
    expect(readContentFlags({ id: 'p', contentFlags: [flag], extract: 't' }).refusals).toHaveLength(0);
    const atUse = readContentFlags({ id: 'p', contentFlags: [flag], extract: 't' }, { enforceUse: true });
    expect(atUse.refusals[0]?.code).toBe('CONDITION_MISSING');
    expect(atUse.refusals[0]?.detail).toContain('AT USE');
  });

  it('§5: a load-bearing flag whose strike span is not verbatim in the passage refuses', () => {
    const flag = { ...GOOD, loadBearing: true, strike: { span: 'the horse was vindicated', lines: [4] } };
    const drifted = readContentFlags({ id: 'p', contentFlags: [flag], extract: 'nothing of the sort' });
    expect(drifted.refusals[0]?.code).toBe('STRIKE_SPAN_DRIFTED');
    const verbatim = readContentFlags({ id: 'p', contentFlags: [flag], extract: 'and so the horse was vindicated at once' });
    expect(verbatim.refusals).toHaveLength(0);
  });

  it('§5: an assertive reason with loadBearing false is REPORTED, never refused', () => {
    const r = readContentFlags({
      id: 'p',
      contentFlags: [{ ...GOOD, reason: 'the narrative immediately vindicates the horse', loadBearing: false }],
      extract: 't',
    });
    expect(r.refusals).toHaveLength(0);
    expect(r.reported).toHaveLength(1);
  });

  it('legacy shapes are a CENSUS, never refused — the reader does not decide the twenty-six', () => {
    const r = readContentFlags({
      id: 'p',
      contentFlags: ['a bare string flag', { element: 'x', reason: 'y', recommendation: 'KEEP' }],
      extract: 't',
    });
    expect(r.refusals).toHaveLength(0);
    expect(r.legacy).toEqual({ strings: 1, objects: 1 });
  });

  it('R173: a non-array contentFlags refuses the shape rather than returning empty', () => {
    const r = readContentFlags({ id: 'p', contentFlags: 'oops' as never, extract: 't' });
    expect(r.refusals[0]?.code).toBe('UNPARSEABLE_FLAG');
    expect(r.refusals[0]?.detail).toContain('refusing the shape, not returning empty');
  });
});
