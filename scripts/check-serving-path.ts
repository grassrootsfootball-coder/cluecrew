/**
 * CAN THIS ITEM REACH A CHILD? — `pnpm check:serving-path`
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
import { FAMILY_BY_TYPE } from '../packages/core/src/index';
import { stemText } from '../apps/web/components/crew/engines/shared';
import { prisma } from '../packages/db/src/index';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { requirePopulation } from './lib/population';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const PASSAGES = resolve(import.meta.dirname, '../content/passages');
const RUNNER = resolve(import.meta.dirname, '../apps/web/components/crew/play-runner.tsx');
const FAMILY = 'serving-path-english';

/** Families with an engine, read from the runner's own map rather than kept by hand (R57). */
function enginesInRunner(): Set<string> {
  const src = readFileSync(RUNNER, 'utf8');
  const block = src.split('const engines = {')[1]?.split('};')[0];
  if (!block) throw new Error('could not find the engines map in play-runner.tsx — refusing to guess');
  return new Set([...block.matchAll(/^\s*([a-zA-Z0-9_]+)\s*:/gm)].map((m) => m[1]!));
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

interface Passage { numberedLines?: Array<{ n?: number | null }> }

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
          : 'PASS';

    // `[]` DECLARES WHOLE-PASSAGE SCOPE; `null`/absent means nobody stated one. Never conflated.
    const declaredWholePassage = Array.isArray(item.lineRefs) && (item.lineRefs as unknown[]).length === 0;
    const cited = Array.isArray(item.lineRefs) ? (item.lineRefs as unknown[]).map(Number).filter((n) => !Number.isNaN(n)) : [];
    const have = new Set((passage?.numberedLines ?? []).map((l) => l.n).filter((n): n is number => typeof n === 'number'));
    const missingLines = cited.filter((n) => !have.has(n));
    const lineRefsOk = NEEDS_NO_PASSAGE.has(item.questionTypeId)
      ? `EXEMPT — ${item.questionTypeId} has no passage to cite into`
      : NEEDS_NO_LINEREFS.has(item.questionTypeId)
        ? `EXEMPT — ${item.questionTypeId} cites a gap (stem.gapRef), not lines`
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

  const generatedAt = new Date().toISOString();
  const body = {
    kind: FAMILY,
    note:
      'Whether each English item can actually be delivered to a child. A DEFAULT TAKEN IS A FAILURE: '
      + 'the serving path has three fallbacks in series and none of them raises, so an undeliverable '
      + 'item renders as a blank-stemmed synonym tile with no passage and nothing reports it.',
    generatedAt,
    denominator: { englishItems: items.length, passageFiles: passages.size, engineFamilies: [...engines].sort() },
    headline: {
      deliverable: deliverable.length,
      undeliverable: rows.length - deliverable.length,
      routes: { pass: tally('routes'), exempt: exempt('routes'), fail: rows.length - tally('routes') - exempt('routes') },
      stem: { pass: tally('stem'), exempt: exempt('stem'), fail: rows.length - tally('stem') - exempt('stem') },
      passage: { pass: tally('passage'), exempt: exempt('passage'), fail: rows.length - tally('passage') - exempt('passage') },
      lineRefs: { pass: tally('lineRefs'), exempt: exempt('lineRefs'), fail: rows.length - tally('lineRefs') - exempt('lineRefs') },
    },
    items: rows,
  };
  const stamp = artefactStamp(body, generatedAt, 'status',
    'whether each English item routes, renders, resolves its passage and resolves its citations', ['items']);
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, stampedName(FAMILY, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify({ ...body, stamp }, null, 2));
  deliver(path, FAMILY);

  console.log(`check:serving-path: ${items.length} English item(s) · ${passages.size} passage file(s) · `
    + `engine families in the runner: ${[...engines].sort().join(', ')}\n`);
  console.log(`  ${deliverable.length} of ${rows.length} COULD REACH A CHILD.\n`);
  console.log('        pass  exempt  fail');
  for (const k of ['routes', 'stem', 'passage', 'lineRefs'] as const) {
    const f = rows.length - tally(k) - exempt(k);
    console.log(`  ${String(tally(k)).padStart(8)}${String(exempt(k)).padStart(8)}${String(f).padStart(6)}  ${k}`);
  }
  console.log('\n  EXEMPT is declared, never inferred: SPaG spot items carry their text in the stem,');
  console.log('  cloze cites a gap, and lineRefs [] declares the whole passage as the window — which');
  console.log('  is a positive statement and is NOT the same as null, where nobody stated one.');
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
