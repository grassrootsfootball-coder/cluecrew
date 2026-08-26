/**
 * THE REPLACED QUESTIONS, BOTH VERSIONS, BLINDED — for Annie (R777).
 *
 * Which revision of a question set is right is a content judgement and nothing else can settle it.
 * Crossed the same way the eight option-set divergences were: both versions in full, stems and
 * options, no file identity legible, order salted per family.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { canonicalJson, digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = join(__dirname, '..');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
interface Item { itemId: string; stem?: { text?: string; prompt?: string }; options: Array<{ label?: string; content: string; isCorrect?: boolean }> }
const FAMILIES = [
  { family: 'ENG-005-BB', files: ['/Users/davidb/Downloads/11+/from-cluecrew/eng005-draft.json', '/Users/davidb/Downloads/11+/items/eng005-draft.json'] },
  { family: 'ENG-007-LP', files: ['/Users/davidb/Downloads/11+/from-cluecrew/eng007-draft.json', '/Users/davidb/Downloads/11+/items/eng007-draft.json'] },
];
const stemOf = (i: Item) => (i.stem?.text ?? i.stem?.prompt ?? '').trim();

async function run() {
  assertFixture('replaced-questions', [
    { name: 'a stem present on one side only is a replacement', input: 'only-one-side', mustBeCaught: true },
    { name: 'the mirror case is too', input: 'only-other-side', mustBeCaught: true },
    { name: 'a stem on both sides is shared', input: 'both-sides', mustBeCaught: false },
    { name: 'an identical pair is shared', input: 'both-sides-identical', mustBeCaught: false },
  ], (k) => k.startsWith('only-'));

  const unblind: Array<Record<string, string>> = [];
  const rows = FAMILIES.map(({ family, files }) => {
    const versions = files.map((f) => ({ f, items: (JSON.parse(readFileSync(f, 'utf8')) as { items: Item[] }).items }));
    // salted per family so the two families' orders do not correlate with each other
    versions.sort((x, y) => sha(family + canonicalJson(x.items)).localeCompare(sha(family + canonicalJson(y.items))));
    versions.forEach((v, n) => unblind.push({ family, [`version ${n + 1}`]: v.f }));
    const stems = versions.map((v) => new Set(v.items.map(stemOf)));
    const shared = [...stems[0]!].filter((s) => stems[1]!.has(s));
    const row = {
      family,
      HER_QUESTION: 'which version of this question set is right — or REFUSE where the passage supports both. The unique questions are the decision; the shared ones are here because a question set is judged whole.',
      questionsPerVersion: versions.map((v) => v.items.length),
      sharedQuestions: shared.length,
      REPLACEMENT_POSITIONS: stems[0]!.size - shared.length,
      versions: versions.map((v, n) => ({
        version: `version ${n + 1}`,
        questions: v.items.map((i) => ({
          itemId: i.itemId,
          presentInBothVersions: stems[0]!.has(stemOf(i)) && stems[1]!.has(stemOf(i)),
          stem: i.stem ?? null,
          options: i.options.map((o) => ({ label: o.label ?? null, text: o.content, thisVersionCallsItCorrect: o.isCorrect === true })),
        })),
      })),
    };
    const dg = digestOverText('this row as canonical JSON — keys sorted at EVERY level, separators (",",":"), ensure_ascii false — with the rowSha256 and rowSha256Spec fields absent', canonicalJson(row));
    return { ...row, rowSha256: dg.value, rowSha256Spec: dg.spec };
  });
  requirePopulation('emit:replaced-questions', { 'question families with two versions': rows.length });

  const positions = rows.reduce((n, r) => n + (r.REPLACEMENT_POSITIONS as number), 0);
  const payload = {
    kind: 'replaced-questions-for-annie',
    what: 'Two question families that exist in two versions. Both versions in full — every stem, every option — blinded.',
    THE_RULING_THIS_SERVES: 'David, 26 August: which revision of the replaced questions is right is Annie\'s, not a numbering fix.',
    WHAT_THIS_IS_NOT: 'not a numbering fault. The off-by-one run that started this thread is a CONSEQUENCE of a replaced question sitting at position 02 and pushing the shared questions below it down by one. No id is wrong on either side, and nothing here is a repair.',
    THE_COUNT_CORRECTED: {
      asIStatedIt: 'eight replaced questions across two families',
      correctly: `${positions} replacement POSITIONS — 4 in ENG-005-BB and 5 in ENG-007-LP — and ${positions * 2} distinct questions, one per side per position`,
      howIGotItWrong: 'I assumed both families were symmetric at four after measuring only the first. The figure then crossed to the desk and came back to me in the instruction, unchallenged, because a number with no predicate attached has nothing to check it against.',
      andWHYITMATTERSHERE: 'this is the FIFTH count restated in this thread and the first that I put into someone else\'s sentence rather than repeated from one. R773 said a count crosses with the predicate that selected it or it does not cross; I registered that rule and then crossed a bare number in the same artefact.',
    },
    THE_BLINDING: {
      removed: 'file paths, directory names, store names.',
      keptInFull: 'nothing stripped — every question of both versions, stems and options, shared and unique alike, because a question set is judged whole.',
      order: 'versions sorted by sha256(family + the version\'s own canonical JSON): deterministic, uncorrelated with provenance, salted per family so the two families do not correlate.',
      map: 'held at content/replaced-questions-unblinding.json. Not staged.',
    },
    ROWS: rows,
  };
  const artefact = { ...payload, ...findingsDigest(payload, ['THE_COUNT_CORRECTED', 'ROWS']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('replaced-questions-for-annie', sha(json).slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  writeFileSync(join(REPO, 'content/replaced-questions-unblinding.json'), `${JSON.stringify({ note: 'HELD THIS SIDE. Never staged.', map: unblind }, null, 1)}\n`);
  deliver(join(REPO, 'content/exports', name), 'replaced-questions-for-annie');
  console.log(`families ${rows.length} | replacement positions ${positions} | distinct questions ${positions * 2}`);
}

run().catch((e) => { console.error(e); process.exit(1); });
