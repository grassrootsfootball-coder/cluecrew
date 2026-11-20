/**
 * THE LINE-REFERENCE GATE (David's ruling, 2026-08-02).
 *
 * "Five bad references have now survived three authoring rounds — this should
 * be machine-caught, not review-caught."
 *
 * They survived because a line citation is the one part of an item nobody can
 * check by reading it. A reviewer reading "Go straight to line 1" has no way
 * to know whether line 1 says what the script claims without opening the
 * passage and counting; three rounds of careful people missed the same five.
 * A machine opens the passage every time.
 *
 * WHAT IT CHECKS, in ascending order of usefulness:
 *
 *   1. The passage exists at all.
 *   2. Every cited line number is inside the passage.
 *   3. Every quoted span reproduces the passage EXACTLY.
 *   4. Every quoted span appears AT THE CITED LINES.
 *
 * 3 and 4 are separated deliberately. "The quote is not in the passage" and
 * "the quote is real but you sent the child to the wrong place" are different
 * mistakes with different fixes, and a gate that merges them just says
 * "something is wrong" — which is what a reviewer already knew.
 *
 * RULE 3 IS THE STRICT ONE, and it is strict on purpose (David's ruling,
 * 2026-08-02, manifesto v1.10). A quoted span must be a VERBATIM SUBSTRING of
 * the passage, including anything that looks like an error in the source.
 * Quoting less is always allowed — a truncated quotation is still the
 * passage's words. Altering a character never is.
 *
 * The reason is not reverence for the text, it is answerability. The child is
 * reading the passage while they answer. A stem that quotes something the
 * passage does not say sends them hunting for words that are not there, and
 * the item stops being a comprehension question at all. `ENG-001-WIW-18`
 * quoted Grahame's "its" as "it's" — a correction, kindly meant, that a child
 * scanning for "it's" would never find.
 *
 * This is the ABOUT-language principle (v1.8) doing its other half. That
 * principle exempts quoted text from OUR gates because the words are not
 * ours; this rule holds us to the words for exactly the same reason. A
 * carve-out that let us alter what it exempted would be a licence, not a
 * carve-out.
 *
 * TWO THINGS IT DOES NOT DO. It does not judge whether the line supports the
 * inference — that is the reviewer's work and always will be. And it compares
 * text with typography normalised, because a curly apostrophe in the passage
 * and a straight one in a script are the same words in the same place.
 * Typography is a real problem, but it is the PASSAGE INTEGRITY audit's
 * problem; conflating the two would make this gate fire constantly for a
 * reason it cannot fix.
 */

export interface PassageLine {
  n: number | null;
  text: string;
  label?: string;
}

export interface CitablePassage {
  id: string;
  numberedLines: PassageLine[];
  /**
   * Cloze vehicles count GAPS, not lines. Its presence changes the unit a
   * citation is resolved in — see the note on `citation-unit` below.
   */
  gapCount?: number;
}

/**
 * CHECK 11: A QUOTE SPAN IS CONTAINED IN THE ITEM WINDOW — IT IS NOT EQUAL TO IT.
 *
 * Quote-level `lineRefs` names WHERE THE QUOTATION SITS. Item-level `lineRefs` is the item's
 * WINDOW — the span the disposals live in. Two different facts, and they agreed on six items by
 * COINCIDENCE, which is exactly how a subset case establishes a rule that is wrong everywhere else.
 *
 * The evidence that settled it: this store held [56,57] for a quote whose item window is
 * [56..62], and [57,58] against a window of [57,58,59]. Cowork's copies repeated the window onto
 * the quote. An equality check passes the second and fails the first, and would have made the
 * narrower — correct — value look like the defect.
 *
 * Cowork predicted this and built its check to FAIL rather than let the first subset case settle
 * the rule silently. It worked, and this is the rule it was holding the door open for.
 *
 * Returns the lines that fall OUTSIDE the window. Empty means contained.
 */
export function quoteLinesOutsideWindow(
  itemLineRefs: readonly number[] | null | undefined,
  quoteLineRefs: readonly number[] | null | undefined,
): number[] {
  // No window declared is not a violation — there is nothing to be contained IN. An item with no
  // window and a quote with lines is a different fault, and belongs to whatever checks the window.
  if (!itemLineRefs?.length || !quoteLineRefs?.length) return [];
  const window = new Set(itemLineRefs);
  return [...quoteLineRefs].filter((n) => !window.has(n)).sort((a, b) => a - b);
}

