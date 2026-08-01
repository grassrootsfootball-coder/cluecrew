/**
 * Banned-vocabulary scan (BUILD-PHASE-1 §2; manifesto L1/L2/L6/D1/§6 voice;
 * extended by Addendum A §1.3). Fails CI when banned terms reach a child.
 *
 * Scopes:
 *  - EVERYWHERE terms are banned across all user-facing sources.
 *  - CHILD-FACING terms are banned in child-facing surfaces: the crew routes,
 *    the crew components, the voice packs, the authored content, and the seed's
 *    authored strings.
 *
 * Addendum A §1.3 bans words that are also ordinary code identifiers ("error",
 * "limit"), so child-facing rules are tested against PROSE only: JSX text and
 * string literals that read like sentences. Code like `catch (error)` or
 * `take: limit` is not child-facing copy and is not flagged.
 *
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
  // Addendum B §4: mock reporting may never claim or imply an outcome. The
  // patterns are phrase-precise because the report's honest note legitimately
  // contains "not a predicted result" and "age-standardised" — the scan must
  // catch a claim, not the disclaimer that denies one.
  { name: '"predicted pass" (Addendum B §4 / L1)', pattern: /\bpredicted (pass|score|grade)\b/i },
  { name: '"pass probability" (Addendum B §4 / L1)', pattern: /\bpass (probability|chance|likelihood)\b/i },
  { name: '"will pass" (Addendum B §4 / L1)', pattern: /\b(will|would|should) pass\b/i },
];

// D1 + Addendum A §1.3.
const BANNED_CHILD_FACING = [
  { name: '"fail/failure" (D1)', pattern: /\bfail(s|ed|ure|ures|ing)?\b/i },
  { name: '"wrong" (D1)', pattern: /\bwrong(ly)?\b/i },
  { name: '"incorrect" (§1.3)', pattern: /\bincorrect(ly)?\b/i },
  { name: '"error" in child UI (§1.3)', pattern: /\berrors?\b/i },
  { name: '"behind" (D1)', pattern: /\bbehind\b/i },
  { name: '"weak" (voice)', pattern: /\bweak(er|est|ness)?\b/i },
  { name: '"poor" (voice)', pattern: /\bpoor(ly)?\b/i },
  { name: '"careless" (voice)', pattern: /\bcareless(ly|ness)?\b/i },
  { name: '"should have" (voice)', pattern: /\bshould have\b/i },
  // §1.5: never frame a limit as a restriction.
  { name: '"limit" as a restriction (§1.3/§1.5)', pattern: /\blimits?\b/i },
  { name: '"quota" (§1.3)', pattern: /\bquotas?\b/i },
  { name: '"restricted" (§1.3)', pattern: /\brestrict(ed|ion|ions)?\b/i },
  { name: '"you must" (§1.3)', pattern: /\byou must\b/i },
  { name: '"unfortunately" (§1.3)', pattern: /\bunfortunately\b/i },
  // §1.3: praise the work, never the child.
  { name: 'praise of the child, not the work (§1.3)', pattern: /\b(clever|smart|gifted|genius)\b/i },
  // AMENDMENT-1 D7: the child never sees a paywall, price, upsell, lock-out
  // moment, or any signal that money exists. These may not appear in any
  // child-facing string OR code path — a comment about billing in the child
  // app is a comment one refactor away from a string.
  // Commerce MECHANICS, not English: "The Price of Letters" is an approved
  // case about letter codes, and Word Cards may teach "price" or "pay" — a
  // child reading those sees a puzzle, not a paywall. What may never appear
  // is the machinery of money: currency, payment flows, tiers, upsells.
  { name: 'money signal (D7)', pattern: /£|\bpaywall\b|\bupgrade[sd]?\b|\bsubscri(be|ption|bed)\b|\bpremium\b|\btrial\b|\bcheckout\b|\bbilling\b|\bper month\b|\bfree tier\b|\bpaid (plan|tier|version)\b/i },
];

const PURE_WHITE_BACKGROUND = {
  name: 'pure-white page background (D1/D4: use cream)',
  pattern:
    /background(?:-color)?\s*:\s*(?:#fff\b|#ffffff\b|white\b)|background\s*:\s*['"]?(?:#fff\b|#ffffff\b|white\b)/i,
};

// The review recording guide carries the Plus checklist text — L1 claims are
// banned there like anywhere a parent reads (AMENDMENT-1 gate #5). The
// demand-test pack demands the same of itself (DEMAND-TEST-PACK, prerequisite).
const EVERYWHERE_SCOPE = [
  'apps/web',
  'packages/ui/src',
  'content',
  'docs/review-recording-guide.md',
  'docs/DEMAND-TEST-PACK.md',
  'docs/DEMAND-TEST-PACK-V2.md',
  'docs/LIVE-LAUNCH-PACK-V3.md',
];
const CHILD_FACING_SCOPE = [
  'apps/web/app/crew',
  'apps/web/components/crew',
  'content',
  'packages/db/prisma/seed.ts',
];
const STYLE_SCOPE = ['apps/web', 'packages/ui/src'];

const SCAN_EXTENSIONS = new Set(['.ts', '.tsx', '.css', '.json', '.md', '.mdx']);
const EXCLUDED_SEGMENTS = ['node_modules', '.next', '.lighthouseci', 'e2e', 'test-results', 'playwright-report'];
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

/**
 * Prose a child could actually read: JSX text nodes and sentence-like string
 * literals. Import paths, class names, enum values and single-token strings
 * are not prose and are skipped.
 */
