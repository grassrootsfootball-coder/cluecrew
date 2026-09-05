/**
 * The child-facing content gates, in ONE place.
 *
 * Two rulings of 2026-08-02 shaped this module:
 *
 * 1. READING AGE IS CHECKED BY ROLE (David's spec correction). The 16-word
 *    sentence cap applies to what a child reads UNDER PRESSURE — item stems,
 *    the options beneath them, and the instructions on a paper. It does NOT
 *    apply to a Word-card sentence, whose required function is to
 *    disambiguate a meaning: a long sentence there is often the correct
 *    sentence. Word cards keep the vocabulary ceiling (reading age ≤9) and
 *    lose the length cap. The earlier blanket cap was a spec error.
 *
 * 2. THE GATES MUST RUN AGAINST THE DATABASE, not only the content files.
 *    The lint and the scanner read /content, so anything imported straight
 *    into a table walked past both. This module is the shared implementation
 *    the file lint, the database sweep and the publish doors all call, so
 *    there is exactly one definition of "passes" and no route around it.
 */
import bannedVocabulary from './banned-vocabulary.json';
import ukSpelling from './uk-spelling.json';

/**
 * What a piece of text IS determines which rules apply to it. Adding a role
 * is a deliberate act — the default for anything unclassified is the
 * strictest set, so a new surface cannot slip in unchecked.
 */
export type ContentRole =
  /** A question's stem. Read under time pressure: capped. */
  | 'item-stem'
  /**
   * A stem the child PROOFREADS or fills a gap in — error-spotting and cloze.
   * Reading age ≤9 still applies, but there is NO word cap: the sentence to
   * be corrected IS the format, and shortening it destroys the question
   * (David's spec correction, 2026-08-02, same class as the Word-card one).
   */
  | 'item-stem-proofread'
  /** An answer option. Read under time pressure, repeatedly: capped. */
  | 'item-option'
  /** A paper's or section's instructions. Read cold, under pressure: capped. */
  | 'instructions'
  /** A Word-card definition or example sentence. NOT capped (ruling 1). */
  | 'word-card'
  /** The hint shown when a child picks a distractor. Short by nature: capped. */
  | 'hint'
  /** Case narrative and voice lines: capped. */
  | 'narrative'
  /**
   * A PRODUCT NOTICE — a servability statement the platform addresses to the child or the family
   * (David's role ruling, 2026-08-24 — R669). Gates bind BY ROLE, and the 16-word cap does not
   * bind this one: the notice role is bound by the recorded notice standard's own gates —
   * no apology token, no unscheduled promise, reason present, plus the house basics — checked
   * mechanically in `checkNoticeStandard`. The ruling arrived when `landNvrNotice` refused
   * Annie's approved sentence at 24 words: correct behaviour on a mis-scoped population.
   */
  | 'notice'
  /**
   * A CASE DOORPLATE — the child-facing name and description on a case's door (David's role
   * ruling, 2026-08-24 — R689). NOTICE-CLASS: read once, calmly, an explanation not a mid-item
   * hint — no word cap, bound by the recorded notice standard's STANCE gates (no apology token,
   * no unscheduled promise, no shouted capitals, no em dash, no first person). The standard's
   * FORM gates — one sentence, reason present — were the SERVABILITY NOTICE's own form claims
   * and do not bind a doorplate; that partition is stated here in the open so the desk or the
   * reviewer can overrule it, not inferred silently at a landing.
   */
  | 'doorplate';

/**
 * Which stem role a question type gets, decided by its MECHANIC rather than
 * by a list of type ids — so a new error-spotting type in any district is
 * covered the day it is registered, without anyone remembering to add it.
 */
export function roleForItemStem(mechanic: string | null | undefined): ContentRole {
  return mechanic === 'error-spot' || mechanic === 'cloze' ? 'item-stem-proofread' : 'item-stem';
}

export interface RoleRules {
  /** null = no sentence-length cap for this role. */
  maxSentenceWords: number | null;
  /**
   * **THE FOUR-SYLLABLE CAP. IT HAS NEVER COUNTED LETTERS** (R871 — renamed from `maxLongWords`'s
   * old `long-words` rule name). The test is `syllables(word) >= 4`: `operations` and `percentages`
   * count, `proportion` does not, and it is ten letters. **The old name invited every reader to
   * check lengths and disagree with the gate**, which is what happened.
   *
   * `null` = the cap does not bind this role (R868). Not zero — zero would forbid every such word.
   */
  maxLongWords: number | null;
}

/** 16 words at reading age 9 — the repo's long-standing ceiling. */
export const DEFAULT_MAX_SENTENCE_WORDS = 16;

export const ROLE_RULES: Record<ContentRole, RoleRules> = {
  'item-stem': { maxSentenceWords: DEFAULT_MAX_SENTENCE_WORDS, maxLongWords: 1 },
  'item-stem-proofread': { maxSentenceWords: null, maxLongWords: 1 },
  'item-option': { maxSentenceWords: DEFAULT_MAX_SENTENCE_WORDS, maxLongWords: 1 },
  instructions: { maxSentenceWords: DEFAULT_MAX_SENTENCE_WORDS, maxLongWords: 1 },
  hint: { maxSentenceWords: DEFAULT_MAX_SENTENCE_WORDS, maxLongWords: 1 },
  narrative: { maxSentenceWords: DEFAULT_MAX_SENTENCE_WORDS, maxLongWords: 1 },
  // Ruling 1: a Word card teaches a meaning, and disambiguating it can take
  // a long sentence. The vocabulary ceiling still holds — that is what
  // "reading age ≤9" actually protects.
  'word-card': { maxSentenceWords: null, maxLongWords: 1 },
  /**
   * The notice role (R669): no word cap — a notice states a fact with its reason in the same
   * breath, and the notice standard's own gates bind it instead (checkNoticeStandard).
   *
   * **AND NO LONG-WORD CAP EITHER (R868 — R689's second half).** The cap binds the HINT role, for
   * the reason the sixteen-word cap does: a child mid-item after a miss, reading under pressure.
   * **A notice is not read under pressure** — it is read once, at a door, with nothing riding on
   * it. The notice role was minted by copying a row and its caps came with it unexamined; this is
   * the examination.
   */
  notice: { maxSentenceWords: null, maxLongWords: null },
  // The doorplate role (R689): notice-class, no word cap; stance gates only (see the role's doc).
  doorplate: { maxSentenceWords: null, maxLongWords: null },
};

