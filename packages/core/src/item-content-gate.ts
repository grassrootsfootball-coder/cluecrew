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
  const stemQuotes = Array.isArray(stem.quotes)
    ? (stem.quotes as Array<{ text?: string }>).map((q) => q.text ?? '').filter(Boolean)
    : [];
  const testedTokens = Array.isArray(stem.testedTokens) ? (stem.testedTokens as string[]) : [];
  // R23 — proper nouns the passage itself uses, declared on the stem, exempt from the ceiling only.
  const passageNames = Array.isArray(stem.passageNames) ? (stem.passageNames as string[]) : [];

  // Every stem string. Only the prompt carries the declared quotes.
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
        quotedSpans: path === 'prompt' ? stemQuotes : [],
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

  // Every option value.
  for (const option of item.options) {
    for (const [path, text] of textsFrom(option.content, '')) {
      failures.push(
        ...checkChildFacingText({ role: 'item-option', label: `item:${item.id} option.${path}`, text, testedTokens }),
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
