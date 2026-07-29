/**
 * L2 firewall grep (BUILD-PHASE-3 §5, gate #5): no field, metric, or
 * analytics dimension resembling a modality / learning-style profile may
 * exist anywhere — schema, core, app, or content. The single permitted
 * pointer is ChildProfile.lastUsedMode.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SCAN_ROOTS = ['apps/web', 'packages', 'content'];

// Files whose job is to document or enforce the ban itself.
const ALLOWED_FILES = new Set([
  'packages/core/src/modes.ts',
  'packages/ui/src/tokens.ts',
]);

const PATTERNS = [
  { name: 'learning style', pattern: /learning[\s_-]?style/i },
  { name: 'modality profile/score', pattern: /modalit/i },
  { name: 'learner type label', pattern: /learner[\s_-]?type/i },
  { name: 'preferred/dominant mode-style field', pattern: /(preferred|dominant)[\s_-]?(mode|style|modality|learner)/i },
  { name: '"visual/kinaesthetic/auditory learner"', pattern: /(visual|kinaesthetic|auditory)[\s_-]?learner/i },
];

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

const violations = [];
for (const scanRoot of SCAN_ROOTS) {
  for (const file of collect(join(ROOT, scanRoot))) {
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
console.log('L2 firewall check passed: no modality profile exists anywhere.');