export interface ContentFailure {
  where: string;
  /**
   * **`subject-matter` IS ITS OWN RULE AND SHARES NOTHING WITH `banned-vocabulary`.** They ran
   * under one id for three turns, and a re-derivation of the screen's own figures then counted five
   * of the BAN LIST's voice refusals — "poorly", "You must", "weak" — as the appropriateness
   * screen's. **Two instruments under one rule name are indistinguishable to every consumer
   * downstream**, including the one written to audit them.
   */
  rule: 'sentence-length' | 'four-syllable-words' | 'banned-vocabulary' | 'subject-matter' | 'internal-id-leak' | 'us-spelling' | 'notation' | 'placeholder-tag' | 'notice-standard' | 'unclassified-path';
  detail: string;
  /**
   * Absent means 'error' — every rule that existed before UK spelling arrived
   * is an error, and a missing severity must never read as "less serious".
   * Only the sense-dependent spelling pairs are warnings; see uk-spelling.json
   * for why that distinction is not laziness.
   */
  severity?: 'error' | 'warning';
}

/** Warnings are reported, never blocking. Everything else blocks. */
export function isBlocking(failure: ContentFailure): boolean {
  return failure.severity !== 'warning';
}

/**
 * INTERNAL IDS MUST NEVER REACH A CHILD (David's ruling, 2026-08-02).
 *
 * Our slugs are engineering vocabulary: `en-plausible-not-stated`,
 * `nvr-code-row-swap`, `vr-08-move-letter`, `ai-draft:cowork-okafor-v1`.
 * A child seeing one has been shown the machinery — it reads as a glitch, it
 * is meaningless to them, and in a misconception's case it names the very
 * trap the item is testing.
 *
 * The risk is not hypothetical: every item now carries misconception tags
 * beside its options, and a template or an authoring slip that interpolates
 * the tag instead of the hint would ship the id straight into the child's
 * "not yet" message. This catches that at the gate rather than in the wild.
 *
 * Deliberately shaped to catch OUR id conventions and not ordinary hyphenated
 * English: "well-behaved" and "spring-cleaning" are prose, and a rule that
 * flagged them would be turned off within a week.
 */
const INTERNAL_ID_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  // District-prefixed slugs: three or more hyphenated lowercase parts after a
  // known district prefix — en-, vr-, nvr-, mq-, eq-, nq-.
  {
    name: 'a district slug (e.g. en-plausible-not-stated)',
    pattern: /\b(?:en|vr|nvr|mq|eq|nq)-[a-z0-9]+-[a-z0-9]+(?:-[a-z0-9]+)*\b/,
  },
  // Provenance strings.
  { name: 'a provenance string (e.g. ai-draft:…)', pattern: /\b(?:ai-draft|ai-corpus|human|seed):[^\s]+/ },
  // Batch and template identities.
  { name: 'a batch or template id', pattern: /\b(?:ENG|VR|NVR|MQ)-\d{3}\b|\btemplateId\b/ },
  // Status enums leaking into prose.
  { name: 'an internal status', pattern: /\b(?:PROPOSED|REVIEWED|RETIRED|PASS_TO_HUMAN|FIXED_THEN_PASS)\b/ },
];

/**
 * `allowedIds` exists for the ONE legitimate case: an admin surface that is
 * deliberately showing a reviewer the id. Child-facing callers pass nothing.
 */
export function checkNoInternalIds(label: string, text: string): ContentFailure[] {
  const failures: ContentFailure[] = [];
  for (const rule of INTERNAL_ID_PATTERNS) {
    const match = rule.pattern.exec(text);
    if (match) {
      failures.push({
        where: label,
        rule: 'internal-id-leak',
        detail: `${rule.name} — found "${match[0]}". Internal ids are engineering vocabulary and mean nothing to a child.`,
      });
    }
  }
  return failures;
}

/**
 * NOTATION IS NOT A WORD (David's ruling, 2026-08-02).
 *
 * "If A = 3, B = 4, C = 5, D = 6, what is A + B + C?" counted twenty words
 * under the old tokeniser, six of them the four `=` and two `+`. That put
 * every one of the 25 `vr-07-letters-for-numbers` stems over the cap on
 * punctuation alone, and no rewriting of the English would have brought it
 * under — the failure was an artefact of counting, not a reading load.
 *
 * A token carrying no letter or digit is a relation the eye parses, not a word
 * it pronounces. The counter-argument is real and worth recording: read ALOUD
 * that sentence is twenty words, because `=` is spoken "equals". The cap is a
 * measure of what a child reads under time pressure, not of what they would
 * say, and an item built on notation cannot otherwise carry as many English
 * words as a prose one. If that reading is wrong, this is one predicate.
 *
 * Gap markers (`___`) and separators (`—`) fall out the same way, which is
 * correct for the same reason.
 */
function isWord(token: string): boolean {
  return /[A-Za-z0-9]/.test(token);
}

/** Syllable estimate — deliberately the same crude count the lint has always
 *  used, so a text cannot pass one gate and fail the other. */
export function syllables(word: string): number {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
  if (cleaned.length <= 3) return 1;
  const matches = cleaned.replace(/e$/, '').match(/[aeiouy]{1,2}/g);
  return Math.max(1, matches ? matches.length : 1);
}

/**
 * Reading age for a piece of text in a given role. `exemptStem` is the word
 * being TAUGHT — a Word card's headword, or a chapter's seeded word — which
 * is the deliberate stretch and must not count against its own definition.
 */
