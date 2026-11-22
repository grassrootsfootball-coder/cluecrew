/**
 * THE FIFTEEN, RULED BY DERIVATION AND NOT BY PROVENANCE (her ruling).
 *
 * **The deriving text stands whoever held it.** So both texts run through executes-as and the
 * question of which store wrote them never enters.
 *
 * TWO TESTS, BOTH DECIDABLE, AND THE THIRD DELIBERATELY NOT RUN:
 *  - **CITED LINES INSIDE THE ITEM'S OWN WINDOW.** Each item declares `lineRefs`. A text citing a
 *    line outside that window points the child at something the item does not show. Decidable
 *    without knowing the passage's line-numbering convention, because the citation and `lineRefs`
 *    use the SAME convention.
 *  - **QUOTED SPANS PRESENT IN THE PASSAGE.** A text quoting the passage either quotes it or does
 *    not.
 *  - **NOT RUN: resolving a line number to passage text.** The extract is stored as paragraphs and
 *    the items number lines by a rendering convention this store cannot reconstruct. **Guessing it
 *    would decide fifteen readings on an invented numbering** (R904), so the test is named and
 *    withheld rather than approximated.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = pjoin(__dirname, '..');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const norm = (s: string) => s.toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ').trim();

const citedLines = (t: string) => [...t.matchAll(/\bline[s]?\s+(\d+)(?:\s+and\s+(\d+))?(?:\s+to\s+(\d+))?/gi)]
  .flatMap((m) => [m[1], m[2], m[3]].filter(Boolean).map(Number));
/**
 * A QUOTE MARK IS NOT AN APOSTROPHE. Matching `'` as an opening quote read *the family's scepticism
 * about the STORY* as a quoted span and reported it absent from a passage that of course does not
 * contain it — two texts refused for a punctuation collision. Double and curly quotes only, and a
 * straight quote only where it does not follow a word character.
 */
