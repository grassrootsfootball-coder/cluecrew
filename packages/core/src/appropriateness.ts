/**
 * THE SUBJECT-MATTER SCREEN (Annie's 227th and 228th; David's rulings, 2026-09-05).
 *
 * **NOTHING IN THIS ESTATE HAD EVER ASKED WHETHER A STRING IS APPROPRIATE FOR A CHILD.** Every
 * other gate asks whether a claim is true, a tag performs, a key computes, a word is known. HELL
 * and LOVER passed all of it because all of it is about CORRECTNESS, and they were stopped by a
 * name filter that was not looking for them: **exclusion by accident is the same state as no
 * exclusion at all.**
 *
 * ── SOURCE ─ authored in-house, seeded by cases arising. No external list of the right shape was
 * found; a profanity list would miss both words that caused this, and widening `BANNED.childFacing`
 * was rejected because that list is scoped to claims, difficulty and tone.
 *
 * ── SCOPE ─ GENERATED child-facing content, including every word a generated task asks a child to
 * PRODUCE. **NOT passages, quotations or specimen material** — a quotation is bound by fidelity to
 * its source where the ban list binds our own words, and a screen that edits Grahame or Sewell is
 * the gate that would have edited a quotation. That boundary is inherited from `QUOTATION_FIELDS`
 * and `banListApplies`, never re-derived (R57/R429).
 *
 * ── THE RULE ─ **a word belongs on the refuse list only if it has NO ordinary use in the register
 * children read.** A bloody nose; *she had drunk her tea*; a family affair; tobacco in his cheek.
 *
 * ── THE QUALIFIER THE OTHER STORE OFFERED, AND THE ONLY THING THAT RECONCILES THE RULE WITH THE
 * CASE THAT CAUSED THE SCREEN ─ the rule presumes a register AROUND the word, **and a bare option
 * value has none: it is a token on a card, not a sentence.** So *"a lover of books"* is ordinary
 * and bare `LOVER` is not the same string in the same place. **A word whose ordinary use REQUIRES
 * context the scope cannot supply does not pass — it FLAGS.** Where the default reading of the bare
 * token is the ordinary one it passes; where the ordinary sense needs a sentence that is not there
 * it flags. Every assignment below is a READING, not a measurement.
 *
 * ── THE THIRD OUTCOME HAS AN ADDRESSEE, AND IT DIFFERS BY DOOR (her 228th) ─ **a flag with no
 * reader is a diary entry.** At the SEARCH ambiguity is free to avoid: a flagged candidate is
 * dropped and another proposed, because the corpus does not need that particular word. At the WRITE
 * GATE ambiguity costs a reading and should get one: the row HOLDS and routes to the reviewer with
 * its context, because somebody wanted that word. **A screen that proposes may refuse cheaply; a
 * screen that judges what someone wrote may not.**
 */

export const APPROPRIATENESS_VERSION = 'v2-2026-09-05';

export const APPROPRIATENESS_SOURCE = {
  version: APPROPRIATENESS_VERSION,
  source: 'authored in-house, seeded by cases arising; no external list of the right shape was found',
  scope: 'GENERATED child-facing content, including derived words. NOT passages, quotations or specimen material.',
  rule: 'a word belongs on the refuse list only if it has NO ordinary use in the register children read',
  qualifier: 'a word whose ordinary use REQUIRES context this scope cannot supply does not pass — it flags (the authoring store\'s qualifier, 2026-09-02)',
  routing: 'search: a flag is dropped and another candidate proposed. Write gate: the row HOLDS and routes to the reviewer with its context (Annie, 228th)',
  knownLimits: [
    'INCOMPLETE BY CONSTRUCTION: a hand-authored list catches what somebody thought of. A floor, not a proof.',
    'NO SLUR COVERAGE. It contains none and must not be read as having any; that needs a sourced list and its own ruling.',
    'WORD-LEVEL ONLY: it cannot see that an innocent sentence is about something unsuitable.',
    'EVERY LIST MEMBERSHIP IS A READING, NOT A MEASUREMENT — including which token is the default reading of a bare word.',
    'CROSSED AGAINST ONE OTHER LIST ONLY, and the two disagreed on a whole category (drug and weapon doubles) that neither fixture could have surfaced alone.',
  ],
} as const;

/** No ordinary use in the register children read, in any scope. */
const REFUSED = [
  'hell', 'damn', 'crap', 'bugger', 'arse', 'bastard', 'satan',
  'nude', 'sexy', 'lust', 'brothel',
  'whisky', 'whiskey', 'vodka', 'brandy', 'booze', 'heroin', 'cocaine',
  'corpse', 'suicide', 'hanged',
];

/**
 * FLAGGED — two kinds, both flag, and the kinds are kept apart because the distinction IS the
 * reconciliation. Neither is copied from the other store: their qualifier is a RULE and this is
 * that rule applied to this store's own words, or the cross between the two lists measures nothing.
 */
