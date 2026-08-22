/**
 * THE FIRST TWO STANDARD-SHAPE FLAGS, LANDED THROUGH THE READER (R628's first caller — the door).
 *
 * Fields hers verbatim from RAILWAYFLAGSLANDED (the authoring store's landing, her judgements of
 * 2026-08-21), axes from her CONTENT_AXES ruling — the two her ninetieth names as unfrozen. The
 * write happens ONLY if `readContentFlags` accepts the would-be passage: the door refuses before
 * the disk changes, which is what a door is.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readContentFlags } from '../packages/core/src/index';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const PASSAGE = join(REPO, 'content/passages/stream-a-02-railway-children.json');
const SOURCE = '/Users/davidb/Downloads/RAILWAYFLAGSLANDED.json';

const src = JSON.parse(readFileSync(SOURCE, 'utf8')) as {
  flagsReadBack: Array<{ axis: string; fieldsHersVerbatim: Record<string, unknown>; strike: unknown }>;
};
const srcSha = createHash('sha256').update(readFileSync(SOURCE)).digest('hex');
const passage = JSON.parse(readFileSync(PASSAGE, 'utf8')) as Record<string, unknown>;
const extract = String(passage.extract);

// The load-bearing span, taken FROM OUR OWN EXTRACT's bytes — the claim is "the text marks the
// episode as nothing" and the supporting span is the mother's line-45 comment.
const SPAN_ANCHOR = "the cups and saucers, I mean";
const at = extract.indexOf(SPAN_ANCHOR);
if (at === -1) throw new Error('ABORTED — the strike anchor is not in this store\'s extract.');
const span = extract.slice(extract.lastIndexOf('“', at), extract.indexOf('said Mother', at) + 'said Mother'.length);

const flags = src.flagsReadBack.map((f) => ({
  ...f.fieldsHersVerbatim,
  axis: f.axis,
  ...(f.fieldsHersVerbatim.loadBearing === true
    ? { strike: { span, lines: [41, 42, 43, 44, 45], claim: 'the text marks the episode as nothing', authoringStoreStrike: f.strike } }
    : {}),
  landedFrom: `RAILWAYFLAGSLANDED.json, sha256 ${srcSha} — fields hers verbatim, judged 2026-08-21`,
}));

const wouldBe = { ...passage, contentFlags: flags };
const report = readContentFlags(wouldBe, { enforceUse: true });
if (report.refusals.length > 0) {
  console.error('THE DOOR REFUSES — nothing written:');
  for (const r of report.refusals) console.error(`  ${r.code}  ${r.detail}`);
  process.exitCode = 1;
} else {
  writeFileSync(PASSAGE, JSON.stringify(wouldBe, null, 1));
  console.log(`landed ${report.standardFlags.length} flag(s) through the door; ${report.reported.length} reported-not-refused.`);
}