/**
 * THE TESTED-TOKEN EXEMPTION (David's ruling, 2026-08-02).
 *
 * A spelling-spot item plants a misspelling and asks the child to find it;
 * a vocabulary item asks what one hard word means. Those words are the
 * QUESTION. Counting them against the item's vocabulary ceiling marks the
 * item down for containing the thing it exists to test — `dictionery` is
 * flagged on the item whose whole job is to have a child notice
 * `dictionery`.
 *
 * Bounded exactly like `headwordInOwnCard`: only the declared tokens, only
 * inside their own item, and only where the item declares them. Everything
 * else in the stem stays in scope, and the exemption reaches the LONG-WORD
 * ceiling alone — never the ban list, never sentence length.
 *
 * Matching is normalised equality, not a prefix: a planted misspelling is a
 * specific string, and a looser match would let one declaration cover a
 * family of words nobody vetted.
 */
function normaliseToken(word: string): string {
  return word.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function isTestedToken(word: string, testedTokens: readonly string[]): boolean {
  const cleaned = normaliseToken(word);
  if (!cleaned) return false;
  return testedTokens.some((token) => normaliseToken(token) === cleaned);
}

export function checkReadingAge(
  role: ContentRole,
  label: string,
  text: string,
  exemptStem = '',
  /** Words this item exists to test — exempt from the vocabulary ceiling. */
  testedTokens: readonly string[] = [],
  /**
   * Spans quoted from the passage. Excluded from BOTH reading-age checks
   * (David's gate rules, 2026-08-02): a child has to read the passage's words
   * to answer the question, and comprehension passages are pre-1950
   * literature by design — so a quoted "countenance" is the content under
   * test, not a fairness failure. What we write around a quotation is still
   * counted, still capped and still held to plain vocabulary.
   */
  quotedSpans: readonly string[] = [],
  /**
   * PASSAGE PROPER NOUNS (R23, annie 2026-08-08). A name the passage itself uses may be declared
   * and is then exempt from the CEILING ONLY — the ban list, the sentence cap and reading age all
   * still apply to the sentence it sits in. The ceiling exists to stop OUR OWN wording out-running
   * the child, and a name is not vocabulary she has to decode: the passage has just spent 900 words
   * teaching it. Declared rather than automatic, so the declaration records that the author checked
   * whose word it is — the same discipline the quotation rule rests on.
   */
  passageNames: readonly string[] = [],
  /**
   * DERIVED, NOT AUTHORED, AND THEREFORE SOURCED. A walk script may name an option's own words; the
   * option is on the card and is checkable, so this is NOT an unsourced exemption and must not be
   * warned about. Kept SEPARATE from `testedTokens` so the warning names the real mechanism —
   * merging them is what made the first version report six items whose exemption was the option
   * list doing exactly its job. Last in the list so positional callers are unaffected.
   */
  derivedTokens: readonly string[] = [],
): ContentFailure[] {
  /**
   * **THE FALLBACK IS DELIBERATE AND SAFE BY CONSTRUCTION — I tried to replace it with a throw and
   * `content-gates.test.ts` refused the change** (*"an unclassified role falls back to the STRICTEST
   * rules, never the loosest"*). An unrecognised role can therefore only ever be gated MORE harshly,
   * so a divergence between roles cannot turn this into a lax verdict. That answers the objection
   * that sent me here: `apply-all-unlanded` passed `'misconception-hint'`, which is not a role, and
   * every verdict it got was correct — `hint` and `item-stem` carry identical rules, and even if
   * they had not, the fallback errs the safe way. The caller was fixed; this was not the fault.
   */
  const rules = ROLE_RULES[role] ?? ROLE_RULES['item-stem'];
  const failures: ContentFailure[] = [];

  // OUR WORDING: the text with every declared quotation removed. Both
  // reading-age checks run against this, so a quotation is outside the
  // sentence cap AND outside the vocabulary ceiling, while everything we
  // wrote around it stays fully in scope.
  //
  // Stripped rather than blanked: a quote ending in a full stop would
  // otherwise cut our sentence in two and the halves would each look short,
  // which flatters the count instead of measuring it.
  /**
   * **A QUOTED SPAN COUNTS AS ONE UNIT AGAINST THE SENTENCE CAP, NOT ZERO** (Annie's ruling,
   * 2026-08-19 — R337). Her reason: **the cap exists so we do not make the question harder to read
   * than the text it is about**, and a sentence quoted from the item's OWN passage cannot be harder
   * to read than the passage. But it is not free either — the child still reads it — so it counts
   * once, as the single object it is.
   *
   * Previously the span was stripped entirely, which counted it as zero and flattered the number
   * the other way. `QUOTE_UNIT` is a single word-shaped token, so a 22-word stem carrying a
   * 14-word quotation measures as 9 rather than 22 or 8.
   *
   * **IT RIDES ON THE DECLARATION AND NEVER ON QUOTATION MARKS.** An undeclared quotation must not
   * silently earn this — the 62 spans declared on 2026-08-19 (R331) are what makes the rule
   * checkable at all, and a rule keyed on punctuation would hand the exemption to anyone who typed
   * an apostrophe.
   *
   * The VOCABULARY ceiling still sees the span removed entirely, which is unchanged: a hard word
   * inside a quotation is the source's, and we are not answerable for Grahame's vocabulary.
   */
  const QUOTE_UNIT = 'quotation';
  let ourWording = text;
  let vocabularyWording = text;
  for (const span of quotedSpans) {
    const trimmed = span.trim();
    if (trimmed.length >= 3 && ourWording.includes(trimmed)) {
      ourWording = ourWording.split(trimmed).join(` ${QUOTE_UNIT} `);
      vocabularyWording = vocabularyWording.split(trimmed).join(' ');
    }
  }

  if (rules.maxSentenceWords !== null) {
    // PUNCTUATION RULE (reviewer, 2026-08-05, applies to every district): a
    // sentence ends only on a full stop, question mark, or exclamation mark —
    // NOT on a dash. An em dash or en dash is a mid-sentence pause a child reads
    // straight through, so a clause a dash "breaks off" still counts toward the
    // 16-word cap. If a hint needs a dash to be readable, it needs a full stop
    // instead: split it into two sentences. (Authoring guidance mirrors this.)
    for (const sentence of ourWording.split(/[.!?]/).map((part) => part.trim()).filter(Boolean)) {
      const words = sentence.split(/\s+/).filter(Boolean).filter(isWord);
      if (words.length > rules.maxSentenceWords) {
        failures.push({
          where: label,
          rule: 'sentence-length',
          detail: `sentence of ${words.length} words (max ${rules.maxSentenceWords} for ${role}): "${sentence.slice(0, 60)}…"`,
        });
      }
    }
  }

  const stem = exemptStem.toLowerCase().slice(0, 6);
  /** Words cleared by `testedTokens` alone — no declaration covered them. Reported, not failed. */
  const tokenOnly: string[] = [];
  const longWords = vocabularyWording
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => {
      const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
      if (stem && cleaned.startsWith(stem)) return false;
      /**
       * THE DECLARATION OWNS A TAUGHT WORD; `testedTokens` IS SUBORDINATE (David's ruling,
       * 2026-08-17).
       *
       * A declaration is a FACT ABOUT THE ITEM — it cites a passage line and is checkable.
       * `testedTokens` is a bare word list with no source. Where both cover a word, the checkable
       * one carries it. The declaration is consulted FIRST because its spans are masked out of
       * `ourWording` above, so a declaration-carried word never reaches this filter at all.
       *
       * A word arriving HERE is therefore one NO declaration covers, and clearing it on
       * `testedTokens` alone means an exemption is resting on an unsourced list. That is recorded
       * as a WARNING rather than passed silently — the state we have just found is invisible on
       * both sides, where two mechanisms cover one word and neither gate can say which is
       * load-bearing.
       */
      // LENGTH FIRST. The first version recorded every `testedTokens` match regardless of length,
      // so "the", "is" and "to" were reported as long words exempted by an unsourced list — 16 of
      // them on one item. The warning measured matches against the token list, not exemptions that
      // did any work. A number that looks alarming and is an artefact of its own filter order.
      // SOURCED: the word is an option's own. Exempt, and nothing to report.
      if (isTestedToken(word, derivedTokens)) return false;
      // UNSOURCED: cleared by an authored bare list with no declaration behind it.
      if (isTestedToken(word, testedTokens)) {
        if (syllables(cleaned) >= 4) tokenOnly.push(word);
        return false;
      }
      // A declared passage name is the passage's word, not ours (R23).
      if (isTestedToken(word, passageNames)) return false;
      return syllables(cleaned) >= 4;
    });
  /**
   * **THE CEILING COUNTS DISTINCT HEADWORDS, NOT TOKENS** (Annie's ruling, 2026-08-19 — R338).
   *
   * **One hard word met twice is one hard word**, and **a word inside another is not two.**
   * `imagination` / `imagining` share a root and are one demand on the child. `ordinary` sitting
   * inside `extraordinary` is not two hard words — and on `ENG-004-AGG-08` **taking one of that
   * pair out would delete the question**, which is built on the contrast between them.
   *
   * Counting tokens made the gate measure REPETITION, which costs a child nothing, instead of
   * VARIETY, which is what a vocabulary ceiling is about.
   *
   * Grouped by a conservative root: lower-cased, stripped, common suffixes removed. Words that do
   * not share a root still count separately, and a word containing another counts once for the
   * longer form — the shorter is a substring, not a second demand.
   */
  const rootOf = (word: string): string => {
    let w = word.toLowerCase().replace(/[^a-z]/g, '');
    for (const s of ['ational', 'ation', 'ings', 'ing', 'ies', 'ied', 'est', 'ers', 'er', 'ed', 'es', 'ly', 's']) {
      if (w.length - s.length >= 4 && w.endsWith(s)) { w = w.slice(0, -s.length); break; }
    }
    return w.replace(/([^aeiou])\1$/, '$1').replace(/e$/, '');
  };
  const distinctRoots = new Map<string, string>();
  for (const word of longWords) {
    const root = rootOf(word);
    // A shorter word wholly inside a longer one is the same demand: keep the longer as the name.
    const containing = [...distinctRoots.keys()].find((k) => k.includes(root) || root.includes(k));
    if (containing) {
      if (root.length > containing.length) {
        distinctRoots.delete(containing);
        distinctRoots.set(root, word);
      }
      continue;
    }
    distinctRoots.set(root, word);
  }
  const distinctLongWords = [...distinctRoots.values()];

  if (rules.maxLongWords !== null && distinctLongWords.length > rules.maxLongWords) {
    failures.push({
      where: label,
      rule: 'four-syllable-words',
      detail: `${distinctLongWords.length} distinct word(s) of FOUR OR MORE SYLLABLES (max ${rules.maxLongWords}): `
        // Reported WITHOUT their trailing punctuation: printing "operations," made the gate look
        // as though it matched punctuation, and sent readers to count the wrong string (R871).
        + `${distinctLongWords.map((w) => w.replace(/[^A-Za-z']/g, '')).join(', ')}`
        + (longWords.length !== distinctLongWords.length
          ? ` — counted from ${longWords.length} token(s); repeats and shared roots count once (R338)`
          : ''),
    });
  }
  // WHICH MECHANISM FIRED, reported per word. A union has no defined winner and cannot be
  // diagnosed; an ordering can be read. Non-blocking: the exemption is real, its SOURCE is not.
  // SCOPED TO ROLES WHERE A DECLARATION IS EVEN POSSIBLE. On a WORD CARD the headword is the
  // card's own subject and `testedTokens` is the designed and only mechanism — there is no passage
  // to cite, so "unsourced" is false there and the warning is noise. The ruling is about a taught
  // word that a declaration COULD have carried.
  if (tokenOnly.length > 0 && role !== 'word-card') {
    failures.push({
      where: label,
      rule: 'four-syllable-words',
      severity: 'warning',
      detail: `${tokenOnly.length} long word(s) exempted by testedTokens ALONE, with no declaration `
        + `covering them: ${[...new Set(tokenOnly)].join(', ')} — an unsourced exemption`,
    });
  }
  return failures;
}

