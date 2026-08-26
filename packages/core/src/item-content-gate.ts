/**
 * THE ONE CHILD-FACING GATE FOR A WHOLE ITEM.
 *
 * Every door that screens an item — the serving sweep (check:db-content), the
 * publish door (CMS + publish:vr-signoff), the import gates — must read the
 * SAME fields and apply the SAME rules. When they don't, an item passes one and
 * fails another, and if the lenient one is a door and the strict one is a sweep,
 * bad content reaches a child (six vr-06 items went LIVE on a stem.sentence the
 * publish gate never read; the serving sweep caught it after the fact).
 *
 * So the extraction and rules live here, once, and every surface calls this.
 * It screens EVERY readable string an item can show a child:
 *   · every stem field (not just the prompt) at the stem's role;
 *   · every option value;
 *   · the walk script, its hint core, with the option words exempt from the
 *     long-word ceiling and the script checked for stale option references.
 * Declared quotations and tested tokens are honoured exactly as elsewhere.
 */
import { banListApplies } from './ban-list-scope';
import { dispositionFor, dispositionKey } from './field-dispositions';
import { checkChildFacingText, spansPresentIn, type ContentFailure } from './content-gates';
import { refusalMessage, refusedInOptions } from './refused-misconceptions';
import { roleForItemStem } from './content-gates';
import { checkMathsNotation } from './maths/notation';
import { lettersNamedNotOnCard, wordOptionsNamedNotOnCard } from './word-puzzles';

/** Every string in a Json value, INCLUDING single-token ones — the notation gate
 *  needs to see a bare "cm2" or "5C" option that textsFrom skips as a token. */
function everyString(value: unknown, path: string): Array<[string, string]> {
  if (typeof value === 'string') return [[path, value]];
  if (Array.isArray(value)) return value.flatMap((entry, i) => everyString(entry, `${path}[${i}]`));
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([k, entry]) => everyString(entry, path ? `${path}.${k}` : k));
  }
  return [];
}

/**
 * THE FIELDS WHOSE VALUES ARE HEADWORDS OR TOKENS, DECLARED BY NAME (Annie's ruling, 2026-08-19 —
 * R290). These skip the SENTENCE-LENGTH cap; they do not skip the ban list.
 *
 * **THE SKIP USED TO BE "HAS NO SPACE", AND THAT WAS A PROXY FOR "IS A HEADWORD".** Her reasoning:
 * absence of a space is a proxy, **any single-word value anywhere currently gets the same free
 * pass** — including ones that should be capped — and **proxies drift, which this project has paid
 * for four times.** A declared field list drifts too, but it drifts VISIBLY: a new field is absent
 * from the list and gets screened, which is the safe direction. A proxy fails silently toward
 * permissiveness, which is the other one.
 */
/**
 * DECLARED QUOTATION FIELDS — BOUND BY FIDELITY, NOT BY OUR SPELLING AND STANCE GATES
 * (Annie's 154th thread, David's ruling, 2026-08-25 — R711).
 *
 * `ENG-027-RR-08` carries *"he had not realized that the King was in very truth"* in an
 * `attractorQuote`, verbatim from line 35 of stream-a-22-prisoner-of-zenda, **which carries the
 * US spelling itself**. Correcting it to British spelling would make the quotation false and the
 * byte-verify at the landing gate would then refuse it for not matching its source. A quotation
 * is bound by FIDELITY TO ITS SOURCE; the ban list and the UK-spelling rule bind OUR OWN WORDS.
 *
 * These two paths were classified `undecided` in `check-every-string-field` — nobody had ruled.
 * This is the ruling, and both readers take it from HERE rather than re-listing (R57/R429).
 */
export const QUOTATION_FIELDS = new Set(['attractorQuote', 'defeaterQuote']);