/**
 * **THE MEMBERSHIP TEST FOR THIS CLASS, AND IT IS HERS (229th, as relayed): does the unsuitable
 * sense arrive BEFORE the ordinary one, read as the adult over the child's shoulder?**
 *
 * It is a reading and not a measurement, and it decides differently from "has an unsuitable sense
 * somewhere" — which is what a list grows into if nobody states the test. Applied to the two words
 * her ruling names:
 *   · DRUG — bare, the narcotic sense arrives first. **In the class.** Added here.
 *   · TRIP — bare, a journey or a stumble arrives first and the other sense is well behind.
 *     **NOT in the class by her own test**, and it is therefore not flagged here, so this store's
 *     gate has no instance of it to route. The authoring store flags it and holds that instance.
 * That split is this store's reading of her test and is the thing to overrule if it is wrong.
 */
const FLAG_AMBIGUOUS_SENSE = [
  'bloody', 'drunk', 'mistress', 'affair', 'naked', 'spirits', 'liquor', 'bitch', 'drug',
  /**
   * **FOUR CASES THIS STORE'S LIST FAILED IN THE AUTHORING STORE'S FIXTURE.** Their fixture asserts
   * these must not SILENTLY PASS and this store's list passed all four. Flagging satisfies the case
   * without adopting their verdict — and adopting a FIXTURE CASE is not adopting a list.
   *
   * **Independence is for FINDING; convergence is for FIXING.** The cross needed two independent
   * lists to surface this category at all. Once surfaced, refusing to converge would be keeping a
   * known hole open to protect a measurement that has already been taken.
   */
  'shoot', 'arms', 'pot', 'high',
];
/**
 * The ordinary sense needs a sentence that a bare token cannot supply. LOVER is the case.
 *
 * **THE UNDER-APPLICATION RULE (the authoring store, 2026-09-05): a qualifier is UNDER-APPLIED
 * until it has been run over every word the rule it qualifies already touched.** This store had
 * applied it to four words it happened to be thinking about. Run over the whole refuse list, it
 * moves NOTHING — and the first attempt to run it moved three, which was the qualifier being
 * MISAPPLIED rather than finally applied.
 *
 * **THE DISTINCTION THE FIRST PASS BLURRED, WHICH IS THE QUALIFIER'S OWN TEST:** it is not "does
 * this word have an ordinary use somewhere". It is *"where the DEFAULT READING OF THE BARE TOKEN is
 * the ordinary one it passes; where the ordinary sense needs a sentence that is not there it
 * flags."* `nude` has a nude shade, `lust` a lust for life, `brandy` a brandy snap — and the
 * default bare reading of all three is the unsuitable sense, which is the REFUSE case and not the
 * flag case. Caught by this store's own portable fixture, which asserts `nude` MUST_REFUSE and
 * failed 41 of 42 the moment the list moved under it.
 *
 * **So the honest result of the under-application check is ZERO MOVES over twenty-one words** — and
 * that is a result, not a null. Running it was the only way to know.
 */
const FLAG_NEEDS_CONTEXT = ['lover', 'slaughter', 'massacre', 'torture'];
const FLAGGED = [...FLAG_AMBIGUOUS_SENSE, ...FLAG_NEEDS_CONTEXT];

/**
 * **THE DEPARTURES, WITH THE ORDINARY USE THAT CARRIED EACH ONE OUT.** A list that records only its
 * state cannot be argued with; one that records its history can. Every entry here was on a draft of
 * the refuse list and left under the rule.
 */
export const DEPARTURES: ReadonlyArray<{ word: string; ordinaryUse: string }> = [
  { word: 'tobacco', ordinaryUse: 'tobacco in his cheek — a walk script for Rebecca of Sunnybrook Farm; caught by this screen\'s own first baseline diff' },
  { word: 'cigarette', ordinaryUse: 'a plain noun in a story' },
  { word: 'bloody', ordinaryUse: 'a bloody nose — now a FLAG rather than a departure' },
  { word: 'drunk', ordinaryUse: 'she had drunk her tea — the past participle of drink; now a FLAG' },
  { word: 'mistress', ordinaryUse: 'the mistress of the house; now a FLAG' },
  { word: 'affair', ordinaryUse: 'a family affair; now a FLAG' },
  { word: 'naked', ordinaryUse: 'visible to the naked eye; moved from REFUSE to FLAG, having been kept as a refusal with this logged as a known false positive — a word needing a sense, described instead of handled' },
  { word: 'lover', ordinaryUse: 'a lover of books. It leaves the refuse list under the rule and lands on FLAG under the qualifier, which is the only reading that holds both the rule and her 227th naming LOVER as the reason the screen exists' },
];

