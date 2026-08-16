import { describe, expect, it } from 'vitest';
import { shortRange } from './cited-lines';

describe('shortRange — how the "go to lines" control names the cited window', () => {
  it('names a single line without a range', () => {
    expect(shortRange([8])).toBe('8');
  });

  it('reads a contiguous run as "29 to 33", not "29-33"', () => {
    expect(shortRange([29, 30, 31, 32, 33])).toBe('29 to 33');
  });

  it('lists scattered lines rather than implying a run between them', () => {
    expect(shortRange([8, 14, 20])).toBe('8, 14, 20');
  });

  it('sorts before deciding, so an unordered citation is not read as scattered', () => {
    expect(shortRange([31, 29, 33, 30, 32])).toBe('29 to 33');
  });

  it('returns nothing for an empty window, because lineRefs [] declares the WHOLE passage', () => {
    expect(shortRange([])).toBe('');
  });
});
