/**
 * CAN AUTHORED walkScript TEXT REACH A CHILD'S SCREEN? — measured, not asserted from memory.
 *
 * **ANNIE'S RULING (2026-08-19): walkScript IS CHILD-FACING UNTIL MEASURED.** Any string that can
 * reach a child's screen is child-facing regardless of which field holds it, and the safe default
 * for unknown reachability is reachable. She asked for the measurement BEFORE the pin's scope is
 * set rather than after, so this is that measurement — and it is a CHECK rather than a report,
 * because a grep result is true on the day and silent afterwards (R180). The finding rots; the
 * mechanism does not.
 *
 * **WHY A CLOSURE AND NOT A GREP.** The claim is not "no file called walkScript" — it is "no file
 * that can reach a child's browser reads it". Those differ: 704 items carry the field and a dozen
 * scripts read it, all of them staff-side. So the file set is DERIVED by following imports from
 * the child's entry points (R57 — never a hand-kept list), and a new module joins the closure on
 * the commit that imports it.
 *
 * **THE POSITIVE CONTROL IS THE SAME TOKEN IN A DIFFERENT CLOSURE** (R60 question 2). A scan that
 * reports "walkScript is not in the child closure" is indistinguishable from a scan that cannot
 * see the token at all. So the ADMIN closure is walked with the identical matcher, where the field
 * IS read and rendered — if that side ever comes back empty the scanner has gone blind and this
 * check FAILS rather than reporting a clean child surface.
 */
import { readdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { WALK_APPROVED_ITEM_IDS } from '../packages/core/src/index';
import { importClosure } from './lib/import-closure';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const REPO = resolve(import.meta.dirname, '..');
const WEB = join(REPO, 'apps/web');
/**
 * `@/` is the app's own alias for apps/web (tsconfig paths), NOT an external package — treating it
 * as one is what made the first run of this check miss the orchestrator and the play runner
 * entirely. It reported four walkScript readers "on the child's path" from a closure that did not
 * contain the serving code at all: R173's failed read, caught only because MUST_CONTAIN names two
 * files the closure cannot legitimately lack.
 *
 * The workspace packages are followed too, since their source is in a child's bundle — but hits
 * inside them are reported SEPARATELY, because a gate function that reads walkScript in order to
 * CHECK it at write time is not a path that renders it to a child, and counting the two together
 * would make this check report a fault on its own guard rails.
 */
const PACKAGE_ROOTS = {
  '@/': join(REPO, 'apps/web'),
  '@cluecrew/core': join(REPO, 'packages/core/src'),
  '@cluecrew/db': join(REPO, 'packages/db/src'),
  '@cluecrew/ui': join(REPO, 'packages/ui/src'),
};

function entriesUnder(dir: string, match: RegExp): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const name of readdirSync(d)) {
      const full = join(d, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (match.test(name)) out.push(full);
    }
  };
  walk(dir);
  return out;
}

/**
 * THE CHILD'S ENTRY POINTS, SCANNED. Everything a signed-in child's browser can cause to run:
 * the crew route group (the play surface) and the story API it calls. Not the debug pages — those
 * are staff surfaces behind their own route — and not admin, which is the control below.
 */
const CHILD_ROOTS = [
  ...entriesUnder(join(WEB, 'app/crew'), /^(page|layout|template)\.tsx?$/),
  ...entriesUnder(join(WEB, 'app/api/story'), /^route\.ts$/),
  // `app/api/crew` was MISSING from these roots until 2026-08-19 — the child's own API, absent
  // from the closure called "the child's entry points". It went unnoticed because nothing in it
  // read walkScript; the Walk door was the first thing that did, and it reported as "declared but
  // not in the closure" rather than as a leak. A root list is an enumeration, and enumerations
  // drift (R42/R57) — this one did.
  ...entriesUnder(join(WEB, 'app/api/crew'), /^route\.ts$/),
];
const ADMIN_ROOTS = entriesUnder(join(WEB, 'app/admin'), /^(page|layout)\.tsx?$/);