/**
 * ADDENDUM 36: THE ATTRACTOR AND THE DEFEATER.
 *
 * `attractorLine` is the line that makes a distractor attractive — what the child latches onto.
 * `defeaterLine` is the line a correct reading uses to rule it out. Three rules:
 *
 *   1. BOTH OR NEITHER. Half the pair states an attraction with no defeat, or a defeat with
 *      nothing to defeat; either is a claim that cannot be checked or acted on.
 *   2. BOTH INSIDE THE ITEM'S WINDOW. A line outside `lineRefs` sends a reviewer to text the item
 *      does not cover — the same fault the line-reference gate exists for, one level in.
 *   3. THE DEFEATER IS NOT BEFORE THE ATTRACTOR. A defeater earlier in the passage than the thing
 *      it defeats is not a defeater: it is a line the child had already read and passed. EQUAL is
 *      allowed — one line can carry both the pull and the correction.
 *
 * Returns a reason per broken rule, empty when the pair is sound or absent.
 */
export function checkAttractorDefeater(input: {
  itemLineRefs?: readonly number[] | null;
  attractorLine?: number | null;
  defeaterLine?: number | null;
}): string[] {
  const { itemLineRefs, attractorLine: a, defeaterLine: d } = input;
  const out: string[] = [];
  if (a == null && d == null) return out;
  if (a == null || d == null) {
    out.push(`only ${a == null ? 'defeaterLine' : 'attractorLine'} is set — both are required or neither`);
    return out;
  }
  if (itemLineRefs?.length) {
    const window = new Set(itemLineRefs);
    if (!window.has(a)) out.push(`attractorLine ${a} is outside the item window ${itemLineRefs.join(', ')}`);
    if (!window.has(d)) out.push(`defeaterLine ${d} is outside the item window ${itemLineRefs.join(', ')}`);
  }
  // Equal is legitimate; strictly earlier is not.
  if (d < a) out.push(`defeaterLine ${d} comes before attractorLine ${a}`);
  return out;
}

export interface LineRefFailure {
  where: string;
  rule:
    | 'no-such-passage'
    | 'line-out-of-range'
    | 'quote-not-verbatim'
    | 'quote-not-at-cited-lines'
    | 'quote-span-not-contained'
    | 'attractor-defeater'
    | 'citation-unit';
  detail: string;
}

/**
 * Typography normalised, whitespace collapsed, case folded. The passage is
 * hard-wrapped mid-sentence, so a quoted span routinely crosses a line break
 * and has to be compared against the lines JOINED — comparing line by line
 * would miss every quote longer than a few words.
 */
