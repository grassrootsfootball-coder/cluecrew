/**
 * Reading-age lint (BUILD-PHASE-4 §5/§8): child-facing authored content must
 * read at age ≤9.
 *
 * CHECKED BY ROLE (David's spec correction, 2026-08-02). The 16-word
 * sentence cap applies to what a child reads under pressure — item stems,
 * options, instructions, narrative and voice. It does NOT apply to a
 * Word-card sentence: disambiguating a meaning is that sentence's required
 * function and a long one is often correct. Word cards keep the vocabulary
 * ceiling and lose the length cap.
 *
 * A Word card deliberately TEACHES a hard word, so the headword itself is
 * exempt — what we lint is the wording AROUND it. Flesch-Kincaid on 5-word
 * snippets punishes the very word being taught, so it is not used here.
 *
 * The rules themselves live in packages/core/src/content-gates.ts, shared
 * with the database sweep (pnpm check:db-content) so content cannot pass one
 * gate and fail the other.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const MAX_SENTENCE_WORDS = 16;
const MAX_LONG_WORDS = 1;

/** Ruling 2026-08-02: roles whose sentences are NOT length-capped. */
const UNCAPPED_ROLES = new Set(['word-card']);

function syllables(word) {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
  if (cleaned.length <= 3) return 1;
  const matches = cleaned.replace(/e$/, '').match(/[aeiouy]{1,2}/g);
  return Math.max(1, matches ? matches.length : 1);
}

const failures = [];

function check(label, text, exemptStem = '', role = 'item-stem') {
  const stem = exemptStem.toLowerCase().slice(0, 6);
  if (!UNCAPPED_ROLES.has(role)) {
    const sentences = text.split(/[.!?]/).map((sentence) => sentence.trim()).filter(Boolean);
    for (const sentence of sentences) {
      const words = sentence.split(/\s+/).filter(Boolean);
      if (words.length > MAX_SENTENCE_WORDS) {
        failures.push(`${label}: sentence has ${words.length} words (max ${MAX_SENTENCE_WORDS}): "${sentence.slice(0, 60)}…"`);
      }
    }
  }
  const words = text.split(/\s+/).filter(Boolean);
  const longWords = words.filter((word) => {
    const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
    if (stem && cleaned.startsWith(stem)) return false; // the taught word is exempt
    return syllables(cleaned) >= 4;
  });
  if (longWords.length > MAX_LONG_WORDS) {
    failures.push(`${label}: too many long words around the headword (${longWords.join(', ')})`);
  }
}

const wordsFile = JSON.parse(readFileSync(join(ROOT, 'content/words/words.json'), 'utf8'));
for (const word of wordsFile.words) {
  // role 'word-card': vocabulary ceiling only, no sentence-length cap.
  check(`word:${word.id} definition`, word.definitionChild, word.headword, 'word-card');
  check(`word:${word.id} sentence`, word.sentence, word.headword, 'word-card');
}

// Case narrative intros AND the story skin. The wrapper's open/close lines were outside this
// lint until 2026-08-12 — up to 700 and 240 characters of child-facing story prose with no
// sentence-length or vocabulary coverage, because this loop stopped at narrativeIntro.text.
// Clue-skin labels are counted too: a label is the word a child reads in place of the frame's own.
//
// AND THE TITLE, which was outside this lint until 2026-08-17 (David's ruling, building the first
// English case). It is the case NAME ON THE MAP — the first child-facing English string a child
// reads, and the loop went straight past it to `narrativeIntro.text`. The same shape as the story
// wrapper two lines up: a field that was always child-facing and never screened, invisible because
// everything the loop DID screen passed. Role 'word-card': a title is a name, not a sentence, so
// the vocabulary ceiling applies and the sentence-length cap does not.
let storyWrappers = 0;
let caseCount = 0;
for (const file of readdirSync(join(ROOT, 'content/cases'))) {
  if (!file.endsWith('.json')) continue;
  caseCount += 1;
  const parsed = JSON.parse(readFileSync(join(ROOT, 'content/cases', file), 'utf8'));
  check(`case:${parsed.case.id} title`, parsed.case.title, undefined, 'word-card');
  check(`case:${parsed.case.id} narrative`, parsed.case.narrativeIntro.text);
  const wrapper = parsed.case.storyWrapper;
  if (!wrapper) continue;
  storyWrappers += 1;
  check(`case:${parsed.case.id} storyWrapper.open`, wrapper.open);
  check(`case:${parsed.case.id} storyWrapper.close`, wrapper.close);
  for (const [slot, label] of Object.entries(wrapper.clueSkinLabels ?? {})) {
    check(`case:${parsed.case.id} storyWrapper.clueSkinLabels.${slot}`, label);
  }
}

