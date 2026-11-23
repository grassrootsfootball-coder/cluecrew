/**
 * Seed (BUILD-PHASE-1 §7): 21 VR QuestionTypes, misconceptions, 40 synthetic
 * Items across 3 VR types (authoredBy "seed", status DRAFT — never shippable),
 * 60 Words read from /content/words/words.json, 3 Cases from /content/cases,
 * and (outside production) one test family with seed-flow events.
 *
 * Idempotent: everything uses deterministic ids and upserts.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { hash } from '@node-rs/argon2';
import { assertNoReviewedRewrite, classifyDerivedWrites } from './reviewed-guard';
import { ENGLISH_QUESTION_TYPES, MATHS_QUESTION_TYPES, buildDerivedVrDistractors, caseFileSchema, regionFileSchema, vrLetterOf, wordFileSchema, type VrOperands } from '@cluecrew/core';
import { prisma } from '../src/index';

const CONTENT_ROOT = resolve(import.meta.dirname, '../../../content');

// The 21 GL-style VR question types. Names reference the GL familiarisation
// categories factually (manifesto L3); all item content is original (L4).
const VR_TYPES: Array<{ num: number; slug: string; name: string; mechanic: string }> = [
  { num: 1, slug: 'insert-letter', name: 'Insert a Letter', mechanic: 'letter-slot' },
  { num: 2, slug: 'two-odd-ones-out', name: 'Two Odd Ones Out', mechanic: 'select-two' },
  { num: 3, slug: 'related-words', name: 'Related Words', mechanic: 'select-two' },
  { num: 4, slug: 'closest-meaning', name: 'Closest Meaning', mechanic: 'select-one' },
  { num: 5, slug: 'hidden-word', name: 'Hidden Word', mechanic: 'letter-hunt' },
  { num: 6, slug: 'missing-word', name: 'Missing Word', mechanic: 'letter-slot' },
  { num: 7, slug: 'letters-for-numbers', name: 'Letters for Numbers', mechanic: 'code-sum' },
  { num: 8, slug: 'move-letter', name: 'Move a Letter', mechanic: 'letter-move' },
  { num: 9, slug: 'letter-series', name: 'Letter Series', mechanic: 'series-next' },
  { num: 10, slug: 'word-connections', name: 'Word Connections', mechanic: 'analogy' },
  { num: 11, slug: 'number-series', name: 'Number Series', mechanic: 'series-next' },
  { num: 12, slug: 'compound-words', name: 'Compound Words', mechanic: 'word-join' },
  { num: 13, slug: 'make-a-word', name: 'Make a Word', mechanic: 'word-build' },
  { num: 14, slug: 'letter-connections', name: 'Letter Connections', mechanic: 'letter-analogy' },
  { num: 15, slug: 'reading-information', name: 'Reading Information', mechanic: 'logic-read' },
  { num: 16, slug: 'opposite-meaning', name: 'Opposite Meaning', mechanic: 'select-two' },
  { num: 17, slug: 'complete-the-sum', name: 'Complete the Sum', mechanic: 'equation-balance' },
  { num: 18, slug: 'related-numbers', name: 'Related Numbers', mechanic: 'number-triples' },
  { num: 19, slug: 'word-number-codes', name: 'Word-Number Codes', mechanic: 'code-grid' },
  { num: 20, slug: 'complete-the-word', name: 'Complete the Word', mechanic: 'letter-slot' },
  { num: 21, slug: 'same-meaning', name: 'Same Meaning', mechanic: 'select-two' },
];

export function vrTypeId(num: number, slug: string): string {
  return `vr-${String(num).padStart(2, '0')}-${slug}`;
}

// Every distractor maps to a tagged misconception (P3). Child hints use
// "not yet" language only (D1). Teach-Back content is authored here (S3) —
// the mascot's working, the slip, and pick-from corrections.
const MISCONCEPTIONS: Array<{
  id: string;
  description: string;
  childHint: string;
  teachback?: { working: string[]; wrongStepIndex: number; corrections: Array<{ text: string; correct: boolean }> };
}> = [
  {
    id: 'vr-series-step-carryover',
    description: 'Reused the previous step instead of spotting that the step size changes.',
    childHint: 'Look at the jumps between the numbers. Do the jumps stay the same, or do they grow?',
    teachback: {
      working: [
        'I found the jumps: 3, then 4, then 5.',
        'The last jump was 5, so the next jump is 5 again.',
        'So my answer is the last number plus 5.',
      ],
      wrongStepIndex: 1,
      corrections: [
        { text: 'The jumps grow by one each time, so the next jump is 6.', correct: true },
        { text: 'The jumps repeat in a loop, so the next jump is 3.', correct: false },
        { text: 'The next jump is the two last jumps added together.', correct: false },
      ],
    },
  },
  {
    id: 'vr-series-off-by-one',
    description: 'Identified the rule but slipped by one when applying it.',
    childHint: 'Your rule looks right — count the last jump one more time, nice and slowly.',
    teachback: {
      working: [
        'The rule is: add 4 each time.',
        'The last number is 18, and 18 add 4 makes 23.',
      ],
      wrongStepIndex: 1,
      corrections: [
        { text: '18 add 4 makes 22 — count it on your fingers to check.', correct: true },
        { text: 'The rule should be add 5, not add 4.', correct: false },
      ],
    },
  },
  {
    id: 'vr-series-direction',
    description: 'Applied the step in the opposite direction.',
    childHint: 'Check which way the trail is heading. Is it climbing up or stepping down?',
    teachback: {
      working: [
        'The numbers are 20, 17, 14, 11.',
        'The gap is 3, so the next number is 11 add 3, which is 14.',
      ],
      wrongStepIndex: 1,
      corrections: [
        { text: 'The trail is stepping DOWN by 3, so the next number is 8.', correct: true },
        { text: 'The gap changes to 4, so the next number is 15.', correct: false },
      ],
    },
  },
  {
    // Reviewer-authored (2026-08-06), replacing the retired direction distractor
    // for constant-step series. Her wording, verbatim.
    id: 'vr-series-step-applied-twice',
    description: 'Added the step twice from the last term, usually after losing track of the gaps.',
    childHint: 'Take one jump from the last number, not two. Check the gaps first.',
  },
  {
    // Reviewer-authored (2026-08-06), the optional fourth for constant series.
    id: 'vr-series-sum-of-last-two',
    description: 'Read the series as each term being the sum of the two before it, and added the last pair.',
    childHint: 'Look at the gap between each pair. The gap is what tells you the next number.',
  },
  {
    id: 'vr-letter-series-step-repeat',
    description: 'Applied the letter step twice, overshooting the target.',
    childHint: 'One jump at a time! Count the step from the last letter just once.',
  },
  {
    id: 'vr-letter-series-off-by-one',
    description: 'Correct rule, but landed one letter short or long.',
    childHint: 'So close — use the alphabet line and count each letter out loud.',
  },
  {
    id: 'vr-letter-series-direction',
    description: 'Moved backwards through the alphabet instead of forwards.',
    childHint: 'Which way is the series moving through the alphabet? Follow the arrows.',
  },
  {
    id: 'vr-move-letter-first-word-invalid',
    description: 'Chose a letter whose removal does not leave a real first word.',
    childHint: 'Take the letter out and read what is left. Is that first word a real word?',
  },
  {
    id: 'vr-move-letter-second-word-invalid',
    description: 'Chose a letter that does not make a real second word when added.',
    childHint: 'Pop the letter into the second word and say it aloud. Does it sound like a real word?',
  },
  {
    id: 'vr-move-letter-both-invalid',
    description: 'Chose a letter that makes neither word work.',
    childHint: 'Test both halves: the first word without the letter, the second word with it.',
  },
];

interface SeedItem {
  id: string;
  questionTypeId: string;
  difficultyTier: number;
  stem: object;
  options: Array<{ id: string; content: object; isCorrect: boolean; misconceptionId: string | null }>;
}

/** Derived seed options (reviewer audit): distractors are executor outputs, and
 * the stem carries operands so the VR distractor gate verifies them. */
