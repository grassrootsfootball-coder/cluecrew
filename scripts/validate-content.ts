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
import { blueprintFileSchema, caseFileSchema, isBlueprintVerified, regionFileSchema, wordFileSchema } from '@cluecrew/core';

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

const anyContentFile = z.discriminatedUnion('kind', [
  wordFileSchema,
  caseFileSchema,
  regionFileSchema,
  voiceFileSchema,
  blueprintFileSchema,
]);

function collectJsonFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
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