const rx = (w: string) => new RegExp(`\\b${w}(s|'s|es)?\\b`, 'i');
const REFUSE_PATTERNS = REFUSED.map((w) => ({ word: w, re: rx(w) }));
const FLAG_PATTERNS = FLAGGED.map((w) => ({ word: w, re: rx(w) }));

export interface AppropriatenessHit { word: string; matched: string }
export type AppropriatenessVerdict = 'PASS' | 'FLAG-NEEDS-A-SENSE' | 'REFUSE';
/** BARE has no sentence to supply the sense — an option value, a leftover, a headword. */
export type AppropriatenessScope = 'bare' | 'sentence';
/** Which door is asking. A flag means different things at each, and that is her 228th's whole point. */
export type AppropriatenessDoor = 'search' | 'write-gate';
/**
 * Where the flagged token sits. **A KEY is not a distractor** (her 229th, standing exception): the
 * key is the answer the child must produce and carry away, where a distractor is one she rejects.
 * So a flagged word in the key position **routes every time, clearance notwithstanding** — a
 * clearance says the sense was ordinary in that row on that reading, and it does not make the word
 * a safe thing to teach as the answer.
 */
export type TokenRole = 'key' | 'distractor' | 'other';
export type AppropriatenessAction = 'accept' | 'drop-and-retry' | 'hold-and-route' | 'refuse';

export interface AppropriatenessResult {
  verdict: AppropriatenessVerdict;
  hits: AppropriatenessHit[];
  scope: AppropriatenessScope;
  door: AppropriatenessDoor;
  /** What the calling door must DO. A verdict with no action is the diary entry she names. */
  action: AppropriatenessAction;
  reader: string | null;
}

export function appropriatenessHits(text: string): AppropriatenessHit[] {
  const hits: AppropriatenessHit[] = [];
  for (const p of REFUSE_PATTERNS) { const m = p.re.exec(text); if (m) hits.push({ word: p.word, matched: m[0] }); }
  return hits;
}

export function flagHits(text: string): AppropriatenessHit[] {
  const hits: AppropriatenessHit[] = [];
  for (const p of FLAG_PATTERNS) { const m = p.re.exec(text); if (m) hits.push({ word: p.word, matched: m[0] }); }
  return hits;
}

/** The full verdict. **It reports and never rewrites** — nothing is stripped in place. */
export function screenForAChild(
  text: string, scope: AppropriatenessScope = 'bare', door: AppropriatenessDoor = 'write-gate',
  ctx: { role?: TokenRole; cleared?: boolean } = {},
): AppropriatenessResult {
  const refuse = appropriatenessHits(text);
  if (refuse.length) return { verdict: 'REFUSE', hits: refuse, scope, door, action: door === 'search' ? 'drop-and-retry' : 'refuse', reader: null };
  const flags = flagHits(text);
  if (flags.length && scope === 'bare') {
    /**
     * **THE STANDING EXCEPTION OUTRANKS A CLEARANCE, AND ONLY IN ONE DIRECTION.** A cleared
     * distractor stays cleared; a cleared KEY routes again. Nothing here can clear a key, which is
     * the point — the exception exists so that a ruling on one reading cannot become a permanent
     * pass on the word a child is being taught to produce.
     */
    if (ctx.cleared && ctx.role !== 'key') {
      return { verdict: 'PASS', hits: [], scope, door, action: 'accept', reader: null };
    }
    return {
      verdict: 'FLAG-NEEDS-A-SENSE', hits: flags, scope, door,
      // At the search, ambiguity is free to avoid — spending a reader on a proposal is spending a
      // person where a retry would do. At the write gate somebody WANTED that word.
      action: door === 'search' ? 'drop-and-retry' : 'hold-and-route',
      reader: door === 'search' ? null
        : ctx.role === 'key'
          ? 'the reviewer — THE FLAGGED TOKEN IS THE KEY, so this routes every time even though the position has been cleared before (her 229th, standing exception)'
          : 'the reviewer, with the row and its context',
    };
  }
  return { verdict: 'PASS', hits: [], scope, door, action: 'accept', reader: null };
}

/** The search's predicate: a flag is dropped, so a proposal never carries what a reader would owe time to. */
export function isAppropriateForAChild(word: string): boolean {
  return screenForAChild(word, 'bare', 'search').action === 'accept';
}

/**
 * THE FIXTURE.
 *
 * **THE PASS HALF IS ASSERTED AS NEVER-REFUSED, NOT AS PASS** — the other store's repair, and the
 * one that reconciles SHELL. A word may legitimately be a substring trap (must not be refused for
 * containing HELL) AND an ambiguous sense (must not be silently passed); asserting equality with
 * PASS makes those two memberships a contradiction when the real requirement is that it never be
 * REFUSED. **The fault was the assertion, not the lists.**
 */
