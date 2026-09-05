/**
 * WHAT A SUBJECT-MATTER SCREEN WOULD NEED TO BE — A PROPOSAL, AND NOTHING IS BUILT (David's
 * ruling, 2026-09-05: report source, scope and a fixture of in and out before anything is built).
 *
 * The shape is Annie's own, from her 225th on the wordlist she deferred: *"a stated source, a
 * stated scope, a version, and a fixture of known-in and known-out words before it binds
 * anything."* This is that shape applied to the gap her 226th's regeneration exposed.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { headwordIsBanned } from '../packages/core/src/content-gates';
import { findingsDigest, digestsBlock } from './lib/findings-digest';
import { deliver, stampedName } from './lib/export-destination';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const LANE = pjoin(DL, '11+', 'from-cluecrew');
const sha = (s: string | Buffer) => createHash('sha256').update(typeof s === 'string' ? Buffer.from(s, 'utf8') : s).digest('hex');

/** The proposed fixture, run against the CURRENT gate to show exactly what is unscreened today. */
const FIXTURE_OUT = ['HELL', 'LOVER', 'DAMN', 'NAKED', 'CORPSE', 'WHISKY', 'SUICIDE'];
const FIXTURE_IN = ['PAIN', 'SHOT', 'DEAD', 'BLOOD', 'GHOST', 'WAR', 'GUN', 'SELL', 'SHELL', 'SIDE'];