export function normaliseForMatch(text: string): string {
  return text
    // EVERY quote mark folds to one character, single and double alike. A walk
    // script quotes the passage in single quotes; the passage puts dialogue in
    // doubles. Mapping ‘’ to ' and “” to " keeps them distinct, so a script
    // quoting a line of speech would never match its own passage — which is
    // the one place a script quotes most.
    .replace(/['‘’ʼ‛"“”„‟]/g, "'")
    .replace(/[‐-―−]/g, '-')
    .replace(/…/g, '...')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** The highest line number in the passage. NOT `numberedLines.length` — the
 *  array carries paragraph breaks as entries with `n: null`. */
export function lastLineOf(passage: CitablePassage): number {
  return passage.numberedLines.reduce((max, line) => (line.n !== null && line.n > max ? line.n : max), 0);
}

/** The text of the given lines, joined as the child reads them. */
export function textAtLines(passage: CitablePassage, lines: readonly number[]): string {
  const wanted = new Set(lines);
  return passage.numberedLines
    .filter((line) => line.n !== null && wanted.has(line.n))
    .map((line) => line.text)
    .join(' ');
}

/**
 * The whole passage as one normalised string, with a map back to line numbers.
 *
 * Built once and indexed, rather than compared window by window. The first
 * version of this used a sliding window and returned the window's FIRST line,
 * which is not where the span starts — every multi-line quote came back six
 * lines early and the gate reported a uniform offset that did not exist. The
 * lesson is worth the comment: report where the match IS, never where the
 * search happened to begin.
 */
function joined(passage: CitablePassage): { text: string; marks: Array<{ at: number; n: number }> } {
  let text = '';
  const marks: Array<{ at: number; n: number }> = [];
  for (const line of passage.numberedLines) {
    if (line.n === null) continue;
    const piece = normaliseForMatch(line.text);
    if (!piece) continue;
    if (text) text += ' ';
    marks.push({ at: text.length, n: line.n });
    text += piece;
  }
  return { text, marks };
}

/**
 * WHERE A NEAR-MISS DIVERGES. A quote that is almost right is the common case
 * and the bare verdict "nowhere in the passage" sends a reviewer to read the
 * whole extract. This walks the longest prefix that IS present and reports the
 * words on both sides of the split, which turns a search into a fix: every one
 * of the four Pride and Prejudice failures was legible at a glance from it
 * ("Mrs Hurst" for "Mrs. Hurst", a full stop for a comma, a dialogue tag
 * silently dropped).
 */
export function divergence(passage: CitablePassage, span: string): { prefix: string; passageReads: string } | null {
  const needle = normaliseForMatch(span);
  const { text } = joined(passage);
  let best = 0;
  for (let end = 1; end <= needle.length; end += 1) {
    if (!text.includes(needle.slice(0, end))) break;
    best = end;
  }
  // Under four words the "prefix" is noise: half the passage matches it.
  if (best === 0 || needle.slice(0, best).split(' ').length < 4) return null;
  const at = text.indexOf(needle.slice(0, best));
  return {
    prefix: needle.slice(0, best).trim(),
    passageReads: text.slice(at, at + Math.min(needle.length + 40, 160)).trim(),
  };
}

/**
 * THE TWO TOLERANCES (David's ruling, 2026-08-02, manifesto v1.11).
 *
 *   · sentence-initial capitalisation of a quoted word
 *   · terminal punctuation on a truncated quote
 *
 * and NOTHING else. Both are artefacts of setting someone else's clause into
 * our sentence rather than changes to what the passage says: a child scanning
 * the line still finds the words, in the order the passage has them, which is
 * the only thing the verbatim rule was ever protecting.
 *
 * Everything that made the five corrections necessary stays a failure. In
 * particular `pp-19` — an attribution deleted from the MIDDLE of a quotation —
 * is not terminal punctuation and is not tolerated.
 *
 * Preferred where it is available: recast the sentence so the quotation needs
 * no adjusting at all, the way `WIW-10` does. A tolerance is permission to
 * stop fighting the grammar, not an invitation to lean on it.
 */
const TERMINAL_PUNCTUATION = /[.,;:!?…'"”’]+$/;

export type VerbatimVerdict =
  | 'exact'
  | 'initial-capital'
  | 'terminal-punctuation'
  | 'initial-capital and terminal-punctuation'
  | 'altered';

/** Typography and whitespace folded, CASE PRESERVED — the strict comparison. */
function joinedExact(passage: CitablePassage): string {
  return passage.numberedLines
    .filter((line) => line.n !== null && line.text.trim())
    .map((line) =>
      line.text
        .replace(/['‘’ʼ‛"“”„‟]/g, "'")
        .replace(/[‐-―−]/g, '-')
        .replace(/…/g, '...')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .join(' ');
}

function flipInitial(span: string): string {
  if (!span) return span;
  const first = span[0]!;
  const flipped = first === first.toLowerCase() ? first.toUpperCase() : first.toLowerCase();
  return flipped + span.slice(1);
}

/**
 * Does this span reproduce the passage, and if not exactly, under which
 * tolerance? Reported rather than merely allowed, so a reviewer can see how
 * much adjusting an item is doing.
 */
export function verbatimCheck(passage: CitablePassage, span: string): VerbatimVerdict {
  const text = joinedExact(passage);
  const cleaned = span
    .replace(/['‘’ʼ‛"“”„‟]/g, "'")
    .replace(/[‐-―−]/g, '-')
    .replace(/…/g, '...')
    .replace(/\s+/g, ' ')
    .trim();
  const truncated = cleaned.replace(TERMINAL_PUNCTUATION, '').trim();

  if (text.includes(cleaned)) return 'exact';
  if (text.includes(flipInitial(cleaned))) return 'initial-capital';
  if (truncated && truncated !== cleaned) {
    if (text.includes(truncated)) return 'terminal-punctuation';
    if (text.includes(flipInitial(truncated))) return 'initial-capital and terminal-punctuation';
  }
  return 'altered';
}

/** The line a span BEGINS on, or null if it is not in the passage at all. */
export function findSpan(passage: CitablePassage, span: string): number | null {
  const needle = normaliseForMatch(span);
  if (!needle) return null;
  const { text, marks } = joined(passage);
  // Case folds here already; the terminal-punctuation tolerance has to be
  // applied too, or a truncated quote would be located nowhere and reported
  // as invented rather than as the permitted trim that it is.
  const trimmed = normaliseForMatch(span.replace(TERMINAL_PUNCTUATION, ''));
  const at = text.includes(needle) ? text.indexOf(needle) : trimmed ? text.indexOf(trimmed) : -1;
  if (at < 0) return null;
  let line: number | null = null;
  for (const mark of marks) {
    if (mark.at <= at) line = mark.n;
    else break;
  }
  return line;
}

/**
 * EVERY line a span starts on, not only the first. A short quote ("the rule") often occurs more than
 * once in a passage; `findSpan` returns the first, so a citation anchored by a LATER occurrence was
 * reported as sending the child to the wrong place (ENG-006-TM-08: "the rule" at lines 11 and 38, item
 * correctly at 38). The anchoring test asks whether ANY occurrence sits at a cited line.
 */
export function findSpanLines(passage: CitablePassage, span: string): number[] {
  const { text, marks } = joined(passage);
  const lineAt = (at: number) => { let line: number | null = null; for (const mark of marks) { if (mark.at <= at) line = mark.n; else break; } return line; };
  const out = new Set<number>();
  for (const raw of [span, span.replace(TERMINAL_PUNCTUATION, '')]) {
    const needle = normaliseForMatch(raw);
    if (!needle) continue;
    for (let at = text.indexOf(needle); at >= 0; at = text.indexOf(needle, at + 1)) { const l = lineAt(at); if (l !== null) out.add(l); }
    if (out.size) break;
  }
  return [...out].sort((a, b) => a - b);
}

/**
 * Line citations written in PROSE — "Go straight to line 1", "Look at lines 11
 * and 12", "Read to the end of line 8". A walk script has no structured
 * lineRefs field; the citation is a sentence, which is exactly why nobody
 * could check it.
 *
 * Ranges are expanded ("lines 34 to 36" → 34, 35, 36) because that is what
 * the child is being told to read.
 */
export function extractLineCitations(text: string): number[] {
  const found = new Set<number>();
  const range = /\blines?\s+(\d+)\s*(?:to|through|and|[-–—])\s*(\d+)\b/gi;
  for (const match of text.matchAll(range)) {
    const from = Number(match[1]);
    const to = Number(match[2]);
    // "lines 11 and 12" is a pair; "lines 34 to 36" is a run. Both are
    // expanded, and a reversed or absurd range is left to the range check.
    if (to >= from && to - from <= 40) {
      for (let n = from; n <= to; n += 1) found.add(n);
    } else {
      found.add(from);
      found.add(to);
    }
  }
  const single = /\bline\s+(\d+)\b/gi;
  for (const match of text.matchAll(single)) found.add(Number(match[1]));
  return [...found].sort((a, b) => a - b);
}

/**
 * Quoted spans written in prose. Walk scripts quote the passage in single
 * quotes; stems use either. Single words are ignored — a one-word quote is
 * usually a gloss ('party' means a group), and checking those would drown the
 * signal in noise.
 */
export function extractQuotedSpans(text: string): string[] {
  const spans: string[] = [];
  // THE OPENING QUOTE MUST OPEN SOMETHING. A straight apostrophe is also the
  // possessive in "Darcy's", and a naive /'…'/ pairs one possessive with the
  // next — which produced spans like "s one cross moment is the ball ending
  // early" and reported them as quotes the passage did not contain. So the
  // opener must follow a space or an opening bracket, and the closer must be
  // followed by a space or closing punctuation.
  const patterns = [
    /(?:^|(?<=[\s([—–]))'([^']{4,120})'(?=$|[\s.,;:!?)\]—–])/g,
    /(?:^|(?<=[\s([—–]))‘([^’]{4,120})’(?=$|[\s.,;:!?)\]—–])/g,
    /(?:^|(?<=[\s([—–]))"([^"]{4,120})"(?=$|[\s.,;:!?)\]—–])/g,
    /(?:^|(?<=[\s([—–]))“([^”]{4,120})”(?=$|[\s.,;:!?)\]—–])/g,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const span = match[1]!.trim();
      if (span.split(/\s+/).length >= 2) spans.push(span);
    }
  }
  return spans;
}

export function checkLineRefs(input: {
  label: string;
  passageRef: string;
  passage: CitablePassage | undefined;
  /** Structured refs from an item's stem. Prose passages only. */
  lineRefs?: readonly number[];
  /** Which GAP a cloze item fills. Cloze vehicles only (renamed from the
   *  misleading `lineRefs`, 2026-08-02). */
  gapRef?: number;
  /** Prose that may cite lines and quote the passage — a stem or a walk script. */
  text?: string;
  /** Spans the item DECLARES it quotes, checked even if not in `text`. */
  declaredQuotes?: readonly string[];
}): LineRefFailure[] {
  const { label, passageRef, passage } = input;
  if (!passage) {
    return [{ where: label, rule: 'no-such-passage', detail: `cites passage "${passageRef}", which does not exist` }];
  }

  const failures: LineRefFailure[] = [];

  /**
   * CLOZE CITATIONS ARE GAPS, NOT LINES, and the field is called `lineRefs`.
   *
   * All sixteen cloze items carry `lineRefs: [n]` where n is exactly the gap
   * number in their own stem ("Gap 2" → `[2]`). Resolving those as line
   * numbers would quietly pass — a vehicle has enough paragraphs that 1–8 are
   * all "in range" — and the gate would certify a citation it had never
   * actually checked. That is worse than failing.
   *
   * So a passage that declares `gapCount` is resolved in gaps, and the
   * mismatch between the unit and the field name is REPORTED rather than
   * assumed away. Whether the fix is a renamed field or corrected items is a
   * modelling decision, not a gate's to make.
   */
  if (passage.gapCount !== undefined) {
    // `lineRefs` on a cloze item is the mismatch itself and stays a failure:
    // the field renaming (2026-08-02) is what stops a citation certifying
    // itself, so a row that still carries the old name has not been migrated.
    if ((input.lineRefs ?? []).length > 0) {
      failures.push({
        where: label,
        rule: 'citation-unit',
        detail: `${passageRef} is a cloze vehicle and counts gaps, not lines — this cites lineRefs ${(input.lineRefs ?? []).join(', ')}; the field is gapRef`,
      });
    }
    const gap = input.gapRef;
    if (gap !== undefined && (gap < 1 || gap > passage.gapCount)) {
      failures.push({
        where: label,
        rule: 'line-out-of-range',
        detail: `cites gap ${gap}; ${passageRef} has ${passage.gapCount} gaps`,
      });
    }
    return failures;
  }

  // The other direction: a citation into a prose passage has no gaps to name.
  if (input.gapRef !== undefined) {
    failures.push({
      where: label,
      rule: 'citation-unit',
      detail: `cites gap ${input.gapRef}, but ${passageRef} is a prose passage and counts lines`,
    });
  }

  const last = lastLineOf(passage);
  const fromProse = input.text ? extractLineCitations(input.text) : [];
  const cited = [...new Set([...(input.lineRefs ?? []), ...fromProse])].sort((a, b) => a - b);

  for (const line of cited) {
    if (line < 1 || line > last) {
      failures.push({
        where: label,
        rule: 'line-out-of-range',
        detail: `cites line ${line}; ${passageRef} runs to line ${last}`,
      });
    }
  }

  const inRange = cited.filter((line) => line >= 1 && line <= last);
  const spans = [...new Set([...(input.declaredQuotes ?? []), ...(input.text ? extractQuotedSpans(input.text) : [])])];

  // WHERE EACH SPAN ACTUALLY STARTS. A quote is hard-wrapped across lines as
  // often as not, so "begins at a cited line" is the test — requiring
  // containment would fail a script that correctly says "read to the end of
  // that sentence".
  const located = spans.map((span) => ({ span, at: findSpan(passage, span) }));

  for (const { span, at } of located) {
    // The two tolerances are a pass, not a warning: an item that capitalises
    // a quoted word to start its sentence has not altered the passage.
    if (at !== null && verbatimCheck(passage, span) !== 'altered') continue;
    const split = divergence(passage, span);
    failures.push({
      where: label,
      rule: 'quote-not-verbatim',
      detail: split
        ? `quotes "${span}" — matches as far as "…${split.prefix.slice(-40)}", then diverges. The passage reads: "${split.passageReads}"`
        : `quotes "${span}", which is nowhere in ${passageRef}`,
    });
  }

  // A script may legitimately quote something AWAY from the line it sends the
  // child to — "back on line 59 he had 'unfastened a rope'", "'step lively'
  // comes a moment later". So the test is not that every quote sits at every
  // cited line; it is that the citation is anchored by AT LEAST ONE of them.
  // An unanchored citation is the failure David described: a child sent to a
  // line that does not carry the evidence.
  const real = located.filter((entry) => entry.at !== null);
  if (inRange.length > 0 && real.length > 0 && !real.some((entry) => findSpanLines(passage, entry.span).some((l) => inRange.includes(l)))) {
    const where = real.map((entry) => `"${entry.span}" is at line ${entry.at}`).join('; ');
    failures.push({
      where: label,
      rule: 'quote-not-at-cited-lines',
      detail: `sends the child to line${inRange.length === 1 ? '' : 's'} ${inRange.join(', ')}, but ${where}`,
    });
  }
  return failures;
}
