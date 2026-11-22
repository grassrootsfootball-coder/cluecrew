/**
 * BOTH FIXTURES RUN BOTH WAYS — the corroboration route stated as a test (Annie's 228th).
 *
 * *"A list is accepted by passing the fixture rather than by anyone adopting anyone's vocabulary."*
 * So their 36 cases run against this store's two sets, and this store's cases run against theirs.
 * **Neither run imports the other's screen** — a fixture takes two sets and nothing else.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { APPROPRIATENESS_LISTS, APPROPRIATENESS_VERSION } from '../packages/core/src/appropriateness';
import { PORTABLE_CASES, PORTABLE_FIXTURE_VERSION, runAgainst, assertNegativeControls, type CaseKind } from '../packages/core/src/appropriateness-fixture';
import { requirePopulation } from './lib/population';
import { findingsDigest, digestsBlock } from './lib/findings-digest';
import { deliver, stampedName } from './lib/export-destination';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const LANE = pjoin(DL, '11+', 'from-cluecrew');
const sha = (s: string | Buffer) => createHash('sha256').update(typeof s === 'string' ? Buffer.from(s, 'utf8') : s).digest('hex');

type TheirCase = { word: string; reason: string };
type TheirFixture = {
  TWO_THE_FIXTURE_AS_THE_THING_THAT_CROSSES: {
    THE_ARTEFACT: { MUST_REFUSE: TheirCase[]; MUST_NOT_REFUSE: TheirCase[]; SUBSTRING_TRAPS: TheirCase[]; NEEDS_A_SENSE: TheirCase[] };
    runAgainstTHISstoresList: { passing: number; of: number };
  };
};

function main() {
  const theirBytes = readFileSync(pjoin(DL, 'cowork-fixture-for-code.json'));
  if (!sha(theirBytes).startsWith('7e0a5956e807184d')) throw new Error(`their fixture does not verify: ${sha(theirBytes).slice(0, 16)}`);
  const theirs = JSON.parse(theirBytes.toString('utf8')) as TheirFixture;
  const A = theirs.TWO_THE_FIXTURE_AS_THE_THING_THAT_CROSSES.THE_ARTEFACT;

  /** Their cases, read from their artefact rather than transcribed. */
  const theirCases: Array<{ word: string; kind: CaseKind; reason: string }> = [
    ...A.MUST_REFUSE.map((c: TheirCase) => ({ word: c.word, kind: 'MUST_REFUSE' as const, reason: c.reason })),
    ...A.MUST_NOT_REFUSE.map((c: TheirCase) => ({ word: c.word, kind: 'MUST_NOT_REFUSE' as const, reason: c.reason })),
    ...A.SUBSTRING_TRAPS.map((c: TheirCase) => ({ word: c.word, kind: 'SUBSTRING_TRAP' as const, reason: c.reason })),
    ...A.NEEDS_A_SENSE.map((c: TheirCase) => ({ word: c.word, kind: 'NEEDS_A_SENSE' as const, reason: c.reason })),
  ];
  requirePopulation('cross-the-fixtures', { 'their case(s)': theirCases.length, 'this store\'s case(s)': PORTABLE_CASES.length });

  const myRefuse = new Set(APPROPRIATENESS_LISTS.refuse);
  const myFlag = new Set([...APPROPRIATENESS_LISTS.flagAmbiguousSense, ...APPROPRIATENESS_LISTS.flagNeedsContext]);

  /** Their fixture, run against this store's two sets. Same semantics they published. */
  const runTheirCases = (R: Set<string>, F: Set<string>) => theirCases.map((c) => {
    const w = c.word.toLowerCase(); const inR = R.has(w), inF = F.has(w);
    const passed = c.kind === 'MUST_REFUSE' ? inR
      : c.kind === 'MUST_NOT_REFUSE' || c.kind === 'SUBSTRING_TRAP' ? !inR
      : inR || inF;
    return { ...c, passed, saw: inR && inF ? 'BOTH' : inR ? 'refuse' : inF ? 'flag' : 'neither' };
  });
  const theirsOnMine = runTheirCases(myRefuse, myFlag);
  const theirsOnMineFail = theirsOnMine.filter((r) => !r.passed);

  /** Their v2.0 sets, reconstructed from what they published, to run THIS store's cases against. */
  const theirRefuse = new Set<string>(['corpse', 'damn', 'hell', 'nude', 'satan', 'sexy', 'suicide', 'vodka']);
  const theirFlagPublished = new Set<string>(['arms', 'beat', 'blow', 'bust', 'club', 'clubs', 'crack', 'grass', 'high',
    'joint', 'pot', 'shell', 'shells', 'shoot', 'shoots', 'strip', 'stroke', 'trip', 'whip', 'lover', 'drug', 'gun', 'shot', 'stab', 'beer']);
  const mineOnTheirs = runAgainst(theirRefuse, theirFlagPublished);

  const controls = assertNegativeControls();
  const mineOnMine = runAgainst(myRefuse, myFlag);

  const kindOf = (rs: Array<{ kind: CaseKind; passed: boolean }>) => {
    const o: Record<string, { passing: number; of: number }> = {};
    for (const r of rs) { o[r.kind] ??= { passing: 0, of: 0 }; o[r.kind]!.of += 1; if (r.passed) o[r.kind]!.passing += 1; }
    return o;
  };

  const report = {
    kind: 'BOTH-FIXTURES-RUN-BOTH-WAYS',
    TO: 'the authoring store; Annie and David by relay',
    date: '2026-09-05',
    THEIR_FIXTURE_AS_RECEIVED: { file: 'cowork-fixture-for-code.json', sha256: sha(theirBytes), verifiedHere: true, cases: theirCases.length },

    ONE_THEIR_36_AGAINST_THIS_STORES_SETS: {
      passing: `${theirsOnMine.length - theirsOnMineFail.length} of ${theirsOnMine.length}`,
      byKind: kindOf(theirsOnMine),
      failures: theirsOnMineFail.map((f) => ({ word: f.word, kind: f.kind, thisStoreHasItIn: f.saw, theirReason: f.reason })),
      THE_LOVER_CASE: (() => { const r = theirsOnMine.find((x) => x.word === 'lover')!;
        return { passed: r.passed, thisStoreHasItIn: r.saw,
          andWHY: 'their case requires only that a list not SILENTLY PASS it. This store flags it, so at the search it is dropped and never proposed, and at the write gate it holds and routes. A bare pass would have failed this case, and a week ago this store would have refused it outright — which also passes, and is the reading their rule argues against.' }; })(),
    },

    TWO_THIS_STORES_CASES_AGAINST_THEIR_SETS: {
      version: PORTABLE_FIXTURE_VERSION, cases: PORTABLE_CASES.length,
      passing: `${mineOnTheirs.passing} of ${mineOnTheirs.total}`,
      byKind: kindOf(mineOnTheirs.results),
      failures: mineOnTheirs.failures.map((f) => ({ word: f.word, kind: f.kind, theirListHasItIn: f.saw, reason: f.reason })),
      COVERAGE_CAVEAT: 'their flag list is 28 and only 25 are published across both their artefacts. A case failing on a word they may hold unpublished is reported as a failure and is not necessarily one — it is a request for the remaining three (R595).',
    },

    THREE_EACH_AGAINST_ITSELF: {
      thisStoresCasesAgainstThisStoresSets: `${mineOnMine.passing} of ${mineOnMine.total}`,
      theirCasesAgainstTheirOwnSets: `${A ? theirs.TWO_THE_FIXTURE_AS_THE_THING_THAT_CROSSES.runAgainstTHISstoresList.passing : '?'} of ${theirs.TWO_THE_FIXTURE_AS_THE_THING_THAT_CROSSES.runAgainstTHISstoresList.of} (their own figure)`,
      contradictions: mineOnMine.contradictions,
    },

    FOUR_THE_NEGATIVE_CONTROLS: {
      why: 'a fixture nothing can fail is a wish. Three lists that SHOULD fail are carried and asserted to fail.',
      results: controls,
      andTHETHIRDONEISNEW: 'aSilentlyPermissiveList passes every MUST_REFUSE and flags nothing — so LOVER passes silently. It is the control for the one case both stores agree on, and it exists because a list can be complete on refusals and still fail the thing the third outcome was built for.',
    },

    FIVE_THIS_STORES_CASES_IN_FULL: PORTABLE_CASES,
    SIX_THIS_STORES_LISTS: { version: APPROPRIATENESS_VERSION, ...APPROPRIATENESS_LISTS },
    SEVEN_THE_BANK: 'unchanged, pending David. keep-or-revert on slots 12-24.',
  };

  const clean = JSON.parse(JSON.stringify(report)) as Record<string, unknown>;
  const keys = ['ONE_THEIR_36_AGAINST_THIS_STORES_SETS', 'TWO_THIS_STORES_CASES_AGAINST_THEIR_SETS', 'FOUR_THE_NEGATIVE_CONTROLS', 'FIVE_THIS_STORES_CASES_IN_FULL'];
  Object.assign(clean, findingsDigest(clean, keys));
  clean.DIGESTS = digestsBlock(String(clean.findingsSha256), keys);
  const p = pjoin(REPO, 'content/exports', stampedName('both-fixtures-run-both-ways', String(clean.findingsSha256), 'json'));
  writeFileSync(p, JSON.stringify(clean, null, 1));
  const name = deliver(p, 'both-fixtures-run-both-ways').split('/').pop()!;
  const fin = sha(readFileSync(pjoin(LANE, name)));
  writeFileSync(pjoin(LANE, `${name}.sha256`), `${fin}  ${name}\n`);
  writeFileSync(pjoin(DL, name), readFileSync(pjoin(LANE, name)));

  console.log(`  THEIR ${theirCases.length} cases against this store's sets: ${theirsOnMine.length - theirsOnMineFail.length} of ${theirsOnMine.length}`);
  for (const f of theirsOnMineFail) console.log(`    FAIL ${f.kind.padEnd(17)} ${f.word.padEnd(12)} this store has it in: ${f.saw}`);
  console.log(`  LOVER against their fixture: ${theirsOnMine.find((x) => x.word === 'lover')!.passed ? 'PASSES' : 'FAILS'} (this store flags it)`);
  console.log(`  THIS STORE'S ${PORTABLE_CASES.length} cases against their sets: ${mineOnTheirs.passing} of ${mineOnTheirs.total}`);
  for (const f of mineOnTheirs.failures.slice(0, 10)) console.log(`    FAIL ${f.kind.padEnd(17)} ${f.word.padEnd(12)} their list has it in: ${f.saw}`);
  console.log(`  negative controls: ${Object.entries(controls).map(([k, v]) => `${k} ${v.passing}/${v.of}`).join(' | ')}`);
  console.log(`\n  crossed: ${name}  (FILE ${fin.slice(0, 16)})`);
}
main();