// Voice packs (Addendum A §1.4) — every authored variant a child hears.
let voiceLines = 0;
for (const file of readdirSync(join(ROOT, 'content/voice'))) {
  if (!file.endsWith('.json')) continue;
  const pack = JSON.parse(readFileSync(join(ROOT, 'content/voice', file), 'utf8'));
  const groups = [
    ...(pack.variants ? [['', pack.variants]] : []),
    ...Object.entries(pack.byFamily ?? {}),
    ...Object.entries(pack.beats ?? {}),
  ];
  for (const [group, variants] of groups) {
    variants.forEach((line, index) => {
      voiceLines++;
      check(`voice:${pack.beat}${group ? `/${group}` : ''}[${index}]`, line);
    });
  }
}

// Blueprint instruction pages (Addendum B §2): exam-faithful in register but
// still child-facing authored text, so the same ceiling applies — we test the
// question types, not the child's decoding of our instructions.
let blueprintPages = 0;
for (const file of readdirSync(join(ROOT, 'content/blueprints'))) {
  if (!file.endsWith('.json')) continue;
  const parsed = JSON.parse(readFileSync(join(ROOT, 'content/blueprints', file), 'utf8'));
  parsed.blueprint.sections.forEach((section, index) => {
    blueprintPages++;
    check(`blueprint:${parsed.blueprint.id} section ${index + 1} instructions`, section.instructions);
  });
}

// Chapter prose (STORY BIBLE Law 3 + map rule 3, the reading-age ladder):
// each chapter declares its own readingAgeTarget (default 9, Ch1 ≈ 8.5
// rising to ≈10). The sentence-length ceiling scales with the target —
// 16 words at age 9, proportionally looser or tighter either side. Seeded
// Vault words are the DELIBERATE stretch (Law 5), so [[marked]] words are
// exempt from the long-word count, exactly like Word-card headwords.
let chapterCount = 0;
const chaptersDir = join(ROOT, 'content/chapters');
try {
  for (const file of readdirSync(chaptersDir)) {
    if (!file.endsWith('.json')) continue;
    const { chapter } = JSON.parse(readFileSync(join(chaptersDir, file), 'utf8'));
    chapterCount++;
    const target = chapter.readingAgeTarget ?? 9;
    const maxSentence = Math.round(MAX_SENTENCE_WORDS * (target / 9));
    const prose = chapter.body.replace(/\[\[([^\]]+)\]\]/g, '');
    const chapterSentences = prose.split(/[.!?]/).map((s) => s.trim()).filter(Boolean);
    for (const sentence of chapterSentences) {
      const words = sentence.split(/\s+/).filter(Boolean);
      if (words.length > maxSentence) {
        failures.push(
          `chapter:${chapter.id} (target ${target}) sentence of ${words.length} words (max ${maxSentence}): "${sentence.slice(0, 60)}…"`,
        );
      }
    }
  }
} catch {
  // No /content/chapters yet — the ladder starts linting when authoring lands.
}

/**
 * COMPONENT COPY — THE SURFACE THIS LINT HAD NEVER OPENED (David's ruling, 2026-08-19 — R242).
 *
 * Until now this file read `content/` JSON and nothing else: words, cases, voice packs, blueprints,
 * chapters. **It had never opened a `.tsx`.** So every child-facing string authored INLINE in a
 * component — the five mode blurbs, the scope notes, the Walk copy written the same day — was
 * vocabulary-scanned (`scan:vocab` covers `apps/web/components/crew`) and never reading-age
 * screened. **The exposure measured zero sentences over the cap**, which is clean by authoring
 * habit rather than by anything checking, and R62's line applies exactly: zero divergence is an
 * outcome, not evidence the design held.
 *
 * WHAT COUNTS AS CHILD-FACING COPY HERE, and why it is a shape test rather than a list: a quoted
 * string of at least 25 characters, containing a space, ending on a full stop, question mark or
 * exclamation mark. That is what a sentence to a child looks like. Identifiers, class names, test
 * ids, URLs and template expressions fail the shape and are skipped. **A list of "the strings that
 * matter" would drift on the first commit** (R57) — the shape does not.
 *
 * It screens the CREW surfaces only: `apps/web/components/crew` and `apps/web/app/crew`. Admin and
 * debug pages are staff-facing and their copy is not held to a child's reading age.
 */
