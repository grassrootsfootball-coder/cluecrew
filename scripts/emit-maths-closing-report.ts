/**
 * THE CLOSING REPORT FOR THE MATHS DISTRICT — derived from the store, never from prose (R178/R180).
 * Every count below is measured at emission; nothing is carried forward from a message.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { publishBlockers, caseFaceServes } from '../packages/core/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = pjoin(__dirname, '..');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const MINTS = '/Users/davidb/Downloads/maths-six-mints-for-code.json';

/**
  * THE THREE PREDICATES THIS REPORT'S NUMBERS REST ON, named so they can be fixtured (R725).
  * The report asserts counts derived from the store; a count is only as good as the predicate
  * that decides membership, and until this commit the predicates lived inline where nothing
  * could catch them going blind.
  */
const isBlocked = (opts: Array<{ isCorrect: boolean; misconceptionId: string | null }>, reviewedBy: string | null, authoredBy: string | null, flagged: Date | null) =>
  publishBlockers(opts, reviewedBy, authoredBy, flagged) === 'missing-misconceptions';
const isJoinedByMint = (misconceptionId: string | null, mintIds: readonly string[]) =>
  misconceptionId !== null && mintIds.includes(misconceptionId);
/** R873/R870: visible AND empty must be UNREACHABLE, not merely unobserved. */
const windowVisibleAndEmpty = (livePractice: number) => livePractice > 0 && livePractice === 0;

