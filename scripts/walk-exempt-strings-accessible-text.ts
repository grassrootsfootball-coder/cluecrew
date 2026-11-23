/**
 * THE FULL EXEMPTED POPULATION, WITH ITS ACCESSIBLE TEXT — MEMBERSHIP, NOT A REPAIR
 * (David, 2026-08-26 — R755, on Annie's accessibility flag ruled open on channel).
 *
 * R751 established the fact on forty vr-06 rows: no accessible text exists, the type has no field
 * for it, and the render is a bare `<p>`. **Nobody rules a remedy until the population is known**,
 * so this walks every string that claims a notation exemption anywhere in the corpus — gap
 * markers, option values and frames — and reports PER ROW whether accessible text exists.
 *
 * **WHAT THIS CALLS, STATED BEFORE IT RUNS (R41).** It re-derives nothing:
 *   · `textsFrom` — the item gate's OWN walker (packages/core/src/item-content-gate.ts)
 *   · `isScreenedPath`, `dispositionFor` — the disposition membership
 *   · `notationExempt`, `gapMarkerSpans` — the two exemption predicates themselves
 * The one thing it cannot read from a function is WHICH RENDERER a path reaches, because that is
 * a fact about JSX. So the render map below is DECLARED, each entry naming the file and line it
 * was read from, and any (family, path) not in it reports UNKNOWN rather than "none" — a silence
 * read as an absence is the fault R98 exists for.
 *
 * **AND THE ANSWER IS NOT UNIFORM, WHICH IS THE POINT OF WALKING IT.** A cloze gap DOES name
 * itself — `splitCarrierAtGaps` hides the marker and adds "gap N" (R668) — and a stowaway tiled
 * word DOES, through `role="img"` with an `aria-label`. The vr-06 sentence does not. Reporting
 * "none exists" corpus-wide from the forty would have been false.
 */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { FAMILY_BY_TYPE, dispositionFor, gapMarkerSpans, isScreenedPath, notationExempt } from '../packages/core/src/index';
import { textsFrom } from '../packages/core/src/item-content-gate';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { readFileSync } from 'node:fs';
import { requirePopulation } from './lib/population';

const REPO = join(__dirname, '..');

/**
 * DECLARED RENDER MAP. `substitute` is accessible text OTHER THAN the literal characters — the
 * only kind that helps when the characters do not speak. Each entry names where it was read.
 */
/**
 * WHICH ENGINE A FAMILY REACHES, READ FROM THE ROUTER ITSELF rather than hand-listed (R57).
 * `cloze` reuses the word-web component, so a hand-kept map would have put cloze gaps on a
 * renderer nobody had read and reported UNKNOWN for the one class that DOES name its gaps.
 */
const ENGINE_BY_FAMILY: Record<string, string> = (() => {
  const src = readFileSync(join(REPO, 'apps/web/components/crew/play-runner.tsx'), 'utf8');
  const map: Record<string, string> = {};
  for (const m of src.matchAll(/^\s*(\w+): dynamic\(\(\) => import\('\.\/engines\/(?:maths\/|nvr\/)?([\w-]+)'\)\)/gm)) { if (m[1] && m[2]) map[m[1]] = m[2]; }
  if (Object.keys(map).length === 0) throw new Error('read no family→engine pairs from play-runner.tsx — the shape changed (R173: refuse, never return empty)');
  return map;
})();