interface BannedRule {
  name: string;
  pattern: string;
}
const BANNED = bannedVocabulary as { everywhere: BannedRule[]; childFacing: BannedRule[]; stanceOnly: BannedRule[] };

/**
 * ROLE-SCOPED BAN (annie's ruling via David, 2026-08-08). Urgency language is a STANCE fault, not a
 * vocabulary one: "hurry"/"quickly" are barred where the platform ADDRESSES the child (hints, walk
 * scripts, instructions) and permitted where they are CONTENT (a definition, an option, text drawn
 * from a passage). A flat list entry would have broken the vocabulary district outright — `hasty`,
 * `nimble`, `brisk`, `agile`, `scurry`, `flit` and `alacrity` are all DEFINED with the banned words,
 * and `headwordInOwnCard` cannot rescue them because the banned word sits in the DEFINITION rather
 * than being the headword, so there is no headword occurrence to mask.
 */
const STANCE_ROLES: ReadonlySet<ContentRole> = new Set<ContentRole>(['hint', 'instructions']);
export const isStanceRole = (role: ContentRole): boolean => STANCE_ROLES.has(role);

export type BanScope = 'everywhere' | 'child-facing';

/**
 * THE `headwordInOwnCard` EXEMPTION (David's ruling, 2026-08-02).
 *
 * A Word card may use its own headword in its definition, sentence and image
 * prompt even when that headword is itself on the ban list. The card teaching
 * "guarantee" has to be able to say "the shop guarantees the bike"; that is
 * vocabulary, not an outcome claim, and it cannot be reworded without
 * deleting the word being taught.
 *
 * This is a SCANNER RULE, not a per-card exception. Nothing is listed
 * anywhere; the exemption derives from the card itself and applies to any
 * future card teaching a ban-list word.
 *
 * It is bounded three ways, and each bound matters:
 *   1. ONLY the headword — every other banned term in the card still fails.
 *   2. ONLY inside its own card — the word is free nowhere else.
 *   3. ONLY for cards whose headword IS the banned term. A card teaching
 *      "brave" gets no exemption at all, so "wrong" in its sentence still
 *      fails. The exemption is per RULE, not per card: it lifts exactly the
 *      rule the headword trips and leaves every other rule in force.
 *
 * Interpretation recorded: inflections of the headword are covered
 * ("guarantee" → "guarantees"), because the motivating case IS an inflection
 * and a bare-headword-only reading would not achieve the ruling. The bound is
 * a shared prefix within 3 characters, which reaches -s, -es, -ed and -ing
 * and nothing further.
 */