function seedDerived(idPrefix: string, keyValue: string | number, operands: VrOperands, ids: string[]): SeedItem['options'] {
  return [
    { id: `${idPrefix}-opt1`, content: { value: keyValue }, isCorrect: true, misconceptionId: null },
    ...buildDerivedVrDistractors(keyValue, operands, ids).map((d, k) => ({
      id: `${idPrefix}-opt${k + 2}`,
      content: { value: d.value },
      isCorrect: false,
      misconceptionId: d.misconceptionId,
    })),
  ];
}

export function numberSeriesItems(): SeedItem[] {
  const items: SeedItem[] = [];
  for (let i = 0; i < 14; i++) {
    const a = 3 + i;
    const dBase = 2 + (i % 4);
    // Re-tiered against the gen ladder (reviewer, 2026-08-06). A step that grows
    // by +2 each term is the gen bank's changing-step T3 structure; grow +3 is T4.
    // Half the seeds now grow +3 so the bank does not pile 20 items at T3 (was all
    // 14 at T3, forced by the old `1 + (i % 5)` random spread). T5 stays empty —
    // it needs a genuinely new structure (see the report), not a bigger grow.
    const grow = i < 7 ? 2 : 3;
    const gapAt = (k: number): number => dBase + k * grow;
    const terms = [a];
    for (let k = 0; k < 3; k += 1) terms.push(terms[k]! + gapAt(k));
    const last = terms[3]!;
    const answer = last + gapAt(3);
    const id = `seed-vr11-${String(i + 1).padStart(2, '0')}`;
    const operands: VrOperands = { kind: 'number-series', first: a, step: dBase, answer, last, prevStep: gapAt(2) };
    items.push({
      id,
      questionTypeId: vrTypeId(11, 'number-series'),
      difficultyTier: grow === 2 ? 3 : 4,
      stem: { prompt: 'What number comes next in the series?', series: terms, operands },
      // direction RETIRED from this bank (reviewer, 2026-08-06). Changing series
      // still field two distinct tags: step-carryover + off-by-one.
      options: seedDerived(id, answer, operands, ['vr-series-step-carryover', 'vr-series-off-by-one']),
    });
  }
  return items;
}

