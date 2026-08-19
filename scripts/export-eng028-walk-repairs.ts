/**
 * THE FOUR REFUSED ENG-028 WALKS, REPAIRED — proposed for Annie's read, NOT written.
 *
 * **HER DIAGNOSIS IS THE SPEC.** All four have one shape: *line N says, line N says, line N says,
 * stop.* Three citations in a row with no conclusion, and on two of them the cited lines are not
 * even the ones that bear on the question — PR-07 spends two sentences on a bolt and a door where
 * the question asks about the mower; PR-04 opens on the day of the holidays where the question asks
 * WHY she was reaching into the nettles.
 *
 * **AND THE SHAPE IS NOT MERELY UNHELPFUL, IT TEACHES THE ERROR THE ITEM CATCHES.** A walk that
 * recites the lines nearest the cited range demonstrates RETRIEVAL BY PROXIMITY — one of the very
 * misconceptions these items exist to expose. A child following it faithfully would answer the next
 * one wrong by the method the walk modelled.
 *
 * **THE SIX APPROVED ARE THE MODEL AND THEY SHARE ONE STRUCTURE:** go to the line that bears on the
 * question, say what it says, **state the answer**, then dispose of the near-misses in a clause. So
 * each repair below cuts the citations to the ones that bear, and closes with what the answer is
 * and why. Nothing else moved.
 *
 * Every repair carries its gate verdict, and PROPOSED is the status — walk scripts are item content
 * and Walk serves only from the approved set, so writing these would change nothing a child meets
 * while spending her authority for her.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { checkChildFacingText, isBlocking } from '../packages/core/src/index';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'eng028-walk-repairs';

const REPAIRS: Record<string, { proposed: string; cut: string; keptBecause: string }> = {
  'ENG-028-PR-02': {
    proposed: 'Go to line 6. It says two boards have pulled apart under the roof. That gap is what she can see. Line 5 only tells you where she is standing.',
    cut: 'The line 5 flagstone sentence, and the second line 6 sentence about traffic going in and out.',
    keptBecause: 'The gap IS the answer; the traffic is what she sees through it. One line bears on the question and it is line 6.',
  },
  'ENG-028-PR-04': {
    proposed: 'Line 13 says her ball had gone down the side of the shed. That is why she reached in. The day of the holidays tells you when, not why.',
    cut: 'The opening sentence about the second day of the holidays, as a citation.',
    keptBecause: 'It returns as the near-miss rather than the opener — the question asks WHY, and a date answers WHEN.',
  },
  'ENG-028-PR-07': {
    proposed: 'Line 26 answers it. Grandad wants the mower out so her mum comes home to a garden she knows. The bolt and the door are how he gets to it.',
    cut: 'The line 24 bolt sentence and the line 25 door sentence, as citations.',
    keptBecause: 'Two of three sentences were about a bolt and a door where the question asks about the mower. They are the route, not the reason.',
  },
  'ENG-028-PR-10': {
    proposed: 'Line 40 is the one that answers it. Both times, he answered a different question. Lines 37 and 39 only show her saying his name.',
    cut: 'The line 37 and line 39 citations, as the body of the walk.',
    keptBecause: 'The question asks what happens BOTH times; only line 40 states the pattern.',
  },
};

const sentences = (s: string) => s.split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter(Boolean);
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

async function main() {
  const ids = Object.keys(REPAIRS);
  const items = await prisma.item.findMany({
    where: { id: { in: ids } },
    select: { id: true, status: true, stem: true, explanation: true, options: { select: { content: true, isCorrect: true } } },
    orderBy: { id: 'asc' },
  });
  requirePopulation('ENG-028 walk repairs', { 'ids asked about': ids.length, 'rows found': items.length });

  const repairs = items.map((item) => {
    const r = REPAIRS[item.id]!;
    const faults = checkChildFacingText({ role: 'hint', label: `${item.id}.walkScript`, text: r.proposed });
    return {
      itemId: item.id,
      status: item.status,
      stem: ((item.stem ?? {}) as { text?: string }).text ?? null,
      key: ((item.options.find((o) => o.isCorrect)?.content ?? {}) as { value?: string }).value ?? null,
      current: String(((item.explanation ?? {}) as Record<string, unknown>).walkScript ?? ''),
      proposed: r.proposed,
      whatWasCut: r.cut,
      whyThisLineBears: r.keptBecause,
      sentenceCount: sentences(r.proposed).length,
      longestSentenceWords: Math.max(...sentences(r.proposed).map(words)),
      gateVerdict: faults.filter(isBlocking).length === 0 ? 'PASSES' : 'BLOCKED',
      gateFaults: faults.map((f) => `${f.rule}: ${f.detail}`),
    };
  });

  const payload = {
    what: 'Repairs for the four ENG-028 walks Annie refused. PROPOSED — nothing written.',
    herDiagnosis:
      'Identical shape on all four: line N says, line N says, line N says, stop. Three citations, no conclusion, and on PR-04 and PR-07 the cited lines are not the ones that bear on the question.',
    whyTheShapeIsHarmful:
      'A walk that recites the lines nearest the cited range demonstrates RETRIEVAL BY PROXIMITY — one of the errors these items are built to catch. A child following it faithfully would answer the next one wrong by the method it modelled.',
    theModel:
      'The six approved share one structure: go to the line that bears on the question, say what it says, STATE THE ANSWER, then dispose of the near-misses in a clause.',
    notWrittenBecause:
      'Walk scripts are item content, and Walk serves only from the approved set — so writing these would change nothing a child meets while spending her authority for her.',
    repairs,
  };

  const stamp = artefactStamp(payload, new Date().toISOString(), 'content',
    'four proposed walk-script repairs with their current text, gate verdicts and what was cut', ['repairs']);
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, stampedName(FAMILY, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify({ stamp, ...payload }, null, 2));
  deliver(path, FAMILY);

  for (const r of repairs) {
    console.log(`\n${r.itemId} [${r.status}] ${r.gateVerdict} — ${r.sentenceCount} sentences, longest ${r.longestSentenceWords}w`);
    console.log(`  was: ${r.current}`);
    console.log(`  now: ${r.proposed}`);
  }
  await prisma.$disconnect();
}

main();
