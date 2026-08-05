/**
 * David's rulings of 2026-08-02, items 1, 3 and 4. Run once.
 *
 *   1. `ENG-001-WIW-18` quotes Grahame's "its" as "it's". The passage is
 *      verbatim and correct; the item silently modernised it. Corrected to
 *      the source.
 *   3. Four Austen quotations reproduced inexactly. Corrected against the
 *      passage. `pp-19` is the priority: it deleted `,” cried Bingley, “`
 *      from the middle of a quotation and presented the remainder as
 *      continuous speech.
 *   4. Cloze `lineRefs` renamed to `gapRef`. They were always gap numbers,
 *      and a gap number resolved as a line number certified itself.
 *
 * Every corrected quotation is DECLARED in `stem.quotes` rather than left
 * loose. That is not tidiness: a declared span is what the reading-age and
 * vocabulary gates step over (R4), and it is what the line-reference gate
 * checks for verbatim reproduction. An undeclared quotation gets the worst of
 * both — measured as our wording, and unchecked against its source.
 *
 * Corrections are made to the passage's exact text, TRUNCATED where Austen's
 * sentence runs on. Truncating a quotation still quotes the passage; adding a
 * full stop where the source has a comma does not, and three of the four
 * faults were exactly that.
 */
import { checkChildFacingText, checkLineRefs, isBlocking, type CitablePassage } from '@cluecrew/core';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { prisma } from '../packages/db/src/index';

const DRY = process.argv.includes('--dry-run');
const PASSAGE_DIR = resolve(import.meta.dirname, '../content/passages');
const ACTOR = 'david@cluecrew.test';

const PP = 'stream-a-13-pride-prejudice';
const WIW = 'stream-a-03-wind-in-willows';

interface Correction {
  id: string;
  field: 'stem' | 'walkScript';
  was: string;
  now: string;
  quotes?: Array<{ text: string; passageRef: string; lineRefs: number[] }>;
  testedTokens?: string[];
  why: string;
}

const CORRECTIONS: Correction[] = [
  {
    id: 'ENG-001-WIW-18',
    field: 'stem',
    was: "The Mole says, 'Oh, it's all very well to talk.' What does this show about the Mole?",
    now: "The Mole says, 'Oh, its all very well to talk'. What does this show about the Mole?",
    quotes: [{ text: 'Oh, its all very well to talk', passageRef: WIW, lineRefs: [56, 57] }],
    why: "Grahame's text reads 'its'. The item modernised it, so a child scanning the passage for \"it's\" would never find it.",
  },
  {
    id: 'ENG-002-pp-12',
    field: 'walkScript',
    was: "Lines 39 and 40 give it in one sentence. He 'danced only once with Mrs Hurst and once with Miss Bingley'. That is two dances. Both ladies came with his own group. Dancing every dance is Mr Bingley's. Elizabeth is never asked.",
    now: "Lines 39 and 40 give it in one sentence. He 'danced only once with Mrs. Hurst and once with Miss Bingley'. That is two dances. Both ladies came with his own group. Dancing every dance is Mr Bingley's. Elizabeth is never asked.",
    why: 'Austen writes "Mrs. Hurst" with the full stop.',
  },
  {
    id: 'ENG-002-pp-13',
    field: 'stem',
    was: "The writer says: 'His character was decided. He was the proudest, most disagreeable man in the world.' What do these short, sure sentences do?",
    now: "The writer says: 'His character was decided. He was the proudest, most disagreeable man in the world'. What do these short, sure sentences do?",
    quotes: [
      {
        text: 'His character was decided. He was the proudest, most disagreeable man in the world',
        passageRef: PP,
        lineRefs: [42, 43],
      },
    ],
    why: 'The passage runs on with a comma ("…in the world, and everybody hoped…"). The item closed it with a full stop, turning a clause into a sentence.',
  },
  {
    id: 'ENG-002-pp-18',
    field: 'stem',
    was: "Mr Darcy says: 'Your sisters are engaged.' What does 'engaged' mean here?",
    now: "Mr Darcy says: 'Your sisters are engaged'. What does 'engaged' mean here?",
    quotes: [{ text: 'Your sisters are engaged', passageRef: PP, lineRefs: [53, 54] }],
    testedTokens: ['engaged'],
    why: 'Same invented full stop: Austen has "engaged, and there is not another woman…".',
  },
  {
    id: 'ENG-002-pp-19',
    field: 'stem',
    was: "Mr Bingley cries: 'I would not be so fastidious as you are, for a kingdom!' What does 'fastidious' mean here?",
    now: "Mr Bingley cries: 'I would not be so fastidious as you are'. What does 'fastidious' mean here?",
    quotes: [{ text: 'I would not be so fastidious as you are', passageRef: PP, lineRefs: [57, 58] }],
    testedTokens: ['fastidious'],
    why: 'THE PRIORITY. Austen writes “I would not be so fastidious as you are,” cried Bingley, “for a kingdom!” — the item deleted the attribution from the middle and presented the join as one continuous cry. Truncating at the attribution quotes the passage exactly; the word under test is inside the span.',
  },
];

function loadPassage(id: string): CitablePassage {
  return JSON.parse(readFileSync(`${PASSAGE_DIR}/${id}.json`, 'utf8')) as CitablePassage;
}