export const APPROPRIATENESS_FIXTURE = {
  mustRefuse: ['HELL', 'DAMN', 'CORPSE', 'WHISKY', 'SUICIDE', 'BROTHEL', 'SATAN', 'a hell of a thing'],
  /** May PASS or FLAG. May never REFUSE. */
  mustNeverBeRefused: [
    'kill', 'killed the engine', 'dead', 'die', 'blood', 'gun', 'war', 'shot', 'pain', 'poison',
    'ghost', 'fight', 'hate', 'sick', 'weapon', 'enemy', 'angry', 'knife', 'murder', 'stupid', 'ugly', 'fat',
    'sell', 'side', 'hello', 'shellfish', 'damp', 'lovely', 'bloodied',
    'tobacco in his cheek', 'a cigarette card',
    // the substring traps — each a whole word containing a refused one
    'shell', 'glover', 'grass', 'class', 'button', 'diesel',
  ],
  mustFlagWhenBARE: ['bloody', 'drunk', 'mistress', 'affair', 'naked', 'lover', 'bitch'],
  mustPassInASentence: ['a bloody nose', 'she had drunk her tea', 'the mistress of the house',
    'a family affair', 'visible to the naked eye', 'a lover of books'],
  /** Her 228th: at the search a flag is dropped; at the write gate it holds and routes. */
  routing: [
    { text: 'lover', scope: 'bare' as const, door: 'search' as const, action: 'drop-and-retry' as const },
    { text: 'lover', scope: 'bare' as const, door: 'write-gate' as const, action: 'hold-and-route' as const },
    { text: 'a lover of books', scope: 'sentence' as const, door: 'write-gate' as const, action: 'accept' as const },
    { text: 'HELL', scope: 'bare' as const, door: 'write-gate' as const, action: 'refuse' as const },
  ],
} as const;

export interface FixtureCounts { refused: number; neverRefused: number; flagged: number; inASentence: number; routing: number; contradictions: number }

/**
 * Runs every half AND checks the lists against each other. **A fixture that can detect its own
 * contradiction is a specification; one that cannot is a wish** (Annie, 228th) — so a word sitting
 * in both the refuse and flag lists halts the run rather than being silently resolved.
 */
export function runAppropriatenessFixture(): FixtureCounts {
  const wrong: string[] = [];
  const F = APPROPRIATENESS_FIXTURE;

  const both = REFUSED.filter((w) => FLAGGED.includes(w));
  if (both.length) wrong.push(`CONTRADICTION — ${both.join(', ')} sit(s) in the refuse list AND the flag list`);
  const dup = (xs: readonly string[]) => xs.filter((w, i) => xs.indexOf(w) !== i);
  for (const [name, xs] of [['refuse', REFUSED], ['flag', FLAGGED]] as const) {
    const d = dup(xs); if (d.length) wrong.push(`CONTRADICTION — ${name} list repeats ${d.join(', ')}`);
  }

  for (const s of F.mustRefuse) if (screenForAChild(s, 'bare').verdict !== 'REFUSE') wrong.push(`MISSED "${s}"`);
  for (const s of F.mustNeverBeRefused) { const v = screenForAChild(s, 'bare'); if (v.verdict === 'REFUSE') wrong.push(`WRONGLY REFUSED "${s}" (${v.hits.map((h) => h.word).join(', ')})`); }
  for (const s of F.mustFlagWhenBARE) { const v = screenForAChild(s, 'bare'); if (v.verdict !== 'FLAG-NEEDS-A-SENSE') wrong.push(`"${s}" bare should FLAG and gave ${v.verdict}`); }
  for (const s of F.mustPassInASentence) { const v = screenForAChild(s, 'sentence'); if (v.verdict !== 'PASS') wrong.push(`"${s}" in a sentence should PASS and gave ${v.verdict}`); }
  for (const r of F.routing) { const v = screenForAChild(r.text, r.scope, r.door); if (v.action !== r.action) wrong.push(`"${r.text}" at the ${r.door} should ${r.action} and gave ${v.action}`); }

  if (wrong.length) throw new Error(`the appropriateness fixture fails on ${wrong.length} case(s):\n  ${wrong.join('\n  ')}`);
  return { refused: F.mustRefuse.length, neverRefused: F.mustNeverBeRefused.length, flagged: F.mustFlagWhenBARE.length,
    inASentence: F.mustPassInASentence.length, routing: F.routing.length, contradictions: 0 };
}

/** The lists themselves, for crossing. Published entire — a cross on a fifth of a population is a start, not a result. */
export const APPROPRIATENESS_LISTS = { refuse: REFUSED, flagAmbiguousSense: FLAG_AMBIGUOUS_SENSE, flagNeedsContext: FLAG_NEEDS_CONTEXT } as const;
