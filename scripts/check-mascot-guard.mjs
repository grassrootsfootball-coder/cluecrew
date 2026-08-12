/**
 * Gate #6 lint rule: no component sets mascot state outside mascotController.
 * setMascotState/debugSetMascotState may be referenced only in the controller
 * itself and the debug panel.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SCAN_ROOT = join(ROOT, 'apps/web');
const ALLOWED = new Set([
  'apps/web/components/crew/mascot-controller.ts',
  'apps/web/app/crew/debug/mascot/page.tsx', // debugSetMascotState only (no-ops in production)
]);
/** The door itself. If this file stops setting mascot state, the guard is guarding nothing. */
const CONTROLLER = 'apps/web/components/crew/mascot-controller.ts';

// --- Canary: the exceptions must still resolve ------------------------------
// A stale entry widens the exception invisibly — the named file moves, nothing under
// the old path is ever scanned, and an exemption sits here forever covering a file
// that no longer exists (audit, 2026-08-12).
const stale = [...ALLOWED].filter((rel) => !existsSync(join(ROOT, rel)));
if (stale.length > 0) {
  console.error('Mascot guard ABORTED: the allowlist names files that do not exist:');
  for (const rel of stale) console.error(`  ${rel}`);
  console.error('An exemption for a moved file silently widens the exception. Update ALLOWED.');
  process.exit(1);
}

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
let scanned = 0;
for (const file of collect(SCAN_ROOT)) {
  const rel = relative(ROOT, file);
  scanned += 1;
  if (ALLOWED.has(rel)) continue;
  const source = readFileSync(file, 'utf8');
  if (/setMascotState/.test(source)) violations.push(rel);
}

// --- Canary: the door must still be a door ----------------------------------
// The pass line claims mascotController is the SINGLE door. If the controller no
// longer sets mascot state, the symbol was renamed and this scan is looking for a
// string nothing uses — zero matches would then read as perfect isolation.
if (!/setMascotState/.test(readFileSync(join(ROOT, CONTROLLER), 'utf8'))) {
  console.error(
    `Mascot guard ABORTED: ${CONTROLLER} does not mention setMascotState.\n` +
      'The door does not set the state this guard tracks, so the symbol was renamed and this\n' +
      'scan now matches nothing. Zero violations would mean nothing was tested, not that the\n' +
      'single-door rule holds. Update the pattern here.',
  );
  process.exit(1);
}

if (violations.length > 0) {
  console.error('Mascot guard FAILED — components must drive the mascot via mascotEvent() only:');
  for (const violation of violations) console.error(`  ${violation}`);
  process.exit(1);
}
console.log(
  `Mascot guard passed across ${scanned} file(s): mascotController is the single door ` +
    `(${ALLOWED.size} exemptions, all resolving).`,
);