/**
 * A COMMENT IS NOT A READER. Writing the note that explains this very check into `play-runner.tsx`
 * made the file "read the explanation blob" — prose about code counted as code. The same class as
 * the mode kinds cleared by collisions with ordinary English: a whole-word matcher cannot tell a
 * sentence from a statement, so the sentences are removed before matching.
 */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

function readersOf(token: string, files: string[]): { file: string; line: number; text: string }[] {
  const hits: { file: string; line: number; text: string }[] = [];
  for (const file of files) {
    const lines = stripComments(readFileSync(file, 'utf8')).split('\n');
    lines.forEach((text, i) => {
      if (text.includes(token)) hits.push({ file: relative(REPO, file), line: i + 1, text: text.trim() });
    });
  }
  return hits;
}

/**
 * KNOWN READERS OF THE BLOB THAT CARRIES walkScript. `explanation` is a JSON column, so a payload
 * that carries it carries every authored field inside it whether or not anything renders them.
 * Each reader inside the child closure is declared here with what it takes; a new one fails.
 */
const DECLARED_EXPLANATION_READERS: Record<string, string> = {
  'apps/web/lib/crew/orchestrator.ts':
    'selects explanation server-side and reads one key from it (replayTemplate, an id) to choose a replay template. The blob is not returned to the browser.',
  'apps/web/app/api/crew/[childId]/walk/[itemId]/route.ts':
    'the Walk content door. Reads explanation.walkScript for ONE item, only after walkScriptMayServe has passed, and only when the item is LIVE. An approved id carrying no script is a 500, never an empty success.',
  'apps/web/lib/crew/replay.ts':
    'names explanation in a doc comment only. It receives the template id as a string argument and composes the replay lines a child reads after a miss from the SOLUTION and a hard-coded template — no authored text reaches it.',
};

/**
 * PACKAGE-LEVEL READERS OF walkScript, AND WHAT EACH DOES WITH IT. These are in a child's import
 * closure because the shared packages are, and every one of them READS the field to CHECK or
 * CLASSIFY it — none renders it. That distinction is the whole point: a gate that screens walk
 * script text is the opposite of a leak, and a check that flagged its own guard rails would be
 * discarded within a week. A new package reader fails here until someone writes down which it is.
 */
const DECLARED_PACKAGE_WALK_READERS: Record<string, string> = {
  'packages/core/src/english/cowork-item-keys.ts':
    'declares WHERE the key is carried (Item.explanation.walkScript) for the cross-store key map. Names the field; never reads a value.',
  'packages/core/src/english/spot-shape.ts':
    "measures sentences per part for Annie's walk cap. Reads the text to COUNT it; returns numbers.",
  'packages/core/src/item-content-gate.ts':
    'gathers walkScript into the child-facing gate so the scanners and the reading-age cap screen it. This is the field being TREATED as child-facing, which is the ruling.',
  'packages/core/src/walk-approval.ts':
    'SCREENS it. Holds the set of item ids whose walk script a reviewer has read, and answers walkScriptMayServe. Currently empty by design.',
  // R1041 — three readers added after this list was written, each checked by reading the file:
  'packages/core/src/ban-list-scope.ts':
    'CLASSIFIES it. Names the path explanation.walkScript as IN the ban-list scope, so the ban list screens it. Names the field; never reads a value.',
  'packages/core/src/field-dispositions.ts':
    "CLASSIFIES it. Declares explanation.walkScript as 'child' and its sibling metadata paths as 'staff', so the every-string-field sweep screens it. Names the field; never reads a value.",
  'packages/core/src/quoted-field-exemption.ts':
    'CLASSIFIES it. Lists walkScript among AUTHORED_FIELDS, where the ban list and spelling rules apply in full (never the quotation exemption). Names the field; never reads a value.',
};

