/**
 * TWO INDEPENDENTLY AUTHORED SCREENS, CROSSED — her disagreement-set method pointed at a WORDLIST
 * rather than a lexicon (David, 2026-09-05).
 *
 * **THE METHOD ONLY WORKS IF THE LISTS STAY INDEPENDENT.** Adopting the other store's words
 * wholesale would make the cross measure nothing — two copies of one list agree perfectly and prove
 * nothing. So this store adopted their MECHANISM (the third outcome) and their FIXTURE SHAPE (the
 * substring traps, which they offered as the transferable half and were right to), and kept its own
 * words its own. **Where the two disagree is the only place either is uncertain.**
 *
 * Both first drafts contained a false refusal, and each store's own instrument found its own:
 * `tobacco` here, on a Rebecca of Sunnybrook Farm walk script; `knife` there, in a vr-02 group of
 * sharp things. Neither found the other's. That is the argument for crossing them.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { screenForAChild, APPROPRIATENESS_SOURCE, APPROPRIATENESS_FIXTURE, APPROPRIATENESS_VERSION, runAppropriatenessFixture } from '../packages/core/src/appropriateness';
import { requirePopulation } from './lib/population';
import { findingsDigest, digestsBlock } from './lib/findings-digest';
import { deliver, stampedName } from './lib/export-destination';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const LANE = pjoin(DL, '11+', 'from-cluecrew');
const THEIRS = pjoin(DL, 'THE-APPROPRIATENESS-SCREEN-SITED-AT-THE-SEARCH-ad22698d015b.json');
const sha = (s: string | Buffer) => createHash('sha256').update(typeof s === 'string' ? Buffer.from(s, 'utf8') : s).digest('hex');

function main() {
  const bytes = readFileSync(THEIRS);
  const theirDigest = sha(bytes);
  if (!theirDigest.startsWith('ad22698d015b')) throw new Error(`their screen does not verify: ${theirDigest.slice(0, 16)}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- an external artefact read field by field; its shape is pinned by the digest above
  const theirs = JSON.parse(bytes.toString('utf8')) as Record<string, any>;
  const theirFlags: string[] = theirs.ONE_THE_SCREEN_AS_SHE_SPECIFIED_IT.AND_A_THIRD_OUTCOME_THE_FIXTURE_FORCED.theList;
  const theirRefusalsSeen: string[] = (theirs.THREE_THE_CROSSED_POPULATION_MEASURED_NEVER_SCREENED.REFUSED_BY_THIS_STORES_LIST ?? [])
    .flatMap((r: { tokens: string[] }) => r.tokens);
  const theirPin = theirs.SCREEN_PIN;
  requirePopulation('cross-the-screens', { 'their flag word(s) published': theirFlags.length, 'their refusal(s) visible in instances': theirRefusalsSeen.length });

  const mine = (w: string) => screenForAChild(w, 'bare').verdict;
  const onTheirFlags = theirFlags.map((w) => ({ word: w, thisStore: mine(w), otherStore: 'FLAG-NEEDS-A-SENSE' }));
  const onTheirRefusals = [...new Set(theirRefusalsSeen)].map((w) => ({ word: w, thisStore: mine(w), otherStore: 'REFUSE' }));
  const agreeFlags = onTheirFlags.filter((r) => r.thisStore === 'FLAG-NEEDS-A-SENSE');
  const disagreeFlags = onTheirFlags.filter((r) => r.thisStore !== 'FLAG-NEEDS-A-SENSE');

  const fixture = runAppropriatenessFixture();
  const out = {
    kind: 'THE-TWO-SCREENS-CROSSED',
    TO: 'the authoring store; Annie and David by relay',
    date: '2026-09-05',
    THEIR_SCREEN_AS_RECEIVED: { file: 'THE-APPROPRIATENESS-SCREEN-SITED-AT-THE-SEARCH-ad22698d015b.json', sha256: theirDigest, verifiedHere: true, pin: theirPin },

    THE_METHOD: 'her disagreement-set, pointed at a wordlist. Two independently authored screens over one vocabulary: where they agree the agreement is stronger than either alone, and where they disagree is the only place either is uncertain.',
    ANDWHYTHISSTOREDIDNOTJUSTADOPTYOURS: 'two copies of one list agree perfectly and prove nothing. This store took your MECHANISM — the third outcome — and your FIXTURE SHAPE, which you offered as the transferable half and were right about. The WORDS stayed independent, or the cross measures nothing.',

    WHAT_THIS_STORE_ADOPTED_FROM_YOURS: {
      thirdOutcome: 'FLAG-NEEDS-A-SENSE, with a SCOPE. Bare scope flags; a sentence resolves it. Your reasoning — a bare option value has no sentence around it — is Annie\'s wordhood ruling transposed, and it is better than what this store did, which was to DELETE six ambiguous words. Deleting decides silently in favour of passing.',
      andWHATCAMEBACKBECAUSEOFIT: ['bloody', 'drunk', 'mistress', 'affair', 'naked'],
      naked: 'moved from REFUSE to FLAG. It was kept as a refusal with "the naked eye" logged as a known false positive — which is exactly a word needing a sense, described instead of handled.',
      substringTraps: 'your five are now named cases in this store\'s pass fixture: shell, glover, grass, class, button, diesel. This store\'s matcher was already whole-token, but an untested property is a property nobody has shown.',
    },

    THE_CROSS_ON_WHAT_YOU_PUBLISHED: {
      onYOURNINETEENFLAGS: onTheirFlags,
      agreement: `${agreeFlags.length} of ${onTheirFlags.length}`,
      disagreement: `${disagreeFlags.length} of ${onTheirFlags.length} — every one of them PASSES here and FLAGS there`,
      andWHATTHATMEANS: 'this store\'s list has no drug, weapon or violence-slang doubles in it at all. Yours has nineteen. That is not a near-miss, it is a WHOLE CATEGORY this store did not think of, and it is exactly what a cross is for: neither store\'s own fixture could have surfaced it.',
      THE_ONE_THAT_TOUCHES_THIS_STORE_DIRECTLY: 'SHELL. It is a must-PASS case in this store\'s fixture — deliberately, as the near neighbour of HELL — and it is a FLAG in yours. This store has just authored SHELL/AIR into the vr-08 bank at slot 19. Both readings are defensible and they cannot both govern that row.',
      onYOURREFUSALSVISIBLEININSTANCES: onTheirRefusals,
      andKNIFE: 'you flagged it yourselves as probably your list\'s fault, in a vr-02 group of sharp things. This store PASSES it and agrees with your doubt rather than your list.',
    },

    WHAT_THIS_CROSS_CANNOT_YET_MEASURE: {
      missing: ['your 45-word refuse list', 'your 26-word pass list'],
      whyItMatters: 'only your FLAG list is published in full. The cross above therefore covers 19 words plus 2 seen in instances, out of at least 90 across both stores. A disagreement set measured on a fifth of the population is a start, not a result (R595 — a subset of a real population is indistinguishable from that population when you cannot see what was excluded).',
      andTHISSTORESHALFISWHOLE: 'every word of this store\'s three lists is published below, so the cross can be run from your side today without waiting.',
    },

    THIS_STORES_LISTS_IN_FULL: {
      version: APPROPRIATENESS_VERSION,
      source: APPROPRIATENESS_SOURCE,
      refuse: APPROPRIATENESS_FIXTURE.mustRefuse,
      flagWhenBare: APPROPRIATENESS_FIXTURE.mustFlagWhenBARE,
      neverRefusedFixture: APPROPRIATENESS_FIXTURE.mustNeverBeRefused, // R1000 renamed mustPass (may pass or flag, never refuse)
      passInASentence: APPROPRIATENESS_FIXTURE.mustPassInASentence,
      fixtureCases: fixture,
      andTHEREFUSELISTITSELF: 'hell, damn, crap, bugger, arse, bastard, bitch, lover, nude, sexy, lust, brothel, whisky, whiskey, vodka, brandy, booze, heroin, cocaine, corpse, suicide, slaughter, massacre, torture, hanged',
    },

    BOTH_FIRST_DRAFTS_CARRIED_A_FALSE_REFUSAL: {
      here: 'tobacco, on ENG-018-RB-02 — a walk script for Rebecca of Sunnybrook Farm reporting that Mr Cobb has tobacco in his cheek. Found by an R149 baseline diff of one row on a gate whose total moved by one.',
      there: 'knife, on bank-vr-02-two-odd-ones-out-12 — a group of sharp things. Found by running the list over a crossed population.',
      andTHEPOINT: 'NEITHER STORE FOUND THE OTHER\'S. Two instruments, two self-caught faults, and no overlap in what they caught — which is the argument for crossing them rather than for either one being careful.',
    },

    THE_BANK: 'unchanged and staying as it is, pending David\'s word. The decision is keep-or-revert on the fill of slots 12-24; rows 1-12 are untouched either way.',
  };

  const clean = JSON.parse(JSON.stringify(out)) as Record<string, unknown>;
  const keys = ['THE_CROSS_ON_WHAT_YOU_PUBLISHED', 'THIS_STORES_LISTS_IN_FULL', 'WHAT_THIS_STORE_ADOPTED_FROM_YOURS', 'WHAT_THIS_CROSS_CANNOT_YET_MEASURE'];
  Object.assign(clean, findingsDigest(clean, keys));
  clean.DIGESTS = digestsBlock(String(clean.findingsSha256), keys);
  const p = pjoin(REPO, 'content/exports', stampedName('the-two-screens-crossed', String(clean.findingsSha256), 'json'));
  writeFileSync(p, JSON.stringify(clean, null, 1));
  const name = deliver(p, 'the-two-screens-crossed').split('/').pop()!;
  const fin = sha(readFileSync(pjoin(LANE, name)));
  writeFileSync(pjoin(LANE, `${name}.sha256`), `${fin}  ${name}\n`);
  writeFileSync(pjoin(DL, name), readFileSync(pjoin(LANE, name)));

  console.log(`  their screen verifies at ${theirDigest.slice(0, 12)} (v${theirPin.version}: ${theirPin.refuseListSize} refuse, ${theirPin.passListSize} pass, ${theirPin.flagListSize} flag)`);
  console.log(`  this store v${APPROPRIATENESS_VERSION}: ${fixture.refused} refuse-cases, ${fixture.flagged} flag, ${fixture.neverRefused} never-refused, ${fixture.inASentence} sentence-resolved`);
  console.log(`  on their 19 flags: ${agreeFlags.length} agree, ${disagreeFlags.length} disagree (all PASS here)`);
  console.log(`  disagreements: ${disagreeFlags.map((d) => d.word).join(', ')}`);
  console.log(`\n  crossed: ${name}  (FILE ${fin.slice(0, 16)})`);
}
main();