function prosePieces(line, isData) {
  // JSON/markdown are pure content — the whole line is prose.
  if (isData) return [line];

  const pieces = [];

  // JSX text between tags: >Some words<
  for (const match of line.matchAll(/>([^<>{}]{3,})</g)) {
    pieces.push(match[1]);
  }
  // String literals that read like sentences (contain a space).
  for (const match of line.matchAll(/'([^'\\]{3,})'|"([^"\\]{3,})"|`([^`\\$]{3,})`/g)) {
    const value = match[1] ?? match[2] ?? match[3] ?? '';
    if (!value.includes(' ')) continue; // identifiers, paths, class names
    if (/^[\w-]+(\/[\w-]+)+$/.test(value)) continue; // paths
    pieces.push(value);
  }
  return pieces;
}

function scan(scopes, rules, label, { proseOnly = false } = {}) {
  const violations = [];
  const files = [...new Set(scopes.flatMap((scope) => collectFiles(join(ROOT, scope))))];
  for (const file of files) {
    const isData = /\.(json|md|mdx)$/.test(file);
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, index) => {
      if (line.includes('vocab-ok')) return;
      const haystacks = proseOnly ? prosePieces(line, isData) : [line];
      for (const haystack of haystacks) {
        for (const rule of rules) {
          if (rule.pattern.test(haystack)) {
            violations.push(
              `${relative(ROOT, file)}:${index + 1} [${label}] ${rule.name}\n    ${haystack.trim().slice(0, 120)}`,
            );
          }
        }
      }
    });
  }
  return violations;
}

const violations = [
  ...scan(EVERYWHERE_SCOPE, BANNED_EVERYWHERE, 'banned everywhere'),
  ...scan(CHILD_FACING_SCOPE, BANNED_CHILD_FACING, 'banned child-facing', { proseOnly: true }),
  ...scan(STYLE_SCOPE, [PURE_WHITE_BACKGROUND], 'design law'),
];

if (violations.length > 0) {
  console.error('Banned-vocabulary scan FAILED:\n');
  for (const violation of violations) console.error(`  ${violation}\n`);
  process.exit(1);
}
console.log('Banned-vocabulary scan passed (manifesto D1/L-laws + Addendum A §1.3).');