const MAX_INFLECTION_DELTA = 3;

function isInflectionOf(candidate: string, headword: string): boolean {
  const a = candidate.toLowerCase().replace(/[^a-z]/g, '');
  const b = headword.toLowerCase().replace(/[^a-z]/g, '');
  if (!a || !b) return false;
  if (a === b) return true;
  const [longer, shorter] = a.length >= b.length ? [a, b] : [b, a];
  return longer.startsWith(shorter) && longer.length - shorter.length <= MAX_INFLECTION_DELTA;
}

/**
 * Blanks out occurrences of the headword (and its inflections) that a given
 * rule matched, so the SAME rule still sees the rest of the text. Masking
 * rather than skipping is the point: a card teaching "guarantee" that also
 * said "clever" must still fail on "clever".
 */
export function maskHeadwordMatches(text: string, headword: string, pattern: RegExp): string {
  return text.replace(new RegExp(pattern.source, 'gi'), (match) =>
    isInflectionOf(match, headword) ? ' '.repeat(match.length) : match,
  );
}

/** Does this card's headword itself trip a ban rule? */
export function headwordIsBanned(headword: string, scope: BanScope = 'child-facing'): boolean {
  const rules = scope === 'child-facing' ? [...BANNED.everywhere, ...BANNED.childFacing] : BANNED.everywhere;
  return rules.some((rule) => new RegExp(rule.pattern, 'i').test(headword));
}

/**
 * Banned vocabulary. `child-facing` includes the everywhere rules — a claim
 * is no less a claim for being said to a child.
 *
 * The passage-quote carve-out (manifesto v1.5) is NOT applied here: this
 * function screens product voice. A caller holding genuinely quoted text
 * excludes that span before calling.
 */
/**
 * INLINE QUOTATION (David's ruling, 2026-08-02; reviewer ruled in favour in
 * principle).
 *
 * The v1.5 carve-out covers a quoted span standing on its own. Authoring
 * quotes INSIDE a stem — `ENG-002-pp-17` asks about Mr Bingley saying "in
 * this stupid manner" — and a standalone-span mechanism cannot see that, so
 * the quote was invisible to the exemption and the author had no way to
 * declare it.
 *
 * A stem therefore declares its quoted spans, and the ban list steps over
 * exactly those characters and nothing else. The wording around the quote is
 * ours and stays fully in scope, which is the whole point: an author cannot
 * widen the exemption by quoting loosely, because only the declared span is
 * skipped and the span must genuinely appear in the text.
 *
 * Reading age is NOT exempted. A child reads the quote as well as our
 * wording, so it counts toward the load — the carve-out is about whose
 * VOCABULARY it is, never about how much there is to read.
 */
export function maskQuotedSpans(text: string, quotedSpans: readonly string[]): string {
  let out = text;
  for (const span of quotedSpans) {
    const trimmed = span.trim();
    // Only a span that is really there can be stepped over.
    if (trimmed.length >= 3 && out.includes(trimmed)) {
      out = out.split(trimmed).join(' '.repeat(trimmed.length));
    }
  }
  return out;
}

