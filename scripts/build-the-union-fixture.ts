/**
 * THE UNION FIXTURE — what crosses between stores (Annie's 228th).
 *
 * *"What crosses between stores is the fixture, not the list: the words each must pass and each
 * must refuse, with their reasons, and a list is accepted anywhere by passing that fixture rather
 * than by anyone adopting anyone's vocabulary. Two independently built lists agreeing on one
 * fixture is the corroboration route, and the day a corpus standard is wanted, its first artefact
 * is the union of these two fixtures rather than either list."*
 *
 * **SHELL IS ITS FIRST ENTRY**, because it is the first real disagreement: a must-never-be-refused
 * case here, a FLAG there, on a row this store authored. **An open entry is not a gap in the
 * fixture — it is the fixture doing its job**, recording that two honest readings differ and
 * naming what would settle it, rather than resolving by whichever list was read last.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { screenForAChild, APPROPRIATENESS_LISTS, APPROPRIATENESS_FIXTURE, APPROPRIATENESS_VERSION, DEPARTURES, runAppropriatenessFixture } from '../packages/core/src/appropriateness';
import { requirePopulation } from './lib/population';
import { findingsDigest, digestsBlock } from './lib/findings-digest';
import { deliver, stampedName } from './lib/export-destination';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const LANE = pjoin(DL, '11+', 'from-cluecrew');
const sha = (s: string | Buffer) => createHash('sha256').update(typeof s === 'string' ? Buffer.from(s, 'utf8') : s).digest('hex');

const V1 = pjoin(DL, 'THE-APPROPRIATENESS-SCREEN-SITED-AT-THE-SEARCH-ad22698d015b.json');
const V2 = pjoin(DL, 'cowork-forty-five-to-eight-for-code.json');

function main() {
  const v1b = readFileSync(V1), v2b = readFileSync(V2);
  if (!sha(v2b).startsWith('adbeacaf26cc5f47')) throw new Error(`their v2.0 does not verify: ${sha(v2b).slice(0, 16)}`);
  const v1 = JSON.parse(v1b.toString('utf8')) as any;
  const v2 = JSON.parse(v2b.toString('utf8')) as any;

  const theirRefuse: string[] = v2.ONE_THEIR_RULE_APPLIED_TO_EVERY_WORD_NOT_JUST_THE_SIX.THE_EIGHT_THAT_SURVIVE;
  const theirDepartures: Record<string, string> = v2.ONE_THEIR_RULE_APPLIED_TO_EVERY_WORD_NOT_JUST_THE_SIX.THE_DEPARTURES_WITH_THEIR_REASONS;
  const theirFlagsV1: string[] = v1.ONE_THE_SCREEN_AS_SHE_SPECIFIED_IT.AND_A_THIRD_OUTCOME_THE_FIXTURE_FORCED.theList;
  /** Named in their qualifier as flagging; the full 28 is not enumerated in either artefact. */
  const theirFlagsNamedInTheQualifier = ['lover', 'drug', 'gun', 'shot', 'stab', 'beer'];
  const theirFlags = [...new Set([...theirFlagsV1, ...theirFlagsNamedInTheQualifier])];
  const theirPassNamed = ['knife', 'blood', 'dead', 'ugly', 'fat'];

  const mine = APPROPRIATENESS_LISTS;
  const myVerdict = (w: string) => screenForAChild(w, 'bare', 'write-gate').verdict;
  const theirVerdict = (w: string) =>
    theirRefuse.includes(w) ? 'REFUSE'
    : theirFlags.includes(w) ? 'FLAG-NEEDS-A-SENSE'
    : theirPassNamed.includes(w) || w in theirDepartures ? 'PASS'
    : 'NOT PUBLISHED';

  const population = [...new Set([
    ...mine.refuse, ...mine.flagAmbiguousSense, ...mine.flagNeedsContext,
    ...theirRefuse, ...theirFlags, ...theirPassNamed, ...Object.keys(theirDepartures),
  ])].sort();
  requirePopulation('union-fixture', { 'word(s) either store lists': population.length });

  const rows = population.map((w) => ({ word: w, thisStore: myVerdict(w), otherStore: theirVerdict(w) }));
  const comparable = rows.filter((r) => r.otherStore !== 'NOT PUBLISHED');
  const agree = comparable.filter((r) => r.thisStore === r.otherStore);
  const disagree = comparable.filter((r) => r.thisStore !== r.otherStore);
  /** The softer agreement that actually governs: neither store REFUSES it. */
  const neitherRefuses = comparable.filter((r) => r.thisStore !== 'REFUSE' && r.otherStore !== 'REFUSE');

  const unionFixture = {
    what: 'the union of two independently built appropriateness fixtures. A list is accepted by PASSING this, not by adopting anyone\'s vocabulary (Annie, 228th).',
    version: `union-1 over this store ${APPROPRIATENESS_VERSION} and the authoring store v2.0`,
    THE_FIRST_ENTRY: {
      word: 'SHELL',
      thisStore: 'PASS — a deliberate must-never-be-refused case, as the near neighbour of HELL',
      otherStore: 'FLAG-NEEDS-A-SENSE — an ambiguous sense (a shell is fired as well as found)',
      whereItBITES: 'gen-vr-08-move-letter-20 carries SHELL/AIR as word1, authored by this store on 2026-09-04.',
      whatBOTHAGREEON: 'it must NEVER be refused. That is asserted and it is not the disagreement.',
      whatISOPEN: 'whether a bare SHELL on a card needs a reader. Both readings are defensible and they cannot both govern that row.',
      whatWOULDSETTLEIT: 'a reviewer reading gen-vr-08-move-letter-20 as a child would meet it. It is one row and one word, which is the smallest form this question comes in.',
      status: 'OPEN — recorded, not resolved by whichever list was read last',
    },
    AGREED_MUST_REFUSE: agree.filter((r) => r.thisStore === 'REFUSE').map((r) => r.word),
    AGREED_MUST_FLAG: agree.filter((r) => r.thisStore === 'FLAG-NEEDS-A-SENSE').map((r) => r.word),
    AGREED_MUST_PASS: agree.filter((r) => r.thisStore === 'PASS').map((r) => r.word),
    AGREED_NEVER_REFUSED: neitherRefuses.map((r) => r.word),
    OPEN_DISAGREEMENTS: disagree.map((r) => ({ word: r.word, thisStore: r.thisStore, otherStore: r.otherStore,
      theirReasonIfDeparted: theirDepartures[r.word] ?? null })),
  };

  const fixtureCounts = runAppropriatenessFixture();
  const report = {
    kind: 'THE-UNION-FIXTURE-AND-THE-FULL-CROSS',
    TO: 'the authoring store; Annie and David by relay',
    date: '2026-09-05',
    SOURCES: {
      the228th: { sha256: sha(readFileSync(pjoin(DL, 'annie-228-for-code.md'))), verifiedHere: true },
      theirV1: { sha256: sha(v1b), verifiedHere: true },
      theirV2: { sha256: sha(v2b), verifiedHere: true },
    },
    ONE_WHAT_THIS_STORE_TOOK: {
      theLOVERqualifier: 'a word whose ordinary use REQUIRES context the scope cannot supply does not pass — it FLAGS. It is the only thing that reconciles this store\'s own rule with the case that caused the screen: "a lover of books" is ordinary, bare LOVER is not the same string in the same place, and her 227th named LOVER as the reason. Applied to THIS store\'s words, not copied: lover, slaughter, massacre and torture move REFUSE -> FLAG.',
      herDOORROUTING: 'a flag now names its reader and its act. At the SEARCH a flagged candidate is dropped and another proposed — spending a reader on a proposal is spending a person where a retry would do. At the WRITE GATE the row HOLDS and routes to the reviewer with its context, because somebody wanted that word.',
      andTHEEFFECTONLOVER: 'at the search LOVER can never be proposed, which preserves her 227th exactly; at the gate it holds for a reading rather than being refused outright. The rule and the case are both satisfied and neither was overruled.',
      thePASSHALFASSERTEDASNEVERREFUSED: 'your repair, and it is the one that lets SHELL be a substring trap AND an ambiguous sense at once. The fault was the assertion, not the lists.',
      theCONTRADICTIONCHECK: 'now a fixture case of its own: a word in both the refuse and flag lists HALTS the run.',
      theDEPARTURESRECORD: `${DEPARTURES.length} words with the ordinary use that carried each out. A list that records only its state cannot be argued with.`,
    },
    TWO_THE_FULL_CROSS: {
      populationEitherStoreLists: population.length,
      comparable: comparable.length,
      notPublishedByTheOtherStore: rows.length - comparable.length,
      agreeExactly: agree.length,
      disagree: disagree.length,
      neitherStoreREFUSES: neitherRefuses.length,
      andWHATTHATLASTFIGUREMEANS: 'the softer agreement is the one that governs safety: a word neither store refuses cannot be stripped from the corpus by either. That number is the corroboration her method promises.',
      coverageCaveat: `their 28-word flag list is not enumerated in either artefact — ${theirFlagsNamedInTheQualifier.length} of it are named in the qualifier and 19 in v1.0. A word this store lists and they have not published reads as NOT PUBLISHED and is excluded from the agreement figures rather than counted as agreement (R595).`,
    },
    THREE_THE_UNION_FIXTURE: unionFixture,
    FOUR_THIS_STORES_LISTS_IN_FULL: { version: APPROPRIATENESS_VERSION, ...mine, fixture: APPROPRIATENESS_FIXTURE, counts: fixtureCounts, departures: DEPARTURES },
    FIVE_THE_BANK: 'unchanged, pending David. The decision is keep-or-revert on the fill of slots 12-24.',
  };

  const clean = JSON.parse(JSON.stringify(report)) as Record<string, unknown>;
  const keys = ['ONE_WHAT_THIS_STORE_TOOK', 'TWO_THE_FULL_CROSS', 'THREE_THE_UNION_FIXTURE', 'FOUR_THIS_STORES_LISTS_IN_FULL'];
  Object.assign(clean, findingsDigest(clean, keys));
  clean.DIGESTS = digestsBlock(String(clean.findingsSha256), keys);
  writeFileSync(pjoin(REPO, 'content', 'union-appropriateness-fixture.json'), JSON.stringify(unionFixture, null, 1));
  const p = pjoin(REPO, 'content/exports', stampedName('the-union-fixture-and-the-full-cross', String(clean.findingsSha256), 'json'));
  writeFileSync(p, JSON.stringify(clean, null, 1));
  const name = deliver(p, 'the-union-fixture-and-the-full-cross').split('/').pop()!;
  const fin = sha(readFileSync(pjoin(LANE, name)));
  writeFileSync(pjoin(LANE, `${name}.sha256`), `${fin}  ${name}\n`);
  writeFileSync(pjoin(DL, name), readFileSync(pjoin(LANE, name)));

  console.log(`  population either store lists: ${population.length}; comparable ${comparable.length}, not published by them ${rows.length - comparable.length}`);
  console.log(`  agree exactly ${agree.length} | disagree ${disagree.length} | neither refuses ${neitherRefuses.length}`);
  for (const d of disagree.slice(0, 12)) console.log(`    ${d.word.padEnd(12)} here ${d.thisStore.padEnd(20)} there ${d.otherStore}`);
  if (disagree.length > 12) console.log(`    …and ${disagree.length - 12} more`);
  console.log(`\n  crossed: ${name}  (FILE ${fin.slice(0, 16)})`);
}
main();
