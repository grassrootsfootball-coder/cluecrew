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
  byFamily: z.record(variantList).optional(),
  beats: z.record(variantList).optional(),
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
  copyrightCheck: z.record(z.unknown()).optional(),
  provenance: z.string().optional(),
  sceneTitle: z.string().optional(),
  preamble: z.string().optional(),
  body: z.string().min(1),
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
  metadata: z.record(z.unknown()).optional(),
  editorialCuts: z.array(z.string()).optional(),
  verbatimVerification: z.record(z.unknown()).optional(),
  similarityCheck: z.record(z.unknown()).optional(),
});

const anyContentFile = z.discriminatedUnion('kind', [
  passageFileSchema,
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
 */
const GENERATED_DIRS = new Set(['exports', 'review-returns']);

function collectJsonFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (GENERATED_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...collectJsonFiles(full));
    else if (entry.endsWith('.json')) out.push(full);
  }
  return out;
}

const files = collectJsonFiles(CONTENT_ROOT);
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

if (failures > 0) {
  console.error(`\nContent validation FAILED: ${failures} file(s) invalid.`);
  process.exit(1);
}
console.log(
  `\nContent validation passed: ${files.length} file(s), including ${voicePacks} voice pack(s) at ≥${MIN_VARIANTS} variants per beat.`,
);