interface RenderFact { substitute: string | null; how: string; read: string }
const RENDER: Record<string, (stem: Record<string, unknown>) => RenderFact> = {
  'wordweb|stem.text': (stem) => (typeof stem.gapIndex === 'number' || typeof stem.gapRef === 'number')
    ? { substitute: `gap ${typeof stem.gapIndex === 'number' ? stem.gapIndex : '<printed index>'}`, how: 'the cloze carrier is split at " — " and each marker rendered aria-hidden beside a visually-hidden "gap N" (R668). The ear hears the gap named; the eye keeps the marker.', read: 'apps/web/components/crew/engines/wordweb.tsx:54-62' }
    : { substitute: null, how: 'NOT a cloze stem (no gapIndex and no gapRef), so the carrier split never runs and the stem prints whole in a bare <p>. The gap-naming is gated on isCloze.', read: 'apps/web/components/crew/engines/wordweb.tsx:23,37' },
  'stowaway|stem.word1': (stem) => ({ substitute: String(stem.word1 ?? ''), how: 'rendered through <Word>, which carries role="img" with aria-label={word} — announced once as the word, the letter tiles aria-hidden.', read: 'apps/web/components/crew/engines/stowaway.tsx:18-22' }),
  'stowaway|stem.word2': (stem) => ({ substitute: String(stem.word2 ?? ''), how: 'rendered through <Word>, role="img" with aria-label={word}.', read: 'apps/web/components/crew/engines/stowaway.tsx:18-22' }),
  'stowaway|stem.sentence': () => ({ substitute: null, how: 'a bare <p className="crew-panel">. No role, no aria-label, no visually-hidden gloss.', read: 'apps/web/components/crew/engines/stowaway.tsx:64' }),
  'stowaway|stem.wordWithGap': () => ({ substitute: null, how: 'a bare <p> with letter-spacing. Styling only; nothing in the accessibility channel.', read: 'apps/web/components/crew/engines/stowaway.tsx:65' }),
  'stowaway|stem.text': () => ({ substitute: null, how: 'a bare <p>{stemText(stem)}.', read: 'apps/web/components/crew/engines/stowaway.tsx:49' }),
};
/**
 * PATH-LEVEL RENDERERS, consulted BEFORE the engine map because these paths do not reach an engine
 * at all. Keyed by disposition key, so every engine's rows resolve the same way.
 */
const BY_PATH: Record<string, RenderFact & { renderedToChild: boolean }> = {
  'explanation.walkScript': {
    substitute: null, renderedToChild: true,
    how: 'the walk panel prints each sentence as a bare <p>{line}. The panel names ITSELF (role="group" aria-label="How this one works out") and manages focus, but nothing glosses a marker inside a line.',
    read: 'apps/web/components/crew/modes/walk-panel.tsx:90-109',
  },
  'stem.quotes[].text': {
    substitute: null, renderedToChild: false,
    how: 'NOT RENDERED on the child surface. `quotes` declares a quoted SPAN within the stem text (R23); the only reader is the admin review. The words reach a child through stem.text, which renders — so this row is a declaration about rendered text, not itself rendered.',
    read: 'grep for `.quotes` across apps/web: the sole consumer is components/admin/comprehension-review.tsx:69',
  },
  'explanation.quotes[].text': {
    substitute: null, renderedToChild: false,
    how: 'NOT RENDERED on the child surface — same as stem.quotes[].text; a span declaration, read only by the admin review.',
    read: 'grep for `.quotes` across apps/web: the sole consumer is components/admin/comprehension-review.tsx:69',
  },
};

const OPTION_RENDER: RenderFact = {
  substitute: null,
  how: 'OptionButton prints the option value as the button\'s own visible text and adds no aria-label, so the accessible name IS the characters. There is no substitute, and for a value that is ordinary letters there is nothing a substitute would add.',
  read: 'apps/web/components/crew/engines/option-button.tsx (no aria-label, no visually-hidden text)',
};

/**
 * **THE THIRD STATE, STATED PRECISELY.** The stem is an OPEN JSON object with passthrough (R57),
 * so a key written there would survive every import door — this is not a schema that forbids the
 * field. It is worse and more specific: **no key is declared for it in `stemSchema`, and no
 * renderer anywhere reads one.** Twenty-eight distinct `stem.*` keys are read across the engines
 * and not one is an accessibility channel; the identifiers `accessibleText`, `spokenForm`,
 * `readAloud` and their kin appear nowhere in the repository. So a value authored into such a
 * field today would pass the gate, land on the row, and **reach nothing** — which is a different
 * fact from a field left blank, and the reason this is not reported as an empty value.
 */