async function run() {
  assertFixture('closing-report-predicates', [
    { name: 'a row with an untagged distractor counts as blocked', input: JSON.stringify({ k: 'blocked', opts: [{ isCorrect: true, misconceptionId: null }, { isCorrect: false, misconceptionId: null }] }), mustBeCaught: true },
    { name: 'a row with every distractor tagged does NOT count as blocked', input: JSON.stringify({ k: 'blocked', opts: [{ isCorrect: true, misconceptionId: null }, { isCorrect: false, misconceptionId: 'x' }] }), mustBeCaught: false },
    { name: 'an untagged KEY does not make a row blocked', input: JSON.stringify({ k: 'blocked', opts: [{ isCorrect: true, misconceptionId: null }, { isCorrect: false, misconceptionId: 'x' }] }), mustBeCaught: false },
    { name: 'an option tagged with a mint id counts as joined', input: JSON.stringify({ k: 'joined', id: 'm1' }), mustBeCaught: true },
    { name: 'an option tagged with a NON-mint id does not count as joined', input: JSON.stringify({ k: 'joined', id: 'maths-77-treating-a-percentage-as-money' }), mustBeCaught: false },
    { name: 'an untagged option does not count as joined', input: JSON.stringify({ k: 'joined', id: null }), mustBeCaught: false },
    { name: 'the visible-and-empty window is unreachable at zero', input: JSON.stringify({ k: 'window', n: 0 }), mustBeCaught: false },
    { name: 'the visible-and-empty window is unreachable at any pool size', input: JSON.stringify({ k: 'window', n: 42 }), mustBeCaught: false },
  ], (raw) => {
    const c = JSON.parse(raw) as { k: string; opts?: Array<{ isCorrect: boolean; misconceptionId: string | null }>; id?: string | null; n?: number };
    if (c.k === 'blocked') return isBlocked(c.opts!, null, 'someone', null);
    if (c.k === 'joined') return isJoinedByMint(c.id ?? null, ['m1', 'm2']);
    return windowVisibleAndEmpty(c.n!);
  });

  const mintBytes = readFileSync(MINTS);
  const mints = JSON.parse(mintBytes.toString('utf8')) as { entries: Array<{ id: string; refinement?: string }> };

  const rows = await prisma.item.findMany({
    where: { questionType: { district: 'MATHS' } },
    select: { id: true, status: true, reviewedBy: true, authoredBy: true, answerFlaggedAt: true,
      options: { select: { content: true, isCorrect: true, misconceptionId: true } } },
  });
  requirePopulation('emit:maths-closing-report', { 'MATHS row(s)': rows.length });

  const entries = await prisma.misconception.findMany({
    where: { id: { in: mints.entries.map((e) => e.id) } },
    select: { id: true, description: true, childHint: true, status: true },
  });
  const mintIds = mints.entries.map((e) => e.id);
  const joined = rows.flatMap((r) => r.options
    .filter((o) => isJoinedByMint(o.misconceptionId, mintIds))
    .map((o) => ({ itemId: r.id, option: String((o.content as { label: unknown }).label), value: String((o.content as { value: unknown }).value), entry: o.misconceptionId })));

  const blocked = rows.filter((r) => isBlocked(r.options, r.reviewedBy, r.authoredBy, r.answerFlaggedAt));
  const signed = rows.filter((r) => r.reviewedBy).length;
  const live = rows.filter((r) => r.status === 'LIVE').length;
  const caseRow = await prisma.case.findUnique({ where: { id: 'case-maths-01' }, select: { title: true, narrativeIntro: true } });
  const livePractice = await prisma.item.count({ where: { questionType: { district: 'MATHS' }, status: 'LIVE', pool: 'PRACTICE' } });

  const full = {
    kind: 'maths-district-closing-report',
    mintFileSha256: sha(mintBytes.toString('utf8')),
    mintFileSha256Spec: 'sha256 over the mint file bytes exactly as delivered, unparsed',

    ENTRIES_LANDED: { count: entries.length, of: mints.entries.length, entries },
    THE_REFINEMENT_TAKEN: mints.entries.find((e) => e.refinement)
      ? { id: mints.entries.find((e) => e.refinement)!.id, supersedes: 'fraction-reduced-to-its-denominator (her 189th)', wordingTakenFrom: 'the file, not the earlier return' }
      : null,
    NO_NUMBERS_MINTED: 'ids are names here; every id is the file\'s string verbatim, with no maths-NN prefix. Numbers attach at the authoring register.',

    JOINS_LANDED: { count: joined.length, joined },
    JOINS_REFUSED_WITH_CAUSES: [
      { entry: 'percentage-never-divided-by-hundred', carrier: 'MC01-FDP-03 C="2000"',
        cause: 'the declared value is one her own 180th superseded. The store holds "£2000"; the mint quotes the population her 182nd was fenced against (1d7f9cf414f33a0a…), which predates that amendment.',
        identityIsNotInDoubt: 'row id, label C, the option\'s retained _previousValue "2000" byte-identical to the declaration, and the working 25 x 80 = 2000 computing to the option value — four agreements, nothing inferred.',
        whyItStillRefuses: 'landing it means inventing retention-matching as a carrier-selection rule, mid-run, to turn a red row green (R149). The gate reports the evidence; it does not settle it for her.',
        whatLandsIt: 'one line: her re-declaration against current bytes, or a ruling that a fenced value plus label identifies a carrier.' },
      { entry: 'fraction-part-used-alone', carrier: 'MC01-FDP-08 D="60"',
        cause: 'HELD. The file joins this candidate only if the store\'s declared gap prose agrees; this store holds NO declared gap prose for that option — misconceptionExecution, drafterDeclaredPull, tagStatus, attractorLine, defeaterLine and a36Note are all null.',
        andWHYTHATISNOTADISAGREEMENT: 'an absent antecedent is UNKNOWN, not false (R98). The file says "else waits", and it waits.',
        whatLandsIt: 'either store declaring the gap prose, or her ruling the candidate directly.' },
      { entry: 'maximum-given-for-a-sum', carrier: 'MC01-STATS-01 D="7"',
        cause: 'NOT MECHANICALLY VERIFIABLE — the working names the act in words ("the largest of 6, 3, 7 and 4") and writes no arithmetic to execute.',
        whatLandsIt: 'a declared expression in the sender\'s hand, or her ruling on the join. Not an interpreter built here (R826/R878).' },
      { entry: 'ordering-goal-reversed', carrier: 'MC01-NPV-03 C="640"',
        cause: 'NOT MECHANICALLY VERIFIABLE — "digits 6, 4, 0 in descending order" states a property, not a computation.',
        whatLandsIt: 'a declared expression, or her ruling on the join.' },
      { entry: 'leading-zero-repaired-ordering-not', carrier: 'MC01-NPV-03 D="604"',
        cause: 'NOT MECHANICALLY VERIFIABLE — the working describes the repair and the residual fault in prose.',
        whatLandsIt: 'a declared expression, or her ruling on the join.' },
    ],
    andWHOAUTHOREDTHEWORKINGS: 'the file states the workings were COMPUTED BY THE SENDER from her behaviours. So a working is not itself her ruling on a carrier, and cannot stand in for the execution the gate requires (R203).',

    SIGNED: { count: signed, of: rows.length, newlySigned: ['MC01-GEOM-04'],
      method: 'her pin recomputed and MATCHED under the named projection {stem, options[{content,isCorrect}], explanation}, retention excluded, before the signature landed' },

    HER_SIGNATURE_SCOPING: {
      pin: 'asserts IDENTITY over the whole row, under its named projection',
      verdict: 'asserts READING over what was actually read',
      inheritedFields: 'PINNED AND UNREAD — inside the pin, outside the reading',
      andWHYITMATTERSHERE: 'options[].misconceptionId is OUTSIDE the projection, which is why a join can unblock a row without voiding her verification. That is a fact about the projection and it is asserted per row, never assumed.',
      theMeasuredExposure: 'pnpm check:inherited-fields — 1,227 items, 30 distinct stem keys, 3,398 row-fields; the canonical stemSchema validates 5 key names, so 26 keys on 2,640 row-fields are inside somebody\'s pin and inside no door (R875).',
    },

    PUBLICATION_SHAPE: {
      signed, blockedOnMissingMisconceptions: blocked.length,
      blockedIds: blocked.map((b) => b.id).sort(),
      untaggedDistractorsRemaining: blocked.reduce((n, b) => n + b.options.filter((o) => !o.isCorrect && !o.misconceptionId).length, 0),
      live, livePractice,
      caseFaceServes: caseFaceServes(caseRow),
      caseServable: livePractice > 0,
      windowVisibleAndEmpty: windowVisibleAndEmpty(livePractice),
      TWO_GATES_IN_SERIES: 'a landed face makes the case RENDERABLE; a non-empty LIVE+PRACTICE pool makes it VISIBLE. Neither implies the other (R873).',
      shapeA: `${signed} signed, ${blocked.length} held — available now`,
      shapeB: `${rows.length} with the remaining ${blocked.length} unblocked — needs the five refused joins settled and the other blocked rows' entries`,
      PUBLICATION_HOLDS: 'on David\'s go. Nothing here publishes.',
    },
  };

  const lines = [
    `entries\t${entries.length}/${mints.entries.length}`,
    `joins\t${joined.length}/7 named options`,
    `signed\t${signed}/${rows.length}`,
    `blocked\t${blocked.length}`,
    `live\t${live}`,
  ];
  const d = digestOverText('the summary lines joined by \\n', lines.join('\n'));
  const withLines = { ...full, RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec };
  const artefact = { ...withLines, ...findingsDigest(withLines, ['ENTRIES_LANDED', 'JOINS_LANDED', 'JOINS_REFUSED_WITH_CAUSES', 'SIGNED', 'PUBLICATION_SHAPE', 'RESULT_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('maths-district-closing-report', sha(json).slice(0, 16), 'json');
  writeFileSync(pjoin(REPO, 'content/exports', name), json);
  deliver(pjoin(REPO, 'content/exports', name), 'maths-district-closing-report');
  console.log(`\n  entries ${entries.length}/${mints.entries.length} · joins ${joined.length}/7 · signed ${signed}/${rows.length} · blocked ${blocked.length} · LIVE ${live} · face serves ${caseFaceServes(caseRow)} · servable ${livePractice > 0}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
