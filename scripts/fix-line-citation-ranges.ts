/**
 * SINGLE-LINE CITATIONS THAT SHOULD BE RANGES (David's ruling, 2026-08-02).
 *
 * Six walk scripts name one line and then quote a span that runs onto the
 * next. The citation is not wrong — the quote does begin there, which is why
 * the line-reference gate passes them — but it is short. A child told to read
 * line 8 reads line 8, does not find the end of the sentence, and concludes
 * they have misunderstood. The gate checks that a citation is TRUE; this makes
 * it USEFUL, and only a human can tell the difference between the two.
 *
 * Both gates run before anything is written: adding "and 9" costs two words
 * and a walk-script sentence is capped at 16.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  checkChildFacingText,
  checkLineRefs,
  extractQuotedSpans,
  findSpan,
  isBlocking,
  type CitablePassage,
} from '@cluecrew/core';
import { prisma } from '../packages/db/src/index';

const DRY = process.argv.includes('--dry-run');
const DIR = resolve(import.meta.dirname, '../content/passages');
const ACTOR = 'david@cluecrew.test';

const passages = new Map<string, CitablePassage>();
for (const file of readdirSync(DIR)) {
  if (!file.endsWith('.json')) continue;
  const passage = JSON.parse(readFileSync(join(DIR, file), 'utf8')) as CitablePassage;
  passages.set(passage.id, passage);
}

/** Third-person singular → plural, for the verb that follows a widened
 *  citation used as the sentence's subject. */
const SINGULAR_TO_PLURAL: Record<string, string> = {
  says: 'say', puts: 'put', gives: 'give', shows: 'show', tells: 'tell',
  has: 'have', is: 'are', does: 'do', carries: 'carry', names: 'name',
  holds: 'hold', sits: 'sit', makes: 'make', comes: 'come',
};

const norm = (text: string): string =>
  text.replace(/['‘’"“”]/g, "'").replace(/\s+/g, ' ').trim().toLowerCase();

/** The last line a span touches. */
function endLine(passage: CitablePassage, span: string, start: number): number {
  const lines = passage.numberedLines.filter((line) => line.n !== null);
  const needle = norm(span);
  let acc = '';
  for (const line of lines) {
    if (line.n! < start) continue;
    acc = acc ? `${acc} ${line.text}` : line.text;
    if (norm(acc).includes(needle)) return line.n!;
  }
  return start;
}

async function main(): Promise<void> {
  const operator = await prisma.parentAccount.findUnique({ where: { email: ACTOR }, select: { id: true } });
  if (!operator) throw new Error(`${ACTOR} is not an account on this system`);

  const items = await prisma.item.findMany({ orderBy: { id: 'asc' } });
  let applied = 0;
  let held = 0;

  for (const item of items) {
    const stem = (item.stem ?? {}) as Record<string, unknown>;
    const explanation = (item.explanation ?? {}) as Record<string, unknown>;
    const passage = passages.get(stem.passageRef as string);
    const script = explanation.walkScript;
    if (!passage || passage.gapCount !== undefined || typeof script !== 'string') continue;
    if (typeof explanation.walkScriptBy === 'string') continue; // a person's words

    const ranges = [...script.matchAll(/\blines?\s+(\d+)\s*(?:to|through|and|[-–—])\s*(\d+)\b/gi)].map((m) =>
      Number(m[1]),
    );
    let next = script;
    const notes: string[] = [];
    for (const span of extractQuotedSpans(script)) {
      const at = findSpan(passage, span);
      if (at === null) continue;
      const end = endLine(passage, span, at);
      if (end <= at || ranges.includes(at)) continue;
      // Replace only the citation that anchors THIS quote, preserving the
      // author's capitalisation.
      // Case-INSENSITIVE with the initial captured: a script that opens
              // "Line 14 gives it" needs the same widening as one that says
              // "on line 14", and the first draft here silently skipped two
              // of the six because the L was capital.
              const pattern = new RegExp(`\\b([Ll])(ine)\\s+${at}\\b`, 'g');
      const replaced = next.replace(pattern, (_m, l: string, ine: string) => `${l}${ine}s ${at} and ${end}`);
      if (replaced === next) continue;
      // SUBJECT-VERB AGREEMENT. "Line 14 says" becomes "Lines 14 and 15
      // says" under a naive replace, and shipping ungrammatical copy to a
      // child to satisfy a citation rule would be a poor trade. Only the verb
      // IMMEDIATELY after the citation is touched — that is the only position
      // where the widened phrase is the subject.
      next = replaced.replace(
        new RegExp(`(\\b[Ll]ines ${at} and ${end}\\s+)(says|puts|gives|shows|tells|has|is|does|carries|names|holds|sits|makes|comes)\\b`, 'g'),
        (_m, head: string, verb: string) => head + SINGULAR_TO_PLURAL[verb],
      );
      notes.push(`line ${at} → lines ${at} and ${end} (quote "${span.slice(0, 40)}…" runs on)`);
    }
    if (notes.length === 0) continue;

    const quotedSpans = Array.isArray(stem.quotes)
      ? (stem.quotes as Array<{ text?: string }>).map((q) => q.text ?? '').filter(Boolean)
      : [];
    const copy = checkChildFacingText({
      role: 'hint',
      label: `${item.id} walkScript`,
      text: next,
      quotedSpans: quotedSpans.filter((q) => next.includes(q)),
    }).filter(isBlocking);
    const lines = checkLineRefs({
      label: `${item.id} walkScript`,
      passageRef: stem.passageRef as string,
      passage,
      text: next,
    });
    if (copy.length > 0 || lines.length > 0) {
      held += 1;
      console.log(`  ✗ ${item.id}: the widened citation does not pass — NOT applied`);
      for (const f of copy) console.log(`      ${f.detail}`);
      for (const f of lines) console.log(`      [${f.rule}] ${f.detail}`);
      continue;
    }

    console.log(`  ✓ ${item.id}: ${notes.join('; ')}`);
    console.log(`      ${next}`);
    if (DRY) { applied += 1; continue; }
    await prisma.item.update({
      where: { id: item.id },
      data: { explanation: { ...explanation, walkScript: next } },
    });
    await prisma.adminAuditLog.create({
      data: {
        actorId: operator.id,
        action: 'item.walkscript_recorded',
        targetKind: 'Item',
        targetId: item.id,
        detail: {
          writtenBy: `human:${ACTOR}`,
          recordedBy: `human:${ACTOR}`,
          authorship: 'direct',
          method: 'line-citation range ruling, 2026-08-02',
          before: script,
          after: next,
          why: 'The cited line was true but short: the quote runs onto the next line, so a child reading only the cited line never reaches the end of the evidence.',
        },
      },
    });
    applied += 1;
  }

  console.log(`\n${DRY ? '--dry-run: nothing written. ' : ''}widened: ${applied} · held back: ${held}`);
  await prisma.$disconnect();
}

void main();