/** **A COUNT IS NOT A MEMBERSHIP, AND A MEMBERSHIP IS NOT A DERIVATION.** Stated, not implied. */
const DERIVATION = {
  unit: 'ONE STRING on ONE field path of ONE item. Not a run, not an item, not a token.',
  selected: 'a string is a member when it sits on a SCREENED path (per the disposition membership) AND the notation exemption is LOAD-BEARING on it: it carries a capital run of two or more that the shouted-capitals rule would otherwise fail, or an underscore marker that would otherwise be screened as text.',
  rejectedAlternative: 'every string for which an exemption predicate merely returns true. That reading gives 3,470, of which 3,376 are option values like "cat" — exempt in the sense that a locked door is keeping out somebody who was not coming.',
  functionsCalled: [
    'textsFrom (packages/core/src/item-content-gate.ts) — the item gate\'s own walker; not re-derived',
    'isScreenedPath, dispositionFor (packages/core/src/field-dispositions.ts) — the disposition membership',
    'notationExempt, gapMarkerSpans (same file) — the two exemption predicates themselves',
  ],
  classAssignment: 'FRAME when the marker token carries adjacent capitals; GAP_MARKER when it does not; OPTION_VALUE when the exemption is notationExempt on an options[] path; NOTATION for the same on any other notation-bearing path.',
  whatTHEDIGESTcovers: 'manifestSha256 is over the population manifest ALONE, and manifestSha256Spec beside it states the serialisation. It changes when membership changes and not when prose does.',
};

const NO_FIELD = 'the stem is open JSON and would CARRY such a key (R57 passthrough), but none is declared in stemSchema and no renderer reads one — 28 stem keys are read across the engines and none is an accessibility channel. A value written there would reach nothing. This is not a blank field; it is an uninvited one.';

