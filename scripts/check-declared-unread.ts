/**
 * DECLARED BUT UNREAD — every field the schema names, and every mode a Case file names, that NO
 * CODE PATH CONSUMES.
 *
 * **THE POPULATION NOBODY HAD COUNTED** (David, 2026-08-19). Two instances surfaced in one day and
 * neither came from a check: Walk mode is a finished shell whose `assetRef` nothing reads (found
 * while measuring walkScript reachability, R221), and the MATHS gates screen a question type no
 * code path creates (found by a declaration audit, R61). **Both are a built half waiting on a half
 * that was never built**, and both were invisible because nothing anywhere asks the question this
 * file asks: *what do we declare that we never read?*
 *
 * A declared-and-unread field is not automatically a fault — a column may be filled today and read
 * next month by design. **The fault is not knowing which**, so this prints the population and
 * requires each entry to be either read or DECLARED, in the shape R61 established for empty
 * populations: the guard is a declaration, never an inference.
 *
 * **THE METHOD, AND ITS DIRECTION OF ERROR, STATED BEFORE THE NUMBERS** (R60 q3, and the standing
 * instruction that a verifier names its source). A field counts as READ if its name appears as a
 * whole word anywhere in the scanned source outside the schema and its migrations. That is a
 * PROXY, and a generous one: `status`, `content` and `id` match in hundreds of unrelated places,
 * so genuine non-readers WILL be counted as read. **The error runs one way only** — this
 * UNDER-reports. Everything it names is unread with high confidence; what it clears is not
 * thereby proven read. A tighter test (resolving property access per type) is the honest next
 * version and is not what this is.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { requirePopulation } from './lib/population';

const REPO = resolve(import.meta.dirname, '..');
const SCHEMA = join(REPO, 'packages/db/prisma/schema.prisma');
const CASES = join(REPO, 'content/cases');

/**
 * TWO CORPORA, BECAUSE "READ" IS NOT ONE THING. The first version scanned everything at once and
 * reported `assetRef` as READ — by this very file, which names it in a comment. A field that only
 * a checker or an exporter touches is NOT consumed by the product; it is precisely the half-built
 * class being counted. Merging the two corpora hides the population inside its own scanner.
 */
const RUNTIME_ROOTS = ['apps/web', 'packages/core/src', 'packages/db/src', 'packages/ui/src'];
const TOOLING_ROOTS = ['scripts', 'tools'];

/**
 * **A VALIDATOR IS NOT A CONSUMER, AND THAT DISTINCTION IS THE WHOLE SUBJECT.** The second version
 * of this check cleared `assetRef` as SERVED because `packages/core/src/content-schema.ts` names
 * it — a zod field that CHECKS the value on the way in. Nothing then reads it. That is exactly the
 * shape being counted: a declaration validated at the door and consumed by nobody, which is why
 * every Case file carries a well-formed asset path to a mode that renders nothing.
 *
 * So reads inside a declaration site — a schema, a type module, a test — do not count as
 * consumption. They are the DECLARATION, not the use of it.
 */
const DECLARATION_SITE = /(\.test\.tsx?|\.spec\.tsx?|\.d\.ts|[/-]schema\.ts|[/-]types\.ts|\/e2e\/)$|content-schema\.ts$/;
const SCAN_EXT = /\.(ts|tsx|js|jsx|mjs|py)$/;
const SKIP_DIR = /node_modules|\.next|prisma\/migrations|generated/;

/**
 * DECLARED SLEEPERS: named here, with WHY it is declared and unread, and what would wake it. An
 * entry here is a decision someone can disagree with; an entry missing from here is a surprise.
 */
const DECLARED_UNREAD: Readonly<Record<string, string>> = {
  'Case.modes.*.assetRef':
    'Watch/Walk/See/Hear mode assets. Every Case declares one and NOTHING reads it — the modes are built shells with placeholder paths. This is R221: 704 authored walk scripts are the obvious content for the Walk slot, and wiring them is what makes walkScript child-reachable.',
  'Case.storyWrapper':
    'Validated by content-schema and read by no runtime path. Found by this check, not previously known. Awaiting a ruling on whether the wrapper is unbuilt or abandoned.',
};

/**
 * THE BACKLOG, ON THE `typecheck:scripts` MODEL: the population as it stood when this check was
 * written, listed so the check can FAIL ON ANYTHING NEW while the existing entries are triaged.
 *
 * It is printed in full on every run, never summarised to a count — a known list that shrinks to a
 * number is a green tick with a footnote, which is the shape R60 exists to refuse. Each entry
 * leaves this list by being wired, dropped, or moved into DECLARED_UNREAD with a reason.
 */
