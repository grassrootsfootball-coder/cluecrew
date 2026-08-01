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
import { FAMILY_BY_TYPE, caseFileSchema, regionFileSchema, wordFileSchema } from '@cluecrew/core';
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

function numberSeriesItems(): SeedItem[] {
  const items: SeedItem[] = [];
  for (let i = 0; i < 14; i++) {
    const a = 3 + i;
    const d = 2 + (i % 4);
    // Steps grow by one each time: d, d+1, d+2, then d+3 to the answer.
    const terms = [a, a + d, a + 2 * d + 1, a + 3 * d + 3];
    const answer = a + 4 * d + 6;
    const id = `seed-vr11-${String(i + 1).padStart(2, '0')}`;
    items.push({
      id,
      questionTypeId: vrTypeId(11, 'number-series'),
      difficultyTier: 1 + (i % 5),
      stem: { prompt: 'What number comes next in the series?', series: terms },
      options: [
        { id: `${id}-opt1`, content: { value: answer }, isCorrect: true, misconceptionId: null },
        { id: `${id}-opt2`, content: { value: answer - 1 }, isCorrect: false, misconceptionId: 'vr-series-step-carryover' },
        { id: `${id}-opt3`, content: { value: answer + 1 }, isCorrect: false, misconceptionId: 'vr-series-off-by-one' },
        { id: `${id}-opt4`, content: { value: terms[3]! - (d + 3) }, isCorrect: false, misconceptionId: 'vr-series-direction' },
      ],
    });
  }
  return items;
}

function letterAt(position: number): string {
  return String.fromCharCode(64 + position); // 1 → A
}

function letterSeriesItems(): SeedItem[] {
  const items: SeedItem[] = [];
  for (let i = 0; i < 13; i++) {
    const start = 1 + (i % 5);
    const step = 2 + (i % 3);
    const terms = [0, 1, 2, 3].map((n) => letterAt(start + n * step));
    const answer = start + 4 * step;
    const id = `seed-vr09-${String(i + 1).padStart(2, '0')}`;
    items.push({
      id,
      questionTypeId: vrTypeId(9, 'letter-series'),
      difficultyTier: 1 + (i % 5),
      stem: { prompt: 'Which letter comes next in the series?', series: terms },
      options: [
        { id: `${id}-opt1`, content: { value: letterAt(answer) }, isCorrect: true, misconceptionId: null },
        { id: `${id}-opt2`, content: { value: letterAt(answer - 1) }, isCorrect: false, misconceptionId: 'vr-letter-series-off-by-one' },
        { id: `${id}-opt3`, content: { value: letterAt(Math.min(26, answer + step)) }, isCorrect: false, misconceptionId: 'vr-letter-series-step-repeat' },
        { id: `${id}-opt4`, content: { value: letterAt(answer - 2 * step) }, isCorrect: false, misconceptionId: 'vr-letter-series-direction' },
      ],
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
        prompt: 'Move one letter from the first word to the second word so that both make new words.',
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
}

async function seedMisconceptions(): Promise<void> {
  for (const misconception of MISCONCEPTIONS) {
    await prisma.misconception.upsert({
      where: { id: misconception.id },
      create: { ...misconception, district: 'VR' },
      update: {
        description: misconception.description,
        childHint: misconception.childHint,
        teachback: misconception.teachback,
      },
    });
  }
}

async function seedItems(): Promise<void> {
  const items = [...numberSeriesItems(), ...letterSeriesItems(), ...moveLetterItems()];
  if (items.length !== 40) throw new Error(`Expected 40 seed items, got ${items.length}`);
  for (const item of items) {
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

async function seedWords(): Promise<void> {
  const raw = JSON.parse(readFileSync(resolve(CONTENT_ROOT, 'words/words.json'), 'utf8'));
  const { words } = wordFileSchema.parse(raw);
  if (words.length < 60) throw new Error(`Expected at least 60 seed words, got ${words.length}`);
  for (const word of words) {
    const { id, ...rest } = word;
    await prisma.word.upsert({ where: { id }, create: { id, ...rest }, update: rest });
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
      },
      update: {
        title: caseContent.title,
        narrativeIntro: caseContent.narrativeIntro,
        modes: caseContent.modes,
        orderInDistrict: caseContent.orderInDistrict,
      },
    });
  }

  // AMENDMENT-1 §5.1: the free Crew tier's default selection — the first two
  // cases per engine family by orderInDistrict (10 in all). David + reviewer
  // ratify or adjust; the seed re-derives the DEFAULT on every run, so a
  // hand-ratified change should be made HERE, not in the database.
  const allCases = await prisma.case.findMany({ orderBy: { orderInDistrict: 'asc' } });
  const byFamily = new Map<string, string[]>();
  for (const caseRow of allCases) {
    const family = FAMILY_BY_TYPE[caseRow.questionTypeId] ?? 'wordweb';
    const list = byFamily.get(family) ?? [];
    if (list.length < 2) {
      list.push(caseRow.id);
      byFamily.set(family, list);
    }
  }
  // The tenth (David, 2026-08-01): the derived rule yields 9 because the
  // deduction family has a single case. The Counting Culprit (Number Series)
  // completes the ten — it is the flagship case with LIVE items, so the free
  // tier always contains a case a production child can genuinely play.
  const TENTH_FREE_CASE = 'case-vr-11';
  const freeTierIds = [...new Set([...byFamily.values()].flat().concat(TENTH_FREE_CASE))];
  await prisma.case.updateMany({ data: { freeTier: false } });
  await prisma.case.updateMany({ where: { id: { in: freeTierIds } }, data: { freeTier: true } });
  console.log(`Free-tier cases (Amendment 1 default): ${freeTierIds.length}`);
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

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
