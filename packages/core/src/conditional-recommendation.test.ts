import { describe, expect, it } from 'vitest';
import {
  blocksPublishing, blocksServing, newCondition, refuseFlagAtAuthoring, verdictReopens,
  type ConditionalFlag,
} from './conditional-recommendation';

const wiw = (): ConditionalFlag => ({
  element: 'The Mole knocks over an elderly rabbit.',
  verdict: 'KEEP_IF',
  why: 'The text does not return to him, and the tone is farcical rather than cruel.',
  condition: newCondition(
    'A teacher note points out that the Mole is being cheeky, not admirable.',
    'ACCOMPANYING_MATERIAL', 'reviewer:rev-0001', '2026-09-30',
  ),
});

describe('the four decisions, refused at authoring', () => {
  it('a condition with no owner is refused — an obligation with nobody to meet it is UNMET forever', () => {
    const f = wiw();
    f.condition!.owner = '';
    expect(refuseFlagAtAuthoring(f).join(' ')).toContain('no owner');
  });

  it('a condition with no reviewBy date is refused', () => {
    const f = wiw();
    f.condition!.reviewBy = '';
    expect(refuseFlagAtAuthoring(f).join(' ')).toContain('no reviewBy');
  });

  it('WAIVED without a reason is refused — a silent keep with extra steps', () => {
    const f = wiw();
    f.condition!.state = 'WAIVED';
    f.condition!.ruledBy = 'reviewer:rev-0001';
    expect(refuseFlagAtAuthoring(f).join(' ')).toContain('no waivedWhy');
  });

  it('a conditional verdict with no condition is refused', () => {
    expect(refuseFlagAtAuthoring({ element: 'x', verdict: 'RETIRE_UNLESS', why: 'y' }).join(' '))
      .toContain('no condition is present');
  });

  it('an UNCONDITIONAL verdict carrying a condition is refused', () => {
    const f = wiw();
    f.verdict = 'KEEP';
    expect(refuseFlagAtAuthoring(f).join(' ')).toContain('a condition is attached');
  });

  it('a well-formed KEEP_IF authors cleanly, and UNMET is written not inferred', () => {
    const f = wiw();
    expect(refuseFlagAtAuthoring(f)).toEqual([]);
    expect(f.condition!.state).toBe('UNMET');
  });
});

describe('the two-verdict split', () => {
  it('KEEP_IF does NOT block serving — Wind in the Willows keeps its 22', () => {
    expect(blocksServing(wiw())).toBe(false);
  });

  it('RETIRE_UNLESS DOES block serving when the condition is unmet', () => {
    const f = wiw();
    f.verdict = 'RETIRE_UNLESS';
    expect(blocksServing(f)).toBe(true);
  });

  it('publishing blocks on BOTH, so the population stops growing', () => {
    const keepIf = wiw();
    const retireUnless = { ...wiw(), verdict: 'RETIRE_UNLESS' as const };
    expect(blocksPublishing(keepIf)).toBe(true);
    expect(blocksPublishing(retireUnless)).toBe(true);
  });

  it('a MET condition blocks neither', () => {
    const f = { ...wiw(), verdict: 'RETIRE_UNLESS' as const };
    f.condition = { ...f.condition!, state: 'MET', metBy: 'teacher-note-wiw-01', ruledBy: 'reviewer:rev-0001' };
    expect(blocksServing(f)).toBe(false);
    expect(blocksPublishing(f)).toBe(false);
  });
});

describe("the reviewBy rider", () => {
  it('past its date and still UNMET, the verdict reopens', () => {
    expect(verdictReopens(wiw(), '2026-10-01')).toBe(true);
  });

  it('before its date it does not', () => {
    expect(verdictReopens(wiw(), '2026-08-21')).toBe(false);
  });
});
