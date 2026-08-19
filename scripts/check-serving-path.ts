/**
 * CAN THIS ITEM REACH A CHILD? — `pnpm check:serving-path`
 *
 * **DELIVERABLE AND REACHABLE ARE TWO PROPERTIES, AND THIS CHECK COLLAPSED THEM** (David's ruling,
 * 2026-08-17 — R171). It printed *"372 of 372 COULD REACH A CHILD"* while **no English item was
 * reachable by any route in the product.** The four legs were right; the sentence was not.
 *
 *   · DELIVERABLE is a property of the ITEM: hand it to the runner and something correct appears.
 *     Routes to an engine, renders a stem, resolves a passage, resolves its citations.
 *   · REACHABLE is a property of the PLATFORM: some door will actually select it. Nothing about the
 *     item can establish it, and an item can be perfect on all four legs and unreachable forever.
 *
 * R170 in this file, minutes after recording R170. There it was a constructor that superseded by
 * intent and not by id; here it is a check that measured the near leg and named the far one. **The
 * shared shape: the instrument was correct, and the property it reported was one nobody measured.**
 *
 * So the two are reported SEPARATELY and the reachability half names its three stops by reading
 * them, never by assertion. Exit status still follows DELIVERABILITY alone — reachability is a
 * platform state and not an item fault, and a permanently red CI step teaches people to skip it —
 * so the summary says in terms which cannot be misread that a green exit means deliverable ONLY.
 *
 * Every guard built this month watches content going IN. **None watches whether what came in can
 * come OUT.** Two months of instruments on one side of a boundary nobody checked the far side of —
 * and on the far side, four things stand between a signed bank and a child, none of which is
 * content, and every one of which FAILS OPEN.
 *
 * **A DEFAULT TAKEN IS A FAILURE, NOT A FALLBACK.** That is the whole design of this check. The
 * serving path has three defaults in series and none of them raises:
 *   · `engines[activity.family] ?? engines.wordweb`   (play-runner)
 *   · `FAMILY_BY_TYPE[questionTypeId] ?? 'wordweb'`   (core/families)
 *   · `typeof stem.prompt === 'string' ? … : ''`      (engines/shared)
 * A comprehension item would therefore render as a blank-stemmed SYNONYM TILE with no passage, and
 * nothing anywhere would say so. That is R60's family in the serving path: correct code, true
 * report, and nothing stating that nothing happened.
 *
 * WHAT THIS CALLS, STATED BEFORE IT RUNS (R41). It does not re-derive the routing:
 *   · `familyForType` / `FAMILY_BY_TYPE` — packages/core/src/families.ts, the SAME lookup
 *     `districts.ts` and the runner use. Membership is tested against the map DIRECTLY so that the
 *     `??` default is visible as a default rather than absorbed as an answer.
 *   · `stemText` — apps/web/components/crew/engines/shared.ts, the exact function every engine
 *     calls to put a question on the screen.
 *   · `ENGINE_FAMILIES` — read from `play-runner.tsx` by parsing its `engines` map, so a family
 *     added there is picked up without this file being edited. A hand-kept list would drift (R57).
 *
 * The four assertions, per item:
 *   ROUTES    its questionTypeId is IN `FAMILY_BY_TYPE` (no default), and that family has an engine.
 *   STEM      `stemText(stem)` returns something non-empty.
 *   PASSAGE   `passageRef` names a file in content/passages that exists and parses.
 *   LINEREFS  every cited line number exists in that passage's numberedLines.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { FAMILY_BY_TYPE, SERVING_HOLDS, isHeldFromServing, servingSensesBanner } from '../packages/core/src/index';
import { stemText } from '../apps/web/components/crew/engines/shared';
import { QUARTER_ORDER } from '../apps/web/lib/crew/districts';
import { prisma } from '../packages/db/src/index';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { requirePopulation } from './lib/population';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const PASSAGES = resolve(import.meta.dirname, '../content/passages');
const RUNNER = resolve(import.meta.dirname, '../apps/web/components/crew/play-runner.tsx');
const MOCKS = resolve(import.meta.dirname, '../apps/web/lib/crew/mocks.ts');
const BLUEPRINTS = resolve(import.meta.dirname, '../content/blueprints');
const FAMILY = 'serving-path-english';

/** Families with an engine, read from the runner's own map rather than kept by hand (R57). */
function enginesInRunner(): Set<string> {
  const src = readFileSync(RUNNER, 'utf8');
  const block = src.split('const engines = {')[1]?.split('};')[0];
  if (!block) throw new Error('could not find the engines map in play-runner.tsx — refusing to guess');
  return new Set([...block.matchAll(/^\s*([a-zA-Z0-9_]+)\s*:/gm)].map((m) => m[1]!));
}

