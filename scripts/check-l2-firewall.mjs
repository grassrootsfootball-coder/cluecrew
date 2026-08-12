/**
 * L2 firewall grep (BUILD-PHASE-3 §5, gate #5): no field, metric, or
 * analytics dimension resembling a modality / learning-style profile may
 * exist anywhere — schema, core, app, or content. The single permitted
 * pointer is ChildProfile.lastUsedMode.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SCAN_ROOTS = ['apps/web', 'packages', 'content'];

// Files whose job is to document or enforce the ban itself.
const ALLOWED_FILES = new Set([
  'packages/core/src/modes.ts',
  'packages/ui/src/tokens.ts',
  // The ban list NAMES the banned phrases in order to ban them, so it trips every pattern here
  // by construction. It is the same category as the two above and was simply never added, which
  // turned CI red the moment "learning style" and "visual learner" were added as L2 entries: the
  // firewall was reporting the firewall.
  'packages/core/src/banned-vocabulary.json',
]);

/**
 * Each pattern carries a `canary`: a string it MUST match. This is a checking-for-absence
 * scan, so zero matches is the pass — which means a pattern that has gone dead reports
 * exactly what a clean repo reports, forever (audit, 2026-08-12). The canaries are
 * fixtures proving each rule still fires, not a copy of anything the scan audits.
 */
const PATTERNS = [
  { name: 'learning style', pattern: /learning[\s_-]?style/i, canary: 'learning_style' },
  { name: 'modality profile/score', pattern: /modalit/i, canary: 'modalityScore' },
  { name: 'learner type label', pattern: /learner[\s_-]?type/i, canary: 'learner-type' },
  { name: 'preferred/dominant mode-style field', pattern: /(preferred|dominant)[\s_-]?(mode|style|modality|learner)/i, canary: 'preferredMode' },
  { name: '"visual/kinaesthetic/auditory learner"', pattern: /(visual|kinaesthetic|auditory)[\s_-]?learner/i, canary: 'visual learner' },
];

const deadPatterns = PATTERNS.filter((rule) => !rule.pattern.test(rule.canary));
if (deadPatterns.length > 0) {
  console.error('L2 firewall ABORTED: these patterns no longer match their own canary —');
  for (const rule of deadPatterns) console.error(`  ${rule.name}  (canary: "${rule.canary}")`);
  console.error('A dead pattern in an absence check passes forever. Fix the pattern.');
  process.exit(1);
}

const EXTENSIONS = /\.(ts|tsx|prisma|json|mjs|css|md|mdx)$/;
const EXCLUDED = ['node_modules', '.next', '.lighthouseci', 'test-results', 'playwright-report'];

function collect(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (EXCLUDED.includes(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...collect(full));
    else if (EXTENSIONS.test(entry)) out.push(full);
  }
  return out;
}

// A stale exemption is a hole: the named file moves, and the entry sits here covering
// nothing while the pattern that justified it is never re-examined.
const staleAllowed = [...ALLOWED_FILES].filter((rel) => !existsSync(join(ROOT, rel)));
if (staleAllowed.length > 0) {
  console.error('L2 firewall ABORTED: the allowlist names files that do not exist:');
  for (const rel of staleAllowed) console.error(`  ${rel}`);
  process.exit(1);
}

const violations = [];
const perRoot = {};
for (const scanRoot of SCAN_ROOTS) {
  perRoot[scanRoot] = 0;
  for (const file of collect(join(ROOT, scanRoot))) {
    perRoot[scanRoot] += 1;
    const rel = relative(ROOT, file);
    if (ALLOWED_FILES.has(rel)) continue;
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, index) => {
      for (const rule of PATTERNS) {
        if (rule.pattern.test(line)) {
          violations.push(`${rel}:${index + 1} [${rule.name}]\n    ${line.trim()}`);
        }
      }
    });
  }
}

if (violations.length > 0) {
  console.error('L2 FIREWALL BREACH — modality/learning-style shaped code detected:\n');
  for (const violation of violations) console.error(`  ${violation}\n`);
  console.error('Any feature wanting modality inference must amend the manifesto first.');
  process.exit(1);
}
// An empty root means the scan is pointed at nothing — not that the ban is holding.
const emptyRoots = SCAN_ROOTS.filter((root) => perRoot[root] === 0);
if (emptyRoots.length > 0) {
  console.error(`L2 firewall ABORTED: scanned zero files under ${emptyRoots.join(', ')}.`);
  console.error('An absence check over an empty tree passes without testing anything.');
  process.exit(1);
}
const totalScanned = Object.values(perRoot).reduce((a, b) => a + b, 0);
console.log(
  `L2 firewall check passed: ${PATTERNS.length} live patterns over ${totalScanned} files ` +
    `(${SCAN_ROOTS.map((r) => `${r} ${perRoot[r]}`).join(', ')}) — no modality profile exists anywhere.`,
);
