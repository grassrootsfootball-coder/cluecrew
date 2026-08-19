/**
 * QUOTE FIELDS ARE A THIRD CLASS: SOURCE-OF-TRUTH, CHECKED BY EXACT MATCH (Annie's ruling,
 * 2026-08-19 — R291).
 *
 * **THE AXIS WAS WRONG AND THAT IS THE RULING.** The obvious move — extend the child-facing gate
 * over `attractorQuote` and `defeaterQuote` — would run the reading-age cap and the ban list across
 * **quoted Victorian prose** and fail Grahame on every line. The fields are not child-facing; a
 * child never sees them. **They are not staff prose either**: they are a RECORD OF WHAT THE PASSAGE
 * SAYS, and the only property that means anything about them is whether they still say it.
 *
 * **AND THIS CHECK IS STRONGER THAN THE ONE IT REPLACES.** It would have caught PU-06 the day it
 * was written — **a doubled opening quotation mark is not in the source**, so an exact match fails
 * on it immediately, where a punctuation-pattern sweep only catches the shapes someone thought to
 * name. A source-of-truth field does not need a list of ways it can be wrong; it needs the source.
 *
 * **WITHIN THE DECLARED LINES, NOT MERELY SOMEWHERE IN THE PASSAGE.** A quote present in the
 * passage but outside the item's own `lineRefs` window is a different fault — it cites a place the
 * child was not sent — and it is reported separately rather than folded into "found".
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const PASSAGES = resolve(import.meta.dirname, '../content/passages');

/** The passage text, by id. A reader refuses a shape it cannot parse (R173). */
function passages(): Map<string, { text: string; numbered: NumberedLine[] | null }> {
  const out = new Map<string, { text: string; numbered: NumberedLine[] | null }>();
  for (const name of readdirSync(PASSAGES).filter((n) => n.endsWith('.json'))) {
    const parsed = JSON.parse(readFileSync(join(PASSAGES, name), 'utf8')) as
      { id?: string; extract?: unknown; body?: unknown; text?: unknown; numberedLines?: unknown };
    if (typeof parsed.id !== 'string') {
      throw new Error(`${name}: no string id — refusing to report from a failed read (R173)`);
    }
    /*
     * THREE SHAPES, ALL LEGITIMATE, AND THE READER NAMES THEM RATHER THAN COERCING. A stream-A
     * comprehension extract carries `extract`; a cloze VEHICLE carries `body`; a stream-B passage
     * carries `text`. The first version knew one and threw on the second, then knew two and threw
     * on the third — **each refusal was correct and each taught me a shape I did not know the
     * corpus had.** That is what a refusing reader buys: a `?? ''` here would have silently
     * screened 819 quotes against an empty string and reported every one as NOT IN THE SOURCE.
     */
    const text = typeof parsed.extract === 'string' ? parsed.extract
      : typeof parsed.body === 'string' ? parsed.body
      : typeof parsed.text === 'string' ? parsed.text
      : null;
    if (text === null) {
      throw new Error(`${name}: none of 'extract', 'body' or 'text' is a string — an unknown passage shape, reported rather than skipped`);
    }
    const numbered = Array.isArray(parsed.numberedLines)
      ? (parsed.numberedLines as NumberedLine[]).filter((l) => typeof l?.n === 'number' && typeof l?.text === 'string')
      : null;
    out.set(parsed.id, { text, numbered });
  }
  if (out.size === 0) throw new Error('no passages parsed — refusing to report "all quotes match" from an empty read');
  return out;
}

/**
 * The declared window as text, **read from the passage's own `numberedLines`** — not derived by
 * splitting the extract on newlines.
 *
 * **MY FIRST VERSION DERIVED IT AND REPORTED ELEVEN LIVE QUOTES AS OUTSIDE THEIR WINDOW.** The
 * Wind in the Willows extract has 32 newlines and **83 numbered lines**: the file DECLARES its own
 * numbering and I recomputed a different one, so `lineRefs [5,6,7,8,9]` indexed into the wrong
 * text entirely. Every one of those eleven was the instrument.
 *
 * This is the standing instruction landing again — *a verifier calls the family's own function
 * rather than re-deriving the property* — and it is the second time in two turns. Line numbers are
 * an authored fact about a passage, not an artefact of where the newlines fell.
 */
function window(numbered: NumberedLine[] | null, lineRefs: unknown): string | null {
  if (!numbered || !Array.isArray(lineRefs) || lineRefs.length === 0) return null;
  const wanted = new Set(lineRefs.filter((n): n is number => typeof n === 'number'));
  if (wanted.size === 0) return null;
  const picked = numbered.filter((l) => wanted.has(l.n)).map((l) => l.text);
  return picked.length > 0 ? picked.join('\n') : null;
}

