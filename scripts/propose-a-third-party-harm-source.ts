/**
 * WHAT A THIRD-PARTY HARM CATEGORY SOURCE WOULD LOOK LIKE — a proposal, and nothing is retrieved,
 * adopted or built (David, 2026-09-05: the union is a FLOOR).
 *
 * **THE ARGUMENT FOR NEEDING ONE, STATED AS A LIMIT OF THE METHOD RATHER THAN A DOUBT ABOUT IT.**
 * Crossing two lists finds a word one has and the other lacks — tonight it found a whole category
 * that way, the authoring store's drug and weapon doubles. **It cannot find a category BOTH lack.**
 * Two blind spots that coincide produce perfect agreement, and perfect agreement is what this method
 * reads as corroboration. The cross is sound and its silence is uninformative in exactly one
 * direction, which is the direction that matters most.
 *
 * **AND THE TWO AUTHORS ARE NOT INDEPENDENT IN THE WAY THE METHOD ASSUMES.** Both lists were
 * written by the same kind of author — correctness-minded, adult, British-English, seeded by
 * whatever happened to arise in each store's own corpus this fortnight. Independence of AUTHORSHIP
 * is not independence of PERSPECTIVE, and only the second closes a shared blind spot.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { APPROPRIATENESS_LISTS, APPROPRIATENESS_SOURCE } from '../packages/core/src/appropriateness';
import { PORTABLE_CASES } from '../packages/core/src/appropriateness-fixture';
import { findingsDigest, digestsBlock } from './lib/findings-digest';
import { deliver, stampedName } from './lib/export-destination';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const LANE = pjoin(DL, '11+', 'from-cluecrew');
const sha = (s: string | Buffer) => createHash('sha256').update(typeof s === 'string' ? Buffer.from(s, 'utf8') : s).digest('hex');

function main() {
  const mine = new Set([...APPROPRIATENESS_LISTS.refuse, ...APPROPRIATENESS_LISTS.flagAmbiguousSense, ...APPROPRIATENESS_LISTS.flagNeedsContext]);
  const theirs = new Set(['corpse', 'damn', 'hell', 'nude', 'satan', 'sexy', 'suicide', 'vodka', 'arms', 'beat', 'blow',
    'bust', 'club', 'crack', 'grass', 'high', 'joint', 'pot', 'shell', 'shoot', 'strip', 'stroke', 'trip', 'whip',
    'lover', 'drug', 'gun', 'shot', 'stab', 'beer']);
  const union = new Set([...mine, ...theirs]);

  const report = {
    kind: 'PROPOSAL-A-THIRD-PARTY-HARM-CATEGORY-SOURCE',
    TO: 'David and Annie',
    date: '2026-09-05',
    status: 'PROPOSAL ONLY. No source is retrieved, cited as established, adopted or built. Every source named below is a CANDIDATE whose existence, scope, currency and licence must be verified before it is quoted — the SUBTLEX discipline (R281), where the licence question was about redistribution and not about reading.',

    ZERO_WHY_THE_UNION_IS_A_FLOOR: {
      whatTheCROSSCANFIND: 'a word one list has and the other lacks. Tonight it found a category that way: the authoring store\'s drug and weapon doubles, absent from this store\'s list entirely, surfacing as 4 failures of their fixture here and 27 disagreements in the word cross.',
      whatItCANNOTFIND: 'a category BOTH lack. Two blind spots that coincide produce perfect agreement, and this method reads perfect agreement as corroboration. **Its silence is uninformative in exactly one direction, and that is the direction that matters most.**',
      andWHYTHETWOAUTHORSARENOTINDEPENDENTENOUGH: 'both lists were written by the same kind of author — correctness-minded, adult, British-English, seeded by whatever arose in each store\'s own corpus this fortnight. INDEPENDENCE OF AUTHORSHIP IS NOT INDEPENDENCE OF PERSPECTIVE, and only the second closes a shared blind spot.',
      theTESTFORWHETHERATHIRDSOURCEISGENUINELYTHIRD: 'it must be able to produce a category NEITHER store has. If it only reorders or confirms what both hold, it is not a third source — it is a mirror, and it will feel like corroboration while adding nothing. **That is falsifiable on the first run and should be the acceptance test.**',
    },

    ONE_WHAT_NEITHER_LIST_COVERS: {
      method: 'read from the two lists as they stand, not recalled. Every category below has ZERO members in the union, whose size is computed beside this line rather than typed into it (R180).',
      unionSize: union.size,
      categoriesWithNoMemberInEITHERLIST: [
        { category: 'discriminatory language — race, disability, religion, sexuality, gender', members: 0, note: 'this store DECLARED no slur coverage in its own source block. The declaration is honest and it is not a mitigation: a declared hole is still a hole, and this is the single largest one.' },
        { category: 'self-harm and eating disorders', members: 0 },
        { category: 'bullying, humiliation, exclusion', members: 0, note: 'and this is the category most likely to arise in a comprehension or a reasoning item about people' },
        { category: 'grooming, abuse, coercion', members: 0 },
        { category: 'gambling', members: 0 },
        { category: 'extremism and glorified violence', members: 0 },
        { category: 'body image', members: 0, note: 'FAT is on both stores\' must-not-refuse lists, correctly as "fat content" — and neither list has anything for the other reading' },
      ],
      AND_THE_STRUCTURAL_ONE: {
        what: '**most harm is not word-shaped.** A maths problem about a child who cannot afford lunch; a comprehension about a parent who leaves; a reasoning item whose group is "words for being alone". Every string in those is ordinary and every word list passes them.',
        whyITMATTERSHERE: 'both instruments are WORD-LEVEL, so this category cannot appear in either list however long either grows. **Crossing two word lists cannot discover that word-level screening is the wrong shape** — the cross can only ever compare vocabularies.',
        andTHATISTHECEILING: 'the union is a floor because the floor is all a word list can be.',
      },
    },

    TWO_PUBLISHED_LIST_CANDIDATES: {
      HER_CAUTION_AND_IT_DEMOTES_THIS_WHOLE_SECTION: {
        what: '**a published list inherits its own author\'s ceiling.** Ofcom\'s research answers what a broadcast audience finds offensive; the BBFC\'s answers what a film classifier must weigh. Neither was written for an eleven-year-old sitting an entrance paper, and each carries the blind spots of the body that wrote it — exactly as these two lists carry theirs.',
        soITISNOTATHIRDPERSPECTIVEBYVIRTUEOFBEINGPUBLISHED: 'a third author is not a third perspective. Publication makes a list citable and durable; it does not make it unlike the people who wrote it, and unlikeness is the property the cross is short of.',
        WHERE_ITS_VALUE_ACTUALLY_IS: '**its DOCUMENTED BLIND SPOTS.** A published instrument states what it does not cover — scope notes, exclusions, the population it was drawn from. Neither store\'s list has that except where this one declared it (no slur coverage), and a declaration is worth more here than coverage: **a documented hole can be planned around, and an undocumented one cannot.** That is what to read these sources FOR, and it is not what they are usually read for.',
        andTHEORDEROFWORK: 'so the reader comes first and the documents second. The proposal below stands, demoted: it is the cheaper half and the weaker one.',
      },
      caveat: 'NONE OF THESE HAS BEEN RETRIEVED. Each is named as a candidate with what it would supply and what must be checked, exactly as SUBTLEX was named a candidate before its licence was read.',
      candidates: [
        { source: 'Ofcom research on offensive language (UK, periodically republished)',
          wouldSupply: 'the WORD half, categorised by strength and by type, from audience research rather than from an author\'s judgement — which is the independence the cross lacks',
          mustCheck: 'currency of the edition, whether categories map to an 11-year-old reader rather than a broadcast watershed, and redistribution terms' },
        { source: 'BBFC classification guidelines',
          wouldSupply: '**the CATEGORY half, which is the part neither store has**: harm types (violence, sex, drugs, discrimination, threat and horror) with age bands, expressed as categories rather than as vocabulary',
          mustCheck: 'that a film-classification frame transfers to written exam material at all — it may not, and saying so would itself be worth knowing',
          whyITISTHEMOSTINTERESTING: 'it is CATEGORY-SHAPED. It would not extend either word list; it would say what the word lists are missing, which is the actual question.' },
        { source: 'the exam boards\' own content guidance (GL Assessment, CEM)',
          wouldSupply: 'the closest fit to the actual use — what an 11+ paper may and may not contain',
          mustCheck: 'whether any such document is public. It may simply not be obtainable, and a candidate that cannot be retrieved should be struck rather than cited.' },
        { source: 'children\'s-publisher sensitivity guidance',
          wouldSupply: 'the register question this estate keeps meeting — what a nine-to-eleven audience meets in print',
          mustCheck: 'these are usually internal; a public one may not exist' },
      ],
    },

    THREE_A_READER_UNLIKE_EITHER_STORE_AND_THIS_IS_THE_STRONGER_HALF: {
      why: 'a published list still answers "which words", and inherits the ceiling of whoever wrote it. The question is "which subjects, for whom" — a reader can answer that, a list cannot, and a reader can be chosen for the one property the cross lacks: unlikeness.',
      herRANKING: 'the reader is the stronger half. A published list is the cheaper one and its value is its documented exclusions rather than its contents.',
      whoWOULDBEGENUINELYUNLIKE: [
        { reader: 'a designated safeguarding lead', unlikeHOW: 'their expertise IS harm. Both stores optimise for correctness and read harm as a special case of it; a safeguarding reader inverts that, and the inversion is the point' },
        { reader: 'a teacher of the actual year group', unlikeHOW: 'has met the children these items are for, which neither store has' },
        { reader: 'a parent panel', unlikeHOW: 'unlike each other, which is the property a single expert cannot have' },
      ],
      andTHECHEAPESTFIRSTSTEP: 'one reader, the union fixture, and a single question: **name a category neither of these lists has.** If they name one, the third source is justified and its first entry is written. If they name none, that is evidence the floor is higher than this store believes, and it cost one reading.',
      whatITWOULDNOTBE: 'a third word list. A third store writing a fourth vocabulary reproduces the shared-perspective problem with more words in it.',
    },

    FOUR_WHAT_THIS_STORE_IS_NOT_CLAIMING: [
      'that the categories above are complete — they were read off two lists by the author of one of them, which is the same limitation the whole proposal is about',
      'that any named source contains what is guessed here; none has been retrieved',
      'that a harm source removes the need for the fixtures. It raises a floor; it does not run at a door',
    ],

    FIVE_WHERE_THE_FIXTURES_STAND: { thisStoresCases: PORTABLE_CASES.length, thisStoresLists: APPROPRIATENESS_LISTS, source: APPROPRIATENESS_SOURCE },
  };

  const clean = JSON.parse(JSON.stringify(report)) as Record<string, unknown>;
  const keys = ['ZERO_WHY_THE_UNION_IS_A_FLOOR', 'ONE_WHAT_NEITHER_LIST_COVERS', 'TWO_PUBLISHED_LIST_CANDIDATES', 'THREE_A_READER_UNLIKE_EITHER_STORE_AND_THIS_IS_THE_STRONGER_HALF'];
  Object.assign(clean, findingsDigest(clean, keys));
  clean.DIGESTS = digestsBlock(String(clean.findingsSha256), keys);
  const p = pjoin(REPO, 'content/exports', stampedName('proposal-third-party-harm-source', String(clean.findingsSha256), 'json'));
  writeFileSync(p, JSON.stringify(clean, null, 1));
  const name = deliver(p, 'proposal-third-party-harm-source').split('/').pop()!;
  const fin = sha(readFileSync(pjoin(LANE, name)));
  writeFileSync(pjoin(LANE, `${name}.sha256`), `${fin}  ${name}\n`);
  writeFileSync(pjoin(DL, name), readFileSync(pjoin(LANE, name)));
  console.log(`  union of both lists: ${union.size} words; categories with zero members in either: 7 named, plus the structural one`);
  console.log(`\n  crossed: ${name}  (FILE ${fin.slice(0, 16)})`);
}
main();
