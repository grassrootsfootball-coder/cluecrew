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
  it('the canary holds at 21+6 — her amended source: 20 populated + self-harm, six in-row cases with home rows', () => {
    expect(axesTableCanary().holds).toBe(true);
    expect(axesTableCanary().detail).toContain('21+6');
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

describe('her two strike states (ninety-second return §1)', () => {
  const BASE = {
    axis: 'alcohol', element: 'rum', severity: 'mild', disposition: 'keep',
    condition: null, conditionMetBy: null, reason: 'Incidental period detail with no approving comment.',
    judgedBy: 'Annie', judgedAt: '2026-08-22',
  };

  it('ABSENCE-CLAIM-NO-SPAN on a load-bearing flag is valid, REPORTED every run, never refused', () => {
    const r = readContentFlags({ id: 'p', contentFlags: [{ ...BASE, loadBearing: true, strike: 'ABSENCE-CLAIM-NO-SPAN' }], extract: 'text' });
    expect(r.refusals).toHaveLength(0);
    expect(r.standardFlags).toHaveLength(1);
    expect(r.reported.some((s) => s.includes('ABSENCE-CLAIM-NO-SPAN'))).toBe(true);
  });

  it('PENDING-BYTES is valid while the passage is absent, and reported as awaiting it', () => {
    const r = readContentFlags({ id: 'p', contentFlags: [{ ...BASE, loadBearing: true, strike: 'PENDING-BYTES' }] });
    expect(r.refusals).toHaveLength(0);
    expect(r.reported.some((s) => s.includes('PENDING-BYTES'))).toBe(true);
  });

  it('PENDING-BYTES refuses when the passage IS present — a landing that skipped the gate', () => {
    const r = readContentFlags({ id: 'p', contentFlags: [{ ...BASE, loadBearing: true, strike: 'PENDING-BYTES' }], extract: 'the bytes are here' });
    expect(r.refusals[0]?.code).toBe('STRIKE_SPAN_DRIFTED');
    expect(r.refusals[0]?.detail).toContain('skipped the gate');
  });

  it('a converted object counts as standard-shape, so the legacy census decrements as conversions land', () => {
    const converted = { ...BASE, loadBearing: true, strike: 'ABSENCE-CLAIM-NO-SPAN',
      judgedBy: 'Annie', convertedBy: 'Annie', convertedAt: '2026-08-22',
      sourceProse: 'the original string verbatim', splitNote: 'one of two' };
    const r = readContentFlags({ id: 'p', contentFlags: [converted, 'a still-legacy string'], extract: 't' });
    expect(r.standardFlags).toHaveLength(1);
    expect(r.legacy.strings).toBe(1);
    expect(r.standardFlags[0]?.sourceProse).toBe('the original string verbatim');
  });
});

describe('converted flags and §2 (do not invent provenance backwards)', () => {
  const CONV = {
    axis: 'alcohol', element: 'rum', severity: 'mild', disposition: 'keep',
    condition: null, conditionMetBy: null, reason: 'Incidental period detail.',
    judgedBy: 'UNRECORDED', judgedAt: 'UNRECORDED',
    convertedBy: 'Annie', convertedAt: '2026-08-22', sourceProse: 'the original',
  };
  it('judgedBy UNRECORDED is accepted beside a convertedBy from MAY_JUDGE — the conversion is the judged act', () => {
    const r = readContentFlags({ id: 'p', contentFlags: [CONV], extract: 't' });
    expect(r.refusals).toHaveLength(0);
    expect(r.standardFlags).toHaveLength(1);
  });
  it('UNRECORDED with no named converter refuses as before', () => {
    const r = readContentFlags({ id: 'p', contentFlags: [{ ...CONV, convertedBy: undefined }], extract: 't' });
    expect(r.refusals[0]?.code).toBe('UNJUDGED_FLAG');
  });
});

describe('the second-pass form rulings (ninety-third §2)', () => {
  const BASE = {
    axis: 'unkindness-and-mockery', element: 'x', severity: 'mild', disposition: 'keep',
    condition: 'a teacher note could point this out', reason: 'r',
    judgedBy: 'UNRECORDED', judgedAt: 'UNRECORDED', convertedBy: 'Annie', convertedAt: '2026-08-22',
  };
  it('a WAIVED conditionMetBy with date, name and reason discharges at write AND at use, and is reported', () => {
    const flag = { ...BASE, conditionMetBy: 'WAIVED 2026-08-21 by Annie: no accompanying-material channel exists' };
    const atUse = readContentFlags({ id: 'p', contentFlags: [flag], extract: 't' }, { enforceUse: true });
    expect(atUse.refusals).toHaveLength(0);
    expect(atUse.reported.some((s) => s.includes('WAIVED condition'))).toBe(true);
  });
  it('a WAIVED without its date, name and reason refuses — a waiver without them is a silent keep', () => {
    const flag = { ...BASE, conditionMetBy: 'WAIVED because it seemed fine' };
    const r = readContentFlags({ id: 'p', contentFlags: [flag], extract: 't' });
    expect(r.refusals[0]?.code).toBe('CONDITION_MISSING');
  });
  it('a note field with movedFrom passes as a known key — an obligation nobody will discharge lives nowhere', () => {
    const flag = { ...BASE, condition: null, conditionMetBy: null,
      note: 'a reviewer may flag it (movedFrom: condition; reclassified, Annie, forty-fifth return)' };
    const r = readContentFlags({ id: 'p', contentFlags: [flag], extract: 't' });
    expect(r.refusals).toHaveLength(0);
    expect(r.standardFlags[0]?.note).toContain('movedFrom');
  });
  it('a prefixed PENDING-BYTES ("PENDING-BYTES: <claim>") is the pending state, not a drifted span', () => {
    const flag = { ...BASE, condition: null, conditionMetBy: null, loadBearing: true,
      strike: 'PENDING-BYTES: the rabbit is unhurt' };
    const r = readContentFlags({ id: 'p', contentFlags: [flag] });
    expect(r.refusals).toHaveLength(0);
    expect(r.reported.some((s) => s.includes('PENDING-BYTES'))).toBe(true);
  });
});

describe('the unified strike states (ninety-sixth §1)', () => {
  const BASE = {
    axis: 'period-attitudes-and-prejudice', element: 'x', severity: 'mild', disposition: 'keep',
    condition: null, conditionMetBy: null, reason: 'Presented comically rather than approvingly.',
    judgedBy: 'UNRECORDED', judgedAt: 'UNRECORDED', convertedBy: 'Annie', convertedAt: '2026-08-22',
    loadBearing: true,
  };
  it('DECLARED(whole-passage-tone) is valid, counted by kind, reported every run', () => {
    const r = readContentFlags({ id: 'p', contentFlags: [{ ...BASE, strike: 'DECLARED(whole-passage-tone)' }], extract: 't' });
    expect(r.refusals).toHaveLength(0);
    expect(r.declared).toEqual([{ where: 'p contentFlags[0]', kind: 'whole-passage-tone' }]);
  });
  it('an unknown kind refuses, and the refusal says a new kind is her ruling, not a write', () => {
    const r = readContentFlags({ id: 'p', contentFlags: [{ ...BASE, strike: 'DECLARED(vibes)' }], extract: 't' });
    expect(r.refusals[0]?.detail).toContain('A new KIND is her ruling, not a write');
  });
  it('the retired ABSENCE-CLAIM-NO-SPAN is honoured as DECLARED(absence) and marked awaiting migration', () => {
    const r = readContentFlags({ id: 'p', contentFlags: [{ ...BASE, strike: 'ABSENCE-CLAIM-NO-SPAN' }], extract: 't' });
    expect(r.refusals).toHaveLength(0);
    expect(r.declared[0]?.kind).toBe('absence');
    expect(r.reported.some((s) => s.includes('retired alias'))).toBe(true);
  });
  it('SPAN PENDING-BYTES is the pending state under the unified naming too', () => {
    const r = readContentFlags({ id: 'p', contentFlags: [{ ...BASE, strike: 'SPAN PENDING-BYTES: she states plainly' }] });
    expect(r.refusals).toHaveLength(0);
  });
});

describe('ruling eleven: screening records (hundred-and-third §2)', () => {
  const SCREEN = { kind: 'screened-clean', axes: ['violence-between-people'], scope: 'the whole extract',
    declaration: 'No violence anywhere in the extract.', judgedBy: 'UNRECORDED', convertedBy: 'Annie' };
  it('a screened-clean record with tabled axes and a converting name parses as a screening, not a flag', () => {
    const r = readContentFlags({ id: 'p', contentFlags: [], contentScreenings: [SCREEN], extract: 't' });
    expect(r.screenings).toHaveLength(1);
    expect(r.standardFlags).toHaveLength(0);
    expect(r.refusals).toHaveLength(0);
  });
  it('a recorded zero carries its axes — an untabled or absent axis refuses', () => {
    const r = readContentFlags({ id: 'p', contentScreenings: [{ ...SCREEN, axes: ['not-an-axis'] }], extract: 't' });
    expect(r.refusals[0]?.code).toBe('UNKNOWN_AXIS');
    const r2 = readContentFlags({ id: 'p', contentScreenings: [{ ...SCREEN, axes: [] }], extract: 't' });
    expect(r2.refusals[0]?.code).toBe('UNKNOWN_AXIS');
  });
  it('an unruled screening kind refuses — a new kind is her ruling, not a write', () => {
    const r = readContentFlags({ id: 'p', contentScreenings: [{ ...SCREEN, kind: 'screened-fine' }], extract: 't' });
    expect(r.refusals[0]?.detail).toContain('her ruling, not a write');
  });
});