interface NumberedLine { n: number; text: string }

/** Runs of whitespace to one space. A presentation difference, never a punctuation one. */
const flat = (s: string) => s.replace(/\s+/g, ' ').trim();

async function main() {
  const text = passages();
  const rows = await prisma.itemOption.findMany({
    where: { OR: [{ attractorQuote: { not: null } }, { defeaterQuote: { not: null } }] },
    select: {
      attractorQuote: true, defeaterQuote: true,
      item: { select: { id: true, status: true, stem: true, lineRefs: true } },
    },
  });

  /*
   * **DECLARED SPANS ARE CHECKED HERE TOO** (R331). Declaring a span in `explanation.quotes` was
   * described as turning a future refusal into a *verified* quotation — and half of that was untrue
   * when written: this check read only `attractorQuote` and `defeaterQuote`, so 62 newly declared
   * spans were exempted from the house rules and verified against the passage by nothing.
   *
   * **An exemption without a verification is strictly worse than neither**: the text stops being
   * screened for our rules and gains no check that it still matches its source. The claim is made
   * true here rather than softened in the prose.
   */
  // Filtered in code rather than by a JSON path predicate: the predicate needs a Prisma namespace
  // import this script cannot resolve, and the item count is small enough that reading and
  // filtering is the honest trade.
  const declaring = (await prisma.item.findMany({
    select: { id: true, status: true, stem: true, lineRefs: true, explanation: true },
  })).filter((i) => Array.isArray(((i.explanation ?? {}) as { quotes?: unknown }).quotes));
  const declaredRows = declaring.flatMap((item) => {
    const quotes = ((item.explanation ?? {}) as { quotes?: { text?: string }[] }).quotes ?? [];
    return quotes
      .filter((q) => typeof q?.text === 'string' && q.text.trim() !== '')
      .map((q) => ({
        attractorQuote: q.text!, defeaterQuote: null,
        item: { id: item.id, status: item.status, stem: item.stem, lineRefs: item.lineRefs },
      }));
  });
  requirePopulation('source-of-truth quotes', {
    'passage files': text.size,
    'options carrying a quote': rows.length,
    'declared spans in explanation.quotes': declaredRows.length,
  });

  const faults: string[] = [];
  let checked = 0, outsideWindow = 0, noPassage = 0, noWindow = 0;

  for (const row of [...rows, ...declaredRows]) {
    const passageRef = ((row.item.stem ?? {}) as { passageRef?: unknown }).passageRef;
    const passage = typeof passageRef === 'string' ? text.get(passageRef) : undefined;
    const extract = passage?.text;
    for (const [field, quote] of [['attractorQuote', row.attractorQuote], ['defeaterQuote', row.defeaterQuote]] as const) {
      if (!quote) continue;
      if (!extract) { noPassage += 1; continue; }
      checked += 1;
      /*
       * **WHITESPACE IS FLATTENED; NOTHING ELSE IS.** The passage files wrap lines for reading, so
       * a quote spanning a wrap is not contiguous in the raw text — that is an artefact of the
       * FILE, not of the words. Collapsing runs of whitespace is therefore not "tidying to match":
       * it removes a presentation difference and leaves every character that carries meaning.
       *
       * **Punctuation is untouched, which is what makes the check strong.** PU-06's doubled opening
       * mark still fails, and so does the real fault this run found — a quote carrying an
       * apostrophe the source does not have.
       */
      if (!flat(extract).includes(flat(quote))) {
        faults.push(`${row.item.id} [${row.item.status}] ${field}: NOT IN THE SOURCE — ${JSON.stringify(quote.slice(0, 70))}`);
        continue;
      }
      const win = window(passage?.numbered ?? null, row.item.lineRefs);
      if (win === null) { noWindow += 1; continue; }
      if (!flat(win).includes(flat(quote))) {
        outsideWindow += 1;
        faults.push(`${row.item.id} [${row.item.status}] ${field}: in the passage but OUTSIDE lineRefs ${JSON.stringify(row.item.lineRefs)} — ${JSON.stringify(quote.slice(0, 60))}`);
      }
    }
  }

  console.log('source-of-truth quotes — exact match against the declared passage');
  console.log(`  passage files read            : ${text.size}`);
  console.log(`  options carrying a quote      : ${rows.length}`);
  console.log(`  quotes matched exactly        : ${checked - faults.length}`);
  console.log(`  quotes checked                : ${checked}`);
  console.log(`  skipped, no passage declared  : ${noPassage}`);
  console.log(`  skipped, no lineRefs window   : ${noWindow}`);
  console.log(`  present but outside the window: ${outsideWindow}`);

  if (checked === 0) {
    console.error('\n  CONTROL FAILED: no quote was checked against any passage. This run asserted');
    console.error('  nothing and must not read as a pass.');
    await prisma.$disconnect();
    process.exit(1);
  }
  /*
   * TWO CLASSES, AND THEY GATE DIFFERENTLY.
   *
   * **NOT IN THE SOURCE is a hard fault**: the field claims the passage says something it does not,
   * which is the property this check exists for and the one that would have caught PU-06.
   *
   * **OUTSIDE THE WINDOW is a backlog of 30**, all pre-existing and all LIVE. The schema declares
   * that attractor and defeater sit inside the item's own `lineRefs`; thirty do not. That is a real
   * divergence from a declared rule and it is NOT mine to fix — a defeater one line outside its
   * window may be correct authoring or may be a mis-cited window, and only a reviewer reading the
   * item can say which. Failing CI on thirty pre-existing rows would get the check switched off,
   * so it fails on anything NEW, on the `typecheck:scripts` model.
   */
  /**
   * 30 -> 31 on 2026-08-19, and **the content did not change: the POPULATION did.** Widening this
   * check to read `explanation.quotes` brought 73 newly declared spans under it, and one of them
   * cites text outside its item's `lineRefs`. **A backlog that grows because the denominator grew
   * is a different event from one that grows because the content got worse**, and recording the
   * number without the reason would have made them look identical the next time someone read it.
   */
  const OUTSIDE_WINDOW_BACKLOG = 31;
  /**
   * THE ONE KNOWN DIVERGENCE, DECLARED WITH ITS QUESTION. `ENG-001-WIW-18`'s attractor quotes
   * *"it’s all very well to talk"*; the passage transcription reads *"its all very well to talk"*,
   * with no apostrophe. **One of the two is wrong and a reviewer decides which** — Grahame's text
   * has the apostrophe, so this may be a transcription that dropped it rather than a quote that
   * invented one, and correcting the wrong side would put a fault into the passage itself.
   */
  const DECLARED_DIVERGENCES = new Set([
    'ENG-001-WIW-18|attractorQuote',
    /**
     * `ENG-025-LW-09` (DRAFT): quotes *"then take a quiet minute"*; Alcott's text reads **"than
     * take a quiet minute"**. A one-word drift — and the clearest possible demonstration of why
     * this check is not a punctuation sweep: no pattern of marks would ever have found it.
     */
    'ENG-025-LW-09|attractorQuote',
  ]);
  const notInSource = faults.filter((f) => f.includes('NOT IN THE SOURCE'));
  const outside = faults.filter((f) => f.includes('OUTSIDE lineRefs'));

  const undeclared = notInSource.filter((f) => ![...DECLARED_DIVERGENCES].some((d) => {
    const [id, field] = d.split('|');
    return f.includes(id!) && f.includes(field!);
  }));
  if (notInSource.length > 0) {
    console.log(`\n  ${notInSource.length} quote(s) NOT IN THE SOURCE (${DECLARED_DIVERGENCES.size} declared, awaiting a reviewer):`);
    for (const f of notInSource) console.log(`      ${f}`);
    console.log('      The passage is authority for a source-of-truth field — but where the passage');
    console.log('      itself may carry the error, correcting the quote would bury it. Reviewer decides.');
  }
  if (undeclared.length > 0) {
    console.error(`\n${undeclared.length} UNDECLARED quote(s) not present in the source:`);
    for (const f of undeclared) console.error(`  - ${f}`);
  }
  if (outside.length > 0) {
    console.log(`\n  ${outside.length} quote(s) cite text OUTSIDE the item's declared lineRefs (backlog ${OUTSIDE_WINDOW_BACKLOG}):`);
    for (const f of outside.slice(0, 6)) console.log(`      ${f}`);
    if (outside.length > 6) console.log(`      … and ${outside.length - 6} more`);
    console.log('      Each needs a reviewer: a defeater outside its window may be correct authoring');
    console.log('      or a mis-cited window, and the check cannot tell those apart.');
  }
  if (outside.length > OUTSIDE_WINDOW_BACKLOG) {
    console.error(`\nFAULT: the outside-window backlog GREW, ${OUTSIDE_WINDOW_BACKLOG} -> ${outside.length}.`);
    await prisma.$disconnect();
    process.exit(1);
  }
  if (undeclared.length > 0) { await prisma.$disconnect(); process.exit(1); }
  console.log(`\n  Every quote is present in its declared passage. Backlog not growing.`);
  await prisma.$disconnect();
}

main();
