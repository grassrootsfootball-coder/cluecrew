/**
 * THE SUBJECT-MATTER SCREEN (Annie's 227th; David's ruling, 2026-09-05).
 *
 * **NOTHING IN THIS ESTATE HAS EVER ASKED WHETHER A STRING IS APPROPRIATE FOR A CHILD.** Every
 * gate built this fortnight asks whether a claim is true, a tag performs, a key computes, a word is
 * known. HELL and LOVER passed all of it because all of it is about CORRECTNESS. They were caught
 * by a name filter that was not looking for them and would not have caught a hundred others —
 * **exclusion by accident is the same state as no exclusion at all**, and the estate's apparent
 * absence of failures here is a fact about generation volume, not about safety.
 *
 * ── SOURCE ────────────────────────────────────────────────────────────────────────────────────
 * AUTHORED IN-HOUSE, v1, seeded by the cases that actually arose. Three sources were considered and
 * two rejected in the crossed proposal: an external profanity list is the wrong SHAPE (neither HELL
 * nor LOVER is profanity, and the words that matter are ordinary words wrong for the setting), and
 * widening `BANNED.childFacing` was rejected because that list is scoped to claims, difficulty and
 * tone — a gate that absorbs whatever it happens to miss stops meaning what it says.
 *
 * **THE SOURCE'S WEAKNESS IS ITS INCOMPLETENESS AND THAT IS STATED, NOT DISCOVERED LATER.** A
 * hand-authored list catches what someone thought of. It is a floor, not a proof, and its growth
 * path is the fixture: every case that arises is added there first. **It carries no slur coverage
 * and must not be read as having any** — that needs a properly sourced list and a separate ruling,
 * and pretending otherwise would be the most dangerous thing this file could do.
 *
 * ── SCOPE ─────────────────────────────────────────────────────────────────────────────────────
 * **GENERATED CHILD-FACING CONTENT ONLY. NOT PASSAGES.** Public-domain literature carries what it
 * carries, and `QUOTATION_FIELDS` already holds that ground: a quotation is bound by FIDELITY TO
 * ITS SOURCE where the ban list binds OUR OWN WORDS. A screen that edits Grahame or Sewell is the
 * gate that would have edited a quotation, so quoted and specimen material is exempt here by the
 * same rule and not by a second list of its own (R57/R429).
 *
 * ── THE FIXTURE IS TWO-SIDED, AND THE PASS HALF MATTERS MORE ──────────────────────────────────
 * **A screen tuned only to refuse will quietly strip a corpus of ordinary language.** A maths
 * district that cannot say *kill* in *killed the engine* is damaged by its own guard. So KILL,
 * DEAD, BLOOD, GUN, WAR, SHOT and PAIN are must-PASS cases, carried in the same fixture and given
 * the same weight — and SHELL, SELL and SIDE are there because **the words this must not touch are
 * the near neighbours of the words it must**: SHELL is fine, HELL is not, and they differ by the
 * letter a vr-08 task removes.
 */

/** Bump when the list changes. A screen without a version cannot be cited by a store that ran it. */
export const APPROPRIATENESS_VERSION = 'v1-2026-09-05';

export const APPROPRIATENESS_SOURCE = {
  version: APPROPRIATENESS_VERSION,
  source: 'authored in-house, seeded by cases arising; no external list is cited because none of the right shape was found',
  scope: 'GENERATED child-facing content — stems, options and generated text, plus every word a generated task asks a child to PRODUCE. NOT passages, quotations or specimen material.',
  ruling: 'Annie 227th; David 2026-09-05 — one predicate, declared once, called at the search and at every write producing child-facing text',
  knownLimits: [
    'INCOMPLETE BY CONSTRUCTION: a hand-authored list catches what somebody thought of. This is a floor, not a proof.',
    'NO SLUR COVERAGE. It contains none and must not be read as having any; that needs a sourced list and its own ruling.',
    'WORD-LEVEL ONLY: it cannot see that an innocent sentence is about something unsuitable.',
    'AMBIGUOUS WORDS ARE OMITTED RATHER THAN HANDLED. A word with any ordinary use in a child\'s register is left off, because a word-level matcher cannot tell "a bloody nose" from an oath. That is a deliberate hole on the refuse side, chosen over the certainty of stripping ordinary language.',
    'ONE KNOWN FALSE POSITIVE KEPT ON PURPOSE: "naked" refuses, so "visible to the naked eye" would be flagged. The bare word is unsuitable often enough in generated content to be worth one phrase a reviewer can wave.',
  ],
} as const;

/**
 * REFUSED IN GENERATED CONTENT. Every entry is a word a child could meet on a generated card where
 * no passage supplies a reason for it. Ordinary words for difficult things are NOT here — see the
 * pass fixture, which is the half that keeps this honest.
 */
