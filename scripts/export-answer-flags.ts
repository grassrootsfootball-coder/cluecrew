/**
 * THE ANSWERABILITY FLAGS — `pnpm export:answer-flags`
 *
 * FIRST OF THE RETURN-LEG CLASSES, and ahead of five larger ones, because of what it is: eight
 * items in the bank that A CHILD CANNOT ANSWER, each carrying a recorded verdict saying so, and
 * the verdict had never reached anyone who could act on it.
 *
 * `answerFlaggedAt` is deliberately UNLIKE `similarityFlaggedAt`: there is no clearing field and no
 * reviewer note that dismisses it. The flag goes when the item is fixed and the gate stops setting
 * it, and by no other route (David's ruling, 2026-08-02). So it is the one verdict in the store
 * that ONLY THE AUTHOR CAN DISCHARGE — and the author could not see it.
 *
 * WHO SET IT, STATED PRECISELY. `pnpm check:word-puzzles` sets this flag by executing the item's
 * own rule and comparing the result against its key. It is a MACHINE verdict under David's ruling,
 * not a reviewer's prose, and this export says so rather than letting eight machine findings travel
 * under a reviewer's authority. The distinction is the whole subject of R75.
 *
 * IT SENDS THE VALUES, NOT AN ACCOUNT OF THEM (R25). The note verbatim, and with it the stem and
 * every option — because "key is C but the only valid move is E" cannot be acted on without the
 * item it describes, and an author asked to fix eight items should not have to go looking for them.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { prisma as defaultPrisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'answer-flags-open';

/** The delivered projection AND the stamp source. One function, so the name moves when the payload does (R88). */
export async function buildAnswerFlagSource(prisma: typeof defaultPrisma): Promise<unknown> {
  const rows = await prisma.item.findMany({
    where: { answerFlagNote: { not: null } },
    include: { options: { orderBy: { id: 'asc' } }, questionType: true },
    orderBy: { id: 'asc' },
  });
  return rows.map((it) => {
    const stem = (it.stem ?? {}) as Record<string, unknown>;
    return {
      itemId: it.id,
      status: it.status,
      questionTypeId: it.questionTypeId,
      mechanic: it.questionType.mechanic,
      flaggedAt: it.answerFlaggedAt?.toISOString() ?? null,
      // VERBATIM. This is the finding; a paraphrase of it is a door into the gate's judgement
      // with no guard on it.
      answerFlagNote: it.answerFlagNote,
      setBy: 'pnpm check:word-puzzles — the item\'s own rule executed against its key',
      clearedBy:
        'NOTHING. There is no clearing field by design: the flag goes when the item is fixed and '
        + 'the gate stops setting it. A reviewer cannot wave it through.',
      stem: stem.text ?? stem.prompt ?? null,
      options: it.options.map((o) => ({
        label: (o.content as { label?: unknown })?.label ?? null,
        value: (o.content as { value?: unknown })?.value ?? o.content,
        isCorrect: o.isCorrect,
      })),
    };
  });
}

async function main(): Promise<void> {
  const prisma = defaultPrisma;
  const entries = (await buildAnswerFlagSource(prisma)) as Array<{ itemId: string; status: string }>;

  // NOT a population that may legitimately be empty today: eight items carry the flag. An empty
  // run means the query or the column moved, not that the bank is clean — and "0 flagged items"
  // is the single most reassuring wrong sentence this export could print.
  requirePopulation('export:answer-flags', { 'items carrying an answerability flag': entries.length });

  const generatedAt = new Date().toISOString();
  const stamp = artefactStamp(
    entries,
    generatedAt,
    'content',
    'every open answerability flag, with the gate\'s note verbatim and the item it describes',
    ['entries'],
  );
  const out = {
    kind: 'answer-flags-open',
    note:
      'Items whose OWN RULE does not produce their key. A child cannot answer these. The flag is '
      + 'set by a gate, not by a reviewer, and there is no route to clear it except fixing the item.',
    generatedAt,
    stamp,
    count: entries.length,
    entries,
  };
  const json = JSON.stringify(out, null, 2);
  mkdirSync(OUT_DIR, { recursive: true });
  const name = stampedName(FAMILY, stamp.sourceHash, 'json');
  const path = join(OUT_DIR, name);
  writeFileSync(path, json);
  deliver(path, FAMILY);

  const byStatus = entries.reduce<Record<string, number>>((a, e) => { a[e.status] = (a[e.status] ?? 0) + 1; return a; }, {});
  console.log(`${entries.length} open answerability flag(s) · ${JSON.stringify(byStatus)}`);
  console.log('  Every one is an item a child cannot answer. Only the author can discharge these.');
  await prisma.$disconnect();
}

void main();
