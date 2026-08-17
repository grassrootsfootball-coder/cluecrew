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
import { checkChildFacingText, spansPresentIn, type ContentFailure } from './content-gates';
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

/** Every readable string in a Json value, path-labelled. A lone word (no space)
 *  is a token, not prose, and is skipped — matching the serving sweep. */
export function textsFrom(value: unknown, path: string): Array<[string, string]> {
  if (typeof value === 'string') return value.trim().includes(' ') ? [[path, value]] : [];
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

  // Every stem string. The prose and the quote declarations carry the declared quotes.
  for (const [path, text] of textsFrom(item.stem, '')) {
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
  const scriptTested = [...testedTokens, ...optionWords];
  // Quotations declared ON THE EXPLANATION. The authoring contract puts a walk script's quoted
  // spans in `explanation.quotes` — where they are USED — but this gate previously read only
  // `stem.quotes`, so an R4 declaration on a walk script was silently invisible and the passage's
  // own word still failed the ceiling. Both sources are honoured now, filtered to spans actually
  // present in the field being checked (a declaration that does not resolve is still reported).
  const explanationQuotes = Array.isArray(explanation.quotes)
    ? (explanation.quotes as Array<{ text?: string }>).map((q) => q.text ?? '').filter(Boolean)
    : [];
  const declaredForScripts = [...stemQuotes, ...explanationQuotes];
  for (const field of ['walkScript', 'walk', 'hintCore'] as const) {
    const text = explanation[field];
    if (typeof text !== 'string' || !text.trim()) continue;
    failures.push(
      ...checkChildFacingText({
        role: 'hint',
        label: `item:${item.id} explanation.${field}`,
        text,
        quotedSpans: spansPresentIn(text, declaredForScripts),
        testedTokens: scriptTested,
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