async function main(): Promise<void> {
  const operator = await prisma.parentAccount.findUnique({ where: { email: ACTOR }, select: { id: true } });
  if (!operator) throw new Error(`${ACTOR} is not an account on this system`);

  console.log('=== Quotation corrections ===');
  let applied = 0;
  for (const fix of CORRECTIONS) {
    const item = await prisma.item.findUnique({ where: { id: fix.id }, include: { questionType: true } });
    if (!item) { console.log(`  ! ${fix.id}: no such item`); continue; }
    const stem = (item.stem ?? {}) as Record<string, unknown>;
    const explanation = (item.explanation ?? {}) as Record<string, unknown>;
    const current = fix.field === 'stem' ? ((stem.prompt as string) ?? '') : ((explanation.walkScript as string) ?? '');
    if (current.trim() !== fix.was.trim()) {
      console.log(`  ! ${fix.id} ${fix.field}: stored text is not what this correction was written against — SKIPPED`);
      console.log(`      stored  : ${current}`);
      console.log(`      expected: ${fix.was}`);
      continue;
    }

    // Both gates, before the write. A correction that does not itself pass is
    // not a correction.
    const quotes = (fix.quotes ?? []).map((quote) => quote.text);
    const passageRef = (stem.passageRef as string) ?? '';
    const copy = checkChildFacingText({
      role: fix.field === 'stem' ? 'item-stem' : 'hint',
      label: `${fix.id} ${fix.field}`,
      text: fix.now,
      quotedSpans: quotes,
      testedTokens: fix.testedTokens ?? [],
    }).filter(isBlocking);
    const lines = checkLineRefs({
      label: `${fix.id} ${fix.field}`,
      passageRef,
      passage: loadPassage(passageRef),
      lineRefs: fix.field === 'stem' ? (stem.lineRefs as number[] | undefined) : undefined,
      text: fix.now,
      declaredQuotes: quotes,
    });
    if (copy.length > 0 || lines.length > 0) {
      console.log(`  ✗ ${fix.id} ${fix.field}: the correction does not pass — NOT applied`);
      for (const fault of copy) console.log(`      ${fault.detail}`);
      for (const fault of lines) console.log(`      [${fault.rule}] ${fault.detail}`);
      continue;
    }

    console.log(`  ✓ ${fix.id} ${fix.field}`);
    console.log(`      was: ${fix.was}`);
    console.log(`      now: ${fix.now}`);
    if (DRY) continue;

    await prisma.item.update({
      where: { id: fix.id },
      data:
        fix.field === 'stem'
          ? {
              stem: {
                ...stem,
                prompt: fix.now,
                ...(fix.quotes ? { quotes: fix.quotes } : {}),
                ...(fix.testedTokens ? { testedTokens: fix.testedTokens } : {}),
              },
            }
          : { explanation: { ...explanation, walkScript: fix.now } },
    });
    await prisma.adminAuditLog.create({
      data: {
        actorId: operator.id,
        action: fix.field === 'stem' ? 'item.stem_rewritten_recorded' : 'item.walkscript_recorded',
        targetKind: 'Item',
        targetId: fix.id,
        detail: {
          writtenBy: `human:${ACTOR}`,
          recordedBy: `human:${ACTOR}`,
          authorship: 'direct',
          method: 'verbatim-quotation ruling, 2026-08-02',
          before: fix.was,
          after: fix.now,
          why: fix.why,
        },
      },
    });
    applied += 1;
  }

  console.log(`\n=== Cloze lineRefs → gapRef ===`);
  const cloze = await prisma.item.findMany({ where: { questionTypeId: 'en-spag-cloze' }, orderBy: { id: 'asc' } });
  let migrated = 0;
  for (const item of cloze) {
    const stem = (item.stem ?? {}) as Record<string, unknown>;
    const refs = stem.lineRefs;
    if (!Array.isArray(refs) || refs.length === 0) continue;
    if (refs.length > 1) {
      console.log(`  ! ${item.id}: ${refs.length} refs, cannot be a single gap — left alone`);
      continue;
    }
    const gap = refs[0] as number;
    console.log(`  ${item.id}: lineRefs [${gap}] → gapRef ${gap}`);
    if (DRY) { migrated += 1; continue; }
    // lineRefs is DROPPED, not left beside gapRef: leaving both would let a
    // reader — or a gate — pick the wrong one, which is the whole fault this
    // rename exists to close.
    const rest = Object.fromEntries(Object.entries(stem).filter(([key]) => key !== 'lineRefs'));
    await prisma.item.update({ where: { id: item.id }, data: { stem: { ...rest, gapRef: gap } } });
    await prisma.adminAuditLog.create({
      data: {
        actorId: operator.id,
        action: 'item.field_renamed',
        targetKind: 'Item',
        targetId: item.id,
        detail: {
          from: 'stem.lineRefs',
          to: 'stem.gapRef',
          value: gap,
          why: 'These were always gap numbers. Resolved as line numbers they were all "in range", so the citation certified itself.',
          ruling: 'David, 2026-08-02',
        },
      },
    });
    migrated += 1;
  }

  console.log(`\n${DRY ? '--dry-run: nothing written. ' : ''}Quotations: ${DRY ? CORRECTIONS.length : applied} · gapRef migrations: ${migrated}`);
  await prisma.$disconnect();
}

void main();