export function letterSeriesItems(): SeedItem[] {
  const items: SeedItem[] = [];
  for (let i = 0; i < 13; i++) {
    const start = i % 5; // 0-indexed to match the executors' vrLetterOf
    const step = 2 + (i % 3);
    const terms = [0, 1, 2, 3].map((n) => vrLetterOf(start + n * step));
    const answer = start + 4 * step;
    const id = `seed-vr09-${String(i + 1).padStart(2, '0')}`;
    const operands: VrOperands = { kind: 'letter-series', first: start, step, answer };
    items.push({
      id,
      questionTypeId: vrTypeId(9, 'letter-series'),
      difficultyTier: 1 + (i % 5),
      stem: { prompt: 'Which letter comes next in the series?', series: terms, operands },
      options: seedDerived(id, vrLetterOf(answer), operands, ['vr-letter-series-step-repeat', 'vr-letter-series-direction', 'vr-letter-series-off-by-one']),
    });
  }
  return items;
}

// Original word pairs (L4): move `letter` from word1 to word2 → two new words.
const MOVE_LETTER_PAIRS: Array<{ word1: string; word2: string; letter: string; new1: string; new2: string }> = [
  { word1: 'PLANT', word2: 'RAIN', letter: 'T', new1: 'PLAN', new2: 'TRAIN' },
  { word1: 'SPARK', word2: 'TABLE', letter: 'S', new1: 'PARK', new2: 'STABLE' },
  { word1: 'SLIP', word2: 'TRAY', letter: 'S', new1: 'LIP', new2: 'STRAY' },
  { word1: 'COAT', word2: 'HARD', letter: 'C', new1: 'OAT', new2: 'CHARD' },
  { word1: 'BEAST', word2: 'RING', letter: 'B', new1: 'EAST', new2: 'BRING' },
  { word1: 'STOOL', word2: 'POT', letter: 'S', new1: 'TOOL', new2: 'SPOT' },
  { word1: 'GLOVE', word2: 'RAIN', letter: 'G', new1: 'LOVE', new2: 'GRAIN' },
  { word1: 'SCARE', word2: 'TRIP', letter: 'S', new1: 'CARE', new2: 'STRIP' },
  { word1: 'BRAIN', word2: 'OIL', letter: 'B', new1: 'RAIN', new2: 'BOIL' },
  { word1: 'STEAM', word2: 'ALE', letter: 'S', new1: 'TEAM', new2: 'SALE' },
  { word1: 'PLATE', word2: 'RICE', letter: 'P', new1: 'LATE', new2: 'PRICE' },
  { word1: 'STONE', word2: 'PILL', letter: 'S', new1: 'TONE', new2: 'SPILL' },
  { word1: 'SWING', word2: 'TART', letter: 'S', new1: 'WING', new2: 'START' },
];

function moveLetterItems(): SeedItem[] {
  const misconceptionCycle = [
    'vr-move-letter-first-word-invalid',
    'vr-move-letter-second-word-invalid',
    'vr-move-letter-both-invalid',
  ];
  return MOVE_LETTER_PAIRS.map((pair, i) => {
    const id = `seed-vr08-${String(i + 1).padStart(2, '0')}`;
    const distractors = [...new Set(pair.word1.split(''))].filter((l) => l !== pair.letter).slice(0, 3);
    return {
      id,
      questionTypeId: vrTypeId(8, 'move-letter'),
      difficultyTier: 1 + (i % 5),
      stem: {
        // 17 words before the reading-age cap reached this file (R270). Reworded, never exempted.
        prompt: 'Move one letter from the first word to the second so both make new words.',
        word1: pair.word1,
        word2: pair.word2,
      },
      options: [
        { id: `${id}-opt1`, content: { value: pair.letter }, isCorrect: true, misconceptionId: null },
        ...distractors.map((letter, n) => ({
          id: `${id}-opt${n + 2}`,
          content: { value: letter },
          isCorrect: false,
          misconceptionId: misconceptionCycle[n % misconceptionCycle.length]!,
        })),
      ],
    };
  });
}

async function seedQuestionTypes(): Promise<void> {
  for (const type of VR_TYPES) {
    const id = vrTypeId(type.num, type.slug);
    await prisma.questionType.upsert({
      where: { id },
      create: { id, district: 'VR', name: type.name, glCode: String(type.num), mechanic: type.mechanic },
      update: { name: type.name, glCode: String(type.num), mechanic: type.mechanic },
    });
  }
  // English and maths: one shared list (packages/core/src/question-types.ts). Without these a fresh
  // database cannot seed the English cases (Case_questionTypeId_fkey — CI, 2026-11-19).
  for (const [district, types] of [['ENGLISH', ENGLISH_QUESTION_TYPES], ['MATHS', MATHS_QUESTION_TYPES]] as const) {
    for (const type of types) {
      await prisma.questionType.upsert({
        where: { id: type.id },
        create: { id: type.id, district, name: type.name, mechanic: type.mechanic },
        update: { name: type.name, mechanic: type.mechanic },
      });
    }
  }
}

async function seedMisconceptions(): Promise<void> {
  for (const misconception of MISCONCEPTIONS) {
    await prisma.misconception.upsert({
      where: { id: misconception.id },
      create: { ...misconception, district: 'VR' },
      /**
       * CREATE-ONLY. LIBRARY TEXT IS AUTHORED IN THE DATABASE, NOT HERE (CLAUDE.md: "the DB holds
       * library text"). This clause used to rewrite description/childHint/teachback on every seed
       * run, which silently reverted reviewed text: Annie's R456 hint for vr-letter-series-off-by-one
       * was applied and confirmed by direct read on 2026-08-21 and found serving the old seed string
       * on 2026-11-19. The literals above are the FIRST-CREATE values only; an existing row is never
       * touched. Same class as R62 — a routine command must not rewrite reviewed content.
       */
      update: {},
    });
  }
}