const KNOWN_UNREAD: readonly string[] = [
  'ParentAccount.verificationTokens', 'ParentAccount.bursaryApplications', 'ParentAccount.plusWaitlist',
  'ChildProfile.mockSittings', 'ChildProfile.readinessSnapshots', 'ChildProfile.reviewRecordings',
  'WebhookEvent.processedAt', 'QuestionType.glCode',
  'Item.englishOpenResponse', 'Item.englishUnmatchedAnswers',
  'EnglishUnmatchedAnswer.reviewNote', 'EnglishUnmatchedAnswer.purgeAt',
  'Word.vaultEntries',
  'NvrTemplateSignature.signedAt', 'NvrTemplateSignature.lastDriftCheckAt',
  'ContentWriteLog.txId',
];

const SELF = join(REPO, 'scripts/check-declared-unread.ts');

/**
 * THE FIVE MODE KINDS, WITH WHETHER ANY AUTHORED CONTENT EXISTS TO FILL THEM (David's ruling,
 * 2026-08-19). They stay DECLARED — none is removed — but a slot with content waiting behind it
 * and a slot with nothing behind it are different decisions, and the difference is recorded here
 * rather than rediscovered each time someone asks.
 */
const MODE_KIND_STATE: Readonly<Record<string, string>> = {
  // Keyed on the KIND, which is what the Case files declare and what this check reads. The mode
  // NAME is given first in each line because the two differ and confusing them is easy: the first
  // version of this map was keyed on the names and matched nothing at all.
  'faded-example': 'walk — RULED FOR BUILD 2026-08-19; 670 authored scripts on types a Walk Case opens, 331 LIVE; content exists and is unwired',
  practice: 'try — BACKED ALREADY; declares no assetRef because practice IS the serving path, the Daily Loop; its kind string is simply never dispatched',
  audio: 'hear — NO AUDIO EXISTS, but a working on-device speech path does (speak-button.tsx); a substitute route, not the declared one',
  video: 'watch — NOTHING BEHIND IT; no video, no scripts, no storyboards anywhere in the repo',
  visual: 'see — NOTHING BEHIND IT for VR or English; NVR has an SVG renderer but NVR serves no Cases',
};

function sourceFiles(roots: string[]): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (SKIP_DIR.test(full)) continue;
      if (statSync(full).isDirectory()) walk(full);
      // A scanner that counts its own mentions clears every field it discusses.
      else if (SCAN_EXT.test(name) && full !== SELF) out.push(full);
    }
  };
  for (const root of roots) walk(join(REPO, root));
  return out;
}

type Field = { model: string; name: string; type: string; isRelation: boolean };

function parseSchema(): Field[] {
  const src = readFileSync(SCHEMA, 'utf8');
  const fields: Field[] = [];
  const modelBlock = /^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm;
  let m: RegExpExecArray | null;
  while ((m = modelBlock.exec(src)) !== null) {
    const model = m[1]!;
    for (const rawLine of m[2]!.split('\n')) {
      const line = rawLine.trim();
      if (line === '' || line.startsWith('//') || line.startsWith('@@') || line.startsWith('*') || line.startsWith('/')) continue;
      const f = /^(\w+)\s+(\S+)/.exec(line);
      if (!f) continue;
      const [, name, type] = f as unknown as [string, string, string];
      fields.push({ model, name, type, isRelation: /^[A-Z]/.test(type.replace(/[[\]?]/g, '')) && !/^(String|Int|Boolean|DateTime|Json|Float|Decimal|BigInt|Bytes)$/.test(type.replace(/[[\]?]/g, '')) });
    }
  }
  // R173: a reader refuses a shape it cannot parse rather than returning empty.
  if (fields.length === 0) throw new Error(`parsed 0 fields from ${SCHEMA} — the model-block shape changed; refusing to report "nothing unread" from a failed read`);
  return fields;
}

