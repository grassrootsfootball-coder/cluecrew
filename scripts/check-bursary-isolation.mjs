/**
 * Grep-level guarantee (BUILD-PHASE-2 §6, gate #9): no child-facing or
 * parent-facing UI reads `isBursary`. The flag exists ONLY for capacity
 * accounting and aggregate reporting, so the only files allowed to mention it
 * are the staff-only admin surfaces.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SCAN_ROOT = join(ROOT, 'apps/web');

const ALLOWED_PREFIXES = [
  'apps/web/app/admin/',
  'apps/web/app/api/admin/',
  'apps/web/lib/actions/admin-',
];

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
for (const file of collect(SCAN_ROOT)) {
  const rel = relative(ROOT, file);
  if (!readFileSync(file, 'utf8').includes('isBursary')) continue;
  if (!ALLOWED_PREFIXES.some((prefix) => rel.startsWith(prefix))) {
    violations.push(rel);
  }
}

if (violations.length > 0) {
  console.error('isBursary isolation FAILED — the flag leaked outside admin surfaces:');
  for (const violation of violations) console.error(`  ${violation}`);
  process.exit(1);
}
console.log('isBursary isolation check passed: the product is identical for bursary families.');