async function seedItems(): Promise<void> {
  const items = [...numberSeriesItems(), ...letterSeriesItems(), ...moveLetterItems()];
  if (items.length !== 40) throw new Error(`Expected 40 seed items, got ${items.length}`);

  /**
   * REVIEWED CONTENT IS IMMUTABLE TO CODE CHANGES. This upsert's `update` clause rewrites `stem`
   * and every option unconditionally, and those values come out of `buildDerivedVrDistractors` —
   * so a change to that function silently rewrites items a reviewer approved. It did: seed-vr09-12
   * and -13 were APPROVED, a seed run re-derived their options, and their reviewed walk scripts
   * were left naming options that no longer existed.
   *
   * Classified BEFORE anything is written, so a refusal leaves the database untouched rather than
   * half-applied. An unchanged re-derivation is a no-op, which is what keeps the seed re-runnable.
   */
  const outcome = await classifyDerivedWrites(prisma, items.map((item) => ({
    id: item.id,
    stem: item.stem,
    options: item.options.map((o) => ({ content: o.content, isCorrect: o.isCorrect, misconceptionId: o.misconceptionId })),
  })));
  assertNoReviewedRewrite(outcome, 'seed:items');
  const writable = new Set(outcome.writable);

  for (const item of items) {
    // Reviewed and unchanged: nothing to write, and writing anyway would touch `updatedAt` on a
    // row a reviewer owns for no reason.
    if (!writable.has(item.id)) continue;
    await prisma.item.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        questionTypeId: item.questionTypeId,
        difficultyTier: item.difficultyTier,
        stem: item.stem,
        explanation: { note: 'synthetic seed item — never shippable' },
        status: 'DRAFT',
        authoredBy: 'seed',
      },
      update: { stem: item.stem, difficultyTier: item.difficultyTier },
    });
    for (const option of item.options) {
      await prisma.itemOption.upsert({
        where: { id: option.id },
        create: { ...option, itemId: item.id },
        update: { content: option.content, isCorrect: option.isCorrect, misconceptionId: option.misconceptionId },
      });
    }
  }
}

/**
 * CREATE-ONLY (R1063). words.json BOOTSTRAPS an empty store; it never speaks over a row that exists.
 *
 * This used to upsert every field of the file over the Word table, unconditionally, and CI runs the
 * seed on top of the restored content snapshot. On 2026-11-23 the file differed from the store on
 * all 120 seed words' `definitionChild` (the August house-style rewrite went into the store and
 * never into the file), so any seed run would have reverted 117 LIVE definitions and hollow's
 * superseding card. It is the likeliest way hollow's and transparent's ratified tiers were undone
 * before 2026-08-16 (R1050).
 *
 * Why create-only and not `classifyDerivedWrites`' shape: the DB is the only store (R1034), and
 * these values are AUTHORED, not computed by a derivation function (R63's test), so there is no
 * code change for a classifier to catch. A classifier would instead fail the seed every time a
 * reviewed card is edited through review until somebody also edits this file — making the file a
 * second write target, which is the two-way drift R1034 retired. `createMany(skipDuplicates)` is
 * ON CONFLICT DO NOTHING: an existing row is not even touched, so the write log records nothing.
 *
 * The file still matters to two readers that are not this one: `difficulty.ts` derives item tiers
 * from its `tier`, and `check-reading-age.mjs` lints its text. So divergence from the store is
 * REPORTED here, by field, on every run — never written, never silent.
 */
async function seedWords(): Promise<void> {
  const raw = JSON.parse(readFileSync(resolve(CONTENT_ROOT, 'words/words.json'), 'utf8'));
  const { words } = wordFileSchema.parse(raw);
  if (words.length < 60) throw new Error(`Expected at least 60 seed words, got ${words.length}`);
  const existing = await prisma.word.findMany({ where: { id: { in: words.map((w) => w.id) } } });
  const stored = new Map(existing.map((row) => [row.id, row]));
  const toCreate = words.filter((w) => !stored.has(w.id));
  if (toCreate.length > 0) await prisma.word.createMany({ data: toCreate, skipDuplicates: true });

  const divergence = new Map<string, string[]>();
  for (const word of words) {
    const row = stored.get(word.id);
    if (!row) continue;
    for (const [field, value] of Object.entries(word)) {
      if ((row as Record<string, unknown>)[field] !== value) {
        divergence.set(field, [...(divergence.get(field) ?? []), word.id]);
      }
    }
  }
  const summary = [...divergence].map(([field, ids]) => `${field} ${ids.length}`).join(', ');
  console.log(
    `  seedWords: ${words.length} in words.json · ${toCreate.length} created · ${existing.length} already ` +
      `in the store, left untouched (create-only, R1063)` +
      (existing.length > 0 ? ` · ${summary ? `words.json DIFFERS from the store: ${summary}` : 'words.json matches the store'}` : ''),
  );
  const tierDrift = divergence.get('tier');
  if (tierDrift) {
    console.warn(
      `  ⚠ words.json tier differs from the store on ${tierDrift.join(', ')}. difficulty.ts derives item tiers ` +
        'from the FILE, so the generator is reading a tier the store does not hold.',
    );
  }
}

