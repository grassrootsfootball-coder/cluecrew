/**
 * HER THREE TREASURE-ISLAND CONVERSIONS, LANDED THROUGH THE EXTENDED READER (ninety-second return).
 *
 * Fields hers verbatim from the block. The two legacy strings they replace are stamped as
 * displaced — and her sourceProse rule is satisfied BY CONSTRUCTION: each object carries its
 * original string verbatim, so the displacement destroys nothing the objects do not hold.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readContentFlags } from '../packages/core/src/index';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const PASSAGE = join(REPO, 'content/passages/stream-a-01-treasure-island.json');
const RETURN = '/Users/davidb/Downloads/annie-ninetysecond-return.md';
const EXPECTED = '9acaeb8a9765e59d0ec5078a5b165927c1e7d2cbbebee70413cf1a4722b3ff59';

const sha = createHash('sha256').update(readFileSync(RETURN)).digest('hex');
if (sha !== EXPECTED) throw new Error(`ABORTED — return digest ${sha}.`);

/** Her three objects, parsed from the block's own JSON — never re-typed. */
const body = readFileSync(RETURN, 'utf8');
const authored = [...body.matchAll(/^\s+authored: (\{.*\})$/gm)].map((m) => JSON.parse(m[1] as string) as Record<string, unknown>);
if (authored.length !== 3) throw new Error(`ABORTED — expected 3 authored objects in her block, parsed ${authored.length}.`);

const passage = JSON.parse(readFileSync(PASSAGE, 'utf8')) as Record<string, unknown>;
const legacy = (passage.contentFlags as unknown[]) ?? [];
if (legacy.length !== 2 || legacy.some((f) => typeof f !== 'string')) {
  throw new Error(`ABORTED — expected exactly 2 legacy strings on the row, found ${JSON.stringify(legacy).slice(0, 80)}.`);
}
// The byte-guard: each replaced string must be the one her sourceProse quotes verbatim.
const [flag1, flag2] = legacy as [string, string];
if (authored[0]!.sourceProse !== flag1) throw new Error('ABORTED — legacy flag 1 differs from her sourceProse; her conversion must not paper an unexplained change.');
if (authored[2]!.sourceProse !== flag2) throw new Error('ABORTED — legacy flag 2 differs from her sourceProse.');

const wouldBe = {
  ...passage,
  contentFlags: authored,
  _displacedLegacyFlags: {
    displaced: legacy,
    by: `annie-ninetysecond-return.md, sha256 ${sha}`,
    note: 'Each original string travels verbatim in its conversion\'s sourceProse (the split pair shares flag 1\'s), so this stamp is a convenience and the objects are the record.',
  },
};
const report = readContentFlags(wouldBe, { enforceUse: true });
if (report.refusals.length > 0) {
  console.error('THE DOOR REFUSES — nothing written:');
  for (const r of report.refusals) console.error(`  ${r.code}  ${r.detail}`);
  process.exitCode = 1;
} else {
  writeFileSync(PASSAGE, JSON.stringify(wouldBe, null, 1));
  console.log(`landed ${report.standardFlags.length} conversion(s); reported-not-refused: ${report.reported.length}`);
  for (const s of report.reported) console.log(`  ${s}`);
}
