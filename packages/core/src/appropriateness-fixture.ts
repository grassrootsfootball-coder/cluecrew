/**
 * THE PORTABLE FIXTURE — cases and reasons, not a list (Annie's 228th; the authoring store's shape).
 *
 * **A LIST IS ACCEPTED BY PASSING THIS, NOT BY ADOPTING ANYONE'S VOCABULARY.** `runAgainst` takes
 * TWO SETS AND NOTHING ELSE: no import of this store's screen, no shared code path. Any store
 * passes its own refuse and flag sets and gets a verdict per case.
 *
 * **EVERY CASE CARRIES ITS REASON**, which is what makes it arguable. *A case whose reason is not
 * stated is a case another store cannot disagree with — it can only comply or fail.*
 *
 * **AND IT CAN BE FAILED.** Two negative controls are carried, because a fixture nothing can fail
 * is a wish (R721, and their store's own framing).
 */

export type CaseKind = 'MUST_REFUSE' | 'MUST_NOT_REFUSE' | 'SUBSTRING_TRAP' | 'NEEDS_A_SENSE';
export interface FixtureCase { word: string; kind: CaseKind; reason: string }

export const PORTABLE_FIXTURE_VERSION = 'serving-side portable v1.0';

export const PORTABLE_CASES: readonly FixtureCase[] = [
  // ── MUST REFUSE ─ no ordinary use in the register children read, in any scope ────────────────
  { word: 'hell', kind: 'MUST_REFUSE', reason: 'an expletive in generated text; the scriptural sense is passage territory and out of every generated scope. One of the two words that caused this screen to exist' },
  { word: 'damn', kind: 'MUST_REFUSE', reason: 'an expletive; no ordinary use as an option word' },
  { word: 'sexy', kind: 'MUST_REFUSE', reason: 'no ordinary use in the register children read' },
  { word: 'nude', kind: 'MUST_REFUSE', reason: 'no ordinary use in the register children read' },
  { word: 'corpse', kind: 'MUST_REFUSE', reason: 'no ordinary use in an eleven-plus item; BODY and REMAINS carry the same meaning without the register' },
  { word: 'suicide', kind: 'MUST_REFUSE', reason: 'no ordinary use in this register, and a subject a generated card cannot handle responsibly' },
  { word: 'brothel', kind: 'MUST_REFUSE', reason: 'no ordinary use in the register children read' },
  { word: 'heroin', kind: 'MUST_REFUSE', reason: 'a named drug with no ordinary sense; distinct from DRUG, which has a drug store' },
  { word: 'whisky', kind: 'MUST_REFUSE', reason: 'a named spirit with no ordinary child sense; distinct from BEER, which has root beer' },

  // ── MUST NOT REFUSE ─ ordinary words for difficult things. Over-refusal strips the corpus ────
  { word: 'knife', kind: 'MUST_NOT_REFUSE', reason: 'a kitchen knife; a group of sharp things is an ordinary vr-02 item. THE AUTHORING STORE REFUSED IT in its own first draft and caught it within the hour' },
  { word: 'tobacco', kind: 'MUST_NOT_REFUSE', reason: 'a crop and a historical trade. THIS STORE REFUSED IT in its own first draft; caught by a baseline diff on ENG-018-RB-02, a walk script reporting that Mr Cobb has tobacco in his cheek' },
  { word: 'killed', kind: 'MUST_NOT_REFUSE', reason: 'killed the engine — her 227th\'s own example, and the reason the pass half exists' },
  { word: 'die', kind: 'MUST_NOT_REFUSE', reason: 'a die is one of a pair of dice; plants die in every science book' },
  { word: 'dead', kind: 'MUST_NOT_REFUSE', reason: 'a dead end; a dead battery' },
  { word: 'blood', kind: 'MUST_NOT_REFUSE', reason: 'blood vessels; the bloodstream. Biology in every year group' },
  { word: 'war', kind: 'MUST_NOT_REFUSE', reason: 'history in every year group' },
  { word: 'weapon', kind: 'MUST_NOT_REFUSE', reason: 'a weapon in a myth' },
  { word: 'poison', kind: 'MUST_NOT_REFUSE', reason: 'a poison dart frog; poisonous plants in science' },
  { word: 'ghost', kind: 'MUST_NOT_REFUSE', reason: 'a ghost story is a genre eleven-year-olds read for pleasure' },
  { word: 'hate', kind: 'MUST_NOT_REFUSE', reason: 'I hate broccoli — ordinary children\'s speech' },
  { word: 'ugly', kind: 'MUST_NOT_REFUSE', reason: 'the Ugly Duckling' },
  { word: 'fat', kind: 'MUST_NOT_REFUSE', reason: 'fat content; a fat book' },
  { word: 'sick', kind: 'MUST_NOT_REFUSE', reason: 'off sick; travel sick' },
  { word: 'enemy', kind: 'MUST_NOT_REFUSE', reason: 'ordinary in history and in fiction' },
  { word: 'cigarette', kind: 'MUST_NOT_REFUSE', reason: 'a plain noun in a story; naming an object is not endorsing it' },

  // ── SUBSTRING TRAPS ─ whole words containing a refused one. A substring matcher fails all ────
  { word: 'shell', kind: 'SUBSTRING_TRAP', reason: 'contains HELL. A shell on a beach; vr-08 carries SHELL as a stem word and vr-10 as an option' },
  { word: 'shelf', kind: 'SUBSTRING_TRAP', reason: 'contains HEL. vr-08 carried SHELF as a stem word' },
  { word: 'glover', kind: 'SUBSTRING_TRAP', reason: 'contains LOVER. A surname and a trade' },
  { word: 'clover', kind: 'SUBSTRING_TRAP', reason: 'contains LOVER. A plant' },
  { word: 'grass', kind: 'SUBSTRING_TRAP', reason: 'contains ASS. A plant; vr-02 carries it in a nature group' },
  { word: 'class', kind: 'SUBSTRING_TRAP', reason: 'contains ASS. A school class' },
  { word: 'button', kind: 'SUBSTRING_TRAP', reason: 'contains BUTT. A button on a coat' },
  { word: 'diesel', kind: 'SUBSTRING_TRAP', reason: 'contains DIE. A fuel' },
  { word: 'analyse', kind: 'SUBSTRING_TRAP', reason: 'contains ANAL. Ordinary in any register' },
  { word: 'hello', kind: 'SUBSTRING_TRAP', reason: 'contains HELL. The commonest greeting in English' },
  { word: 'damp', kind: 'SUBSTRING_TRAP', reason: 'contains DAM. Ordinary weather and building vocabulary' },

  // ── NEEDS A SENSE ─ must not SILENTLY PASS. Refusing or flagging both satisfy the case ───────
  { word: 'lover', kind: 'NEEDS_A_SENSE', reason: 'THE CASE THAT FORCED THE THIRD OUTCOME. "A lover of books" is ordinary and the rule carries it off the refuse list; but the 227th named LOVER as a reason the screen exists. The rule presumes a register and a bare option value has none. A list may resolve this either way; IT MAY NOT RESOLVE IT SILENTLY' },
  { word: 'bloody', kind: 'NEEDS_A_SENSE', reason: 'a bloody nose, and an oath. This store flags it; the authoring store passes it. A live disagreement, and a list must at least SEE it' },
  { word: 'drunk', kind: 'NEEDS_A_SENSE', reason: 'the past participle of DRINK — "she had drunk her milk" — and a state. This store flags; they pass. It may not be refused (see MUST_NOT_REFUSE reasoning) and it may not pass unseen' },
  { word: 'naked', kind: 'NEEDS_A_SENSE', reason: 'the naked eye, and the bare sense. This store kept it as a refusal with the ordinary use logged as a known false positive, which is a word needing a sense described instead of handled' },
  { word: 'shoot', kind: 'NEEDS_A_SENSE', reason: 'a bamboo shoot and a gun. The authoring store had it in two lists at once and its own fixture halted' },
  { word: 'mistress', kind: 'NEEDS_A_SENSE', reason: 'a schoolmistress and the other sense. This store flags; they pass' },
];