/**
 * THE E2E FIXTURE SET — live rows that exist so no spec has to promote real content.
 *
 * The incident: the story e2e needed a LIVE word to assert a tappable word against, reached for
 * `brave` — a real vault card — and its teardown demoted it. It was caught because someone noticed
 * a LIVE-word count move, which is not a detection mechanism (David, 2026-08-12).
 *
 * A spec needing live data now has live data of its own. These rows are:
 *   PERMANENT   — seeded, never created or deleted by a spec, so nothing has to clean them up.
 *   READ-ONLY   — specs assert against them and must never mutate them. `check:e2e-residue`
 *                 fails if a fixture's status or reviewer moves.
 *   HONEST      — they pass the same gates as real content, because they ARE live content: a
 *                 LIVE word is screened by check:db-content and a LIVE item by
 *                 check:option-positions. A fixture exempt from the gates would be a second,
 *                 unscreened class of live row, which is the thing the DB gate exists to stop.
 *
 * The `zz-e2e-` id prefix sorts them last and marks them unmistakably. It appears ONLY in ids —
 * never in a headword, definition or stem, because those are child-facing and an id there is an
 * internal-id leak the scanner would rightly refuse.
 */
const E2E_FIXTURE_WORD_ID = 'zz-e2e-fixture-word';
const E2E_FIXTURE_ITEM_ID = 'zz-e2e-fixture-item';

async function seedE2eFixtures(): Promise<void> {
  await prisma.word.upsert({
    where: { id: E2E_FIXTURE_WORD_ID },
    create: {
      id: E2E_FIXTURE_WORD_ID,
      headword: 'lantern',
      definitionChild: 'A lamp with a handle that you can carry.',
      sentence: 'She held the lantern up so we could see the path.',
      tier: 2,
      status: 'LIVE',
      authoredBy: 'seed',
      // `word_live_needs_reviewer` allows authoredBy = 'seed', but naming a reviewer is the
      // honest form: this row is LIVE on purpose, not LIVE through an exemption.
      reviewedBy: 'human:fixtures@cluecrew.test',
    },
    update: { status: 'LIVE', reviewedBy: 'human:fixtures@cluecrew.test' },
  });

  await prisma.item.upsert({
    where: { id: E2E_FIXTURE_ITEM_ID },
    create: {
      id: E2E_FIXTURE_ITEM_ID,
      questionTypeId: 'vr-04-closest-meaning',
      difficultyTier: 2,
      stem: { prompt: 'Which word is closest in meaning to brave?' },
      explanation: {},
      status: 'LIVE',
      authoredBy: 'seed',
      reviewedBy: 'human:fixtures@cluecrew.test',
    },
    update: { status: 'LIVE' },
  });
  // Key first in storage, matching every other bank — check:option-positions asserts storage
  // uniformity per bank, so a fixture that broke the convention would fail a real gate.
  const options = [
    { id: `${E2E_FIXTURE_ITEM_ID}-a`, content: { value: 'courageous' }, isCorrect: true },
    { id: `${E2E_FIXTURE_ITEM_ID}-b`, content: { value: 'cautious' }, isCorrect: false },
    { id: `${E2E_FIXTURE_ITEM_ID}-c`, content: { value: 'curious' }, isCorrect: false },
    { id: `${E2E_FIXTURE_ITEM_ID}-d`, content: { value: 'clumsy' }, isCorrect: false },
  ];
  for (const option of options) {
    await prisma.itemOption.upsert({
      where: { id: option.id },
      create: { ...option, itemId: E2E_FIXTURE_ITEM_ID },
      update: { content: option.content, isCorrect: option.isCorrect },
    });
  }
}