function main() {
  const today = FIXTURE_OUT.map((w) => ({ word: w, headwordIsBannedToday: headwordIsBanned(w.toLowerCase()) }));
  const unscreened = today.filter((t) => !t.headwordIsBannedToday).map((t) => t.word);

  const proposal = {
    kind: 'PROPOSAL-A-SUBJECT-MATTER-SCREEN-FOR-GENERATED-CHILD-FACING-BANKS',
    TO: 'David and Annie',
    date: '2026-09-05',
    status: 'PROPOSAL ONLY. Nothing is built, no list is authored, no gate is changed. The two by-name exclusions in land-annie-226.ts stand meanwhile.',

    THE_GAP_AS_RULED: 'a generated child-facing bank has no subject-matter screen, and the ban list is scoped to claims and tone.',
    HOW_IT_SURFACED: 'the vr-08 search proposed SHELL/BEGIN and SLIDE/OVER. Both are sound items by every gate this estate has: the keys perform, the seats perform, both words clear the cut on both corpora. The DERIVED words are HELL and LOVER.',
    ANDTHATISTHEWHOLEDIFFICULTY: 'nobody typed either word. They are products of the task, so a screen that reads authored fields would not have seen them however good its list was.',
    whatTheCurrentGateSays: today,
    unscreenedToday: unscreened,

    ONE_SOURCE: {
      question: 'where does the list come from, and who can be held to it?',
      optionsConsidered: [
        { source: 'an external profanity or blocklist', verdict: 'REJECTED — wrong shape. Neither HELL nor LOVER is profanity, and the words that matter here are ordinary words wrong for the setting. A profanity list would miss both and would ban words a comprehension passage legitimately needs.' },
        { source: 'widen the existing ban list (BANNED.childFacing)', verdict: 'REJECTED — that list is scoped to CLAIMS, DIFFICULTY and TONE, and its scope is designed and documented. Adding a fourth axis makes every existing rule harder to read and makes banListScope mean something new without anyone deciding that. A gate that absorbs whatever it happens to miss stops meaning what it says.' },
        { source: 'a 11+ publisher style guide', verdict: 'POSSIBLE but unverified — this store has not established that a public one exists with usable scope. It should be looked for before anything is authored, because an external source can be cited and an in-house one can only be asserted.' },
        { source: 'authored in-house by the reviewer, small, versioned', verdict: 'THE ONLY ONE THAT MATCHES THE QUESTION TODAY — and it carries Annie\'s own warning from her 225th: it does not scale and cannot be audited by anyone but her. Which is an argument for keeping it SMALL and for it being a list of DECIDED CASES rather than a general rule.' },
      ],
      recommendation: 'author in-house, small, versioned, and seeded by the cases that actually arise — exactly the way she described the wordlist growing out of per-row readings. Look for a citable publisher source first; if one exists it is worth more than anything this store can assert.',
    },

    TWO_SCOPE: {
      THE_CRITICAL_PART: 'it must screen DERIVED words, not authored fields. HELL was never written by anyone — it is what the item asks the child to produce.',
      whatItScreens: [
        'every word a child is asked to READ on the card: word1, word2, option values, stem prompt',
        'every word a child is asked to PRODUCE: for vr-08, every leftover and every insertion the task admits — including under the LOSING options, because a child tries those too',
        'and for other districts, whatever their own derivation is: a vr-13 assembly, a vr-20 completion',
      ],
      whatItDoesNOTScreen: 'passages and comprehension text, which legitimately carry difficult subject matter and are reviewed as wholes. A screen written for generated banks and applied to authored prose would ban war from a history passage.',
      whereItRUNS: 'ONE function, called from the one child-facing gate (checkItemChildFacing) and from the generator search that proposes candidates. Two doors enumerating separately WILL drift — that is R42\'s finding and it recurred in R55 and R57. The search calls the gate\'s function; it does not carry its own copy.',
      andTHEBOUNDARY: 'the screen REFUSES a candidate; it never rewrites one. A generator that edits its way past a screen is the corpus-firewall fault in a new place.',
    },

    THREE_THE_FIXTURE: {
      why: 'her 225th: a fixture of known-in and known-out before it binds anything. A screen with only OUT cases has not been shown to discriminate, and this one\'s whole risk is over-blocking (R721).',
      mustBeCaught: FIXTURE_OUT,
      mustBeLeftALONE: FIXTURE_IN,
      andWHYTHEINLISTISTHEHARDHALF: 'PAIN, SHOT, DEAD, BLOOD, GHOST, WAR and GUN are ordinary words an 11+ paper uses without comment, and a screen that catches them is useless — it would have blocked PAINT/PLAN and SHOUT/COLD, two of the thirteen pairs that just filled the bank. SELL, SHELL and SIDE are there because the words the screen must NOT touch are the near neighbours of the ones it must: SHELL is fine and HELL is not, and they differ by a letter the task removes.',
      THEBOUNDARYISNOTTHISSTORESTODRAW: 'every word in both lists above is a PROPOSAL. The line between DEAD (in) and CORPSE (out) is a judgement about what an eleven-year-old should meet in an exam, and this store has no standing to set it. What this store can say is that the fixture must exist and must have both halves.',
    },

    FOUR_WHAT_WOULD_MAKE_THIS_NOT_WORTH_BUILDING: {
      theHonestCase: 'two words in one run. If the rate stays this low, a declared exclusion list in the applier — what is there now — is proportionate, and a gate with a hand-authored list behind it is a mechanism that will be trusted more than it deserves.',
      whatWouldSETTLETHAT: 'run the existing search over every generated district and count how many candidate items derive a word that would fail. That number is measurable today, costs nothing, and turns this from a judgement into a rate. It has NOT been run — it is proposed here, not reported.',
      andTHEASYMMETRY: 'a false negative ships one bad word to a child. A false positive silently shrinks the candidate pool and nobody sees it. The second is the one that needs the fixture.',
    },

    FIVE_WHAT_IS_TRUE_MEANWHILE: 'land-annie-226.ts excludes HELL and LOVER by name, with the reason in the source. That is a declared exclusion in one applier, not a screen: it does not travel, it does not cover other districts, and the next generator to derive a word like these will not be stopped by it.',
  };

  const clean = JSON.parse(JSON.stringify(proposal)) as Record<string, unknown>;
  const keys = ['ONE_SOURCE', 'TWO_SCOPE', 'THREE_THE_FIXTURE', 'FOUR_WHAT_WOULD_MAKE_THIS_NOT_WORTH_BUILDING'];
  Object.assign(clean, findingsDigest(clean, keys));
  clean.DIGESTS = digestsBlock(String(clean.findingsSha256), keys);
  const p = pjoin(REPO, 'content/exports', stampedName('proposal-subject-matter-screen', String(clean.findingsSha256), 'json'));
  writeFileSync(p, JSON.stringify(clean, null, 1));
  const name = deliver(p, 'proposal-subject-matter-screen').split('/').pop()!;
  const fin = sha(readFileSync(pjoin(LANE, name)));
  writeFileSync(pjoin(LANE, `${name}.sha256`), `${fin}  ${name}\n`);
  writeFileSync(pjoin(DL, name), readFileSync(pjoin(LANE, name)));
  console.log(`  ${unscreened.length} of ${FIXTURE_OUT.length} proposed must-catch words are unscreened by the gate today: ${unscreened.join(', ')}`);
  console.log(`\n  crossed: ${name}  (FILE ${fin.slice(0, 16)})`);
}

main();