/*
 * THE THREE GAPS ANNIE NAMED, CLOSED 2026-08-19 (R270). All three were vocabulary-scanned and
 * outside this cap:
 *
 *   · `apps/web/lib/crew` — the district map's seven quarter NAMES and seven BLURBS, which a child
 *     reads every session on the map she opens first;
 *   · `packages/core/src/nvr` — generated prompt templates that expand into copy NO AUTHOR EVER
 *     RE-READS, which is the argument the vocabulary scanner's own comment makes for covering them
 *     and applies to sentence length exactly as well;
 *   · `packages/db/prisma/seed.ts` — seeded copy. Lower risk, because most of what it writes is
 *     screened again by the database sweep once it lands — but "screened later" depends on the row
 *     reaching a table the sweep reads, and that is an assumption, not a guarantee.
 *
 * Passages stay out and that is A DECISION, NOT A GAP: pre-1950 source text is the content under
 * test, so an archaic word and a long sentence are the item rather than a fairness failure.
 */
const COPY_ROOTS = [
  'apps/web/components/crew',
  'apps/web/app/crew',
  'apps/web/lib/crew',
  'packages/core/src/nvr',
  'packages/db/prisma',
];

/**
 * **A FILE IS NOT A SURFACE, AND THE DATA FILES HOLD BOTH KINDS OF STRING.** Widening to
 * `packages/db/prisma` flagged five sentences, and the longest were misconception `description`
 * fields — **teacher-facing by schema**, where a 30-word sentence is correct and capping it would
 * be a fault. A blanket file scan cannot tell those from a stem sitting six lines away.
 *
 * So in a DATA file a string is linted only when the key it is assigned to is child-facing. In a
 * COMPONENT there is no key — JSX text is the surface — so the shape test governs there. Two
 * modes, because the two file kinds genuinely differ; a single rule would either miss the stems or
 * cap the teacher notes.
 */
const DATA_ROOTS = ['packages/core/src/nvr', 'packages/db/prisma'];
const CHILD_FACING_KEYS = /\b(childHint|prompt|stem|text|title|blurb|narrativeIntro|hintCore|walkScript|label|value|instruction|question)\s*:/;
const TEACHER_FACING_KEYS = /\b(description|note|notes|reason|evidence|rationale|method|summary)\s*:/;
const COPY_SHAPE = /(['"`])([^'"`\n]{25,240}?[.?!])\1/g;
const NOT_COPY = /[<>{}$]|https?:|data-[a-z]|aria-[a-z]{4}|^[A-Z_]+$/;

let componentFiles = 0;
let componentStrings = 0;
const walkDir = (dir, out) => {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walkDir(full, out);
    else if (/\.tsx?$/.test(entry.name) && !/\.(test|spec)\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
};

for (const root of COPY_ROOTS) {
  for (const file of walkDir(join(ROOT, root), [])) {
    componentFiles++;
    const src = readFileSync(file, 'utf8')
      // A comment is not copy. Prose ABOUT a string would otherwise be linted as the string
      // (the same fault that made a doc comment "read the explanation blob" — R243).
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');
    const label = file.slice(ROOT.length);
    const isData = DATA_ROOTS.some((r) => label.replace(/^\//, '').startsWith(r));
    for (const line of src.split('\n')) {
      for (const match of line.matchAll(COPY_SHAPE)) {
        const text = match[2];
        if (NOT_COPY.test(text)) continue;
        if (isData) {
          // Keyed mode: lint it only if the key on this line is one a child reads.
          const before = line.slice(0, match.index ?? 0);
          if (TEACHER_FACING_KEYS.test(before)) continue;
          if (!CHILD_FACING_KEYS.test(before)) continue;
        }
        componentStrings++;
        check(`copy:${label}`, text, '', 'item-stem');
      }
    }
  }
}

if (failures.length > 0) {
  console.error(`Reading-age lint FAILED (${failures.length}):\n`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}
// The wrapper count is stated rather than folded into "case narratives", because zero is the
// number today and a reader has to be able to tell "none authored yet" from "covered" (R60).
console.log(
  `Reading-age lint passed (${wordsFile.words.length} words + ${caseCount} case title(s) and narrative(s) + ${storyWrappers} story wrapper(s) + ${voiceLines} voice lines + ${blueprintPages} blueprint instruction pages + ${chapterCount} chapter(s) + ${componentStrings} component copy string(s) across ${componentFiles} crew component file(s)).`,
);
if (componentStrings === 0) {
  console.error(
    '  component copy: ZERO STRINGS MATCHED. This surface has copy in it, so a zero means the\n' +
      '  shape test has stopped matching, not that the copy is gone. Refusing to report a pass.',
  );
  process.exit(1);
}
if (storyWrappers === 0) {
  console.log(
    '  story wrappers: NONE AUTHORED — the open/close lines are now in scope, but no case carries\n' +
      '  one yet, so nothing was screened there. This line disappears the day the first one lands.',
  );
}
