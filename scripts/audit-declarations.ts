/**
 * STRUCTURAL DECLARATION AUDIT — `pnpm audit:declarations`
 *
 * David's question after Entry 18: for every structural declaration an author
 * can make, does a malformed or misnamed field FAIL LOUDLY, or vanish?
 *
 * "An exemption that evaporates without error is worse than one never
 * claimed, because the author believes they're covered."
 *
 * This does not reason about the code. It PLANTS each malformation and runs
 * the real gate functions over it, because the whole class of defect we are
 * hunting is one where reading the code makes you confident and running it
 * does not. `quote.span` for `quote.text` was invisible to four separate
 * readings.
 *
 * THREE OUTCOMES, and the middle one is the point:
 *
 *   REPORTED     a gate names the malformed declaration. The author is told
 *                what they got wrong.
 *   FAILS CLOSED nothing names it, but the protection it bought is gone, so
 *                another gate fires. The author sees a failure and has to
 *                work out why. Safe, unhelpful.
 *   SILENT       nothing fires. The author believes they are covered, the
 *                obligation the declaration carried is never checked, and
 *                the item ships.
 *
 * A binary loud/quiet would hide the distinction that matters: a declaration
 * usually buys an EXEMPTION and carries an OBLIGATION, and losing the two
 * behaves completely differently.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  checkChildFacingText,
  checkLineRefs,
  checkWordCard,
  isBlocking,
  type CitablePassage,
} from '@cluecrew/core';

const PASSAGE_DIR = resolve(import.meta.dirname, '../content/passages');
const passage = JSON.parse(
  readFileSync(`${PASSAGE_DIR}/stream-a-13-pride-prejudice.json`, 'utf8'),
) as CitablePassage;
const cloze = JSON.parse(
  readFileSync(`${PASSAGE_DIR}/cloze-eng003-a-eco-club.json`, 'utf8'),
) as CitablePassage;

type Outcome = 'REPORTED' | 'FAILS CLOSED' | 'SILENT';

interface Probe {
  field: string;
  malformation: string;
  /** A control asserts the declaration WORKS. Silence is the pass there, so
   *  it must not be counted as a finding. */
  control?: boolean;
  /** What the declaration is FOR — an exemption, an obligation, or both. */
  carries: 'exemption' | 'obligation' | 'both';
  run: () => { names: boolean; anyFailure: boolean; detail: string };
}

/** A stem long enough that losing its quote exemption breaks the cap. */
const STEM =
  "Mr Darcy says: 'Your sisters are engaged, and there is not another woman in the room whom it would not be a punishment to me to stand up with'. What does 'engaged' mean here?";
/**
 * Two LONG words (the rule is >=4 syllables), one of them the token under
 * test. Both halves matter: without the exemption this is 2 long words and
 * fails; with it, 1 and passes. The control probe below proves the pair
 * discriminates, which the first draft of this stem did not — "description"
 * is three syllables and the probe could not tell the cases apart.
 */
const TESTED_STEM = "What does 'fastidious' mean in this conversation?";
const GOOD_QUOTE =
  'Your sisters are engaged, and there is not another woman in the room whom it would not be a punishment to me to stand up with';

/** Run the two gates a stem passes through and say what came back. */
function stemGates(input: {
  quotedSpans?: readonly string[];
  testedTokens?: readonly string[];
  declaredQuotes?: readonly string[];
  lineRefs?: readonly number[];
  gapRef?: number;
  passageRef?: string;
  target?: CitablePassage;
  text?: string;
}): { names: boolean; anyFailure: boolean; detail: string } {
  const copy = checkChildFacingText({
    role: 'item-stem',
    label: 'probe',
    text: input.text ?? STEM,
    quotedSpans: input.quotedSpans ?? [],
    testedTokens: input.testedTokens ?? [],
  }).filter(isBlocking);
  const lines = input.passageRef
    ? checkLineRefs({
        label: 'probe',
        passageRef: input.passageRef,
        passage: input.target,
        lineRefs: input.lineRefs,
        gapRef: input.gapRef,
        text: input.text ?? STEM,
        declaredQuotes: input.declaredQuotes ?? [],
      })
    : [];
  const all = [...copy.map((f) => f.detail), ...lines.map((f) => `[${f.rule}] ${f.detail}`)];
  // "Names it" means a gate mentions the declaration itself — a broken span
  // claim, a citation unit, a missing passage — rather than firing on the
  // consequence of the declaration having disappeared.
  const names = all.some((detail) =>
    /declares|citation|gap|passage|verbatim|not in the text/i.test(detail),
  );
  return { names, anyFailure: all.length > 0, detail: all[0] ?? '(nothing)' };
}