const TOKEN_FIELDS = new Set([
  'words', 'stemWord', 'word1', 'word2', 'sum', 'series', 'pairA', 'clues',
  'code', 'P', 'Q', 'R', 'S',
  // `testedTokens` is a DECLARED LIST OF TOKENS — the field name is the declaration, and every
  // value it can hold is one whatever the item type. It names words already exempt from the
  // ceilings; screening the exemption list itself would cap the very words it exempts.
  'testedTokens',
]);
/*
 * **`value` AND `label` ARE DELIBERATELY ABSENT, AND MY FIRST LIST HAD THEM.** An option's `value`
 * is a single word on a VR card and a FULL SENTENCE on a comprehension one — the same field name
 * carrying two kinds of content. Declaring it a token field exempted every option value in the
 * store from the sentence cap, and the baseline diff caught it immediately: two UK-spelling rows
 * silently stopped being reported.
 *
 * That is the exact failure her ruling is about, committed while implementing her ruling: I
 * replaced a proxy for "is a headword" with a field list that was ALSO a proxy for it. A field
 * belongs here only when EVERY value it can hold is a token, whatever the item type.
 */

/**
 * **A SUPERSEDED VALUE STORED INSIDE THE FIELD IT SUPERSEDES IS READ AS LIVE BY ANYTHING WALKING
 * THAT FIELD** (David, 2026-08-21 — R358, the fault found on Cowork's side and present here).
 *
 * `_previousText`, `_previousWalkScript`, `_previousHintCore`, `_previousQuotes` and their kind sit
 * as SIBLINGS of the value they replaced — inside `stem`, inside `explanation` — so `textsFrom`
 * walked them and this gate screened the OLD text as though a child would read it. **A reword that
 * successfully removed a banned word would keep failing on the copy of the pre-reword text kept
 * beside it**, and the failure would read as a live content defect.
 *
 * 36 rows carry one, across six field names. **Zero blocking failures are raised on one today, and
 * that is an outcome rather than evidence the design held** (R62): the coupling is live, unguarded,
 * and simply has not been exercised. The right shape is Cowork's — stamps OUTSIDE the field they
 * supersede — and `check:superseded-inside-field` reports the 36 as the population to move. Until
 * they move, the gate refuses to read them.
 */
const isSuperseded = (path: string) => path.split('.').some((seg) => seg.startsWith('_'));

/** The last path segment, with any array index stripped: `stem.words[3]` -> `words`. */
function fieldOf(path: string): string {
  const last = path.split('.').pop() ?? '';
  return last.replace(/\[\d+\]$/, '');
}

/**
 * Every readable string in a Json value, path-labelled.
 *
 * **A value is skipped when its FIELD is declared a token field — not when it happens to lack a
 * space** (R290). A multi-word value in a token field is still a token by declaration (`stem.sum`
 * holds "3 + 4"); a single word in an undeclared field is now screened, where before it was not.
 */
export function textsFrom(value: unknown, path: string): Array<[string, string]> {
  if (typeof value === 'string') {
    if (TOKEN_FIELDS.has(fieldOf(path))) return [];
    // A declared quotation is the source's words, not ours (R711). A FORWARD GUARD: the gate does
    // not walk option columns today, so this changes no current verdict — it means a later
    // widening cannot silently start capping quotations.
    if (QUOTATION_FIELDS.has(fieldOf(path))) return [];
    if (isSuperseded(path)) return [];
    return value.trim() !== '' ? [[path, value]] : [];
  }
  if (Array.isArray(value)) return value.flatMap((entry, i) => textsFrom(entry, `${path}[${i}]`));
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([k, entry]) =>
      textsFrom(entry, path ? `${path}.${k}` : k),
    );
  }
  return [];
}

export interface GatableItem {
  id: string;
  stem: unknown;
  explanation?: unknown;
  mechanic?: string | null;
  options: Array<{ content: unknown }>;
}

