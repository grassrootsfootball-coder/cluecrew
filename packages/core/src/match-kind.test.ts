import { describe, expect, it } from 'vitest';
import { classifyMatch, describeMatches } from '../../../scripts/lib/match-kind';

describe('a match carries its kind', () => {
  it('a register citation is NOT an input — the case that produced the seven', () => {
    const m = classifyMatch('docs/authoring-calibration-log.md', '`WSREDRAFT1.json` (2 August)');
    expect(m.kind).toBe('REGISTER');
    expect(m.isInput).toBe(false);
  });

  it('a path constant IS an input', () => {
    const m = classifyMatch('scripts/x.ts', "const SOURCE = '/Users/davidb/Downloads/REISSUESIXITEMS.json';");
    expect(m.kind).toBe('PATH_CONSTANT');
    expect(m.isInput).toBe(true);
  });

  it('a comment naming a file is prose, not a read', () => {
    const m = classifyMatch('scripts/x.ts', ' * `REISSUESIXITEMS.json` named six items');
    expect(m.isInput).toBe(false);
  });

  it('direction is read from the path, never guessed from the name', () => {
    expect(classifyMatch('s.ts', 'x', '/Users/davidb/Downloads/11+/from-cluecrew/a.json').direction).toBe('OUTBOUND');
    expect(classifyMatch('s.ts', 'x', 'content/exports/a.json').direction).toBe('OUTBOUND');
    expect(classifyMatch('s.ts', 'x', '/Users/davidb/Downloads/a.json').direction).toBe('INBOUND');
  });

  it('the summary never ships a count without its kinds', () => {
    const s = describeMatches([
      classifyMatch('docs/authoring-calibration-log.md', 'a'),
      classifyMatch('scripts/x.ts', "const P = 'a.json';"),
    ]);
    expect(s).toContain('1 that can cause a read');
    expect(s).toContain('REGISTER 1');
  });
});