async function seedCases(): Promise<void> {
  // Read the directory rather than a hardcoded list: a new authored case
  // should appear by dropping the file in, not by also editing the seed.
  const files = readdirSync(resolve(CONTENT_ROOT, 'cases'))
    .filter((file) => file.endsWith('.json'))
    .sort();
  for (const file of files) {
    const raw = JSON.parse(readFileSync(resolve(CONTENT_ROOT, 'cases', file), 'utf8'));
    const { case: caseContent } = caseFileSchema.parse(raw);
    await prisma.case.upsert({
      where: { id: caseContent.id },
      create: {
        id: caseContent.id,
        questionTypeId: caseContent.questionTypeId,
        title: caseContent.title,
        narrativeIntro: caseContent.narrativeIntro,
        modes: caseContent.modes,
        orderInDistrict: caseContent.orderInDistrict,
        storyWrapper: caseContent.storyWrapper ?? undefined,
      },
      update: {
        title: caseContent.title,
        narrativeIntro: caseContent.narrativeIntro,
        modes: caseContent.modes,
        orderInDistrict: caseContent.orderInDistrict,
        storyWrapper: caseContent.storyWrapper ?? undefined,
      },
    });
  }

  /**
   * THE FREE TIER IS A FLOOR OF TWO CASES PER DISTRICT (David's ruling, 2026-08-17 — R177).
   * AMENDMENT-1 §5.1, restated. This replaces "the first two cases of each engine family".
   *
   * **NOBODY HAD EVER DECIDED WHAT THE FREE TIER IS. THEY DECIDED WHAT TO KEEP OUT OF IT.** The old
   * formula was never chosen as a shape — it was a default that three exclusions and one addition
   * were then argued against, one case at a time, each with a written reason. Measuring it exposed
   * that: VR's ten is the formula's NINE plus a hand-added tenth, minus three held out, so four of
   * the ten slots are human decisions and the other six are a rule nobody ratified.
   *
   * **AND THE FORMULA CHANGED MEANING WHEN THE FAMILY COUNT CHANGED.** Across VR's five families
   * "two per family" is a SAMPLING rule — show a child every kind of work the district does. In
   * English's single family it degenerates into a QUANTITY rule — show a child two cases. Same
   * words, different instrument, and English drew 2 of 4 cases (20 of 34 items) from a rule that
   * was never pointed at a one-family district. A structural rule reached a population nobody
   * aimed it at, and this time the result was arbitrary rather than correct.
   *
   * **SO THE SET IS NOW ENUMERATED AND THE RULE IS A FLOOR.** The list below is authoritative — a
   * HUMAN RULING, not a computed value — and the floor is the invariant it must satisfy. That also
   * moves this write off the derived path entirely (R63: the test is who authored the value), which
   * is why no `classifyDerivedWrites` guard belongs on it.
   *
   * **VR'S TEN ARE RECORDED AS EXCLUSIONS FROM THE FULL SET, NOT AS DEVIATIONS FROM A FORMULA.**
   * Re-deriving them to a shape nobody chose would discard four real decisions.
   */
  const FREE_TIER_FLOOR_PER_DISTRICT = 2;

  /**
   * A DISTRICT OUTSIDE THE FLOOR, BY RULING (David, 2026-11-22 — R1040: "Keep Maths paid").
   * Maths has ONE case, `case-maths-01`, built PAID (2026-08-29). Under the floor that single case
   * had to be free, which gives away the whole district; the seed refused against the real store
   * from that day and nobody ran it until CI read the snapshot. The exemption is printed on every
   * run, so a district that grows past one case does not stay exempt by silence — revisit it then.
   */
  const FLOOR_EXEMPT_DISTRICTS: Record<string, string> = {
    MATHS: 'one case, paid by ruling (R1040) — revisit when Maths has a second case',
  };

  /**
   * WHY EACH EXCLUDED CASE IS OUT. Every reason survives from the 2026-08-02 rulings; only the
   * framing changed. These are cases that would otherwise be free, kept out one at a time.
   */
  const EXCLUDED_FROM_FREE_TIER: Array<{ id: string; reason: string }> = [
    {
      id: 'case-vr-05',
      reason:
        'Hidden Word: four gate-clean items against a floor of fifteen. Fourteen of its twenty-five '
        + 'admit a second word at a join, so a child who reads correctly can still lose the mark. '
        + 'That is authoring a case, not fixing one — it returns once rebuilt.',
    },
    {
      id: 'case-vr-10',
      reason:
        'Word Connections: the same 25 analogies as case-vr-03, differing only in tag names '
        + '(Entry 27), so it adds nothing. case-vr-14 carries a LETTER analogy against vr-03\'s WORD '
        + 'analogy, so the free set shows range instead of running one mechanic twice.',
    },
    {
      id: 'case-vr-02',
      reason:
        'Two Odd Ones Out: the generator writes its answer as a {pair} with no `value` against a '
        + 'select-two mechanic, so every value-based consumer reads it as unkeyable and it cannot be '
        + 'scored as served. Out until the interaction is rebuilt.',
    },
  ];

  /**
   * THE FREE SET, ENUMERATED PER DISTRICT.
   *
   * VR's ten: the eight that survive the exclusions above, plus `case-vr-11` (The Counting Culprit),
   * added by hand on 2026-08-01 because it is the flagship case with LIVE items — so the free tier
   * always contains a case a production child can genuinely play.
   *
   * ENGLISH's two: **CHOSEN, 2026-08-17 (R194) — the second entry in this set a person selected.**
   * They were `case-en-01` and `case-en-02` by accident: the floor took the first two by
   * `orderInDistrict`, and that order was the order the authoring loop ran. No property of the
   * items decided it, and it landed badly — technique carries EVERY T4 in the reachable English
   * bank and vocabulary carries the two-part screen, so a free child met the two most tractable
   * strands and none of the writer's-technique work.
   *
   * The pair is now chosen on what it shows a child: **`case-en-01` (retrieval)** — a strand she can
   * get purchase on immediately — and **`case-en-04` (technique)** — the one that shows what the
   * district actually does. `case-en-02` (inference) and `case-en-03` (vocabulary) are paid. That is
   * a DECISION, not a derivation, which is why it is written here and not computed.
   */
  const FREE_TIER_CASES: Record<string, string[]> = {
    VR: [
      'case-vr-01', 'case-vr-03', 'case-vr-04', 'case-vr-06', 'case-vr-07',
      'case-vr-09', 'case-vr-11', 'case-vr-12', 'case-vr-14', 'case-vr-15',
    ],
    ENGLISH: ['case-en-01', 'case-en-04'],
  };

  const allCases = await prisma.case.findMany({
    include: { questionType: { select: { district: true } } },
    orderBy: { orderInDistrict: 'asc' },
  });
  const districtOf = new Map(allCases.map((c) => [c.id, String(c.questionType.district)]));
  const freeTierIds = [...new Set(Object.values(FREE_TIER_CASES).flat())];

  /**
   * THE ENUMERATION IS ASSERTED, NEVER TRUSTED. A list is only safer than a formula if something
   * checks it — an id that no longer exists, a case excluded and listed at once, or a district that
   * has quietly dropped below the floor are all invisible in a literal. Each REFUSES the run.
   */
  const excludedIds = new Set(EXCLUDED_FROM_FREE_TIER.map((e) => e.id));
  const problems: string[] = [];
  for (const id of freeTierIds) {
    if (!districtOf.has(id)) problems.push(`free-tier case '${id}' does not exist`);
    if (excludedIds.has(id)) problems.push(`'${id}' is both listed free and excluded`);
  }
  for (const e of EXCLUDED_FROM_FREE_TIER) {
    if (!districtOf.has(e.id)) problems.push(`excluded case '${e.id}' does not exist`);
  }
  const perDistrict = new Map<string, { total: number; free: number }>();
  for (const c of allCases) {
    const d = String(c.questionType.district);
    const e = perDistrict.get(d) ?? { total: 0, free: 0 };
    e.total += 1;
    if (freeTierIds.includes(c.id)) e.free += 1;
    perDistrict.set(d, e);
  }
  for (const [d, v] of perDistrict) {
    // A district with fewer cases than the floor cannot meet it; that is a content gap, not a
    // tier fault, and it says so rather than failing.
    if (FLOOR_EXEMPT_DISTRICTS[d]) {
      console.log(`  free-tier floor: ${d} EXEMPT (${v.free} free of ${v.total}) — ${FLOOR_EXEMPT_DISTRICTS[d]}`);
      continue;
    }
    const required = Math.min(FREE_TIER_FLOOR_PER_DISTRICT, v.total);
    if (v.free < required) {
      problems.push(`district ${d} has ${v.free} free case(s), below the floor of ${required} (${v.total} exist)`);
    }
  }
  if (problems.length) {
    throw new Error(
      `Free-tier set is inconsistent — refusing to write it:\n  ${problems.join('\n  ')}\n`
      + 'The list in seed.ts is a human ruling; fix it there, never in the database.',
    );
  }

  await prisma.case.updateMany({ data: { freeTier: false } });
  await prisma.case.updateMany({ where: { id: { in: freeTierIds } }, data: { freeTier: true } });
  console.log(
    `Free-tier cases: ${freeTierIds.length} (floor of ${FREE_TIER_FLOOR_PER_DISTRICT} per district) · `
    + [...perDistrict].map(([d, v]) => `${d} ${v.free}/${v.total}`).join(' · ')
    + ` · ${EXCLUDED_FROM_FREE_TIER.length} excluded by ruling`,
  );
}