/**
 * The subset of an item's declared quotations that actually appear in some
 * OTHER text of the same item — a walk script quoting the same passage line.
 *
 * The declaration was made about the stem, so a span missing from the script
 * is not a broken claim, it is simply a span the script did not use. Passing
 * the raw stem list to a script check reports every unused quote as a fault,
 * which is how ENG-002-pp-17 first appeared to fail.
 */
export function spansPresentIn(text: string, quotedSpans: readonly string[]): string[] {
  return quotedSpans.filter((span) => span.trim().length >= 3 && text.includes(span.trim()));
}

/** A declared span that is not actually in the text is a broken claim. */
export function invalidQuotedSpans(text: string, quotedSpans: readonly string[]): string[] {
  return quotedSpans.filter((span) => span.trim().length < 3 || !text.includes(span.trim()));
}

/**
 * UK SPELLING THROUGHOUT (David's ruling, 2026-08-02). These are British exam
 * papers; an American form on the page is wrong in the same way a wrong answer
 * is wrong, and a child who copies it into a real paper loses a real mark.
 *
 * The table lives in uk-spelling.json beside the ban list — one canonical copy,
 * read by this module and by the file scan, for the same reason.
 *
 * Two exemptions, both the ones already established elsewhere in this file:
 * a declared quotation (we do not re-spell someone else's text) and a tested
 * token (a spelling item that presents a US form AS the error to spot is
 * content ABOUT the spelling — manifesto v1.8). Neither is a loophole: both
 * have to be declared on the item, and a declaration is a claim someone made.
 */
const IZE_RULE = new RegExp(ukSpelling.izeRule.pattern, ukSpelling.izeRule.flags);
const ALLOWED_IZE = new RegExp(ukSpelling.allowedIze, 'i');
const SPELLING_RULES = ukSpelling.rules.map((rule) => ({
  ...rule,
  regex: new RegExp(rule.pattern, 'gi'),
}));

export function checkUkSpelling(
  label: string,
  text: string,
  quotedSpans: readonly string[] = [],
  testedTokens: readonly string[] = [],
  /** R849 — a specimen is exhibited, not used. Masked exactly as a quotation is. */
  specimens: readonly string[] = [],
): ContentFailure[] {
  const masked = [...quotedSpans, ...specimens];
  const haystack = masked.length > 0 ? maskQuotedSpans(text, masked) : text;
  const tested = new Set(testedTokens.map((token) => token.toLowerCase()));
  const failures: ContentFailure[] = [];
  const seen = new Set<string>();

  const flag = (found: string, uk: string, severity: 'error' | 'warning', family: string): void => {
    const key = `${found.toLowerCase()}|${family}`;
    if (tested.has(found.toLowerCase()) || seen.has(key)) return;
    seen.add(key);
    failures.push({
      where: label,
      rule: 'us-spelling',
      severity,
      detail:
        severity === 'warning'
          ? `"${found}" (${family}) — ${uk}`
          : `US spelling "${found}" (${family}) — UK form is ${uk}`,
    });
  };

  for (const match of haystack.matchAll(IZE_RULE)) {
    // -ize is the productive rule, so it is matched morphologically rather
    // than word by word; the allowlist carries the handful of British words
    // that genuinely end -ize (size, seize, prize and their compounds).
    if (!ALLOWED_IZE.test(match[0])) {
      flag(match[0], ukSpelling.izeRule.uk, 'error', ukSpelling.izeRule.family);
    }
  }
  for (const rule of SPELLING_RULES) {
    for (const match of haystack.matchAll(rule.regex)) {
      flag(match[0], rule.uk, rule.severity === 'warning' ? 'warning' : 'error', rule.family);
    }
  }
  return failures;
}

export function checkBannedVocabulary(
  label: string,
  text: string,
  scope: BanScope = 'child-facing',
  /** Set ONLY when `text` is a field of that headword's own Word card. */
  headwordInOwnCard?: string,
  /** Spans quoted from a passage — stepped over, and only these. */
  quotedSpans: readonly string[] = [],
  /** The stance band applies only where the platform ADDRESSES the child. */
  role?: ContentRole,
): ContentFailure[] {
  const rules = scope === 'child-facing'
    ? [...BANNED.everywhere, ...BANNED.childFacing, ...(role && isStanceRole(role) ? BANNED.stanceOnly : [])]
    : BANNED.everywhere;
  const failures: ContentFailure[] = [];
  for (const broken of invalidQuotedSpans(text, quotedSpans)) {
    // A claim that does not resolve is REPORTED and its text stays in scope —
    // a broken exemption must never read as a passing one.
    failures.push({
      where: label,
      rule: 'banned-vocabulary',
      detail: `declares a quoted span that is not in the text: "${broken.slice(0, 40)}"`,
    });
  }
  const quoted = quotedSpans.length > 0 ? maskQuotedSpans(text, quotedSpans) : text;
  for (const rule of rules) {
    const pattern = new RegExp(rule.pattern, 'i');
    // The exemption is per RULE: it lifts only the rule the headword itself
    // trips, and only over occurrences of that headword. Every other rule,
    // and every other word, is tested exactly as before.
    const haystack =
      headwordInOwnCard && pattern.test(headwordInOwnCard)
        ? maskHeadwordMatches(quoted, headwordInOwnCard, pattern)
        : quoted;
    const match = pattern.exec(haystack);
    if (match) {
      failures.push({
        where: label,
        rule: 'banned-vocabulary',
        detail: `${rule.name} — found "${match[0]}"`,
      });
    }
  }
  return failures;
}

/**
 * THE NOTICE STANDARD'S GATES, MECHANICAL AND VERBATIM FROM THE RECORDED STANDARD (R669).
 *
 * The source is `nvr-notice-redraft-for-annie.json` (sha256 `9061bb94decc8a0aa89167a5309da434a…`,
 * the artefact Annie judged in her 119th), whose `complianceAsserted` line enumerates them:
 * *"no first person, no shouted capitals, one sentence, no em dash, no apology token, no
 * unscheduled promise, a reason present ("so …") — all mechanical, none eyeballed."*
 * These bind the `notice` role INSTEAD of the 16-word cap (David's role ruling, 2026-08-24);
 * the house basics — ban list, internal ids, UK spelling — still run beside them.
 */
