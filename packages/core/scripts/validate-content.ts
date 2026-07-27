/**
 * Validates every JSON file under /content against the schemas in
 * packages/core/src/content-schema.ts. Run in CI on every PR (BUILD-PHASE-1 §2).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { contentFileSchema } from '../src/content-schema';

const contentRoot = resolve(import.meta.dirname, '../../../content');

function collectJsonFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...collectJsonFiles(full));
    else if (entry.endsWith('.json')) out.push(full);
  }
  return out;
}

const files = collectJsonFiles(contentRoot);
if (files.length === 0) {
  console.error('No content files found under /content — that is unexpected.');
  process.exit(1);
}

let failures = 0;
for (const file of files) {
  const label = relative(contentRoot, file);
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    console.error(`✗ ${label}: invalid JSON — ${(error as Error).message}`);
    failures++;
    continue;
  }
  const parsed = contentFileSchema.safeParse(raw);
  if (!parsed.success) {
    console.error(`✗ ${label}:`);
    for (const issue of parsed.error.issues) {
      console.error(`    ${issue.path.join('.') || '(root)'}: ${issue.message}`);
    }
    failures++;
  } else {
    console.log(`✓ ${label}`);
  }
}

if (failures > 0) {
  console.error(`\nContent validation FAILED: ${failures} file(s) invalid.`);
  process.exit(1);
}
console.log(`\nContent validation passed: ${files.length} file(s).`);
