/**
 * THE DOUBLED CLAUSE, TRACED TO ITS WRITE (David, 2026-08-22 — R633). For Annie's ruling; the row
 * is HELD UNTOUCHED and nothing further lands on this passage until it crosses.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const PASSAGE = join(REPO, 'content/passages/stream-a-03-wind-in-willows.json');

const passage = JSON.parse(readFileSync(PASSAGE, 'utf8')) as Record<string, unknown>;
const row = (passage.contentFlags as unknown[])[0];
if (typeof row !== 'string') throw new Error('ABORTED — flag 0 is no longer the legacy string; the hold may have been broken.');
const fault = ((passage.flagRecordFaults ?? []) as Array<Record<string, unknown>>).find((f) => f.flagIndex === 0) ?? null;

const ORIGINAL = 'The Mole knocks over an elderly rabbit who asks him for a toll and jeers about onion sauce, a joke about rabbit being served as food. Recommendation: keep. It is brief comic rudeness, the rabbit is unhurt and the tone is farcical rather than cruel; a teacher note could point out that the Mole is being cheeky, not admirable.';
const HER_CLAUSE = 'the text does not return to him, and the tone is farcical rather than cruel';
const reconstruction = ORIGINAL.replace('the rabbit is unhurt', HER_CLAUSE);
if (reconstruction !== row) throw new Error('ABORTED — the reconstruction no longer matches the row; the trace below would be a story, not a proof.');

const payload = {
  what: 'The Wind in the Willows legacy flag with its doubled clause, traced to the write that produced it. The row is HELD UNTOUCHED; nothing further lands on this passage until Annie rules.',
  theRowVerbatim: row,
  theTrace: {
    writtenBy: 'scripts/apply-annie-reason-rewrites.ts, executing her twenty-second return (R369)',
    theWriteItMade: "flags[0].replace('the rabbit is unhurt', <her authored clause read from her file>)",
    herAuthoredClause: HER_CLAUSE,
    herClauseWasFor: 'THE REASON CLAUSE — "the rabbit is unhurt and the tone is farcical rather than cruel" — her replacement itself carries the tone half, which is how she authored it as a whole-clause replacement.',
    theAnchorTheScriptUsed: 'the rabbit is unhurt — SHORTER than the clause her replacement covers',
    theMechanism: 'Substituting a whole-clause replacement at a sub-clause anchor keeps the row\'s own tail, so "…and the tone is farcical rather than cruel" survives once from her clause and once from the row: doubled.',
    theDoublingWasIn: 'THE WRITE. Her twenty-second return is clean (single clause, digest d4b4837e…); the pre-write row is clean (the sourceProse her ninety-third quotes); reconstruction of original+replace equals the row BYTE FOR BYTE.',
    reconstructionEqualsRow: true,
    theStampItLeft: fault,
    theFamily: 'R87: str.replace with an anchor carrying less than the edit\'s true span. The script guarded that the anchor was PRESENT and could not see that the replacement overlapped the row\'s remainder.',
  },
  theSecondDivergence: 'The authoring store\'s copy still reads "the rabbit is unhurt…" — her twenty-second rewrite landed only here (and doubled). Two stores, two texts, both wrong differently: theirs lacks her ruling, ours mangled it.',
  held: 'The row stays as it is, beside her two landed conversions. Nothing further lands on stream-a-03 until her ruling crosses.',
};
const stamp = artefactStamp(payload, new Date().toISOString(), 'content',
  'the doubled WiW clause traced to its write, held for her ruling',
  ['what', 'theRowVerbatim', 'theTrace', 'theSecondDivergence', 'held']);
const out = join(REPO, 'content/exports', stampedName('wiw-doubled-clause-trace', stamp.sourceHash, 'json'));
writeFileSync(out, JSON.stringify({ stamp, ...payload }, null, 2));
deliver(out, 'wiw-doubled-clause-trace');