const PROBES: Probe[] = [
  {
    field: 'stem.quotes',
    malformation: 'key misnamed (quotes → quote)',
    carries: 'both',
    // The array is simply not found: no spans reach either gate.
    run: () => stemGates({ passageRef: 'stream-a-13-pride-prejudice', target: passage, lineRefs: [53, 54] }),
  },
  {
    field: 'stem.quotes[].text',
    malformation: 'span field misnamed (text → span) — the WS-REDRAFT-3 defect',
    carries: 'both',
    run: () => stemGates({ passageRef: 'stream-a-13-pride-prejudice', target: passage, lineRefs: [53, 54] }),
  },
  {
    field: 'stem.quotes[].text',
    malformation: 'declared span is not in the stem (a broken claim)',
    carries: 'both',
    run: () =>
      stemGates({
        quotedSpans: ['a span that is nowhere in this stem at all'],
        declaredQuotes: ['a span that is nowhere in this stem at all'],
        passageRef: 'stream-a-13-pride-prejudice',
        target: passage,
        lineRefs: [53, 54],
      }),
  },
  {
    field: 'stem.quotes[].text',
    malformation: 'span is in the stem but NOT verbatim from the passage',
    carries: 'obligation',
    run: () => {
      const altered = STEM.replace('stand up with', 'stand up with him');
      return stemGates({
        text: altered,
        quotedSpans: [`${GOOD_QUOTE} him`],
        declaredQuotes: [`${GOOD_QUOTE} him`],
        passageRef: 'stream-a-13-pride-prejudice',
        target: passage,
        lineRefs: [53, 54],
      });
    },
  },
  {
    field: 'stem.quotes[].passageRef',
    malformation: 'points at a passage that does not exist',
    carries: 'obligation',
    run: () =>
      stemGates({
        quotedSpans: [GOOD_QUOTE],
        declaredQuotes: [GOOD_QUOTE],
        passageRef: 'no-such-passage',
        target: undefined,
        lineRefs: [53, 54],
      }),
  },
  {
    field: 'stem.testedTokens',
    malformation: 'control — the exemption present and correct',
    carries: 'exemption',
    control: true,
    // The control matters: a probe that cannot tell the two apart proves
    // nothing, and the first draft of this one could not. TESTED_STEM
    // carries two long words, one of them the token under test, so it fails
    // WITHOUT the exemption and passes WITH it.
    run: () => stemGates({ text: TESTED_STEM, testedTokens: ['fastidious'] }),
  },
  {
    field: 'stem.testedTokens',
    malformation: 'key misnamed (testedTokens → testedToken)',
    carries: 'exemption',
    run: () => stemGates({ text: TESTED_STEM }),
  },
  {
    field: 'stem.testedTokens',
    malformation: 'a bare string instead of an array',
    carries: 'exemption',
    // A string spreads to single characters, so no token ever matches.
    run: () => stemGates({ text: TESTED_STEM, testedTokens: [...'fastidious'] }),
  },
  {
    field: 'stem.gapRef',
    malformation: 'key misnamed (gapRef → gapRefs) on a cloze item',
    carries: 'obligation',
    run: () =>
      stemGates({
        text: 'Gap 2. Choose the words that fit best.',
        passageRef: 'cloze-eng003-a-eco-club',
        target: cloze,
      }),
  },
  {
    field: 'stem.gapRef',
    malformation: 'absent entirely on a cloze item',
    carries: 'obligation',
    run: () =>
      stemGates({
        text: 'Gap 2. Choose the words that fit best.',
        passageRef: 'cloze-eng003-a-eco-club',
        target: cloze,
      }),
  },
  {
    field: 'stem.gapRef',
    malformation: 'out of range (gap 99 of 8)',
    carries: 'obligation',
    run: () =>
      stemGates({
        text: 'Gap 99. Choose the words that fit best.',
        gapRef: 99,
        passageRef: 'cloze-eng003-a-eco-club',
        target: cloze,
      }),
  },
  {
    field: 'stem.lineRefs',
    malformation: 'key misnamed (lineRefs → lineRef) on a prose item',
    carries: 'obligation',
    run: () =>
      stemGates({
        quotedSpans: [GOOD_QUOTE],
        declaredQuotes: [GOOD_QUOTE],
        passageRef: 'stream-a-13-pride-prejudice',
        target: passage,
      }),
  },
  {
    field: 'stem.passageRef',
    malformation: 'absent on an item that quotes a passage',
    carries: 'obligation',
    run: () => stemGates({ quotedSpans: [GOOD_QUOTE] }),
  },
];

function outcome(probe: Probe, result: { names: boolean; anyFailure: boolean }): Outcome | 'CONTROL OK' {
  if (probe.control) return result.anyFailure ? 'CONTROL FAILED' as Outcome : 'CONTROL OK';
  if (result.names) return 'REPORTED';
  return result.anyFailure ? 'FAILS CLOSED' : 'SILENT';
}

console.log('STRUCTURAL DECLARATION AUDIT — what happens when a declaration is malformed\n');
const rows = PROBES.map((probe) => ({ probe, result: probe.run() }));
const width = Math.max(...rows.map((row) => row.probe.field.length));
for (const { probe, result } of rows) {
  const verdict = outcome(probe, result);
  console.log(`  ${verdict.padEnd(12)} ${probe.field.padEnd(width)}  ${probe.malformation}`);
  console.log(`  ${' '.repeat(12)} ${' '.repeat(width)}  carries: ${probe.carries} · gate said: ${result.detail.slice(0, 92)}`);
}