const REFUSED = [
  // oaths
  'hell', 'damn', 'crap', 'bugger', 'arse', 'bastard', 'bitch',
  // adult/sexual
  'lover', 'naked', 'nude', 'sexy', 'lust', 'brothel',
  // intoxicants
  'whisky', 'whiskey', 'vodka', 'brandy', 'booze', 'heroin', 'cocaine',
  // death and violence beyond the ordinary register
  'corpse', 'suicide', 'slaughter', 'massacre', 'torture', 'hanged',
];

/**
 * **SIX WORDS WERE REMOVED FROM THE FIRST DRAFT OF THIS LIST BY ITS OWN FIRST RUN, AND THE RULE
 * THEY VIOLATED IS NOW THE RULE FOR ADDING ANY.**
 *
 * `tobacco`, `cigarette`, `bloody`, `drunk`, `mistress` and `affair` all have ORDINARY uses in the
 * register children read: a bloody nose, *had drunk her tea*, a family affair, the mistress of the
 * house. The screen's first baseline diff caught `tobacco` on `ENG-018-RB-02` — a walk script for
 * *Rebecca of Sunnybrook Farm* reporting that Mr Cobb has tobacco in his cheek, which is exactly
 * what a comprehension walk script is FOR.
 *
 * **THE RULE: a word belongs on this list only if it has NO ordinary use in the register children
 * read.** That is the operational form of her 227th — a screen tuned only to refuse strips a corpus
 * of ordinary language — and it is why the pass fixture is not decoration. Every removed word is
 * now a must-PASS case, so no future edit can quietly put them back.
 */

/** Optional plural or possessive only — never a loose prefix, which would catch SHELL from HELL. */
const PATTERNS = REFUSED.map((w) => ({ word: w, re: new RegExp(`\\b${w}(s|'s|es)?\\b`, 'i') }));

export interface AppropriatenessHit { word: string; matched: string }

/** Does this string carry a refused word? Returns every hit, so a report never says only the first. */
export function appropriatenessHits(text: string): AppropriatenessHit[] {
  const hits: AppropriatenessHit[] = [];
  for (const p of PATTERNS) { const m = p.re.exec(text); if (m) hits.push({ word: p.word, matched: m[0] }); }
  return hits;
}

/**
 * THE PREDICATE THE SEARCH CALLS. A search that cannot propose an unsuitable candidate is a system
 * that cannot fail in this direction; a search that proposes one for a gate to catch is a system
 * that works and wastes (her 227th).
 */
export function isAppropriateForAChild(word: string): boolean {
  return appropriatenessHits(word).length === 0;
}

/**
 * THE FIXTURE. Both halves carried, and the PASS half is not decoration: it is the half that fails
 * if this screen is ever tuned into a corpus-stripper.
 */
export const APPROPRIATENESS_FIXTURE = {
  mustRefuse: ['HELL', 'LOVER', 'DAMN', 'NAKED', 'CORPSE', 'WHISKY', 'SUICIDE', 'BROTHEL', 'a hell of a thing'],
  mustPass: [
    // her own instance: a district that cannot say this is damaged by its own guard
    'killed the engine', 'kill', 'dead', 'die', 'blood', 'gun', 'war', 'shot', 'pain', 'poison',
    'ghost', 'fight', 'hate', 'sick', 'weapon', 'enemy', 'angry',
    // the near neighbours of the refused words, which a loose matcher would take with them
    'shell', 'sell', 'side', 'hello', 'shellfish', 'damp', 'lovely', 'clover', 'bloodied',
    // the six its own first run removed — every one has an ordinary use, and each is pinned here
    // so no later edit can put them back without this fixture failing
    'tobacco in his cheek', 'a cigarette card', 'a bloody nose', 'she had drunk her tea',
    'the mistress of the house', 'a family affair',
  ],
} as const;

/** Runs the fixture. Throws on any disagreement — a screen unproven in both directions is not one. */
export function runAppropriatenessFixture(): { refused: number; passed: number } {
  const wrongly: string[] = [];
  for (const s of APPROPRIATENESS_FIXTURE.mustRefuse) if (appropriatenessHits(s).length === 0) wrongly.push(`MISSED "${s}"`);
  for (const s of APPROPRIATENESS_FIXTURE.mustPass) if (appropriatenessHits(s).length > 0) wrongly.push(`WRONGLY REFUSED "${s}" (on ${appropriatenessHits(s).map((h) => h.word).join(', ')})`);
  if (wrongly.length) throw new Error(`the appropriateness fixture fails on ${wrongly.length} case(s):\n  ${wrongly.join('\n  ')}`);
  return { refused: APPROPRIATENESS_FIXTURE.mustRefuse.length, passed: APPROPRIATENESS_FIXTURE.mustPass.length };
}
