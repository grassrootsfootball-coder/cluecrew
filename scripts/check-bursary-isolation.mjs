/**
 * Grep-level guarantee (BUILD-PHASE-2 §6, gate #9): no child-facing or
 * parent-facing UI reads `isBursary`. The flag exists ONLY for capacity
 * accounting and aggregate reporting, so the only files allowed to mention it
 * are the staff-only admin surfaces.
 *
 * The check knows two things it MUST find, because without them it was reporting
 * on a property it no longer tested (audit, 2026-08-12):
 *
 *   1. The FLAG NAME comes from schema.prisma, never from a copy in here. Renaming
 *      the column used to yield zero matches, zero violations, and a printed
 *      assurance that "the product is identical for bursary families" — a claim
 *      about a flag this file could no longer see. It now renames with the schema.
 *   2. At least one file under the scan root must mention it. The flag exists so
 *      the admin surfaces can report on it; zero mentions means the scan root is
 *      wrong or the surfaces have moved, not that isolation is holding.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SCAN_ROOT = join(ROOT, 'apps/web');
const SCHEMA = join(ROOT, 'packages/db/prisma/schema.prisma');

const ALLOWED_PREFIXES = [
  'apps/web/app/admin/',
  'apps/web/app/api/admin/',
  'apps/web/lib/actions/admin-',
];

// --- Canary 1: the flag the schema actually declares ------------------------
const schemaSource = readFileSync(SCHEMA, 'utf8');
const declared = schemaSource.match(/^\s*(\w*[Bb]ursary\w*)\s+Boolean\b/m);
if (!declared) {
  console.error(
    'isBursary isolation check ABORTED: packages/db/prisma/schema.prisma declares no Boolean\n' +
      'bursary flag. Either the flag was renamed beyond this check\'s reach or it is gone. This\n' +
      'check cannot isolate a field it cannot name — fix the pattern here, do not delete the step.',
  );
  process.exit(1);
}
const FLAG = declared[1];

function collect(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...collect(full));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

const violations = [];
const mentions = [];
for (const file of collect(SCAN_ROOT)) {
  const rel = relative(ROOT, file);
  if (!readFileSync(file, 'utf8').includes(FLAG)) continue;
  mentions.push(rel);
  if (!ALLOWED_PREFIXES.some((prefix) => rel.startsWith(prefix))) {
    violations.push(rel);
  }
}

// --- Canary 2: it must find the flag somewhere ------------------------------
if (mentions.length === 0) {
  console.error(
    `isBursary isolation check ABORTED: no file under apps/web mentions \`${FLAG}\`.\n` +
      'The admin surfaces are supposed to read it, so zero mentions means this scan is looking\n' +
      'in the wrong place — NOT that the flag is well isolated. A pass here would assert nothing.',
  );
  process.exit(1);
}

if (violations.length > 0) {
  console.error(`isBursary isolation FAILED — \`${FLAG}\` leaked outside admin surfaces:`);
  for (const violation of violations) console.error(`  ${violation}`);
  process.exit(1);
}
console.log(
  `isBursary isolation passed: \`${FLAG}\` (from schema.prisma) appears in ${mentions.length} ` +
    `file(s) under apps/web, all admin-only — ${mentions.join(', ')}.\n` +
    'The product is identical for bursary families.',
);