export interface CaseResult { word: string; kind: CaseKind; passed: boolean; reason: string; saw: string }
export interface FixtureRun { total: number; passing: number; failures: CaseResult[]; results: CaseResult[]; contradictions: string[] }

/**
 * Run every case against TWO SETS and nothing else. No screen, no shared code, no vocabulary.
 * A word is judged by which set it is in — that is all a list is.
 */
export function runAgainst(refuse: Iterable<string>, flag: Iterable<string>): FixtureRun {
  const R = new Set([...refuse].map((w) => w.toLowerCase()));
  const F = new Set([...flag].map((w) => w.toLowerCase()));
  const contradictions = [...R].filter((w) => F.has(w));
  const results = PORTABLE_CASES.map((c) => {
    const w = c.word.toLowerCase();
    const inR = R.has(w), inF = F.has(w);
    const saw = inR && inF ? 'BOTH LISTS' : inR ? 'refuse' : inF ? 'flag' : 'neither';
    const passed =
      c.kind === 'MUST_REFUSE' ? inR
      : c.kind === 'MUST_NOT_REFUSE' || c.kind === 'SUBSTRING_TRAP' ? !inR
      : /* NEEDS_A_SENSE — refusing or flagging both satisfy it; silence does not */ inR || inF;
    return { word: c.word, kind: c.kind, passed, reason: c.reason, saw };
  });
  return { total: results.length, passing: results.filter((r) => r.passed).length,
    failures: results.filter((r) => !r.passed), results, contradictions };
}

/**
 * THE NEGATIVE CONTROLS. A fixture nothing can fail is a wish, so two lists that SHOULD fail are
 * carried and asserted to fail — one over-refusing, one self-contradicting.
 */
export const NEGATIVE_CONTROLS = {
  aSubstringStyleList: { refuse: ['hell', 'ass', 'die', 'butt', 'lover', 'knife', 'drunk', 'anal', 'dam'], flag: [] as string[],
    why: 'refuses ordinary words for containing a refused one, and misses the words that matter. The exact double fault: over-refusing while under-refusing' },
  aSelfContradictingList: { refuse: ['hell', 'damn', 'shoot', 'lover'], flag: ['shoot', 'lover'],
    why: 'two words sit in both lists at once. A fixture that cannot detect its own contradiction is a wish' },
  aSilentlyPermissiveList: { refuse: ['hell', 'damn', 'sexy', 'nude', 'corpse', 'suicide', 'brothel', 'heroin', 'whisky'], flag: [] as string[],
    why: 'every MUST_REFUSE passes and nothing is flagged — so LOVER passes SILENTLY, which is the one thing their fixture and this one both forbid' },
};

/** Asserts the controls fail and returns their scores. Throws if any control passes. */
export function assertNegativeControls(): Record<string, { passing: number; of: number; contradictions: number }> {
  const out: Record<string, { passing: number; of: number; contradictions: number }> = {};
  for (const [name, c] of Object.entries(NEGATIVE_CONTROLS)) {
    const run = runAgainst(c.refuse, c.flag);
    out[name] = { passing: run.passing, of: run.total, contradictions: run.contradictions.length };
    const failed = run.failures.length > 0 || run.contradictions.length > 0;
    if (!failed) throw new Error(`negative control "${name}" PASSED the fixture. A fixture nothing can fail is a wish.`);
  }
  return out;
}