/**
 * THE STANCE HALF OF THE NOTICE STANDARD (R689 split): the gates that are form-independent and
 * bind every notice-class role — doorplates included. The FORM half (one sentence, reason
 * present) stays in `checkNoticeStandard` and binds the notice role only.
 */
export function checkNoticeStance(label: string, text: string): ContentFailure[] {
  const failures: ContentFailure[] = [];
  const fail = (detail: string) => failures.push({ where: label, rule: 'notice-standard', detail });
  const firstPerson = /\b(i|we|our|ours|us|my|me|mine)\b/i.exec(text);
  if (firstPerson) fail(`first person present: "${firstPerson[0]}"`);
  const shouted = /\b[A-Z]{2,}\b/.exec(text);
  if (shouted) fail(`shouted capitals: "${shouted[0]}"`);
  if (/[—–]/.test(text)) fail('em dash present');
  const apology = /\b(sorry|apologis\w*|apologiz\w*|apolog\w*|unfortunately|regret\w*|sadly|afraid)\b/i.exec(text);
  if (apology) fail(`apology token: "${apology[0]}"`);
  const promise = /\b(soon|coming|eventually|later|one day|in (?:the )?future|plan(?:s|ned|ning)? to|hope to|working on|will be (?:added|available)|for now|not yet)\b/i.exec(text);
  if (promise) fail(`unscheduled promise: "${promise[0]}"`);
  return failures;
}

/** The full notice standard: the stance gates plus the SERVABILITY NOTICE's form claims. */
export function checkNoticeStandard(label: string, text: string): ContentFailure[] {
  const failures = checkNoticeStance(label, text);
  const fail = (detail: string) => failures.push({ where: label, rule: 'notice-standard', detail });
  const sentences = text.split(/[.!?]/).map((part) => part.trim()).filter(Boolean);
  if (sentences.length !== 1) fail(`one sentence required, found ${sentences.length}`);
  if (!/\b(so|because)\b/i.test(text)) fail('no reason present — the child is owed the why in the same breath as the what');
  return failures;
}

/** Both gates at once: what a publish door needs to ask. */
export function checkChildFacingText(input: {
  role: ContentRole;
  label: string;
  text: string;
  exemptStem?: string;
  /** Set ONLY for a Word card's own fields — see the headwordInOwnCard rule. */
  headwordInOwnCard?: string;
  /**
   * Spans quoted from a passage. Exempt from the ban list, the sentence cap
   * and the vocabulary ceiling (2026-08-02): comprehension passages are
   * pre-1950 literature BY DESIGN, so quoted archaic vocabulary is the
   * content under test, not a fairness failure. Our own wording around the
   * quotation stays fully in scope on all three.
   */
  quotedSpans?: readonly string[];
  /**
   * PER-CEILING EXEMPTION, from each quote's own `exemptFrom` (David's ruling, 2026-08-16).
   *
   * `exemptFrom` names WHICH child-facing ceilings a given quotation is exempt from — it exists
   * because the source text may exceed a cap we set for our own writing, and when a child reads
   * Grahame she reads Grahame. Rewording him is not a fix.
   *
   * Supplied, each list is honoured exactly and only for the quotations that named that ceiling.
   * Omitted, `quotedSpans` applies to all three, which is the behaviour every existing caller
   * relies on. EVERYTHING AROUND THE QUOTATION STAYS CAPPED either way: a stem is not exempt
   * because it contains an exempt quote — only the quoted span is masked.
   */
  exemptSpans?: { sentenceCap?: readonly string[]; banList?: readonly string[]; vocabularyCeiling?: readonly string[] };
  /** Option words a script may legitimately name — sourced, never warned about (R158). */
  derivedTokens?: readonly string[];
  /** Words this item tests. Exempt from the VOCABULARY CEILING only. */
  testedTokens?: readonly string[];
  /**
   * **SPECIMENS: HOUSE RULES BIND USE, NEVER MENTION** (Annie, 2026-08-29 — R849).
   *
   * A declared role beside quotation and notation. A specimen is a string the item EXHIBITS rather
   * than employs — the word a SpaG lesson is about. `ENG-003-A-SP-07` teaches the
   * practice/practise distinction, so it must print *practise*, and the US-spelling rule flagged it
   * for doing the only thing it exists to do.
   *
   * **The third instance of one shape.** Quotation: a source's words are not ours to reword.
   * Retention: retired text is a record, not an offer. Specimen: an exhibited form is a lesson, not
   * a usage. **A character-level rule will always eventually meet a lesson about its own
   * characters**, and a district that teaches orthography will produce this on every item it
   * authors — so it is a declarable role rather than an exception list.
   *
   * **The exemption is the SPAN, never the string.** Prose around a specimen stays fully bound, the
   * same boundary quotation already draws.
   */
  specimens?: readonly string[];
  /** Proper nouns the PASSAGE uses (R23). Exempt from the ceiling only; verified against the
   *  passage file by `pnpm check:line-refs`, exactly as a quotation is. */
  passageNames?: readonly string[];
}): ContentFailure[] {
  return [
    ...checkReadingAge(
      input.role,
      input.label,
      input.text,
      input.exemptStem,
      // The vocabulary ceiling lives inside the reading-age check alongside the sentence cap, so
      // a span exempt from either is passed here; the ceiling's own exemption rides testedTokens.
      [...(input.testedTokens ?? []), ...(input.exemptSpans?.vocabularyCeiling ?? [])],
      input.exemptSpans?.sentenceCap ?? input.quotedSpans ?? [],
      input.passageNames ?? [],
      input.derivedTokens ?? [],
    ),
    ...checkBannedVocabulary(
      input.label,
      input.text,
      'child-facing',
      input.headwordInOwnCard,
      input.exemptSpans?.banList ?? input.quotedSpans ?? [],
      input.role,
    ),
    ...checkNoInternalIds(input.label, input.text),
    ...checkUkSpelling(input.label, input.text, input.quotedSpans ?? [], input.testedTokens ?? [], input.specimens ?? []),
    // Gates bind by role (R669/R689): the full notice standard binds the notice role; the
    // doorplate role binds the standard's stance half only.
    ...(input.role === 'notice' ? checkNoticeStandard(input.label, input.text) : []),
    ...(input.role === 'doorplate' ? checkNoticeStance(input.label, input.text) : []),
  ];
}