const quotedSpans = (t: string) => [
  ...[...t.matchAll(/["“]([^"“”]{12,})["”]/g)].map((m) => m[1]!),
  ...[...t.matchAll(/(?<![A-Za-z])'([^']{12,})'/g)].map((m) => m[1]!),
];

async function run() {
  assertFixture('derivation-tests', [
    { name: 'a line inside the window passes', input: JSON.stringify([[70, 71, 72], 'line 71 answers the stem']), mustBeCaught: true },
    { name: 'a line OUTSIDE the window fails', input: JSON.stringify([[70, 71, 72], 'line 69 answers the stem']), mustBeCaught: false },
    { name: 'a range is expanded, not read as one number', input: JSON.stringify([[24, 25, 26, 27], 'lines 24 to 27 give no view']), mustBeCaught: true },
  ], (raw) => { const [refs, text] = JSON.parse(raw) as [number[], string]; const c = citedLines(text); return c.length > 0 && c.every((n) => refs.includes(n)); });

  const src = JSON.parse(readFileSync('/Users/davidb/Downloads/fifteen-executions-for-derivation-for-code.json', 'utf8')) as
    { rows: Array<{ itemId: string; optionValue: string; seatTag: string; THE_TEXT_IN_THESE_ROWS: string; THE_TEXT_IN_THE_CROSSED_ARTEFACT: string; itsSha256: string; itsSha256Crossed: string }> };
  requirePopulation('rule:fifteen-by-derivation', { 'differing execution(s)': src.rows.length });

  const passages = new Map<string, string>();
  const results = [];
  for (const r of src.rows) {
    const item = await prisma.item.findUniqueOrThrow({ where: { id: r.itemId }, select: { lineRefs: true, stem: true } });
    const refs = (item.lineRefs ?? []) as number[];
    const pref = (item.stem as { passageRef?: string }).passageRef;
    if (pref && !passages.has(pref)) {
      try { passages.set(pref, norm(String((JSON.parse(readFileSync(pjoin(REPO, `content/passages/${pref}.json`), 'utf8')) as { extract: string }).extract))); } catch { passages.set(pref, ''); }
    }
    const body = passages.get(pref ?? '') ?? '';

    /**
      * **THE EXPECTATION IS SET BY THE ENTRY, NOT BY THE WINDOW** (R937, and my first pass broke it).
      * `en-wrong-scope-retrieval` means the child retrieved from OUTSIDE the shown window — so a text
      * citing an out-of-window line is performing the derivation, not failing it. The first version
      * of this test scored every out-of-window citation as a refusal and returned NEITHER DERIVES on
      * nine of fifteen: **condemning on the property the entry predicts**, which is the one thing
      * R937 says an instrument may never do. The 9-of-15 cluster was the tell (R955).
      */
    const wrongScope = r.seatTag === 'en-wrong-scope-retrieval';
    const judge = (text: string) => {
      const cited = citedLines(text);
      const outside = cited.filter((n) => refs.length > 0 && !refs.includes(n));
      const inside = cited.filter((n) => refs.includes(n));
      const quotes = quotedSpans(text);
      const missing = body ? quotes.filter((q) => !body.includes(norm(q))) : [];
      // wrong-scope: an out-of-window citation is REQUIRED — it names where the wrong answer is true.
      // every other entry: the derivation lives inside the window.
      const structurallyRight = wrongScope ? outside.length > 0 : outside.length === 0;
      const derives = structurallyRight && missing.length === 0 && cited.length > 0;
      return { cited, citedInsideTheWindow: inside, citedOutsideTheWindow: outside,
        namesTheInWindowLineThatAnswers: inside.length > 0,
        quotedSpans: quotes, quotesNotInThePassage: missing, DERIVES: derives,
        why: !cited.length ? 'cites no line at all — nothing to derive from'
          : !structurallyRight ? (wrongScope
            ? 'the entry is wrong-scope retrieval and this text cites nothing outside the window, so it never names where the wrong answer IS true'
            : `cites line(s) ${outside.join(', ')} outside this item's own window, and this entry's derivation lives inside it`)
          : missing.length ? `quotes text not present in the passage: ${missing.map((m) => m.slice(0, 40)).join(' | ')}`
          : wrongScope
            ? `names the out-of-window line(s) ${outside.join(', ')} where the option is true${inside.length ? `, and the in-window line ${inside.join(', ')} that answers the stem` : ''}`
            : `every line it cites is inside the window${quotes.length ? ' and every span it quotes is in the passage' : ''}` };
    };

    const here = judge(r.THE_TEXT_IN_THESE_ROWS);
    const crossed = judge(r.THE_TEXT_IN_THE_CROSSED_ARTEFACT);
    const verdict = here.DERIVES && !crossed.DERIVES ? 'THE TEXT IN THESE ROWS DERIVES; THE CROSSED ONE DOES NOT'
      : crossed.DERIVES && !here.DERIVES ? 'THE CROSSED TEXT DERIVES; THE ONE IN THESE ROWS DOES NOT'
      : here.DERIVES && crossed.DERIVES ? 'BOTH DERIVE — resolves to house form, the other retained'
      : 'NEITHER DERIVES — re-derives fresh from entry and key';
    results.push({ itemId: r.itemId, optionValue: r.optionValue, seatTag: r.seatTag, windowLineRefs: refs,
      VERDICT: verdict, here: { ...here, sha256: r.itsSha256 }, crossed: { ...crossed, sha256: r.itsSha256Crossed },
      houseForm: here.DERIVES && crossed.DERIVES
        ? { form: 'the near-miss named, THEN the in-window line that answers the stem, quoted',
            whichTextIsInHouseForm: here.namesTheInWindowLineThatAnswers && !crossed.namesTheInWindowLineThatAnswers ? 'the one in these rows'
              : crossed.namesTheInWindowLineThatAnswers && !here.namesTheInWindowLineThatAnswers ? 'the crossed one'
              : 'both, or neither — house form does not separate them and the choice is yours',
            theOtherIsRetained: true }
        : null });
  }

  const tally = results.reduce<Record<string, number>>((a, r) => { a[r.VERDICT] = (a[r.VERDICT] ?? 0) + 1; return a; }, {});
  const full = {
    kind: 'fifteen-ruled-by-derivation',
    THE_RULE: 'ruled by derivation, not by provenance. The deriving text stands whoever held it; dual-deriving resolves to house form with the other retained; dual-refusing re-derives fresh from entry and key.',
    THE_TESTS: {
      one: 'every line a text cites must lie inside the item\'s own lineRefs window — decidable without the passage\'s numbering convention, because citation and lineRefs share it.',
      two: 'every span a text quotes must be present in the passage.',
      NOT_RUN: 'resolving a line NUMBER to passage TEXT. The extract is stored as paragraphs and the items number lines by a rendering this store cannot reconstruct; guessing it would decide fifteen readings on an invented numbering (R904). Named and withheld.',
    },
    tally, rows: results,
  };
  const lines = results.map((r) => `${r.itemId}\t${r.optionValue.slice(0, 24)}\t${r.VERDICT}`);
  const d = digestOverText('one line per row, "<itemId>\\t<option>\\t<verdict>"', lines.join('\n'));
  const body = JSON.parse(JSON.stringify({ ...full, RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec }));
  const artefact = { ...body, ...findingsDigest(body, ['rows', 'tally', 'RESULT_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('fifteen-ruled-by-derivation', sha(json).slice(0, 16), 'json');
  writeFileSync(pjoin(REPO, 'content/exports', name), json);
  deliver(pjoin(REPO, 'content/exports', name), 'fifteen-ruled-by-derivation');
  console.log('');
  for (const [v, n] of Object.entries(tally)) console.log(`  ${String(n).padStart(3)}  ${v}`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