async function seedRegions(): Promise<void> {
  const raw = JSON.parse(readFileSync(resolve(CONTENT_ROOT, 'regions.json'), 'utf8'));
  const { regions } = regionFileSchema.parse(raw);

  for (const region of regions) {
    const { code, lastVerified, ...rest } = region;
    const data = { ...rest, lastVerified: new Date(lastVerified) };
    await prisma.region.upsert({ where: { id: code }, create: { id: code, ...data }, update: data });
  }
}

/** Staff accounts for the admin CMS — dev/staging only (§2). */
async function seedStaff(): Promise<void> {
  if (process.env.APP_ENV === 'production') return;
  const passwordHash = await hash('CrewStaff!2026', { memoryCost: 19456, timeCost: 2, parallelism: 1 });
  const staff = [
    { id: 'seed-staff-admin', email: 'staff-admin@cluecrew.test', displayName: 'Staff Admin', staffRole: 'ADMIN' as const },
    { id: 'seed-staff-reviewer', email: 'staff-reviewer@cluecrew.test', displayName: 'Staff Reviewer', staffRole: 'REVIEWER' as const },
    { id: 'seed-staff-author', email: 'staff-author@cluecrew.test', displayName: 'Staff Author', staffRole: 'AUTHOR' as const },
  ];
  for (const member of staff) {
    await prisma.parentAccount.upsert({
      where: { email: member.email },
      create: { ...member, passwordHash, emailVerified: new Date() },
      update: { staffRole: member.staffRole, passwordHash },
    });
  }
}