export function checkItemChildFacing(item: GatableItem): ContentFailure[] {
  const failures: ContentFailure[] = [];

  /*
   * REFUSED MISCONCEPTIONS, AT THE ONE GATE EVERY DOOR CALLS (R269). A rejection recorded only as
   * a row status depends on whoever builds the next emission remembering to pull it by hand.
   * Here it cannot be forgotten: any item tagged with a refused entry fails at whichever door it
   * arrives through, and the message names the successor so the refusal is actionable rather than
   * a dead end.
   */
  // GatableItem declares options as `{ content: unknown }[]`; the refusal check reads only the
  // tag. Narrowed here rather than widening the shared type, which every door depends on.
  for (const refusal of refusedInOptions((item.options ?? []) as ReadonlyArray<{ misconceptionId?: string | null }>)) {
    failures.push({
      where: `${item.id}:options`,
      rule: 'banned-vocabulary',
      detail: refusalMessage(refusal),
    });
  }
  const stem = (item.stem ?? {}) as Record<string, unknown>;
  const stemRole = roleForItemStem(item.mechanic);
  /**
   * DECLARED QUOTATIONS, AND WHICH CEILINGS EACH ONE IS EXEMPT FROM.
   *
   * `exemptFrom` sat in the declarative-field registry and was READ BY NOTHING. Two ENG-001 items
   * declared it and were refused anyway, three times, on a sentence that is Grahame's own prose —
   * a refusal loop neither side could break, because the door refused a declaration it was built
   * to honour and never said so. That is this thread's shape, in a gate.
   *
   * A bare-string quote (R78) declares a text and not a place and names no ceilings; it keeps the
   * default, which is exempt from all three.
   */
  const stemQuoteObjects = Array.isArray(stem.quotes)
    ? (stem.quotes as Array<unknown>).map((q) => (typeof q === 'string' ? { text: q } : q as { text?: string; exemptFrom?: string[] }))
    : [];
  const stemQuotes = stemQuoteObjects.map((q) => q.text ?? '').filter(Boolean);
  const declaresExemptFrom = stemQuoteObjects.some((q) => Array.isArray(q.exemptFrom));
  const spansExemptFrom = (ceiling: string): string[] => stemQuoteObjects
    .filter((q) => !Array.isArray(q.exemptFrom) || q.exemptFrom.includes(ceiling))
    .map((q) => q.text ?? '')
    .filter(Boolean);
  const stemExemptSpans = declaresExemptFrom
    ? {
      sentenceCap: spansExemptFrom('sentenceCap'),
      banList: spansExemptFrom('banList'),
      vocabularyCeiling: spansExemptFrom('vocabularyCeiling'),
    }
    : undefined;
  const testedTokens = Array.isArray(stem.testedTokens) ? (stem.testedTokens as string[]) : [];
  // R23 — proper nouns the passage itself uses, declared on the stem, exempt from the ceiling only.
  const passageNames = Array.isArray(stem.passageNames) ? (stem.passageNames as string[]) : [];

  /** The stem fields a declared quotation can appear in: the prose, and the declaration itself. */
  const carriesQuotes = (path: string): boolean =>
    path === 'prompt' || path === 'text' || /^quotes\[\d+\]\.text$/.test(path);

  /**
   * WHICH SPANS APPLY TO THIS FIELD — and a quote's OWN field carries ONLY ITSELF.
   *
   * This passed EVERY declared span to every quote field, so screening `quotes[0].text` asked
   * whether quote 1's span appeared inside quote 0's text. It cannot. **Every stem declaring two or
   * more quotations therefore failed, always, with each quote reporting the others as broken spans**
   * — and the message said "declares a quoted span that is not in the text", which reads as bad
   * authoring rather than as the gate comparing a span against the wrong string.
   *
   * Found while confirming the reviewer's AGG-08 ruling, which needs exactly two: *an ordinary
   * observer* (line 35) and *an extraordinary observer* (line 41). One quotation always worked, so
   * the mechanism looked sound and was untestable by the item that needed it.
   */
  const spansFor = (path: string): readonly string[] => {
    const own = /^quotes\[(\d+)\]\.text$/.exec(path);
    if (own) {
      const q = stemQuoteObjects[Number(own[1])];
      const text = q?.text;
      return typeof text === 'string' && text ? [text] : [];
    }
    return stemQuotes;
  };

  /**
   * **THE BAN LIST RUNS ON THE SERVED PATHS AND ON CLASS 3, AND NOTHING ELSE** (Annie, R379).
   * Provenance and workflow are out — `correctionOf` is the decisive case, since a field whose job
   * is to record a fault will contain the fault. Machine declarations are out and
   * `check:declaration-schema` owns them instead, shipped in the same act: **removing a check must
   * not leave a field with none.**
   */
  // Every stem string. The prose and the quote declarations carry the declared quotes.
  for (const [path, text] of textsFrom(item.stem, '')) {
    if (!banListApplies(`stem.${path}`)) continue;
    // A carrier sentence disambiguates a meaning and can run long, so it takes
    // the word-card role (no length cap; the vocabulary ceiling ≤9 still holds,
    // and the headword stays exempt via testedTokens). Every other stem field
    // keeps the item's stem role. One field, one rule — vr-06's existing
    // sentence rides the same path, which is the point of the single gate.
    const role = path === 'sentence' ? 'word-card' : stemRole;
    failures.push(
      ...checkChildFacingText({
        role,
        label: `item:${item.id} stem.${path}`,
        text,
        // BOTH NAMES. This read `path === 'prompt'` while Cowork authors `stem.text` and R79 ruled
        // text wins, so on every migrated item the declared quotes were passed to NOTHING and the
        // exemption could not apply however it was declared.
        // BOTH NAMES, AND THE QUOTE'S OWN FIELD. This read `path === 'prompt'` while Cowork
        // authors `stem.text` and R79 ruled text wins, so on every migrated item the declared
        // quotes were passed to NOTHING. And `textsFrom` walks the stem object, so it screens
        // `quotes[0].text` as its own string — the quotation checked with no exemption, which left
        // a 20-word fault standing on a span declared exempt from the sentence cap.
        quotedSpans: carriesQuotes(path) ? spansFor(path) : [],
        exemptSpans: carriesQuotes(path) ? stemExemptSpans : undefined,
        testedTokens,
        passageNames,
      }),
    );
  }

  // The walk script and hint core: hint register, option words exempt from the
  // long-word ceiling, and screened for stale option references.
  const explanation = (item.explanation ?? {}) as Record<string, unknown>;
  const optionValues = item.options.map((o) => String((o.content as { value?: unknown }).value ?? ''));
  const optionWords = item.options.flatMap((o) => {
    const v = (o.content as { value?: unknown }).value;
    return (Array.isArray(v) ? v : [v]).flatMap((x) => String(x ?? '').split(/\s+/)).filter(Boolean);
  });
  // OPTION WORDS ARE DERIVED, NOT AUTHORED (R158). They were merged into `testedTokens` here, so a
  // script naming an option's own word looked identical to one resting on a bare authored list —
  // which is how the first warning reported six items whose exemption was the option list working
  // exactly as designed. Passed separately so the warning can name the real mechanism.
  const scriptTested = testedTokens;
  // Quotations declared ON THE EXPLANATION. The authoring contract puts a walk script's quoted
  // spans in `explanation.quotes` — where they are USED — but this gate previously read only
  // `stem.quotes`, so an R4 declaration on a walk script was silently invisible and the passage's
  // own word still failed the ceiling. Both sources are honoured now, filtered to spans actually
  // present in the field being checked (a declaration that does not resolve is still reported).
  const explanationQuotes = Array.isArray(explanation.quotes)
    ? (explanation.quotes as Array<{ text?: string }>).map((q) => q.text ?? '').filter(Boolean)
    : [];
  const declaredForScripts = [...stemQuotes, ...explanationQuotes];
  /**
   * EVERY STRING ON THE EXPLANATION, SCREENED BY DISPOSITION (R714). This walked a three-name
   * list — walkScript, walk, hintCore — so `explanation.note` (classified CHILD) carried a US
   * spelling past every check and `teachBack` carried banned vocabulary. A field list screens
   * what somebody remembered; a disposition screens what the row holds.
   *
   * A PATH WITH NO DISPOSITION REFUSES: unclassified is not assumed safe, and the refusal names
   * the path so it reaches the desk as a question rather than a silence.
   */
  const explanationPaths = [...textsFrom(explanation, '')];
  for (const [rawPath] of explanationPaths) {
    const key = dispositionKey('explanation', rawPath);
    if (dispositionFor('explanation', rawPath) === undefined) {
      failures.push({
        where: `item:${item.id} ${key}`,
        rule: 'unclassified-path',
        detail: `no disposition: this path is neither ruled child, staff nor quotation, so the gate cannot know which rules bind it — classify it before this item ships (R714)`,
      });
    }
  }
  for (const [rawPath, text] of explanationPaths) {
    if (dispositionFor('explanation', rawPath) !== 'child') continue;
    const field = rawPath;
    if (typeof text !== 'string' || !text.trim()) continue;
    failures.push(
      ...checkChildFacingText({
        role: 'hint',
        label: `item:${item.id} explanation.${field}`,
        text,
        quotedSpans: spansPresentIn(text, declaredForScripts),
        testedTokens: scriptTested,
        derivedTokens: optionWords,
        passageNames,
      }),
    );
    const orphans = [
      ...lettersNamedNotOnCard(text, optionValues, JSON.stringify(item.stem)),
      ...wordOptionsNamedNotOnCard(text, optionValues, JSON.stringify(item.stem)),
    ];
    if (orphans.length > 0) {
      failures.push({
        where: `item:${item.id} explanation.${field}`,
        rule: 'internal-id-leak',
        detail: `names option(s) not on the card: ${orphans.join(', ')} — script is stale against the current item`,
      });
    }
  }

  /**
   * EVERY OPTION VALUE — AND THE SAME FOUR ARGUMENTS THE STEM BRANCH TAKES (David's ruling,
   * 2026-08-16).
   *
   * This loop passed `testedTokens` alone: no `quotedSpans`, no `exemptSpans`, no `passageNames`. So
   * an option reproducing a span DECLARED ON ITS OWN STEM was blocked identically to one where
   * nothing was declared at all — same rule, same wording, no way to tell the two apart.
   *
   * **AN ACCIDENT, NOT A DESIGN, AND `passageNames` IS WHAT SETTLES IT.** That field exists so a
   * child-facing string may name a character the passage names. There is no reading under which an
   * option may say *Bingley* only by luck of it being short. This branch was written before the
   * declaration machinery and never revisited, which is why it took one argument where the stem
   * branch takes four.
   *
   * SPANS ARE FILTERED TO THOSE ACTUALLY IN THIS OPTION (`spansPresentIn`, as the walk scripts
   * already are). The declaration was made about the stem; a span this option did not use is not a
   * broken claim, and passing the raw list would report every unused quote as a fault on every
   * option — the ENG-002-pp-17 shape.
   */
  for (const option of item.options) {
    for (const [path, text] of textsFrom(option.content, '')) {
      if (!banListApplies(`option.${path}`)) continue;
      failures.push(
        ...checkChildFacingText({
          role: 'item-option',
          label: `item:${item.id} option.${path}`,
          text,
          quotedSpans: spansPresentIn(text, stemQuotes),
          // FILTERED TOO, PER CEILING. `quotedSpans` was filtered and this was not, so the ban-list
          // check received the RAW stem list and reported every span the option did not use as
          // "not in the text" — six items newly failed, all of them false. The same shape as the
          // multi-quote fault: a declared list compared against a string it was never about.
          exemptSpans: stemExemptSpans && {
            sentenceCap: spansPresentIn(text, stemExemptSpans.sentenceCap ?? []),
            banList: spansPresentIn(text, stemExemptSpans.banList ?? []),
            vocabularyCeiling: spansPresentIn(text, stemExemptSpans.vocabularyCeiling ?? []),
          },
          testedTokens,
          passageNames,
        }),
      );
    }
  }

  /**
   * A DECLARED SPAN MUST BE PRESENT IN THE FIELD THAT DECLARES IT (Annie's ruling, 2026-08-17).
   *
   * CHECK 8 asks whether a span is in the PASSAGE and never whether it lives where it CLAIMS to.
   * That is what let a stem declaration exempt text elsewhere, and **the widened option exemption
   * inherits the hole unless it is closed here** — a span declared on the stem now reaches every
   * option, so an unresolvable declaration silently exempts words in fields it was never about.
   *
   * The stem's own prose is already covered: `invalidQuotedSpans` reports a span missing from
   * `stem.text`. The hole is `spansPresentIn`, which FILTERS to what is present and therefore
   * SILENTLY DROPS a span that resolves nowhere — correct for a script that simply did not quote
   * that line, and wrong for a declaration that resolves in no field of the item at all.
   *
   * So: a declared span that appears in NO child-facing field of this item is reported. It cannot
   * be exempting anything, and a declaration that exempts nothing is either a typo or a workaround.
   */
  /**
   * A SPAN THAT CITES A PLACE IS EXCLUDED, AND THIS CHECK NEARLY SHIPPED WITHOUT THAT.
   *
   * The first version reported `ENG-002-pp-12` — an R4 declaration carrying `lineRefs: [39, 40]`
   * whose walk script PARAPHRASES rather than quotes. It resolves in no field of the item, and it
   * is entirely correct: the span sits in the passage ACROSS the line break (`…danced only` /
   * `once with Mrs. Hurst…`), which is what its lineRefs say. **This function is pure over the item
   * and cannot see the passage**, so it cannot tell a workaround from a correct citation — and
   * calling the second one a fault is R149 firing on the check written to apply R149.
   *
   * So the rule is scoped to what this function CAN judge: a span declared with NO claimed
   * location is an exemption for this item's own text, and must resolve in it. A span carrying
   * `lineRefs`/`passageRef` is a citation of the passage, and belongs to `check:line-refs`
   * (CHECK 11 containment), which holds the passage and can verify it.
   */
  const claimsAPlace = (q: unknown): boolean =>
    typeof q === 'object' && q !== null
    && (Array.isArray((q as { lineRefs?: unknown }).lineRefs)
      || typeof (q as { passageRef?: unknown }).passageRef === 'string');
  const placelessDeclared = [
    ...stemQuoteObjects.filter((q) => !claimsAPlace(q)).map((q) => q.text ?? ''),
    ...(Array.isArray(explanation.quotes) ? (explanation.quotes as Array<{ text?: string }>) : [])
      .filter((q) => !claimsAPlace(q)).map((q) => q.text ?? ''),
  ];
  const declaredSpans = [...new Set(placelessDeclared)].filter((q) => q.trim().length >= 3);
  if (declaredSpans.length > 0) {
    const everyField = [
      ...[...textsFrom(item.stem, '')].map(([, t]) => t),
      ...['walkScript', 'walk', 'hintCore'].map((f) => explanation[f]).filter((t): t is string => typeof t === 'string'),
      ...item.options.flatMap((o) => [...textsFrom(o.content, '')].map(([, t]) => t)),
    ].join('\n');
    for (const span of declaredSpans) {
      if (!everyField.includes(span.trim())) {
        failures.push({
          where: `item:${item.id} ${stemQuotes.includes(span) ? 'stem' : 'explanation'}.quotes`,
          rule: 'banned-vocabulary',
          detail: `declares a span that appears in NO field of this item: "${span.slice(0, 40)}" — `
            + 'a declaration that exempts nothing is a typo or a workaround',
        });
      }
    }
  }

  // House notation over EVERY child-facing string — stem, options (single tokens
  // too), and the walk script/hint. Money on £, temperatures with the degree sign,
  // areas/volumes with a real superscript. A word or ascii form is a defect: the
  // batch-01 fix was a manual edit on one export, so batches 04-05 regressed and no
  // reviewer sees it by eye at scale. One gate, every door.
  const notationSources: Array<[string, unknown]> = [['stem', item.stem], ['explanation', item.explanation], ...item.options.map((o, i): [string, unknown] => [`option[${i}]`, o.content])];
  for (const [root, value] of notationSources) {
    for (const [path, text] of everyString(value, root)) {
      for (const issue of checkMathsNotation(text)) {
        failures.push({ where: `item:${item.id} ${path}`, rule: 'notation', detail: `${issue.kind}: "${issue.found}" → house form "${issue.suggestion}"` });
      }
    }
  }
  return failures;
}
