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
  | 'narrative';

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
  maxLongWords: number;
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
};

export interface ContentFailure {
  where: string;
  rule: 'sentence-length' | 'long-words' | 'banned-vocabulary' | 'internal-id-leak' | 'us-spelling' | 'notation';
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
): ContentFailure[] {
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
  let ourWording = text;
  for (const span of quotedSpans) {
    const trimmed = span.trim();
    if (trimmed.length >= 3 && ourWording.includes(trimmed)) {
      ourWording = ourWording.split(trimmed).join(' ');
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
  const longWords = ourWording
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => {
      const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
      if (stem && cleaned.startsWith(stem)) return false;
      // The word under test is the question, not a reading-load problem.
      if (isTestedToken(word, testedTokens)) return false;
      // A declared passage name is the passage's word, not ours (R23).
      if (isTestedToken(word, passageNames)) return false;
      return syllables(cleaned) >= 4;
    });
  if (longWords.length > rules.maxLongWords) {
    failures.push({
      where: label,
      rule: 'long-words',
      detail: `${longWords.length} long words (max ${rules.maxLongWords}): ${longWords.join(', ')}`,
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
): ContentFailure[] {
  const haystack = quotedSpans.length > 0 ? maskQuotedSpans(text, quotedSpans) : text;
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
  /** Words this item tests. Exempt from the VOCABULARY CEILING only. */
  testedTokens?: readonly string[];
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
      input.testedTokens ?? [],
      input.quotedSpans ?? [],
      input.passageNames ?? [],
    ),
    ...checkBannedVocabulary(
      input.label,
      input.text,
      'child-facing',
      input.headwordInOwnCard,
      input.quotedSpans ?? [],
      input.role,
    ),
    ...checkNoInternalIds(input.label, input.text),
    ...checkUkSpelling(input.label, input.text, input.quotedSpans ?? [], input.testedTokens ?? []),
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
