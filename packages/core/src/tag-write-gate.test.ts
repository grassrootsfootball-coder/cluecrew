/**
 * THE vr-02 PREDICATES CARRY THEIR OWN FIXTURE (R721): a case each predicate MUST catch, and a
 * case it must leave alone. A gate that only ever refuses has not been shown to discriminate.
 *
 * The stem is Annie's own instance from the 224th — apple/van/pear/bus/plum, odd ones van and bus.
 */
import { describe, it, expect } from 'vitest';
import { checkTagWrite } from './tag-write-gate';

const STEM = { words: ['apple', 'van', 'pear', 'bus', 'plum'], prompt: 'Which two are the odd ones out?' };
const KEY = 'van,bus';
/** The vr-02 predicates consult no lexicon; a lexicon that always refuses proves it. */
const noLexicon = () => false;
const run = (optionValue: string, misconceptionId: string) =>
  checkTagWrite({ stem: STEM, optionValue, keyValue: KEY, misconceptionId }, noLexicon);

describe('vr-02 tag predicates (Annie, 224th)', () => {
  it('answered-the-opposite PERFORMS when both chosen words sit inside the group', () => {
    expect(run('pear,plum', 'vr02-answered-the-opposite').verdict).toBe('PERFORMS');
  });

  it('answered-the-opposite REFUSES when one chosen word is an odd one', () => {
    expect(run('van,apple', 'vr02-answered-the-opposite').verdict).toBe('REFUSES');
  });

  it('partial-group PERFORMS on one odd word plus one group member', () => {
    expect(run('van,apple', 'vr02-partial-group').verdict).toBe('PERFORMS');
  });

  it('partial-group REFUSES when neither chosen word is odd', () => {
    expect(run('pear,plum', 'vr02-partial-group').verdict).toBe('REFUSES');
  });

  /** The ruling itself: the alliteration is the attraction, not the act. */
  it('surface-link REFUSES on a pair lying wholly inside the group, however alike the words sound', () => {
    const r = run('pear,plum', 'vr02-surface-link');
    expect(r.verdict).toBe('REFUSES');
    expect(r.why).toContain('answering the opposite question');
  });

  /** And it must NOT refuse where the judgement is genuinely semantic, or it is not discriminating. */
  it('surface-link stays UNDECIDED when the pair includes an odd word', () => {
    expect(run('van,apple', 'vr02-surface-link').verdict).toBe('UNDECIDED');
  });

  it('refuses to guess from a stem it cannot read, rather than returning an empty verdict (R173)', () => {
    const r = checkTagWrite({ stem: {}, optionValue: 'pear,plum', keyValue: KEY, misconceptionId: 'vr02-answered-the-opposite' }, noLexicon);
    expect(r.verdict).toBe('UNDECIDED');
  });
});
