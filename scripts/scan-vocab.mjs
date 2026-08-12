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

// The ban list itself lives in packages/core/src/banned-vocabulary.json — ONE
// canonical copy, shared with the database sweep (pnpm check:db-content) and
// the publish doors, so content cannot pass one gate and fail another. Before
// 2026-08-02 the list lived only here, which is how a database import walked
// past it entirely.
const SHARED = JSON.parse(readFileSync(join(ROOT, 'packages/core/src/banned-vocabulary.json'), 'utf8'));
const toRule = (rule) => ({ name: rule.name, pattern: new RegExp(rule.pattern, 'i') });

const BANNED_EVERYWHERE = SHARED.everywhere.map(toRule);

/**
 * UK SPELLING (David's ruling, 2026-08-02) — these are British exam papers.
 * Same discipline as the ban list: the table is packages/core/src/uk-spelling.json,
 * shared with the gates the database sweep and the publish doors call, so a US
 * spelling cannot pass one and fail the other.
 *
 * `severity: 'warning'` rules are REPORTED and do not fail the run. Those are
 * the words that are genuinely British in another sense — 'practice' the noun,
 * 'meter' the gas meter — where only a person can tell which is meant.
 */
const UK_SPELLING = JSON.parse(readFileSync(join(ROOT, 'packages/core/src/uk-spelling.json'), 'utf8'));
const SPELLING_RULES = [
  {
    name: `${UK_SPELLING.izeRule.family} — UK form is ${UK_SPELLING.izeRule.uk}`,
    pattern: new RegExp(UK_SPELLING.izeRule.pattern),
    // The handful of words that genuinely end -ize in British English.
    allow: new RegExp(UK_SPELLING.allowedIze, 'i'),
    severity: 'error',
  },
  ...UK_SPELLING.rules.map((rule) => ({
    name: `${rule.family} — ${rule.uk}`,
    pattern: new RegExp(rule.pattern, 'i'),
    severity: rule.severity === 'warning' ? 'warning' : 'error',
  })),
];
const SPELLING_ERRORS = SPELLING_RULES.filter((rule) => rule.severity === 'error');
const SPELLING_WARNINGS = SPELLING_RULES.filter((rule) => rule.severity === 'warning');

// D1 + Addendum A §1.3, plus the two rules that carry scanner-only mechanics
// (a source-line exemption marker) and so cannot live in the shared JSON.
const BANNED_CHILD_FACING = [
  ...SHARED.childFacing.map(toRule),
  // AMENDMENT-1 D7, clarified in manifesto v1.4: the child never sees the
  // MACHINERY of money — payment flows, tiers, upsells, product pricing.
  // Commerce shapes are banned in ALL child scope including item content.
  { name: 'commerce machinery (D7)', pattern: /£\s*\d+(\.\d{2})?\s*(\/|\bper\s|a\s)?(month|mo\b|year|week)|\bpaywall\b|\bupgrade[sd]?\b|\bsubscri(be|ption|bed)\b|\bpremium\b|\btrial\b|\bcheckout\b|\bbilling\b|\bper month\b|\bfree tier\b|\bpaid (plan|tier|version)\b|\bfull crew\b|\bcrew plus\b|\bfounding rate\b|\bbursary\b/i },
  // Bare currency is curriculum, not commerce, ONLY inside item content of
  // money-strand-tagged items (D7 clarification, v1.4). A line carrying the
  // `money-strand-item` marker is exempt from THIS rule alone — the commerce
  // rule above still applies to it in full.
  { name: 'bare currency outside money-strand item content (D7)', pattern: /£/, exemptMarker: 'money-strand-item' },
];

