/**
 * Gate #6 lint rule: no component sets mascot state outside mascotController.
 * setMascotState/debugSetMascotState may be referenced only in the controller
 * itself and the debug panel.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SCAN_ROOT = join(ROOT, 'apps/web');
const ALLOWED = new Set([
  'apps/web/components/crew/mascot-controller.ts',
  'apps/web/app/crew/debug/mascot/page.tsx', // debugSetMascotState only (no-ops in production)
]);

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
  if (ALLOWED.has(rel)) continue;
  const source = readFileSync(file, 'utf8');
  if (/setMascotState/.test(source)) violations.push(rel);
}

if (violations.length > 0) {
  console.error('Mascot guard FAILED — components must drive the mascot via mascotEvent() only:');
  for (const violation of violations) console.error(`  ${violation}`);
  process.exit(1);
}
console.log('Mascot guard passed: mascotController is the single door.');
