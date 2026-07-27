/**
 * Banned-vocabulary scan (BUILD-PHASE-1 §2; manifesto L2/L6/D1/§6 voice).
 * Fails CI when banned terms appear in user-facing sources.
 *
 * Scopes:
 *  - EVERYWHERE terms are banned across all user-facing code and content.
 *  - CHILD-FACING terms are banned in child-facing surfaces (crew routes,
 *    /content, and authored child strings in the seed).
 * Also lints for pure-white page backgrounds (D1/D4: cream, never #fff).
 *
 * Escape hatch: a line containing "vocab-ok" is skipped (use sparingly, with
 * a reason in review).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;

const BANNED_EVERYWHERE = [
  { name: '"guarantee" (L1: no outcome guarantees)', pattern: /\bguarantee[ds]?\b/i },
  { name: '"learning style" (L2)', pattern: /\blearning[- ]styles?\b/i },
  { name: '"visual learner" (L2)', pattern: /\b(visual|kinaesthetic|auditory) learners?\b/i },
  { name: '"tutor-proof"', pattern: /\btutor[- ]proof\b/i },
  { name: '"beat the exam"', pattern: /\bbeat the exam\b/i },
  { name: 'third-party marks (L6)', pattern: /\b(for dummies|idiot'?s guide)\b/i },
];

const BANNED_CHILD_FACING = [
  { name: '"fail/failure" (D1)', pattern: /\bfail(s|ed|ure|ures|ing)?\b/i },
  { name: '"wrong" (D1)', pattern: /\bwrong(ly)?\b/i },
  { name: '"behind" (D1)', pattern: /\bbehind\b/i },
  { name: '"weak" (voice)', pattern: /\bweak(er|est|ness)?\b/i },
  { name: '"poor" (voice)', pattern: /\bpoor(ly)?\b/i },
  { name: '"careless" (voice)', pattern: /\bcareless(ly|ness)?\b/i },
  { name: '"should have" (voice)', pattern: /\bshould have\b/i },
];

const PURE_WHITE_BACKGROUND = {
  name: 'pure-white page background (D1/D4: use cream)',
  pattern: /background(?:-color)?\s*:\s*(?:#fff\b|#ffffff\b|white\b)|background\s*:\s*['"]?(?:#fff\b|#ffffff\b|white\b)/i,
};

const EVERYWHERE_SCOPE = ['apps/web', 'packages/ui/src', 'content'];
const CHILD_FACING_SCOPE = ['apps/web/app/crew', 'content', 'packages/db/prisma/seed.ts'];
const STYLE_SCOPE = ['apps/web', 'packages/ui/src'];

const SCAN_EXTENSIONS = new Set(['.ts', '.tsx', '.css', '.json', '.md', '.mdx']);
const EXCLUDED_SEGMENTS = ['node_modules', '.next', 'e2e', 'test-results', 'playwright-report'];
const EXCLUDED_SUFFIXES = ['.test.ts', '.test.tsx', '.d.ts'];

function collectFiles(path) {
  const stats = statSync(path, { throwIfNoEntry: false });
  if (!stats) return [];
  if (stats.isFile()) return [path];
  const out = [];
  for (const entry of readdirSync(path)) {
    const full = join(path, entry);
    if (EXCLUDED_SEGMENTS.some((segment) => full.split('/').includes(segment))) continue;
    const entryStats = statSync(full);
    if (entryStats.isDirectory()) {
      out.push(...collectFiles(full));
    } else {
      const extension = entry.slice(entry.lastIndexOf('.'));
      if (!SCAN_EXTENSIONS.has(extension)) continue;
      if (EXCLUDED_SUFFIXES.some((suffix) => entry.endsWith(suffix))) continue;
      out.push(full);
    }
  }
  return out;
}

function scan(scopes, rules, label) {
  const violations = [];
  const files = [...new Set(scopes.flatMap((scope) => collectFiles(join(ROOT, scope))))];
  for (const file of files) {
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, index) => {
      if (line.includes('vocab-ok')) return;
      for (const rule of rules) {
        if (rule.pattern.test(line)) {
          violations.push(`${relative(ROOT, file)}:${index + 1} [${label}] ${rule.name}\n    ${line.trim()}`);
        }
      }
    });
  }
  return violations;
}

const violations = [
  ...scan(EVERYWHERE_SCOPE, BANNED_EVERYWHERE, 'banned everywhere'),
  ...scan(CHILD_FACING_SCOPE, BANNED_CHILD_FACING, 'banned child-facing'),
  ...scan(STYLE_SCOPE, [PURE_WHITE_BACKGROUND], 'design law'),
];

if (violations.length > 0) {
  console.error('Banned-vocabulary scan FAILED:\n');
  for (const violation of violations) console.error(`  ${violation}\n`);
  process.exit(1);
}
console.log('Banned-vocabulary scan passed.');