/**
 * A Word card's full check, as the publish door and the database sweep both
 * need it. The headword is exempt from its own definition (it is the word
 * being taught) and both senses are checked.
 */
export function checkWordCard(card: {
  id: string;
  headword: string;
  definitionChild: string;
  sentence: string;
  senseBDefinition?: string | null;
  senseBSentence?: string | null;
  imagePrompt?: string | null;
  imagePromptB?: string | null;
}): ContentFailure[] {
  const parts: Array<[string, string | null | undefined]> = [
    ['definition', card.definitionChild],
    ['sentence', card.sentence],
    ['sense B definition', card.senseBDefinition],
    ['sense B sentence', card.senseBSentence],
  ];
  return [
    ...parts.flatMap(([field, text]) =>
      text
        ? checkChildFacingText({
            role: 'word-card',
            label: `word:${card.id} ${field}`,
            text,
            exemptStem: card.headword,
            headwordInOwnCard: card.headword,
          })
        : [],
    ),
    // Image prompts became a scanned surface on 2026-08-02 (David): they
    // turn into illustrations a child sees, so what they DEPICT is subject to
    // the child-facing vocabulary rules.
    ...checkWordCardImagePrompts(card),
  ];
}

/**
 * Image prompts (David's ruling, 2026-08-02): a scanned surface, because the
 * prompt becomes an illustration a child sees. What it DEPICTS is therefore
 * subject to the child-facing vocabulary rules, and the headwordInOwnCard
 * exemption applies here as it does to the rest of the card.
 *
 * The VOCABULARY rules only — deliberately not the reading-age caps. A child
 * never reads an image prompt; it is a brief to an illustrator. Measuring its
 * sentence length or syllable count would score a document no child sees,
 * which is a rule with nothing behind it. Called by checkWordCard, and
 * exported separately for callers holding only the prompts.
 */
export function checkWordCardImagePrompts(card: {
  id: string;
  headword: string;
  imagePrompt?: string | null;
  imagePromptB?: string | null;
}): ContentFailure[] {
  const parts: Array<[string, string | null | undefined]> = [
    ['image prompt', card.imagePrompt],
    ['image prompt B', card.imagePromptB],
  ];
  return parts.flatMap(([field, text]) =>
    text ? checkBannedVocabulary(`word:${card.id} ${field}`, text, 'child-facing', card.headword) : [],
  );
}

/**
 * A MISCONCEPTION WITHOUT A DESCRIPTION AND A HINT IS A PLACEHOLDER, NOT A PROPOSAL
 * (annie, 2026-08-12). Refused at CREATION, never at use.
 *
 * The evidence is a drift nobody could see while it happened: undescribed tags carried 9% of
 * distractors across four clusters, then 29% across the next four, with nothing about the passages
 * changing. Nothing about the content explains a figure tripling — the tag itself does. An id with
 * no description cannot REFUSE a use, because there is no stated meaning to contradict, so it
 * becomes the sink for anything that needs a name and has not earned one. Every use is locally
 * reasonable and the aggregate is a library with a hole in it.
 *
 * Refusing at use would be too late twice over: the tag already exists to be reached for, and the
 * refusal lands on whoever is authoring an item rather than on whoever left the placeholder.
 *
 * The floor is deliberately far below anything authored. Across the 270 entries that existed when
 * this landed, the shortest description was 25 characters ("Swapping the definitions.") and the
 * shortest hint 40 ("You found a twin — now find the reverse."). Twelve is not a quality bar and
 * is not meant to be one — a reviewer judges quality. It is the line under which a value cannot
 * be a statement about a child's thinking at all: it catches the empty string, the whitespace, and
 * "TBD"/"TODO"/"n/a"/"?" without ever reaching for a legitimately terse entry.
 *
 * The DATABASE enforces the same rule (`misconception_needs_description_and_hint`), because there
 * are twenty-odd creation doors and a rule that lives in each of them is a rule that drifts — R42
 * and R57, five times over. This function exists so a human at the CMS door gets a sentence
 * explaining the refusal instead of a constraint-violation stack trace.
 */
export const MISCONCEPTION_MIN_CHARS = 12;

export function checkMisconceptionProposal(entry: {
  id: string;
  description: string;
  childHint: string;
}): ContentFailure[] {
  const failures: ContentFailure[] = [];
  const fields: Array<['description' | 'childHint', string]> = [
    ['description', entry.description ?? ''],
    ['childHint', entry.childHint ?? ''],
  ];
  for (const [field, raw] of fields) {
    const value = String(raw).trim();
    if (value.length === 0) {
      failures.push({
        where: `misconception:${entry.id} ${field}`,
        rule: 'placeholder-tag',
        detail:
          `${field} is empty. A misconception id with no ${field} is a placeholder, not a ` +
          'proposal — it cannot refuse a use, so it becomes the sink for anything needing a name.',
      });
      continue;
    }
    if (value.length < MISCONCEPTION_MIN_CHARS) {
      failures.push({
        where: `misconception:${entry.id} ${field}`,
        rule: 'placeholder-tag',
        detail:
          `${field} is ${value.length} characters ("${value}") — below the ${MISCONCEPTION_MIN_CHARS}-character ` +
          'floor under which a value cannot be a statement about a child\'s thinking. Say what the ' +
          'child did, or do not create the tag yet.',
      });
    }
  }
  return failures;
}