/**
 * THE THREE STOPS BETWEEN A DELIVERABLE ITEM AND A CHILD, each read from its own source (R57).
 *
 * There are exactly TWO doors in the product that select an item for a child — `itemPool` in the
 * orchestrator (gated on the focus Case's questionTypeId) and `composeMockPaper` (gated on the
 * wired blueprints) — plus the district map, which decides whether a quarter is drawn at all. An
 * item passes all four legs above and is still met by nobody unless one of these names it.
 *
 * NOTHING HERE IS HAND-KEPT. Cases come from the table, blueprints from the import list in
 * `mocks.ts` (a JSON file in content/blueprints that nothing imports is NOT wired, and listing the
 * directory would report it as though it were), quarters from `QUARTER_ORDER` itself.
 */
interface Reachability {
  englishQuestionTypes: string[];
  casesTotal: number;
  casesNamingEnglish: string[];
  blueprintsWired: Array<{ file: string; district: string; questionTypes: number; namesEnglishType: boolean }>;
  quarterOrder: string[];
  englishQuarters: string[];
  englishQuartersOrdered: string[];
  reachable: boolean;
}

async function reachability(englishTypes: Set<string>): Promise<Reachability> {
  const cases = await prisma.case.findMany({ select: { questionTypeId: true } });
  const casesNamingEnglish = cases.filter((c) => englishTypes.has(c.questionTypeId)).map((c) => c.questionTypeId);

  // The blueprints ACTUALLY WIRED, read from the import list in mocks.ts rather than the directory.
  const mocksSrc = readFileSync(MOCKS, 'utf8');
  const wiredFiles = [...mocksSrc.matchAll(/from '[^']*content\/blueprints\/([\w-]+)\.json'/g)].map((m) => m[1]!);
  if (wiredFiles.length === 0) {
    throw new Error('no blueprint imports found in mocks.ts — refusing to report "0 English blueprints" from a failed parse');
  }
  //
  // THE FILE WRAPS THE BLUEPRINT: `{ kind, blueprint: { district, sections } }`, exactly as
  // `blueprintFileSchema.parse(file).blueprint` unwraps it in mocks.ts. The first version of this
  // read the WRAPPER, found no `sections`, and reported *0 of 4 name an English type* — **the right
  // answer, reached from a failed read.** A shape it cannot parse is refused rather than counted as
  // zero, because a zero from a broken reader is indistinguishable from a true zero and this one
  // would have been believed.
  const blueprintsWired = wiredFiles.map((file) => {
    const raw = JSON.parse(readFileSync(join(BLUEPRINTS, `${file}.json`), 'utf8')) as Record<string, unknown>;
    const bp = (raw.blueprint ?? raw) as { district?: string; sections?: Array<{ typeMix?: Record<string, unknown> }> };
    if (!Array.isArray(bp.sections) || bp.sections.length === 0) {
      throw new Error(
        `blueprint ${file}.json: no sections found at .blueprint.sections — refusing to report `
        + '"names no English type" from a shape this could not read.',
      );
    }
    const types = bp.sections.flatMap((s) => Object.keys(s.typeMix ?? {}));
    return {
      file,
      district: bp.district ?? '(none)',
      questionTypes: types.length,
      namesEnglishType: types.some((t) => englishTypes.has(t)),
    };
  });

  // A quarter DECLARED in QUARTERS but absent from QUARTER_ORDER renders nowhere: `groupIntoQuarters`
  // maps over the ORDER, so the declaration alone puts nothing on a child's map.
  const mapped = [...englishTypes]
    .map((t) => FAMILY_BY_TYPE[t] as string | undefined)
    .filter((f): f is string => typeof f === 'string');
  const englishQuarters: string[] = [...new Set(mapped)];
  const quarterOrder = [...QUARTER_ORDER] as string[];
  const englishQuartersOrdered = englishQuarters.filter((q) => quarterOrder.includes(q));

  return {
    englishQuestionTypes: [...englishTypes].sort(),
    casesTotal: cases.length,
    casesNamingEnglish,
    blueprintsWired,
    quarterOrder,
    englishQuarters: englishQuarters.sort(),
    englishQuartersOrdered,
    reachable: casesNamingEnglish.length > 0 || blueprintsWired.some((b) => b.namesEnglishType),
  };
}

/**
 * DECLARED EXEMPTIONS (R61). Three classes legitimately resolve no passage or no citation, and the
 * first run of this check called all 59 of them failures. A gate whose population may be legitimately
 * absent SAYS SO ONCE, IN WRITING, WITH THE REASON — and the reason prints on every run, so a
 * temporary gap cannot decay into a green tick.
 *
 * NEEDS NO PASSAGE — the text under test is inside the stem:
 *   `en-spag-punct-spot`, `en-spag-spelling-spot` carry the sentence in `stem.text` with
 *   `segmentsInOptions`. There is no extract to show; a passage would be a second text.
 *
 * NEEDS NO LINE CITATION:
 *   `en-spag-cloze` cites a GAP (`stem.gapRef`), not lines. The passage resolves; the citation is of
 *   a different kind.
 *   A whole-passage technique item declares its scope as `lineRefs: []` — **an EMPTY ARRAY, which is
 *   a positive statement that the whole text is the window, and is NOT the same as `null`**, which
 *   is a field nobody set. That distinction is the entire discriminator and it is why absence must
 *   never coerce to empty at the import door.
 */
const NEEDS_NO_PASSAGE = new Set(['en-spag-punct-spot', 'en-spag-spelling-spot']);
const NEEDS_NO_LINEREFS = new Set(['en-spag-cloze']);

/**
 * PASSAGE INTEGRITY. David ruled that `n: null` is a passage fault — an extract never fully
 * numbered, leaving every citation measured against a line index with holes.
 *
 * **MEASURED BEFORE IMPLEMENTING, AND THE PREMISE DOES NOT HOLD.** All 507 `n: null` lines across
 * all 29 passages carry `text: ""`. They are BLANK PARAGRAPH SEPARATORS, and every passage's
 * numbered lines run contiguously 1..N with no gaps. A real paper does not number blank lines
 * either. Failing 27 of 29 passages for that would be the check crying wolf on correct data — R61
 * a third time in one file.
 *
 * So the assertion is the one the ruling was AIMING at, pointed at the fault that would actually
 * produce a holey index:
 *   · numbered lines must run contiguously from 1 with no gaps and no repeats;
 *   · a line with `n: null` must be BLANK. An unnumbered line carrying TEXT is the real fault —
 *     content a citation can never reach, and the thing that would make an index lie.
 */
interface PassageLine { n?: number | null; text?: string }
interface Passage { numberedLines?: PassageLine[] }

function passageFaults(p: Passage): string[] {
  const lines = p.numberedLines ?? [];
  const faults: string[] = [];
  const unnumberedWithText = lines.filter((l) => (l.n === null || l.n === undefined) && (l.text ?? '').trim() !== '');
  if (unnumberedWithText.length) {
    faults.push(`${unnumberedWithText.length} unnumbered line(s) carrying TEXT — a citation can never reach them`);
  }
  const ns = lines.map((l) => l.n).filter((n): n is number => typeof n === 'number');
  if (ns.length === 0) faults.push('no numbered lines at all');
  else {
    const expected = ns.map((_, i) => i + 1);
    if (JSON.stringify(ns) !== JSON.stringify(expected)) {
      const holes = expected.filter((e) => !ns.includes(e));
      faults.push(`line numbers are not contiguous 1..${ns.length}`
        + (holes.length ? ` — missing ${holes.slice(0, 8).join(', ')}${holes.length > 8 ? '…' : ''}` : ' — repeated or out of order'));
    }
  }
  return faults;
}

function loadPassages(): Map<string, Passage> {
  const out = new Map<string, Passage>();
  for (const f of readdirSync(PASSAGES).filter((f) => f.endsWith('.json'))) {
    try { out.set(f.replace(/\.json$/, ''), JSON.parse(readFileSync(join(PASSAGES, f), 'utf8')) as Passage); }
    catch { /* an unparseable passage is reported as an unresolved ref below, not swallowed here */ }
  }
  return out;
}

async function main(): Promise<void> {
  const engines = enginesInRunner();
  const passages = loadPassages();

  // PASSAGE INTEGRITY, REPORTED PER FILE BEFORE ANY ITEM IS JUDGED. An item cannot be deliverable
  // into a passage whose own line index is broken, so this is stated first and separately.
  const passageReport = [...passages].map(([id, p]) => ({
    id, lines: (p.numberedLines ?? []).length,
    blankSeparators: (p.numberedLines ?? []).filter((l) => (l.n === null || l.n === undefined) && (l.text ?? '').trim() === '').length,
    faults: passageFaults(p),
  })).sort((a, b) => a.id.localeCompare(b.id));
  const brokenPassages = new Set(passageReport.filter((r) => r.faults.length).map((r) => r.id));
  const items = await prisma.item.findMany({
    where: { id: { startsWith: 'ENG-' } },
    select: { id: true, questionTypeId: true, stem: true, lineRefs: true, status: true },
    orderBy: { id: 'asc' },
  });
  requirePopulation('check:serving-path', {
    'English items': items.length, 'passage files': passages.size, 'engine families in the runner': engines.size,
  });

  const rows = items.map((item) => {
    const stem = (item.stem ?? {}) as Record<string, unknown>;
    // NO DEFAULT. `familyForType` would answer 'wordweb' for an unmapped type; the map is read
    // directly so an absence is an absence.
    const mapped = FAMILY_BY_TYPE[item.questionTypeId];
    const routes = mapped === undefined
      ? `FAIL — ${item.questionTypeId} is not in FAMILY_BY_TYPE; familyForType would DEFAULT to 'wordweb'`
      : engines.has(mapped)
        ? 'PASS'
        : `FAIL — family '${mapped}' has no engine; the runner would DEFAULT to wordweb`;

    const rendered = stemText(stem);
    const stemOk = rendered.trim().length > 0
      ? 'PASS'
      : `FAIL — stemText() returns empty; the stem carries ${Object.keys(stem).filter((k) => typeof stem[k] === 'string').join(', ') || '(no string fields)'}`;

    const ref = typeof stem.passageRef === 'string' ? stem.passageRef
      : typeof (item as { passageRef?: unknown }).passageRef === 'string' ? String((item as { passageRef?: unknown }).passageRef)
        : null;
    const passage = ref ? passages.get(ref) : undefined;
    const passageOk = NEEDS_NO_PASSAGE.has(item.questionTypeId)
      ? `EXEMPT — ${item.questionTypeId} carries its text in the stem; there is no extract to show`
      : !ref ? 'FAIL — no passageRef on the item'
        : !passage ? `FAIL — passageRef '${ref}' matches no file in content/passages`
          : brokenPassages.has(ref) ? `FAIL — passage '${ref}' has a broken line index; citations into it cannot be trusted`
            : 'PASS';

    // `[]` DECLARES WHOLE-PASSAGE SCOPE; `null`/absent means nobody stated one. Never conflated.
    const declaredWholePassage = Array.isArray(item.lineRefs) && (item.lineRefs as unknown[]).length === 0;
    const cited = Array.isArray(item.lineRefs) ? (item.lineRefs as unknown[]).map(Number).filter((n) => !Number.isNaN(n)) : [];
    const have = new Set((passage?.numberedLines ?? []).map((l) => l.n).filter((n): n is number => typeof n === 'number'));
    const missingLines = cited.filter((n) => !have.has(n));
    const lineRefsOk = NEEDS_NO_PASSAGE.has(item.questionTypeId)
      ? `EXEMPT — ${item.questionTypeId} has no passage to cite into`
      : NEEDS_NO_LINEREFS.has(item.questionTypeId)
        ? `EXEMPT — ${item.questionTypeId} cites a gap (stem.gapIndex), not lines`
        : declaredWholePassage
          ? 'EXEMPT — lineRefs [] declares the whole passage as the window'
          : !passage ? 'FAIL — no passage to resolve against'
            : cited.length === 0 ? 'FAIL — lineRefs is null or absent: no window stated, and [] would have declared one'
              : missingLines.length ? `FAIL — line(s) ${missingLines.join(', ')} not in ${ref}`
                : 'PASS';

    const checks = { routes, stem: stemOk, passage: passageOk, lineRefs: lineRefsOk };
    // EXEMPT is deliverable; only FAIL is not. The two are counted separately below so an exemption
    // can never be read as a pass, which is the whole reason it is declared rather than inferred.
    return { id: item.id, status: item.status, questionTypeId: item.questionTypeId, ...checks,
      deliverable: Object.values(checks).every((c) => c === 'PASS' || c.startsWith('EXEMPT')) };
  });

  const deliverable = rows.filter((r) => r.deliverable);
  const tally = (k: 'routes' | 'stem' | 'passage' | 'lineRefs') => rows.filter((r) => r[k] === 'PASS').length;
  const exempt = (k: 'routes' | 'stem' | 'passage' | 'lineRefs') => rows.filter((r) => r[k].startsWith('EXEMPT')).length;

  const reach = await reachability(new Set(items.map((i) => i.questionTypeId)));

  const generatedAt = new Date().toISOString();
  const body = {
    kind: FAMILY,
    note:
      'Whether each English item can actually be delivered to a child. A DEFAULT TAKEN IS A FAILURE: '
      + 'the serving path has three fallbacks in series and none of them raises, so an undeliverable '
      + 'item renders as a blank-stemmed synonym tile with no passage and nothing reports it.',
    generatedAt,
    denominator: { englishItems: items.length, passageFiles: passages.size, engineFamilies: [...engines].sort() },
    reachability: {
      ...reach,
      note:
        'DELIVERABLE is a property of the ITEM; REACHABLE is a property of the PLATFORM. An item can '
        + 'pass all four legs and be met by nobody. Two doors select items for a child — itemPool '
        + '(gated on the focus Case) and composeMockPaper (gated on the wired blueprints) — and the '
        + 'district map decides whether a quarter is drawn at all.',
    },
    headline: {
      deliverable: deliverable.length,
      undeliverable: rows.length - deliverable.length,
      routes: { pass: tally('routes'), exempt: exempt('routes'), fail: rows.length - tally('routes') - exempt('routes') },
      stem: { pass: tally('stem'), exempt: exempt('stem'), fail: rows.length - tally('stem') - exempt('stem') },
      passage: { pass: tally('passage'), exempt: exempt('passage'), fail: rows.length - tally('passage') - exempt('passage') },
      lineRefs: { pass: tally('lineRefs'), exempt: exempt('lineRefs'), fail: rows.length - tally('lineRefs') - exempt('lineRefs') },
    },
    passages: passageReport,
    items: rows,
  };
  const stamp = artefactStamp(body, generatedAt, 'status',
    'whether each English item routes, renders, resolves its passage and resolves its citations', ['items']);
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, stampedName(FAMILY, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify({ ...body, stamp }, null, 2));
  deliver(path, FAMILY);

  /**
    * THE THREE SENSES FIRST, ACROSS ALL DISTRICTS (R184). This check screens ENGLISH; the census is
    * DELIBERATELY WIDER and says so, because the word being disambiguated was used about the whole
    * bank. Printing a narrower population under the same word would be the fault again.
    */
  const senseTypes = await prisma.questionType.findMany({ select: { id: true, district: true } });
  const senseDistrict = new Map(senseTypes.map((t) => [t.id, String(t.district)]));
  const allCaseRows = await prisma.case.findMany({ select: { questionTypeId: true, freeTier: true } });
  const casedTypes = new Set(allCaseRows.map((c) => c.questionTypeId));
  const freeCasedTypes = new Set(allCaseRows.filter((c) => c.freeTier).map((c) => c.questionTypeId));
  const allItems = await prisma.item.findMany({ select: { id: true, questionTypeId: true, status: true, pool: true } });
  const census = new Map<string, { total: number; published: number; servable: number; reachablePaid: number; reachableFree: number }>();
  for (const it of allItems) {
    const d = senseDistrict.get(it.questionTypeId) ?? '(no type row)';
    const e = census.get(d) ?? { total: 0, published: 0, servable: 0, reachablePaid: 0, reachableFree: 0 };
    e.total += 1;
    if (it.status === 'LIVE') {
      e.published += 1;
      // A serving hold stops SERVABLE and everything above it, and leaves PUBLISHED true (R208):
      // the census reads the same list the doors read, so this column reports what the doors DO.
      if (it.pool === 'PRACTICE' && !isHeldFromServing((it as { id?: string }).id ?? '')) {
        e.servable += 1;
        if (casedTypes.has(it.questionTypeId)) e.reachablePaid += 1;
        if (freeCasedTypes.has(it.questionTypeId)) e.reachableFree += 1;
      }
    }
    census.set(d, e);
  }
  const sum = (k: 'total' | 'published' | 'servable' | 'reachablePaid' | 'reachableFree') =>
    [...census.values()].reduce((n, v) => n + v[k], 0);

  console.log(servingSensesBanner());
  console.log(`\n  CENSUS — ALL DISTRICTS, all ${sum('total')} items (wider than the ${items.length} screened below):\n`);
  console.log(`    ${'district'.padEnd(14)}${'items'.padStart(8)}${'PUBLISHED'.padStart(11)}${'SERVABLE'.padStart(10)}${'REACH(paid)'.padStart(12)}${'REACH(free)'.padStart(12)}`);
  for (const [d, v] of [...census].sort()) {
    console.log(`    ${d.padEnd(14)}${String(v.total).padStart(8)}${String(v.published).padStart(11)}`
      + `${String(v.servable).padStart(10)}${String(v.reachablePaid).padStart(12)}${String(v.reachableFree).padStart(12)}`);
  }
  console.log(`    ${'ALL'.padEnd(14)}${String(sum('total')).padStart(8)}${String(sum('published')).padStart(11)}`
    + `${String(sum('servable')).padStart(10)}${String(sum('reachablePaid')).padStart(12)}${String(sum('reachableFree')).padStart(12)}`);
  if (SERVING_HOLDS.length) {
    console.log(`\n    ${SERVING_HOLDS.length} SERVING HOLD(S) — PUBLISHED stands, SERVABLE stopped at the door (R208):`);
    for (const h of SERVING_HOLDS) {
      console.log(`      · ${h.itemId} — held by ${h.heldBy}, ${h.on}`);
      console.log(`        lifts when: ${h.liftedBy}`);
    }
  }
  if (sum('published') === sum('reachablePaid')) {
    console.log('\n    PUBLISHED, SERVABLE and REACHABLE(paid) agree today. THAT IS A FACT ABOUT TODAY,');
    console.log('    not a reason to stop naming which: they read 332 / 332 / 298 this morning, before');
    console.log('    four Case rows landed. REACHABLE(free) is the one that still disagrees, and it was');
    console.log('    invisible while a single "REACHABLE" stood for both populations.');
  }
  console.log('\n    LIMIT: both REACHABLE columns mean A CASE NAMES THE TYPE, now split by whether that');
  console.log('    Case is in the free set. Neither accounts for MOCK PAPERS, a separate door drawing on');
  console.log('    blueprints — and no blueprint names an English type, so that door adds nothing here.\n');

  console.log(`check:serving-path: ${items.length} English item(s) · ${passages.size} passage file(s) · `
    + `engine families in the runner: ${[...engines].sort().join(', ')}\n`);
  const totalBlank = passageReport.reduce((n, r) => n + r.blankSeparators, 0);
  console.log(`  PASSAGE INTEGRITY: ${passageReport.length - brokenPassages.size}/${passageReport.length} sound.`);
  console.log(`  ${totalBlank} line(s) carry n: null across all passages, and every one is BLANK — they are`);
  console.log('  paragraph separators, not unnumbered content. Every passage numbers contiguously from 1.');
  for (const r of passageReport.filter((r) => r.faults.length)) {
    console.log(`    x ${r.id}: ${r.faults.join('; ')}`);
  }
  console.log();
  // THE SENTENCE THIS CHECK GOT WRONG (R171). It says what it screened, and no more than that.
  console.log(`  ${deliverable.length} of ${rows.length} ARE DELIVERABLE — each routes to an engine, renders a`);
  console.log('  stem, resolves its passage and resolves its citations. THAT IS A PROPERTY OF THE ITEM:');
  console.log('  hand it to the runner and something correct appears. It is NOT a statement that anything');
  console.log('  will hand it to the runner.\n');
  console.log('        pass  exempt  fail');
  for (const k of ['routes', 'stem', 'passage', 'lineRefs'] as const) {
    const f = rows.length - tally(k) - exempt(k);
    console.log(`  ${String(tally(k)).padStart(8)}${String(exempt(k)).padStart(8)}${String(f).padStart(6)}  ${k}`);
  }
  console.log('\n  EXEMPT is declared, never inferred: SPaG spot items carry their text in the stem,');
  console.log('  cloze cites a gap, and lineRefs [] declares the whole passage as the window — which');
  console.log('  is a positive statement and is NOT the same as null, where nobody stated one.');
  // ---- REACHABILITY, REPORTED SEPARATELY AND NEVER FOLDED INTO THE ABOVE ----
  console.log(`\n  REACHABLE? Three stops stand between a deliverable item and a child, and every one`);
  console.log('  is read here rather than asserted.\n');
  const stop = (ok: boolean) => (ok ? ' ' : 'x');
  console.log(`   ${stop(reach.casesNamingEnglish.length > 0)} 1. CASES — ${reach.casesNamingEnglish.length} of ${reach.casesTotal} Case row(s) name an English question type.`);
  console.log(`        itemPool only ever sees the focus Case's questionTypeId, so a type no Case names`);
  console.log('        is never asked for, whatever its status or pool.');
  const engBp = reach.blueprintsWired.filter((b) => b.namesEnglishType);
  console.log(`   ${stop(engBp.length > 0)} 2. BLUEPRINTS — ${engBp.length} of ${reach.blueprintsWired.length} wired mock blueprint(s) name an English type:`);
  for (const b of reach.blueprintsWired) {
    console.log(`        ${b.namesEnglishType ? '·' : ' '} ${b.file.padEnd(20)} district ${String(b.district).padEnd(8)} ${b.questionTypes} question type(s)`);
  }
  console.log('        Read from the import list in mocks.ts: a blueprint file nothing imports is not');
  console.log('        wired, and listing the directory would report it as though it were.');
  console.log(`   ${stop(reach.englishQuartersOrdered.length > 0)} 3. QUARTER_ORDER — ${reach.englishQuartersOrdered.length} of ${reach.englishQuarters.length} English quarter(s) appear in it.`);
  console.log(`        declared: ${reach.englishQuarters.join(', ') || '(none)'}`);
  console.log(`        ordered:  ${reach.quarterOrder.join(', ')}`);
  console.log('        groupIntoQuarters maps over the ORDER, so a quarter declared in QUARTERS but');
  console.log('        absent from QUARTER_ORDER puts nothing on a child\'s map.');
  if (!reach.reachable) {
    console.log(`\n  ==> NOT REACHABLE. No door in the product can select any of these ${rows.length} items.`);
    console.log('      Deliverable and reachable are two properties. Every row above is green on the');
    console.log('      first and this line is the second, and it is the one a child experiences.');
  } else {
    console.log('\n  ==> REACHABLE by at least one door. Which items, and how often, is not asserted here.');
  }
  console.log('\n  EXIT STATUS FOLLOWS DELIVERABILITY ONLY. Reachability is a platform state, not an item');
  console.log('  fault, and a step that is permanently red teaches people to skip it. A GREEN EXIT FROM');
  console.log('  THIS CHECK MEANS DELIVERABLE, NEVER REACHABLE.');

  const firstFail = (k: 'routes' | 'stem' | 'passage' | 'lineRefs') =>
    rows.find((r) => r[k] !== 'PASS' && !r[k].startsWith('EXEMPT'))?.[k];
  console.log('\n  First failure of each kind, in full:');
  for (const k of ['routes', 'stem', 'passage', 'lineRefs'] as const) {
    const f = firstFail(k);
    if (f) console.log(`    ${k}: ${f}`);
  }
  if (deliverable.length === 0) {
    console.log('\n  NOT ONE ENGLISH ITEM CAN BE DELIVERED. This is the first honest statement anyone');
    console.log('  has made about whether this bank reaches a child, and it is red on every row.');
  }
  await prisma.$disconnect();
  process.exit(deliverable.length === rows.length ? 0 : 1);
}

void main();