/** Synthetic test family — staging/dev only, never production (§2). */
async function seedTestFamily(): Promise<void> {
  if (process.env.APP_ENV === 'production') {
    console.log('Production environment: skipping synthetic test family.');
    return;
  }

  const passwordHash = await hash('CrewTest!2026', {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  const parent = await prisma.parentAccount.upsert({
    where: { email: 'test-family@cluecrew.test' },
    create: {
      id: 'seed-parent-1',
      email: 'test-family@cluecrew.test',
      passwordHash,
      emailVerified: new Date(),
      displayName: 'Test Parent',
      // Must match a Region.id from content/regions.json — an orphan code
      // silently falls back to "Not sure yet / other area" wherever the
      // registry is rendered (Casebook ch. 2, onboarding, Parent HQ).
      regionCode: 'birmingham',
    },
    update: { passwordHash, regionCode: 'birmingham' },
  });

  const children = [
    // Year model (Addendum D): capture pair, from which the effective year is
    // always derived. Alex: Year 5 from September 2026; Sam: Year 4.
    { id: 'seed-child-alex', crewName: 'Alex', yearGroupAtCapture: 5, capturedAcademicYear: 2026, examYear: 2027 },
    { id: 'seed-child-sam', crewName: 'Sam', yearGroupAtCapture: 4, capturedAcademicYear: 2026, examYear: 2028 },
  ];
  for (const child of children) {
    await prisma.childProfile.upsert({
      where: { id: child.id },
      create: {
        ...child,
        parentId: parent.id,
        settings: { reducedMotion: false, dyslexiaFont: false, audioDefault: false },
      },
      update: {
        crewName: child.crewName,
        yearGroupAtCapture: child.yearGroupAtCapture,
        capturedAcademicYear: child.capturedAcademicYear,
        examYear: child.examYear,
      },
    });
  }

  for (const [index, kind] of (['tos', 'privacy', 'child_profile_created'] as const).entries()) {
    await prisma.consentEvent.upsert({
      where: { id: `seed-consent-${index + 1}` },
      create: { id: `seed-consent-${index + 1}`, parentId: parent.id, kind, version: 'v1.0' },
      update: {},
    });
  }

  // A realistic seed practice flow for Alex, so the analytics spine has rows
  // to prove itself against (gate #6).
  const session = await prisma.session.upsert({
    where: { id: 'seed-session-1' },
    create: { id: 'seed-session-1', childId: 'seed-child-alex', secondsActive: 540, endedAt: new Date() },
    update: {},
  });

  const attempts = [
    { id: 'seed-attempt-1', itemId: 'seed-vr11-01', correct: true, latencyMs: 6200 },
    { id: 'seed-attempt-2', itemId: 'seed-vr11-02', correct: false, latencyMs: 9800 },
    { id: 'seed-attempt-3', itemId: 'seed-vr11-03', correct: true, latencyMs: 5400 },
  ];
  for (const attempt of attempts) {
    await prisma.attempt.upsert({
      where: { id: attempt.id },
      create: {
        ...attempt,
        childId: 'seed-child-alex',
        sessionId: session.id,
        chosenOptionId: `${attempt.itemId}-opt${attempt.correct ? 1 : 2}`,
        context: 'case_practice',
      },
      update: {},
    });
  }

  await prisma.caseFile.upsert({
    where: { childId_caseId: { childId: 'seed-child-alex', caseId: 'case-vr-11' } },
    create: { childId: 'seed-child-alex', caseId: 'case-vr-11', masteryLevel: 0.4 },
    update: {},
  });

  await prisma.wordVaultEntry.upsert({
    where: { childId_wordId: { childId: 'seed-child-alex', wordId: 'meticulous' } },
    create: { childId: 'seed-child-alex', wordId: 'meticulous', masteryLevel: 0.2 },
    update: {},
  });

  await prisma.reviewSchedule.upsert({
    where: {
      childId_unitKind_unitId: {
        childId: 'seed-child-alex',
        unitKind: 'question_type',
        unitId: 'vr-11-number-series',
      },
    },
    create: {
      childId: 'seed-child-alex',
      unitKind: 'question_type',
      unitId: 'vr-11-number-series',
      dueAt: new Date(),
      intervalDays: 1,
    },
    update: {},
  });

  // Seed-flow events, canonical names only (§6): IDs and enums, never free text.
  const seedEvents: Array<{ id: string; name: string; props: object }> = [
    { id: 'seed-event-1', name: 'session_started', props: { sessionId: session.id } },
    { id: 'seed-event-2', name: 'warmup_completed', props: { sessionId: session.id, reviewedUnits: 2 } },
    { id: 'seed-event-3', name: 'case_opened', props: { caseId: 'case-vr-11' } },
    { id: 'seed-event-4', name: 'mode_selected', props: { caseId: 'case-vr-11', mode: 'try' } },
    { id: 'seed-event-5', name: 'attempt_submitted', props: { itemId: 'seed-vr11-01', correct: true, latencyMs: 6200, context: 'case_practice' } },
    { id: 'seed-event-6', name: 'attempt_submitted', props: { itemId: 'seed-vr11-02', correct: false, latencyMs: 9800, context: 'case_practice' } },
    { id: 'seed-event-7', name: 'attempt_submitted', props: { itemId: 'seed-vr11-03', correct: true, latencyMs: 5400, context: 'case_practice' } },
    { id: 'seed-event-8', name: 'word_collected', props: { wordId: 'meticulous' } },
    { id: 'seed-event-9', name: 'session_ended', props: { sessionId: session.id, secondsActive: 540 } },
  ];
  for (const event of seedEvents) {
    await prisma.event.upsert({
      where: { id: event.id },
      create: { id: event.id, childId: 'seed-child-alex', name: event.name, props: event.props },
      update: {},
    });
  }
}

async function main(): Promise<void> {
  await seedQuestionTypes();
  await seedMisconceptions();
  await seedItems();
  await seedWords();
  await seedE2eFixtures();
  await seedCases();
  await seedRegions();
  await seedStaff();
  await seedTestFamily();

  const counts = {
    questionTypes: await prisma.questionType.count(),
    misconceptions: await prisma.misconception.count(),
    items: await prisma.item.count(),
    words: await prisma.word.count(),
    cases: await prisma.case.count(),
    regions: await prisma.region.count(),
    events: await prisma.event.count(),
  };
  console.log('Seed complete:', counts);
}

// Only seed when run directly, not when a report imports the item builders.
if (process.argv[1]?.endsWith('seed.ts')) {
  main()
    .then(() => prisma.$disconnect())
    .catch(async (error) => {
      console.error(error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
