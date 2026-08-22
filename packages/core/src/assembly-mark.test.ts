import { describe, expect, it } from 'vitest';
import { assemblyBanner, assemblyOf } from '../../../scripts/lib/assembly-mark';

describe('the hand-made mark is unforgeable by absence', () => {
  it('an artefact with NO assembly field is HAND-ASSEMBLED', () => {
    expect(assemblyOf({ what: 'a proposal' }).assembly).toBe('ASSEMBLED_BY_HAND');
    expect(assemblyOf(null).assembly).toBe('ASSEMBLED_BY_HAND');
  });

  it('a hand-assembled banner warns that claims cannot be re-derived', () => {
    expect(assemblyBanner(assemblyOf({}))).toContain('ACCOUNT OF THE STORE, NOT THE STORE');
    expect(assemblyBanner(assemblyOf({}))).toContain('Check any such claim against');
  });

  it('generated carries the script so a claim can be re-derived', () => {
    const m = assemblyOf({ assembly: { assembly: 'GENERATED_FROM_ROWS', generatedBy: 'export-x.ts' } });
    expect(m.assembly).toBe('GENERATED_FROM_ROWS');
    expect(assemblyBanner(m)).toContain('export-x.ts');
  });

  it('generated-then-edited reads as an account, because the edit is unverifiable', () => {
    expect(assemblyOf({ assembly: 'GENERATED_THEN_EDITED' }).readAs).toContain('account rather than a read');
  });

  it('an unknown value falls to HAND rather than passing', () => {
    expect(assemblyOf({ assembly: 'SOMETHING_ELSE' }).assembly).toBe('ASSEMBLED_BY_HAND');
  });
});