function caseModeKinds(): { file: string; mode: string; kind: string; assetRef: string | null }[] {
  const out: { file: string; mode: string; kind: string; assetRef: string | null }[] = [];
  for (const name of readdirSync(CASES).filter((n) => n.endsWith('.json'))) {
    const parsed = JSON.parse(readFileSync(join(CASES, name), 'utf8')) as { case?: { modes?: Record<string, { kind?: string; assetRef?: string }> } };
    const modes = parsed.case?.modes;
    if (!modes) throw new Error(`${name}: no case.modes — refusing to report on a shape I did not parse`);
    for (const [mode, body] of Object.entries(modes)) {
      out.push({ file: name, mode, kind: body.kind ?? '(none)', assetRef: body.assetRef ?? null });
    }
  }
  if (out.length === 0) throw new Error('parsed 0 Case modes — refusing to report from a failed read');
  return out;
}

async function main() {
  const allRuntime = sourceFiles(RUNTIME_ROOTS);
  const runtimeFiles = allRuntime.filter((f) => !DECLARATION_SITE.test(f));
  const declarationFiles = allRuntime.filter((f) => DECLARATION_SITE.test(f));
  const toolingFiles = sourceFiles(TOOLING_ROOTS);
  const runtime = runtimeFiles.map((f) => readFileSync(f, 'utf8')).join('\n');
  const declared = declarationFiles.map((f) => readFileSync(f, 'utf8')).join('\n');
  const tooling = toolingFiles.map((f) => readFileSync(f, 'utf8')).join('\n');
  const fields = parseSchema();
  const modes = caseModeKinds();
  requirePopulation('declared-but-unread', {
    'runtime consumer files': runtimeFiles.length,
    'runtime declaration sites': declarationFiles.length,
    'tooling files': toolingFiles.length,
    'schema fields': fields.length,
    'Case mode declarations': modes.length,
  });

  const hits = (corpus: string, needle: string): number => {
    const re = new RegExp(`\\b${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    return (corpus.match(re) ?? []).length;
  };
  /**
   * SERVED — the product consumes it. VALIDATED-ONLY — only a schema/type/test names it, so it is
   * checked on the way in and read by nothing. TOOLING-ONLY — only a check or export reads it.
   * DEAD — nothing anywhere.
   */
  type Verdict = 'SERVED' | 'VALIDATED-ONLY' | 'TOOLING-ONLY' | 'DEAD';
  const classify = (name: string): Verdict =>
    hits(runtime, name) > 0 ? 'SERVED'
    : hits(declared, name) > 0 ? 'VALIDATED-ONLY'
    : hits(tooling, name) > 0 ? 'TOOLING-ONLY'
    : 'DEAD';

  /**
   * A MODE KIND IS A STRING LITERAL, SO IT IS MATCHED AS ONE. Classified as bare words, four of
   * the five kinds came back SERVED — `video`, `visual`, `audio` and `practice` all occur in
   * unrelated code (an NVR template's `identity: 'visual'`, a debug page seeding `'practice'`).
   * **Every one of those clears was false**, and they would have hidden the finding inside its own
   * measurement: nothing dispatches on a mode kind anywhere. This is the declared under-reporting
   * becoming material, so for kinds the needle is the quoted literal.
   */
  const literalHits = (corpus: string, name: string): number =>
    (corpus.match(new RegExp(`['"\`]${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]`, 'g')) ?? []).length;
  const classifyLiteral = (name: string): Verdict =>
    literalHits(runtime, name) > 0 ? 'SERVED'
    : literalHits(declared, name) > 0 ? 'VALIDATED-ONLY'
    : literalHits(tooling, name) > 0 ? 'TOOLING-ONLY'
    : 'DEAD';

  const classified = fields.map((f) => ({ ...f, verdict: classify(f.name) }));
  const dead = classified.filter((f) => f.verdict === 'DEAD');
  const toolingOnly = classified.filter((f) => f.verdict === 'TOOLING-ONLY');
  const deadScalars = dead.filter((f) => !f.isRelation);
  const deadRelations = dead.filter((f) => f.isRelation);

  const kinds = [...new Set(modes.map((m) => m.kind))];
  const faultsOnKinds: string[] = [];
  const assetRefVerdict = classify('assetRef');
  const modesWithAsset = modes.filter((m) => m.assetRef !== null);

  console.log('DECLARED BUT UNREAD — what we name and never consume');
  console.log(`\n  METHOD: whole-word match over three corpora — ${runtimeFiles.length} runtime consumers,`);
  console.log(`  ${declarationFiles.length} declaration sites (schemas/types/tests), ${toolingFiles.length} tooling files; this file in none.`);
  console.log('  A generous proxy that UNDER-reports: common names match unrelated code, so what it');
  console.log('  clears is not thereby proven read.');

  const validatedOnly = classified.filter((f) => f.verdict === 'VALIDATED-ONLY');
  console.log(`\n  SCHEMA FIELDS: ${fields.length} declared`);
  console.log(`    SERVED (the product consumes it):        ${classified.filter((f) => f.verdict === 'SERVED').length}`);
  console.log(`    VALIDATED-ONLY (checked in, read by none): ${validatedOnly.length}`);
  console.log(`    TOOLING-ONLY (only a check/export):      ${toolingOnly.length}`);
  console.log(`    DEAD (nothing anywhere reads it):        ${dead.length}`);
  if (validatedOnly.length > 0) {
    console.log('\n    VALIDATED-ONLY — the built-half-waiting class:');
    for (const f of validatedOnly) console.log(`      ${f.model}.${f.name} : ${f.type}`);
  }
  console.log(`\n    TOOLING-ONLY — stored and inspected, never served:`);
  for (const f of toolingOnly) console.log(`      ${f.model}.${f.name} : ${f.type}`);
  console.log(`\n    DEAD — ${deadScalars.length} scalar, ${deadRelations.length} relation:`);
  for (const f of deadScalars) console.log(`      ${f.model}.${f.name} : ${f.type}`);
  for (const f of deadRelations) console.log(`      ${f.model}.${f.name} : ${f.type}  (join never traversed)`);

  console.log(`\n  CASE MODES: ${modes.length} declared across ${new Set(modes.map((m) => m.file)).size} Case file(s)`);
  console.log(`    kinds declared: ${kinds.sort().join(', ')}`);
  const kindVerdicts = kinds.sort().map((k) => ({ kind: k, verdict: classifyLiteral(k) }));
  for (const { kind, verdict } of kindVerdicts) {
    const state = MODE_KIND_STATE[kind];
    console.log(`      ${kind.padEnd(16)} ${verdict.padEnd(15)} ${state ? state.split('.')[0] : 'STATE NOT RECORDED'}`);
    if (!state) faultsOnKinds.push(kind);
  }
  const dispatched = kindVerdicts.filter((k) => k.verdict === 'SERVED');
  console.log(`    ${dispatched.length} of ${kinds.length} mode kinds are dispatched by any runtime code path.`);
  console.log(`    assetRef: ${modesWithAsset.length} declared · ${assetRefVerdict}`);
  if (assetRefVerdict !== 'SERVED') {
    console.log('      ==> EVERY mode asset in the product is declared and never served. The modes');
    console.log('          are built shells with placeholder paths — the Walk-mode instance (R221).');
  }

  const undeclared: string[] = [];
  for (const kind of faultsOnKinds) undeclared.push(`Case.modes.${kind} (no state recorded in MODE_KIND_STATE)`);
  if (assetRefVerdict !== 'SERVED' && !('Case.modes.*.assetRef' in DECLARED_UNREAD)) undeclared.push('Case.modes.*.assetRef');
  const backlog: string[] = [];
  for (const f of [...dead, ...validatedOnly]) {
    const key = `${f.model}.${f.name}`;
    if (key in DECLARED_UNREAD) continue;
    if (KNOWN_UNREAD.includes(key)) backlog.push(key);
    else undeclared.push(key);
  }
  const goneFromBacklog = KNOWN_UNREAD.filter((k) => !backlog.includes(k));

  console.log(`\n  DECLARED SLEEPERS (named, with a reason): ${Object.keys(DECLARED_UNREAD).length}`);
  for (const [key, why] of Object.entries(DECLARED_UNREAD)) console.log(`      ${key} — ${why.split('.')[0]}`);
  console.log(`\n  KNOWN BACKLOG (unread when this check was written): ${backlog.length} of ${KNOWN_UNREAD.length}`);
  for (const key of backlog) console.log(`      ${key}`);
  if (goneFromBacklog.length > 0) {
    console.log(`    ${goneFromBacklog.length} no longer unread — wire them out of KNOWN_UNREAD: ${goneFromBacklog.join(', ')}`);
  }
  console.log(`  NEW UNDECLARED (unread, and nobody has said why): ${undeclared.length}`);
  for (const key of undeclared) console.log(`      ${key}`);

  if (undeclared.length > 0) {
    console.error('\nFAULT: an unread declaration with no reason attached. Either wire it, drop it, or');
    console.error('  add it to DECLARED_UNREAD saying why it sleeps and what would wake it. R61: the');
    console.error('  guard is a declaration, never an inference.');
    process.exit(1);
  }
  console.log('\n  The backlog is the population nobody had counted. It is not growing.');
}

main();
