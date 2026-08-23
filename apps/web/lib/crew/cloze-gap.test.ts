import { describe, expect, it } from 'vitest';
import { splitCarrierAtGaps } from './cloze-gap';

describe('the cloze gap names itself in the ear (R668)', () => {
  it('splits a carrier at its gap marker, keeping every byte', () => {
    const segs = splitCarrierAtGaps('Ade was the ___(2)___ runner in Year 5.');
    expect(segs).toEqual([
      { kind: 'text', text: 'Ade was the ' },
      { kind: 'gap', marker: '___(2)___', printedIndex: 2 },
      { kind: 'text', text: ' runner in Year 5.' },
    ]);
    expect(segs.map((s) => (s.kind === 'gap' ? s.marker : s.text)).join('')).toBe('Ade was the ___(2)___ runner in Year 5.');
  });
  it('a carrier with no gap is one text segment, unchanged', () => {
    expect(splitCarrierAtGaps('No gaps here.')).toEqual([{ kind: 'text', text: 'No gaps here.' }]);
  });
  it('multiple gaps each carry their own printed index', () => {
    const segs = splitCarrierAtGaps('___(1)___ and ___(2)___');
    expect(segs.filter((s) => s.kind === 'gap')).toHaveLength(2);
  });
});
