/**
 * Content validation for every file under /content.
 *
 * Words, Cases and Regions are validated against the canonical zod schemas
 * exported by @cluecrew/core (imported, never redefined here — the schemas
 * stay the single source of truth). Voice packs (Addendum A §1.4) are
 * validated here: every repeated beat needs ≥6 authored variants, selected
 * without immediate repeats at runtime.
 *
 * This root-level entry point exists because voice content post-dates the
 * core validator's discriminated union, and packages/core is frozen.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { z } from 'zod';
import {
  batchMixFileSchema,
  blueprintFileSchema,
  caseFileSchema,
  chapterFileSchema,
  examTechniqueTreeFileSchema,
  isBlueprintVerified,
  mathsPlanFileSchema,
  nvrGeneratorConfigFileSchema,
  englishPlanFileSchema,
  nvrPlanFileSchema,
  regionFileSchema,
  replayTemplatesFileSchema,
  wordFileSchema,
} from '@cluecrew/core';

const CONTENT_ROOT = resolve(import.meta.dirname, '../content');
const MIN_VARIANTS = 6;

const variantList = z.array(z.string().min(1).max(160)).min(MIN_VARIANTS);

// Plain object (no .superRefine) so it can sit in the discriminated union;
// the "needs at least one variant set" rule is checked after parsing.
const voiceFileSchema = z.object({
  kind: z.literal('voice'),
  beat: z.string().min(1),
  note: z.string().optional(),
  variants: variantList.optional(),
  byFamily: z.record(z.string(), variantList).optional(),
  beats: z.record(z.string(), variantList).optional(),
});

/**
 * A curated passage (Stream A public-domain, Stream B/C commissioned). Defined
 * here for the same reason the voice pack is: it post-dates the core
 * validator's discriminated union.
 *
 * `numberedLines` is the load-bearing field — every stem and walk script cites
 * lines against it, and `pnpm check:line-refs` resolves those citations here.
 * The numbering must therefore be dense and 1-based, which is checked rather
 * than assumed.
 */
const passageFileSchema = z.object({
  kind: z.literal('passage'),
  id: z.string().min(1),
  stream: z.string().min(1),
  work: z
    .object({ author: z.string(), title: z.string(), firstPublished: z.number().optional(), authorDied: z.number().optional() })
    .optional(),
  commissioned: z.boolean().optional(),
  copyrightCheck: z.record(z.string(), z.unknown()).optional(),
  provenance: z.string().optional(),
  sceneTitle: z.string().optional(),
  preamble: z.string().optional(),
  // THE TEXT HAS THREE NAMES IN THE STORE (R1038): `body` (the original shape), `extract` (Stream A
  // after the 2026-08-16 import) and `text` (commissioned Stream B/C). That import also dropped `kind`,
  // and this validator went unrun in CI from 2026-08-12, so 27 passages failed here unseen. Any one
  // name satisfies; `numberedLines` below is what every citation actually resolves against.
  body: z.string().min(1).optional(),
  extract: z.string().min(1).optional(),
  text: z.string().min(1).optional(),
  // `n: null` is a paragraph break — a real entry in the layout that carries
  // no line number, exactly as a printed paper prints one. The NUMBERING is
  // dense over the numbered entries; the array is longer than the line count,
  // which is why nothing may use `numberedLines.length` as the last line.
  numberedLines: z
    .array(
      z.object({
        n: z.number().int().positive().nullable(),
        text: z.string(),
        label: z.string().optional(),
      }),
    )
    .min(1)
    .superRefine((lines, ctx) => {
      let expected = 0;
      for (const [index, line] of lines.entries()) {
        if (line.n === null) continue;
        expected += 1;
        if (line.n !== expected) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `line numbering must be dense and 1-based: entry ${index} is numbered ${line.n}, expected ${expected}`,
          });
        }
      }
    }),
  /** Cloze vehicles only: how many gaps the text carries. Its presence
   *  declares that citations into this passage count GAPS, not lines. */
  gapCount: z.number().int().positive().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  editorialCuts: z.array(z.string()).optional(),
  verbatimVerification: z.record(z.string(), z.unknown()).optional(),
  similarityCheck: z.record(z.string(), z.unknown()).optional(),
});

const anyContentFile = z.discriminatedUnion('kind', [
  passageFileSchema,
  // `chapter` was in packages/core's own union from the start but was dropped when this second
  // union was built for voice packs, so the FIRST chapter a writer landed failed here with
  // "Invalid discriminator value" — an error pointing at the chapter instead of at this list.
  // R42 again: two doors that enumerate separately WILL drift (2026-08-12).
  chapterFileSchema,
  batchMixFileSchema,
  nvrGeneratorConfigFileSchema,
  wordFileSchema,
  caseFileSchema,
  regionFileSchema,
  voiceFileSchema,
  blueprintFileSchema,
  replayTemplatesFileSchema,
  mathsPlanFileSchema,
  nvrPlanFileSchema,
  englishPlanFileSchema,
  examTechniqueTreeFileSchema,
]);