async function run() {
  assertFixture('exempt-string-walk', [
    { name: 'a frame in a sentence is an exempt string', input: 'Please do not SH___ so loudly.', mustBeCaught: true },
    { name: 'a numbered cloze gap is an exempt string', input: 'Ade was the ___(2)___ runner.', mustBeCaught: true },
    { name: 'a shout with no marker is NOT exempt', input: 'OUT makes SHOUT, and shouting wakes the baby.', mustBeCaught: false },
    { name: 'ordinary prose is not exempt', input: 'Please do not shout so loudly.', mustBeCaught: false },
  ], (t) => gapMarkerSpans(t).length > 0);

  const items = await prisma.item.findMany({
    select: { id: true, status: true, questionTypeId: true, stem: true, explanation: true, options: { orderBy: { id: 'asc' }, select: { content: true } } },
    orderBy: { id: 'asc' },
  });
  requirePopulation('walk:exempt-strings', { 'items in the corpus': items.length });

  interface Row {
    itemId: string; status: string; questionTypeId: string; family: string; engine: string;
    root: string; path: string; text: string;
    class: 'GAP_MARKER' | 'FRAME' | 'OPTION_VALUE' | 'NOTATION';
    exemptTokens: string[];
    tokenCarriesNonSpeakingCharacters: boolean;
    accessibleTextExists: boolean;
    /**
     * **A SCHEMA THAT NEVER INVITED THE FIELD AND A FIELD LEFT BLANK ARE DIFFERENT FACTS**
     * (David, 2026-08-26). Neither is reported as an empty value.
     */
    accessibleTextStatus:
      | 'CARRIED BY THE RENDERER'
      | 'NO FIELD IS DECLARED FOR IT AND NOTHING WOULD READ ONE'
      | 'NOT RENDERED TO A CHILD AT ALL';
    whyThatStatus: string;
    renderedToChild: boolean | 'UNKNOWN';
    substituteAccessibleText: string | null;
    renderPath: string;
    readFrom: string;
  }
  const rows: Row[] = [];

  for (const item of items) {
    const family = FAMILY_BY_TYPE[item.questionTypeId] ?? 'wordweb';
    const engine = ENGINE_BY_FAMILY[family] ?? 'wordweb';
    const stem = (item.stem ?? {}) as Record<string, unknown>;
    const walk: Array<[string, string, string]> = []; // root, path, text
    for (const [p, t] of textsFrom(item.stem, '')) walk.push(['stem', p, t]);
    for (const [p, t] of textsFrom(item.explanation, '')) walk.push(['explanation', p, t]);
    item.options.forEach((o) => { for (const [p, t] of textsFrom(o.content, 'content')) walk.push(['options[]', p, t]); });

    for (const [root, path, text] of walk) {
      if (!isScreenedPath(root, path)) continue;
      const spans = gapMarkerSpans(text);
      const tokens = spans.map(([a, b]) => text.slice(a, b));
      const isNotation = notationExempt(root, path, text);

      /**
       * **THE EXEMPTION MUST BE LOAD-BEARING, OR IT IS NOT A MEMBER.** The first run of this walk
       * returned 3,470 strings, 3,376 of them option values — because `notationExempt` is true of
       * ANY single-token option value, including "cat", which nothing was ever going to screen.
       * Those rows are exempt in the sense that a locked door is keeping out somebody who was not
       * coming. A string is in the population only where the exemption CHANGES A VERDICT: it
       * carries a token the shouted-capitals rule would otherwise fail, or an underscore run that
       * would otherwise be screened as text. Counting the rest inflates the population by an order
       * of magnitude and buries the rows the flag is about (R591).
       */
      const wouldBeScreened = [...text.matchAll(/\b[A-Z]{2,}\b/g)].map((m) => [m.index ?? 0, (m.index ?? 0) + m[0].length] as [number, number]);
      const exemptRuns = wouldBeScreened.filter(([a, b]) => isNotation || spans.some(([s, e]) => a >= s && b <= e));
      const markerCarriesUnderscores = spans.length > 0;
      if (exemptRuns.length === 0 && !markerCarriesUnderscores) continue; // the exemption never bites here

      const hasLetters = tokens.some((t) => /[A-Z]/.test(t));
      const klass: Row['class'] = spans.length > 0
        ? (hasLetters ? 'FRAME' : 'GAP_MARKER')
        : (root === 'options[]' ? 'OPTION_VALUE' : 'NOTATION');

      const key = `${engine}|${root}.${path}`;
      const pathKey = `${root}.${path}`.replace(/\[\d+\]/g, '[]');
      const byPath = BY_PATH[pathKey];
      const fact: RenderFact = byPath ? byPath : root === 'options[]'
        ? OPTION_RENDER
        : (RENDER[key]?.(stem) ?? { substitute: null, how: `UNKNOWN — no renderer has been read for (${engine}, ${root}.${path}). Absence of a declared fact is NOT a finding of "no accessible text" (R98).`, read: 'not read' });
      const unknown = fact.read === 'not read';

      rows.push({
        itemId: item.id, status: item.status, questionTypeId: item.questionTypeId, family, engine,
        root, path, text,
        class: klass,
        exemptTokens: tokens.length ? tokens : [text],
        tokenCarriesNonSpeakingCharacters: (tokens.length ? tokens : [text]).some((t) => /_/.test(t)),
        accessibleTextExists: !unknown && fact.substitute !== null,
        accessibleTextStatus: (byPath && !byPath.renderedToChild)
          ? 'NOT RENDERED TO A CHILD AT ALL'
          : (fact.substitute !== null ? 'CARRIED BY THE RENDERER' : 'NO FIELD IS DECLARED FOR IT AND NOTHING WOULD READ ONE'),
        whyThatStatus: (byPath && !byPath.renderedToChild)
          ? 'the string reaches no child surface, so there is nothing for an accessible text to be an alternative TO. Reported apart from the rendered rows rather than summed with them.'
          : (fact.substitute !== null
            ? 'the renderer computes it at render time; no value is stored on the row.'
            : NO_FIELD),
        renderedToChild: unknown ? 'UNKNOWN' : (byPath ? byPath.renderedToChild : true),
        substituteAccessibleText: fact.substitute,
        renderPath: unknown ? `UNKNOWN — renderer not read for (${engine}, ${root}.${path})` : fact.how,
        readFrom: fact.read,
      });
    }
  }

  // The wide count, kept so the tightening is visible rather than merely applied.
  let wideCount = 0;
  for (const item of items) {
    const walk2: Array<[string, string, string]> = [];
    for (const [p, t] of textsFrom(item.stem, '')) walk2.push(['stem', p, t]);
    for (const [p, t] of textsFrom(item.explanation, '')) walk2.push(['explanation', p, t]);
    item.options.forEach((o) => { for (const [p, t] of textsFrom(o.content, 'content')) walk2.push(['options[]', p, t]); });
    for (const [root, path, text] of walk2) {
      if (!isScreenedPath(root, path)) continue;
      if (gapMarkerSpans(text).length > 0 || notationExempt(root, path, text)) wideCount++;
    }
  }

  const by = <K extends string>(f: (r: Row) => K) => rows.reduce<Record<string, number>>((a, r) => { const k = f(r); a[k] = (a[k] ?? 0) + 1; return a; }, {});
  const unknown = rows.filter((r) => r.readFrom === 'not read');
  const live = rows.filter((r) => r.status === 'LIVE');
  const bite = rows.filter((r) => r.renderedToChild === true && !r.accessibleTextExists && r.tokenCarriesNonSpeakingCharacters);
  const by2 = (rs: Row[], f: (r: Row) => string) => rs.reduce<Record<string, number>>((a, r) => { const k = f(r); a[k] = (a[k] ?? 0) + 1; return a; }, {});

  const payload = {
    kind: 'exempt-strings-accessible-text',
    RECROSS: 'RENAMED CROSSING. Carries the uncovered-set report Cowork refused for want of bytes, now in three buckets rather than two: paths that yielded rows, paths examined and found clean, and PATHS PRESENT IN THE CORPUS AND SCREENED BY NOTHING — the last added after Cowork found what the two-bucket split hid.',
    what: 'EVERY string in the corpus claiming a notation exemption — gap markers, option values, frames — with, per row, whether accessible text exists. Membership. No repair is proposed and none is implied.',
    theInstruction: 'David, on Annie\'s flag ruled open on channel: walk the full population and report per row whether any accessible text exists. Nobody rules a remedy until the population is known.',
    THE_DENOMINATORS: {
      itemsWalked: items.length,
      exemptStringsFound: rows.length,
      ofWhichLIVE: live.length,
      byClass: by((r) => r.class),
      byStatus: by((r) => r.status),
      THE_RECONCILIATION_AGAINST_349: {
        theInstructionsCLASSSIZES: { gapMarkers: 80, optionValues: 240, frames: 29, total: 349 },
        thisSTORESmeasurement: { gapMarkers: 34, optionValues: 195, frames: 60, total: 289 },
        AND_THEY_DO_NOT_RECONCILE: 'no scoping of this store produces 80/240/29. The three counts are STABLE at 34/195/60 across every reading tried: screened paths only or all paths, per-string or per-occurrence, all statuses or LIVE only. Distinct frame TOKENS are 37, not 29. The vr-06 bank holds 120 options in total, so 240 cannot be its option values. The figures are not a different slice of the same corpus.',
        WHERE_THE_240_CAME_FROM: 'her hundred-and-sixty-first ruling — "the bank\'s options[].value bears notation, so the 240 are exempt". It was recorded on this side at R739 as a citation of her ruling and WAS NEVER ASSERTED AGAINST THESE ROWS. That is the R180 shape: a number true where it was written, carried into a second store as a population size, and never checked against the data it now scopes. **Mine to carry, because I recorded it.**',
        THE_TWO_READINGS_AND_I_DO_NOT_PICK: [
          'the three figures are the REVIEWER\'S or COWORK\'S count over Cowork\'s corpus, which this store cannot see and cannot walk — in which case 349 is a real population and simply not this one;',
          'they are prose figures that drifted, in which case 289 is the population and the class sizes need restating.',
        ],
        soWhatThisFileIS: 'the complete membership of THIS store\'s exempted population, per row, walked and reported. If the 349 is Cowork\'s, this is its counterpart and the two should be compared row by row rather than by total. Naming which corpus a count is over is the thing that makes them comparable at all (R591).',
        why: 'the instruction named 349 and this walk finds a different number, so the predicate is stated and several counts given rather than the instrument tuned until it agrees (which is how a number gets confirmed instead of checked).',
        thisWalksPredicate: 'a STRING on a screened path where the exemption is LOAD-BEARING: it carries a capital run the shouted-capitals rule would otherwise fail, or an underscore marker that would otherwise be screened as text.',
        countsUnderOtherReadings: {
          exemptStringsLoadBearing: rows.length,
          exemptStringsLoadBearingLIVEonly: live.length,
          exemptRUNSnotStrings: rows.reduce((n, r) => n + r.exemptTokens.length, 0),
          everyStringWhereAnExemptionIsTRUEwhetherOrNotItBites: wideCount,
        },
        soThe349: 'is not reproduced by any of these. It may count a population this walk scopes differently — a district, a status, or runs on a different unit. The number to compare is whichever of the above shares its predicate; naming the predicate is what makes them comparable at all (R591, a count needs its unit and its predicate).',
      },
      andWhatWasScreenedOUT: 'every string on a screened path that claims NO exemption — the ordinary corpus. This file is the exempt population only, so its size is not a fault count and is not comparable to one (R591).',
    },
    THE_ANSWER_PER_CLASS: {
      accessibleTextEXISTS: by((r) => `${r.class}: ${r.accessibleTextExists ? 'EXISTS' : (r.readFrom === 'not read' ? 'UNKNOWN' : 'NONE')}`),
      byClassAndRender: by((r) => `${r.class} · ${r.renderedToChild === true ? 'rendered' : 'NOT rendered to a child'} · ${r.accessibleTextExists ? 'substitute EXISTS' : 'no substitute'}`),
      theShape: 'a GAP_MARKER in a rendered cloze carrier names itself ("gap N", R668) — 16 of 16 do. A FRAME never does — 0 of 60. The split is not by quality and not by district: it is by WHICH RENDERER THE PATH REACHES, and exactly one renderer in the corpus was ever built to name a marker.',
      andTheOPTIONVALUES: 'the 195 exempt option values carry no underscore at all — every one is ordinary capital letters. Their accessible text is the characters, because the characters are letters. Whether a capitalised option should be capitalised is a different question from this one and is not asked here.',
      theNOTRENDERED: '18 GAP_MARKER rows sit on quotes[].text, which no child surface renders — the sole reader is the admin review. A missing substitute on a string nothing shows a child is not the same fact as a missing substitute on one it does, and they are separated rather than summed.',
      andTheSHARPEST: `${bite.length} rows are RENDERED TO A CHILD, carry a token containing underscores, and have no substitute accessible text — ${bite.filter((r) => r.status === 'LIVE').length} of them LIVE. Every one is vr-06-missing-word: ${JSON.stringify(by2(bite, (r) => `${r.root}.${r.path}`))}. That is the membership her flag asked for, and it is the whole of it. It is not a ruling that they are wrong.`,
      theWHOLEPOPULATIONisONETYPE: 'the frames-without-accessible-text class does not span the corpus. It is one question type on two paths — the forty stem sentences already held, and twenty walk scripts on the same rows. Nothing in maths, NVR, comprehension or SpaG is in it.',
      UNKNOWN: unknown.length === 0 ? 'NONE — every (engine, path) in this population has a renderer that was read.' : `${unknown.length} rows on ${new Set(unknown.map((r) => `${r.engine}|${r.root}.${r.path}`)).size} (engine, path) pairs whose renderer has not been read. Reported UNKNOWN, never as "none exists".`,
      unknownPairs: [...new Set(unknown.map((r) => `${r.engine}|${r.root}.${r.path}`))],
    },
    theRenderMapDECLARED: Object.fromEntries(Object.entries(RENDER).map(([k, f]) => [k, f({ gapIndex: 2, word1: '<the word>', word2: '<the word>' }).read])),
    rows,
  };

  /**
   * **A COUNT IS NOT A MEMBERSHIP** (Cowork's ruling, carried). The other side cannot answer its
   * half from "289"; it needs the rows by id and field path, the derivation that selected them,
   * and WHICH FIELD PATHS WERE LOOKED AT — so it can report what it did NOT check instead of
   * implying it checked everything.
   */
  const manifest = rows.map((r) => `${r.itemId}\t${r.root}.${r.path}`);
  // R759: the value and its spec are produced together, so the two cannot drift apart.
  const manifestDigest = digestOverText('the POPULATION_MANIFEST lines joined by \\n, no trailing newline, each line "<itemId>\\t<root>.<path>"', manifest.join('\n'));

  // Every screened field path present in the corpus, split into looked-at-and-in / looked-at-and-out.
  const inPopulation = new Set(rows.map((r) => `${r.root}.${r.path}`.replace(/\[\d+\]/g, '[]')));
  const allScreened = new Map<string, number>();
  /**
   * **THE THIRD COVERAGE BUCKET, ADDED AFTER COWORK FOUND WHAT IT HID** (R763). The first version
   * split paths into yielded-rows and examined-and-clean, which reads as a complete account and is
   * not: a path can be present in the corpus and screened by NOTHING, because no disposition names
   * its shape. `options[].content.value` is declared; `options[].content.value[]` — the list shape
   * the vr-02 template authors — is not, so 200 child-facing strings were walked past in silence
   * and my coverage report named the scalar path as examined. **An unscreened path reported inside
   * "examined" is the uncovered set lying about its own size.**
   */
  const presentButUnscreened = new Map<string, number>();
  for (const item of items) {
    const w: Array<[string, string]> = [];
    for (const [p] of textsFrom(item.stem, '')) w.push(['stem', p]);
    for (const [p] of textsFrom(item.explanation, '')) w.push(['explanation', p]);
    item.options.forEach((o) => { for (const [p] of textsFrom(o.content, 'content')) w.push(['options[]', p]); });
    for (const [root, p] of w) {
      const k = `${root}.${p}`.replace(/\[\d+\]/g, '[]');
      if (!isScreenedPath(root, p)) {
        if (dispositionFor(root, p) == null) presentButUnscreened.set(k, (presentButUnscreened.get(k) ?? 0) + 1);
        continue;
      }
      allScreened.set(k, (allScreened.get(k) ?? 0) + 1);
    }
  }

  const coverage = {
    WHAT_THIS_WALK_LOOKED_AT: 'every string on every SCREENED field path of every item in the corpus. Not a sample, not a district, not a status filter.',
    fieldPathsExaminedTOTAL: allScreened.size,
    fieldPathsYIELDINGpopulationRows: [...inPopulation].sort(),
    fieldPathsEXAMINEDandFOUNDtoCarryNoExemption: [...allScreened.keys()].filter((k) => !inPopulation.has(k)).sort(),
    fieldPathsPRESENTinTheCorpusAndScreenedByNOTHING: Object.fromEntries([...presentButUnscreened].sort((a, b) => b[1] - a[1])),
    andWhatThatBucketMEANS: 'a string on one of these paths is walked by the gate and screened by no rule, because the disposition membership names no shape for it. It is NOT covered by this walk and NOT covered by the child-facing gate. It is the uncovered set proper, and it was invisible until Cowork named the vr-02 list shape.',
    whatThisDistinctionIsFOR: 'a path in the second list was CHECKED and found clean. A path in neither list was never reached by this walk and no claim is made about it. Cowork can now state its own uncovered set against the same names rather than against a total.',
    fieldPathsNOTexamined: 'paths whose disposition is STAFF, and every non-string column. Named as a class because they are excluded BY THE DISPOSITION MEMBERSHIP, not by this walk\'s judgement.',
  };

  const bound = {
    THE_BOUND_COWORK_NAMED: 'a field authored at the authoring end and DROPPED AT THIS DOOR is invisible to a walk of serving rows, because a walk can only see what arrived. That is correct, it is not hypothetical, and it was true of this very corpus until this turn.',
    whatWasFound: 'scripts/import-english-items.ts rebuilt every option from four named keys with no index signature, so anything else authored on an option was dropped in silence. Across the 19 files in that door\'s own input shape, 553 authored values on four keys would have been lost — misconceptionExecution 499 of them, WHICH IS A REAL COLUMN the schema describes as "the first thing a reviewer asks to see".',
    theOtherDoorDIDNOT: 'apps/web/lib/actions/admin-items.ts takes content as z.record(z.string(), z.unknown()) and passes everything. Two doors enumerating separately, drifted — R57 predicted exactly this and R42/R55 already recorded it; R57 was written about STEMS and never reached options.',
    fixedThisTurn: 'the door now carries an unknown key to its column when one exists (12 columns, read from Prisma\'s datamodel rather than hand-listed), carries it into content when it is retention ("_"-prefixed), and REFUSES THE IMPORT BY NAME otherwise. It no longer drops anything silently. Refusing rather than guessing a home is deliberate: inventing a placement convention is how a second wrong convention starts.',
    soTheHONESTSTATUS: 'this walk is a true and complete account of what is ON the serving rows. It is NOT evidence about what was authored, and for options it could not have been until this turn. Anything dropped before now left no trace here to find.',
  };

  const full = { ...payload, POPULATION_MANIFEST: manifest, manifestSha256: manifestDigest.value, manifestSha256Spec: manifestDigest.spec, THE_DERIVATION: DERIVATION, COVERAGE: coverage, THE_BOUND: bound };
  const artefact = { ...full, ...findingsDigest(full, ['THE_DENOMINATORS', 'THE_ANSWER_PER_CLASS', 'POPULATION_MANIFEST', 'THE_DERIVATION', 'COVERAGE', 'THE_BOUND', 'rows']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('exempt-strings-uncovered-set', createHash('sha256').update(json).digest('hex').slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), 'exempt-strings-uncovered-set');

  console.log(`items ${items.length}; exempt strings ${rows.length} (LIVE ${live.length})`);
  console.log(`  by class: ${JSON.stringify(by((r) => r.class))}`);
  console.log(`  accessible text: ${JSON.stringify(by((r) => r.accessibleTextExists ? 'EXISTS' : (r.readFrom === 'not read' ? 'UNKNOWN' : 'NONE')))}`);
  console.log(`  RENDERED, underscores, no substitute: ${bite.length} (LIVE ${bite.filter((r) => r.status === 'LIVE').length}) — ${JSON.stringify(by2(bite, (r) => `${r.root}.${r.path}`))}`);
  console.log(`  UNKNOWN (engine, path) pairs: ${[...new Set(unknown.map((r) => `${r.engine}|${r.root}.${r.path}`))].join(', ') || 'none'}`);
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