const silent = rows.filter((row) => outcome(row.probe, row.result) === 'SILENT');
const closed = rows.filter((row) => outcome(row.probe, row.result) === 'FAILS CLOSED');
const controls = rows.filter((row) => row.probe.control);
const reported = rows.length - silent.length - closed.length - controls.length;
console.log(
  `\n${rows.length - controls.length} probes (+${controls.length} control) — ` +
    `REPORTED ${reported} · FAILS CLOSED ${closed.length} · SILENT ${silent.length}`,
);
if (silent.length > 0) {
  console.log('\nSILENT — the author believes they are covered and nothing checks:');
  for (const { probe } of silent) console.log(`  · ${probe.field}: ${probe.malformation} (carries an ${probe.carries})`);
}

// Word cards are the other place a structural claim is made.
console.log('\nWORD CARDS');
const card = {
  id: 'probe',
  headword: 'guarantee',
  definitionChild: 'A promise that something will happen.',
  sentence: 'The shop gave a guarantee with the kettle.',
};
const withHeadword = checkWordCard(card);
console.log(`  headwordInOwnCard is DERIVED from the card, not declared by the author: ${withHeadword.length} failure(s)`);
console.log('  → nothing to misname, so nothing to lose. This is the shape the others want.');


/**
 * THE FILE-LEVEL MARKERS live in the .mjs scanner, not in these functions, so
 * they are probed the only way that proves anything: a file is planted under
 * a scanned scope, `scan:vocab` is run for real, and the file is removed.
 *
 * Each probe carries a banned word INSIDE the exempted span, because a probe
 * with nothing to fire on cannot tell an exemption that held from one that was
 * never needed. The first draft of these could not, and reported a false all-clear.
 */
const ROOT = resolve(import.meta.dirname, '..');
const PROBE_FILE = resolve(ROOT, 'content/cases/zz-declaration-probe.json');

function scanWith(body: string): string {
  writeFileSync(PROBE_FILE, body);
  try {
    execFileSync('pnpm', ['-s', 'scan:vocab'], { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' });
    return '';
  } catch (error) {
    // BOTH streams. The scanner prints violations with console.error, so
    // reading only stdout reported a clean bill of health for markers I had
    // just watched fail by hand — the audit's own first result was a false
    // all-clear, which is the exact failure mode it exists to find.
    const streams = error as { stdout?: string; stderr?: string };
    const out = `${String(streams.stdout ?? '')}\n${String(streams.stderr ?? '')}`;
    return out
      .split('\n')
      .filter((line) => line.includes('zz-declaration-probe'))
      .join(' | ');
  } finally {
    rmSync(PROBE_FILE, { force: true });
  }
}

const FILE_PROBES: Array<{ marker: string; malformation: string; body: string; control?: boolean }> = [
  {
    marker: 'passageQuote',
    malformation: 'control — spelled correctly, banned word inside the span',
    control: true,
    body: JSON.stringify({
      kind: 'case',
      id: 'zz-probe',
      quoted: { passageQuote: true, passageRef: 'stream-a-04-black-beauty', text: 'I felt sure there was something wrong' },
    }),
  },
  {
    marker: 'passageQuote',
    malformation: 'key misspelled (passagequote)',
    body: JSON.stringify({
      kind: 'case',
      id: 'zz-probe',
      quoted: { passagequote: true, passageRef: 'stream-a-04-black-beauty', text: 'I felt sure there was something wrong' },
    }),
  },
  {
    marker: 'passageQuote.passageRef',
    malformation: 'names a passage that does not exist',
    body: JSON.stringify({
      kind: 'case',
      id: 'zz-probe',
      quoted: { passageQuote: true, passageRef: 'no-such-passage', text: 'I felt sure there was something wrong' },
    }),
  },
  {
    marker: 'vocab-ok',
    malformation: 'escape hatch misspelled (vocabok)',
    body: JSON.stringify({ kind: 'case', id: 'zz-probe', note: 'You got that wrong, try again. vocabok' }),
  },
  {
    marker: 'money-strand-item',
    malformation: 'marker misspelled (money-strand-itm)',
    body: JSON.stringify({ kind: 'case', id: 'zz-probe', prompt: 'Ravi has £4.50 to spend. money-strand-itm' }),
  },
];

console.log('\nFILE-LEVEL MARKERS (planted file, real scan:vocab run)\n');
for (const probe of FILE_PROBES) {
  const hits = scanWith(probe.body);
  const verdict = probe.control
    ? hits
      ? 'CONTROL FAILED'
      : 'CONTROL OK'
    : hits.includes('passageRef')
      ? 'REPORTED'
      : hits
        ? 'FAILS CLOSED'
        : 'SILENT';
  console.log(`  ${verdict.padEnd(12)} ${probe.marker.padEnd(24)}  ${probe.malformation}`);
  if (hits) console.log(`  ${' '.repeat(12)} ${' '.repeat(24)}  scanner said: ${hits.trim().slice(0, 100)}`);
}