// Internal ids must never reach a child (David's ruling, 2026-08-02). Same
// rule as packages/core content-gates; shaped to catch OUR slug conventions
// and not ordinary hyphenated English ("well-behaved", "spring-cleaning").
const INTERNAL_IDS = [
  { name: 'a district slug leaked into child copy', pattern: /\b(?:en|vr|nvr|mq|eq|nq)-[a-z0-9]+-[a-z0-9]+(?:-[a-z0-9]+)*\b/ },
  { name: 'a provenance string leaked into child copy', pattern: /\b(?:ai-draft|ai-corpus):[^\s"']+/ },
  { name: 'an internal status leaked into child copy', pattern: /\b(?:PASS_TO_HUMAN|FIXED_THEN_PASS)\b/ },
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
  'docs/LIVE-LAUNCH-PACK-V3.md',
];
const CHILD_FACING_SCOPE = [
  'apps/web/app/crew',
  'apps/web/components/crew',
  'content',
  'packages/db/prisma/seed.ts',
  // Generated NVR prompts are child-facing copy that no author will ever
  // re-read — the scanner is the only thing standing between a template
  // string and a child (BUILD-DISTRICT-NVR).
  'packages/core/src/nvr',
];
const STYLE_SCOPE = ['apps/web', 'packages/ui/src'];

/**
 * Where CHILD COPY actually lives. Narrower than CHILD_FACING_SCOPE on
 * purpose: /content also holds plans, configs and blueprint metadata whose
 * `sourceRef` and `evidence` fields cite slugs by design. Those are staff
 * prose. Pointing an id-leak rule at them would flag correct work every run,
 * and a rule that cries wolf gets switched off.
 *
 * The database sweep (pnpm check:db-content) covers the served surfaces —
 * item stems, options, hints, word cards, case narratives — with the same
 * rule, so nothing child-facing is left unwatched by this narrowing.
 */
const CHILD_COPY_SCOPE = [
  'apps/web/app/crew',
  'apps/web/components/crew',
  'packages/core/src/nvr',
  'content/voice',
  'content/words',
  'content/cases',
];

const SCAN_EXTENSIONS = new Set(['.ts', '.tsx', '.css', '.json', '.md', '.mdx']);
const EXCLUDED_SEGMENTS = ['node_modules', '.next', '.lighthouseci', 'e2e', 'test-results', 'playwright-report'];
/**
 * /content/exports is GENERATED — reviewer packs and the reports that list
 * failing copy. A report about banned words necessarily quotes them, so
 * scanning it would flag the very document written to get them fixed.
 *
 * /content/review-returns is the mirror of that: copy coming BACK, quoted
 * verbatim as the reviewer wrote it. Same reason, and the exemption costs
 * nothing, because nothing in that directory reaches a child without going
 * through `import:review-decisions`, which screens every string with the
 * shared gates before it writes and refuses the ones that fail.
 */
/**
 * /content/passages holds TEXT WE DID NOT WRITE and may not alter: fifteen
 * public-domain extracts, verbatim by design and verified so. Kipling's
 * "fibers" is Kipling's, not a spelling slip of ours, and the only way to
 * satisfy a scanner pointed at it would be to edit the literature.
 *
 * This is the manifesto's quotation carve-out (v1.9) applied to the file the
 * quotation lives in rather than to a span declared inside an item.
 *
 * It covers the EVERYWHERE rules too, which is the one part worth arguing.
 * Those rules exist to stop US promising a child an outcome; the L1 pattern
 * duly fired on Jerome K. Jerome's "would pass him up the hammer". A novel
 * published in 1889 cannot make a claim on our behalf, and the alternative —
 * editing the literature to satisfy a scanner — is precisely what the
 * verbatim brief forbids. Flagged to David rather than assumed: if this
 * should be narrower, it is one line.
 */
/**
 * /content/pilot-review holds pilot item BATCHES under active review (R47). The scanner reads a
 * JSON file as one flat blob of text, so it cannot tell a child-facing `stem.text` from the
 * reviewer-facing fields beside it — and the hits here are entirely the latter:
 * `misconceptionExecution` (authoring rationale a reviewer reads, e.g. "Right arrangement, wrong
 * person") and `misconceptionId` (internal ids like `en-wrong-scope-retrieval`). Neither reaches
 * a child.
 *
 * The exemption costs nothing for the same reason review-returns' does: these files have a gate,
 * a NARROWER one. Every write goes through `scripts/lib/pilot-review.ts`, which runs
 * `checkItemChildFacing` over exactly the child-facing fields — stem, options, walk script, hint
 * core — and refuses a ruling that would introduce a failure. Checked before excluding rather
 * than assumed: all 84 child-facing fields in ENG-004 contain no banned word, and every one of
 * the scanner's hits was reviewer-facing metadata.
 */
const EXCLUDED_PATHS = ['content/exports', 'content/review-returns', 'content/pilot-review'];
const SOURCE_TEXT_PATHS = ['content/passages'];
const EXCLUDED_SUFFIXES = ['.test.ts', '.test.tsx', '.d.ts'];

function collectFiles(path) {
  const stats = statSync(path, { throwIfNoEntry: false });
  if (!stats) return [];
  if (stats.isFile()) return [path];
  const out = [];
  for (const entry of readdirSync(path)) {
    const full = join(path, entry);
    if (EXCLUDED_SEGMENTS.some((segment) => full.split('/').includes(segment))) continue;
    if (EXCLUDED_PATHS.some((excluded) => full.includes(excluded))) continue;
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
function prosePieces(line, isData, { sentencesOnly = false } = {}) {
  // JSON/markdown are pure content — the whole line is prose. Except when a
  // rule cares about IDENTIFIERS: then a JSON line must be read value by
  // value, or a structural key like "kind": "nvr-district-plan" reads as
  // child copy containing a slug, which it plainly is not.
  if (isData && sentencesOnly) {
    return [...line.matchAll(/"([^"\\]{3,})"/g)]
      .map((match) => match[1])
      .filter((value) => value.includes(' '));
  }
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

/**
 * THE PASSAGE-QUOTE CARVE-OUT (manifesto v1.5, ratified 2026-08-02).
 *
 * The ban list polices PRODUCT VOICE — stems, options, hints, Walk scripts,
 * UI, emails. A curated pre-1950 literary extract is not our voice, and
 * rewriting it to dodge the scan would both falsify the source and make our
 * papers unlike the real ones, which quote it unaltered.
 *
 * A span claims the exemption structurally, never with a comment marker:
 *
 *   { "text": "…", "passageQuote": true,
 *     "passageRef": "csse-tobermory", "lineRefs": [12, 13] }
 *
 * The claim is expensive on purpose. `passageRef` must resolve to a real
 * passage in /content/passages, so an author cannot launder their own
 * sentence through the exemption without first putting that sentence into a
 * curated, reviewed passage. A claim that does not resolve is itself
 * reported, and its text stays fully in scope — a broken exemption must
 * never read as a passing one.
 *
 * The exemption covers the quoted span and nothing else. A stem discussing
 * the quote is our wording and stays in scope.
 */
const PASSAGE_DIR = join(ROOT, 'content/passages');

function knownPassageIds() {
  const ids = new Set();
  const stats = statSync(PASSAGE_DIR, { throwIfNoEntry: false });
  if (!stats?.isDirectory()) return ids;
  for (const entry of readdirSync(PASSAGE_DIR)) {
    if (!entry.endsWith('.json')) continue;
    try {
      const parsed = JSON.parse(readFileSync(join(PASSAGE_DIR, entry), 'utf8'));
      const id = parsed?.passage?.id ?? parsed?.id;
      if (typeof id === 'string') ids.add(id);
    } catch {
      // A malformed passage file is validate:content's business, not ours.
    }
  }
  return ids;
}

const PASSAGE_IDS = knownPassageIds();

/**
 * THE `headwordInOwnCard` EXEMPTION (David's ruling, 2026-08-02).
 *
 * A Word card may use its OWN headword in its definition, sentence and image
 * prompt even when that headword is on the ban list — the card teaching
 * "guarantee" must be able to say "the shop guarantees the bike". That is
 * vocabulary, not an outcome claim, and no rewording can remove it.
 *
 * A scanner RULE, not a per-card exception: nothing is listed anywhere, and
 * it derives entirely from the card. Bounded to the headword, inside its own
 * card, and only where the headword IS the banned term — so a card teaching
 * "brave" gets nothing, and a "guarantee" card that also says "clever" still
 * fails on "clever". The matching logic mirrors packages/core content-gates.
 */
const MAX_INFLECTION_DELTA = 3;

function isInflectionOf(candidate, headword) {
  const a = candidate.toLowerCase().replace(/[^a-z]/g, '');
  const b = headword.toLowerCase().replace(/[^a-z]/g, '');
  if (!a || !b) return false;
  if (a === b) return true;
  const [longer, shorter] = a.length >= b.length ? [a, b] : [b, a];
  return longer.startsWith(shorter) && longer.length - shorter.length <= MAX_INFLECTION_DELTA;
}

/**
 * Word-card fields in a content file, each mapped to the headword that card
 * teaches. The needle must be SPECIFIC: a bare "guarantee" would also appear
 * inside another card's sentence about guarantees, which would hand that card
 * an exemption it has not earned. So identity fields are matched in their
 * quoted JSON form and prose fields by their full text, both of which belong
 * to exactly one card.
 */
function wordCardTexts(file) {
  const pairs = [];
  if (!file.endsWith('.json')) return pairs;
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return pairs;
  }
  if (parsed?.kind !== 'words' || !Array.isArray(parsed.words)) return pairs;
  for (const word of parsed.words) {
    if (typeof word?.headword !== 'string') continue;
    // The card's own identity: without this a card teaching a ban-list word
    // could not carry its own headword or slug, so it could not exist.
    for (const identity of [word.headword, word.id]) {
      if (typeof identity === 'string' && identity.trim()) {
        pairs.push({ needle: `"${identity}"`, headword: word.headword });
      }
    }
    for (const field of ['definitionChild', 'sentence', 'imagePrompt', 'imagePromptB']) {
      if (typeof word[field] === 'string' && word[field].trim()) {
        pairs.push({ needle: word[field], headword: word.headword });
      }
    }
  }
  return pairs;
}

/** Walks parsed JSON, returning exempt spans and any broken claims. */
function passageQuotesIn(file) {
  const exemptText = new Set();
  const problems = [];
  if (!file.endsWith('.json')) return { exemptText, problems };
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return { exemptText, problems };
  }
  // A passage file IS the quoted source. Its `lines` are the extract itself,
  // so they carry the same exemption the quoting item does — without this the
  // carve-out would be unusable, because the curated extract could never be
  // authored in the first place. Everything else in the file stays in scope,
  // and `preamble` especially: the scene-setting sentence is OUR wording.
  if (parsed?.kind === 'english-passage' && Array.isArray(parsed.passage?.lines)) {
    for (const line of parsed.passage.lines) {
      if (typeof line === 'string' && line.trim() !== '') exemptText.add(line);
    }
  }

  const walk = (node, path) => {
    if (Array.isArray(node)) {
      node.forEach((child, index) => walk(child, `${path}[${index}]`));
      return;
    }
    if (!node || typeof node !== 'object') return;
    if (node.passageQuote === true) {
      const where = `${relative(ROOT, file)} ${path || '(root)'}`;
      if (typeof node.text !== 'string' || node.text.trim() === '') {
        problems.push(`${where}: passageQuote with no text to exempt`);
      } else if (typeof node.passageRef !== 'string' || node.passageRef.trim() === '') {
        problems.push(`${where}: passageQuote claims the carve-out without a passageRef`);
      } else if (!PASSAGE_IDS.has(node.passageRef)) {
        problems.push(
          `${where}: passageQuote names passageRef "${node.passageRef}", which is not a passage in /content/passages`,
        );
      } else {
        exemptText.add(node.text);
      }
    }
    for (const [key, child] of Object.entries(node)) walk(child, path ? `${path}.${key}` : key);
  };
  walk(parsed, '');
  return { exemptText, problems };
}

function scan(
  scopes,
  rules,
  label,
  { proseOnly = false, allowPassageQuotes = false, sentencesOnly = false, excludePaths = [] } = {},
) {
  const violations = [];
  const files = [...new Set(scopes.flatMap((scope) => collectFiles(join(ROOT, scope))))].filter(
    (file) => !excludePaths.some((path) => relative(ROOT, file).startsWith(path)),
  );
  for (const file of files) {
    const isData = /\.(json|md|mdx)$/.test(file);
    // Computed for EVERY scope: the "guarantee" rule lives in the
    // everywhere list, so gating this on the child-facing pass would have
    // left the exemption unable to reach the rule it exists for.
    const cardTexts = wordCardTexts(file);
    const { exemptText, problems } = allowPassageQuotes
      ? passageQuotesIn(file)
      : { exemptText: new Set(), problems: [] };
    for (const problem of problems) {
      violations.push(`${problem}\n    [invalid passageQuote claim — the span stays in scope]`);
    }
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, index) => {
      if (line.includes('vocab-ok')) return;
      // The exemption covers the quoted SPAN, not the line it sits on: a
      // stem and the quote it discusses share a line in single-line JSON, and
      // skipping the whole line would exempt our own wording along with the
      // source. So cut the quoted spans out and scan what is left, which is
      // by definition ours.
      const withoutQuotes = (text) => {
        let out = text;
        for (const quoted of exemptText) out = out.split(quoted).join(' ');
        return out;
      };
      const haystacks = (proseOnly ? prosePieces(line, isData, { sentencesOnly }) : [line])
        .map(withoutQuotes)
        .filter((piece) => piece.trim() !== '');
      for (const haystack of haystacks) {
        // headwordInOwnCard: if this text is a field of a Word card whose
        // headword trips a rule, blank that headword out of THIS rule's view.
        const card = cardTexts.find((pair) => haystack.includes(pair.needle));
        for (const rule of rules) {
          // A rule-scoped exemption (D7 v1.4): the marker lifts exactly one
          // rule on exactly this line — every other rule still applies.
          if (rule.exemptMarker && line.includes(rule.exemptMarker)) continue;
          const tested =
            card && rule.pattern.test(card.headword)
              ? haystack.replace(new RegExp(rule.pattern.source, 'gi'), (match) =>
                  isInflectionOf(match, card.headword) ? ' '.repeat(match.length) : match,
                )
              : haystack;
          // An `allow` regex makes the rule morphological rather than a word
          // list: match broadly, then drop the matches that are legitimate.
          // Without it the -ize rule would flag "size" and "seized".
          // Re-compiled with the rule's OWN flags plus /g. Hard-coding /gi here
          // would quietly restore case-insensitivity to a rule that is
          // case-sensitive on purpose, and `fontSize` would read as American.
          const hit = rule.allow
            ? (
                tested.match(
                  new RegExp(rule.pattern.source, `${rule.pattern.flags.replace('g', '')}g`),
                ) ?? []
              ).some((match) => !rule.allow.test(match))
            : rule.pattern.test(tested);
          if (hit) {
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
  ...scan(EVERYWHERE_SCOPE, BANNED_EVERYWHERE, 'banned everywhere', { excludePaths: SOURCE_TEXT_PATHS }),
  ...scan(CHILD_FACING_SCOPE, BANNED_CHILD_FACING, 'banned child-facing', {
    excludePaths: SOURCE_TEXT_PATHS,
    proseOnly: true,
    // Only the child-facing rules carve out quoted passage text; the
    // everywhere rules (L1 claims, L2, L6) apply to a quote as much as to
    // anything else — a source that says "guaranteed" is still a claim if
    // we reprint it.
    allowPassageQuotes: true,
  }),
  ...scan(CHILD_FACING_SCOPE, SPELLING_ERRORS, 'US spelling', {
    excludePaths: SOURCE_TEXT_PATHS,
    proseOnly: true,
    // A quotation is someone else's text and we do not re-spell it — the
    // same carve-out the child-facing ban rules take.
    allowPassageQuotes: true,
    // Sentences, not identifiers — the same reason the internal-id scan takes
    // this. A Case's `"kind": "practice"` is structure, and `fontSize` is
    // code; flagging either would train everyone to ignore the rule.
    sentencesOnly: true,
  }),
  ...scan(STYLE_SCOPE, [PURE_WHITE_BACKGROUND], 'design law'),
  // Child-facing surfaces only: an id in an admin page is the reviewer's
  // working vocabulary and belongs there.
  ...scan(CHILD_COPY_SCOPE, INTERNAL_IDS, 'internal id in child copy', {
    proseOnly: true,
    // Sentences, not identifiers: a file's `kind` or a plan's template name is
    // structure, and flagging it would train everyone to ignore this rule.
    sentencesOnly: true,
  }),
];

// Reported, never blocking: see the severity note on the spelling table.
const spellingWarnings = scan(CHILD_FACING_SCOPE, SPELLING_WARNINGS, 'UK spelling — check the sense', {
  proseOnly: true,
  allowPassageQuotes: true,
  sentencesOnly: true,
});
if (spellingWarnings.length > 0) {
  console.log(`UK spelling, ${spellingWarnings.length} to check by hand (not blocking):\n`);
  for (const warning of spellingWarnings) console.log(`  ${warning}\n`);
}

if (violations.length > 0) {
  console.error('Banned-vocabulary scan FAILED:\n');
  for (const violation of violations) console.error(`  ${violation}\n`);
  process.exit(1);
}
console.log('Banned-vocabulary scan passed (manifesto D1/L-laws + Addendum A §1.3).');