/**
 * /content/exports holds GENERATED artefacts — reviewer packs and the
 * decisions files that come back — not authored content. They are output of
 * this repo, not input to it, so the authored-content schemas do not apply.
 *
 * /content/review-returns holds the filled-in decisions files. They are
 * correspondence, kept as the paper trail behind a recorded decision; the
 * import script validates their shape at the point of use.
 *
 * /content/pilot-review holds pilot ITEM BATCHES under active review (R47) —
 * ENG-004's cluster and its notes. These are item-authoring artefacts in the
 * Cowork batch shape (batchId / items[] / tierDistribution), NOT one of the
 * `kind`-discriminated authored-content files this validator governs, so the
 * discriminated union cannot describe them and should not try. They are not
 * ungoverned: every write goes through scripts/lib/pilot-review.ts, which runs
 * `checkItemChildFacing` on the items a ruling touches and appends to an
 * append-only RULING-LOG.jsonl. A different gate, deliberately — the same
 * division as review-returns, whose shape is checked at the point of use.
 */
/**
 * WHAT IS VALIDATED IS DECLARED, NOT INFERRED (David, 2026-11-22 — R1041). content/ holds authored
 * content AND the working records of review. The old rule — every .json except three generated
 * dirs — failed 719 record files once CI could run it, while the 27 passages that genuinely broke on
 * 2026-08-16 went unseen. So every TOP-LEVEL entry is declared in scripts/lib/content-paths.json as
 * AUTHORED (schema-checked, every file) or a RECORD (counted and printed, never schema-checked). An
 * entry declared in neither FAILS: a new directory arrives with its declaration, or the run refuses
 * it. Inside an authored path nothing is skipped, so a passage that loses its `kind` fails here.
 */
const PATHS = JSON.parse(readFileSync(resolve(import.meta.dirname, 'lib/content-paths.json'), 'utf8')) as {
  authored?: string[]; records?: Record<string, string>;
};
if (!Array.isArray(PATHS.authored) || typeof PATHS.records !== 'object' || PATHS.records === null) {
  throw new Error('scripts/lib/content-paths.json: expected {authored[], records{}} (R173)');
}
const AUTHORED = new Set(PATHS.authored);
const RECORDS = PATHS.records;

function collectJsonFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...collectJsonFiles(full));
    else if (entry.endsWith('.json')) out.push(full);
  }
  return out;
}

const undeclared: string[] = [];
const recordCounts: Array<[string, number]> = [];
const files: string[] = [];
for (const entry of readdirSync(CONTENT_ROOT).sort()) {
  if (entry.startsWith('.')) continue;
  const full = join(CONTENT_ROOT, entry);
  const isDir = statSync(full).isDirectory();
  if (AUTHORED.has(entry)) files.push(...(isDir ? collectJsonFiles(full) : entry.endsWith('.json') ? [full] : []));
  else if (entry in RECORDS) recordCounts.push([entry, isDir ? collectJsonFiles(full).length : 1]);
  else undeclared.push(entry);
}
console.log(`content/: ${AUTHORED.size} authored path(s) schema-checked · ${recordCounts.length} record path(s) NOT schema-checked, by declaration:`);
for (const [entry, n] of recordCounts) console.log(`    ${entry} (${n}) — ${RECORDS[entry]}`);
for (const entry of undeclared) console.error(`✗ content/${entry}: declared neither authored nor a record in scripts/lib/content-paths.json`);
if (files.length === 0) {
  console.error('No content files found under /content — that is unexpected.');
  process.exit(1);
}

let failures = 0;
let voicePacks = 0;

for (const file of files) {
  const label = relative(CONTENT_ROOT, file);
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    console.error(`✗ ${label}: invalid JSON — ${(error as Error).message}`);
    failures++;
    continue;
  }
  const parsed = anyContentFile.safeParse(raw);
  if (!parsed.success) {
    console.error(`✗ ${label}:`);
    for (const issue of parsed.error.issues) {
      console.error(`    ${issue.path.join('.') || '(root)'}: ${issue.message}`);
    }
    failures++;
    continue;
  }
  if (parsed.data.kind === 'passage' && !(parsed.data.body ?? parsed.data.extract ?? parsed.data.text)) {
    console.error(`✗ ${label}:\n    (root): a passage needs its text under body, extract or text`);
    failures++;
    continue;
  }
  if (parsed.data.kind === 'blueprint') {
    // A draft is valid content, but the difference must never be silent:
    // drafts do not serve real children in production (Addendum B §2).
    const verified = isBlueprintVerified(parsed.data.blueprint);
    console.log(`✓ ${label}${verified ? '' : '  [DRAFT — pending reviewer verification]'}`);
    continue;
  }
  if (parsed.data.kind === 'voice') {
    const pack = parsed.data;
    if (!pack.variants && !pack.byFamily && !pack.beats) {
      console.error(`✗ ${label}: a voice pack needs variants, byFamily or beats`);
      failures++;
      continue;
    }
    voicePacks++;
  }
  console.log(`✓ ${label}`);
}

failures += undeclared.length;
if (failures > 0) {
  console.error(`\nContent validation FAILED: ${failures} file(s) or path(s) invalid.`);
  process.exit(1);
}
console.log(
  `\nContent validation passed: ${files.length} file(s), including ${voicePacks} voice pack(s) at ≥${MIN_VARIANTS} variants per beat.`,
);