async function main() {
  const items = await prisma.item.findMany({ select: { id: true, status: true, explanation: true } });
  const carrying = items.filter((i) => {
    const w = ((i.explanation ?? {}) as Record<string, unknown>).walkScript;
    return (typeof w === 'string' && w.trim() !== '') || (Array.isArray(w) && w.length > 0);
  });
  requirePopulation('walkScript reachability', { 'items carrying a non-empty walkScript': carrying.length });

  const child = importClosure(CHILD_ROOTS, PACKAGE_ROOTS);
  const admin = importClosure(ADMIN_ROOTS, PACKAGE_ROOTS);

  const faults: string[] = [];

  // The scan must be able to see the token at all (R60 q2) — same matcher, the closure where the
  // field IS read. A zero here means the traversal is broken, not that the surface is clean.
  /**
   * SYNTHETIC CONTROL (R254). This used to rest on the ADMIN closure still containing a reader —
   * a live instance, and so a control that dies the day `comprehension-review.tsx` stops rendering
   * walkScript. **A control that depends on the instance still existing disappears exactly when
   * the codebase changes shape**, and it fails SILENTLY in the useful direction: the check would
   * report a clean child surface while proving nothing.
   *
   * The matcher is fired at a fixture through the identical path instead, so it survives any
   * rearrangement of the admin pages. The live admin count stays as COVERAGE information.
   */
  const controlFile = join(REPO, 'scripts/.control-walkscript-fixture.tmp.ts');
  writeFileSync(controlFile, 'const x = explanation.walkScript;\n');
  const controlHits = readersOf('walkScript', [controlFile]);
  unlinkSync(controlFile);
  if (controlHits.length !== 1) {
    faults.push(
      `CONTROL FAILED: the matcher found ${controlHits.length} reader(s) in a fixture containing exactly one. ` +
        'It is blind, and every result below carries no information.',
    );
  }

  const adminHits = readersOf('walkScript', admin.files);
  if (adminHits.length === 0) {
    console.log('  NOTE: no admin file renders walkScript today, so live coverage of the rendering');
    console.log('  side is zero. The synthetic control above still proves the matcher works.');
  }

  // The child closure must not have gone empty or lost its known members.
  const MUST_CONTAIN = ['apps/web/lib/crew/orchestrator.ts', 'apps/web/components/crew/play-runner.tsx'];
  const childRel = new Set(child.files.map((f) => relative(REPO, f)));
  for (const must of MUST_CONTAIN) {
    if (!childRel.has(must)) faults.push(`CLOSURE INCOMPLETE: ${must} is not in the child closure — the walk failed.`);
  }
  if (child.unresolved.length > 0) {
    for (const u of child.unresolved.slice(0, 5)) {
      faults.push(`UNRESOLVED IMPORT in the child closure: '${u.spec}' from ${relative(REPO, u.from)}`);
    }
  }

  // THE CLAIM IS ABOUT THE APP'S OWN CODE — the surfaces that render and the routes that
  // serialise. A package hit is reported and must be declared, but it is not the same finding.
  const isApp = (f: string) => f.startsWith('apps/web/');
  /*
   * **THE PROPERTY THIS ASSERTS CHANGED WHEN WALK WAS BUILT, AND THE CHECK SURVIVED THE CHANGE
   * BECAUSE IT WAS THE POINT OF IT** (R232). It used to assert that NO child-reachable path reads
   * walkScript — true while the field was unreachable, and false by design from the commit that
   * wired the Walk dispatcher. A check whose assertion an intended change falsifies is either
   * deleted or narrowed, and deleting it would have removed the only guard on the thing that
   * actually matters now: **that no UNAPPROVED script can leave the server.**
   *
   * So the app-side reader is now EXPECTED, and named. What is asserted instead is that every
   * reader routes through the approval gate — a reader that touches walkScript without
   * `walkScriptMayServe` beside it would serve unread text to a child, which is the fault the
   * whole measurement existed to prevent.
   */
  const DECLARED_APP_WALK_READERS: Record<string, string> = {
    'apps/web/app/api/crew/[childId]/walk/[itemId]/route.ts':
      'the Walk content door. Checks walkScriptMayServe BEFORE reading the row, so an unapproved script never leaves the server.',
  };

  const childHits = readersOf('walkScript', child.files);
  const appWalkHits = childHits.filter((h) => isApp(h.file) && !(h.file in DECLARED_APP_WALK_READERS));

  // Every declared reader must actually carry the gate — a declaration is not the guard.
  for (const [file] of Object.entries(DECLARED_APP_WALK_READERS)) {
    const src = child.files.find((f) => relative(REPO, f) === file);
    if (!src) {
      faults.push(`DECLARED WALK READER MISSING: ${file} is declared but is not in the child closure.`);
      continue;
    }
    if (!readFileSync(src, 'utf8').includes('walkScriptMayServe')) {
      faults.push(`UNGATED WALK READER: ${file} reads walkScript without calling walkScriptMayServe. Unapproved text would reach a child.`);
    }
  }
  const pkgWalkFiles = [...new Set(childHits.filter((h) => !isApp(h.file)).map((h) => h.file))];

  for (const hit of appWalkHits) {
    faults.push(`walkScript IS READ ON THE CHILD'S PATH: ${hit.file}:${hit.line} — ${hit.text}`);
  }
  for (const file of pkgWalkFiles) {
    if (!(file in DECLARED_PACKAGE_WALK_READERS)) {
      faults.push(
        `UNDECLARED package reader of walkScript in the child's closure: ${file}. ` +
          'Say whether it renders the text or screens it — the two are opposite findings.',
      );
    }
  }

  const explanationReaders = new Map<string, number>();
  for (const hit of readersOf('explanation', child.files).filter((h) => isApp(h.file))) {
    explanationReaders.set(hit.file, (explanationReaders.get(hit.file) ?? 0) + 1);
  }
  for (const [file] of explanationReaders) {
    if (!(file in DECLARED_EXPLANATION_READERS)) {
      faults.push(
        `UNDECLARED READER of the explanation blob on the child's path: ${file}. ` +
          'The blob carries walkScript; declare what this reader takes from it.',
      );
    }
  }

  console.log('walkScript reachability — measured against the import graph, not recalled');
  console.log(`  items carrying a walkScript: ${carrying.length} (${carrying.filter((i) => i.status === 'LIVE').length} LIVE)`);
  console.log(`  child closure: ${child.files.length} files from ${CHILD_ROOTS.length} entry points`);
  console.log(`  admin closure: ${admin.files.length} files from ${ADMIN_ROOTS.length} entry points`);
  console.log(`  CONTROL — walkScript readers in the admin closure: ${adminHits.length}`);
  for (const hit of adminHits) console.log(`      ${hit.file}:${hit.line}`);
  console.log(`  CLAIM   — walkScript readers in apps/web on the child's path: ${appWalkHits.length}`);
  console.log(`            walkScript readers in shared packages (screeners, declared): ${pkgWalkFiles.length}`);
  for (const file of pkgWalkFiles) console.log(`      ${file} — ${DECLARED_PACKAGE_WALK_READERS[file]?.split('.')[0] ?? 'UNDECLARED'}`);
  console.log(`  explanation-blob readers in apps/web on the child's path: ${explanationReaders.size} (all declared: ${[...explanationReaders.keys()].every((f) => f in DECLARED_EXPLANATION_READERS)})`);

  if (faults.length > 0) {
    console.error('\nFAULTS');
    for (const f of faults) console.error(`  - ${f}`);
    await prisma.$disconnect();
    process.exit(1);
  }
  console.log(
    `\nwalkScript IS now reachable, by ${Object.keys(DECLARED_APP_WALK_READERS).length} declared door, and that door checks the approval set before it reads. ` +
      `${WALK_APPROVED_ITEM_IDS.length} script(s) are approved to serve. No undeclared app path reads the field; ` +
      'the shared-package readers all screen it rather than render it, and the control proves the scan can see the token where it IS rendered.',
  );
  await prisma.$disconnect();
}

main();
