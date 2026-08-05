/**
 * Walk scripts for the rewrite pass — `pnpm export:walk-scripts`.
 *
 * The 78 English scripts were drafted before the house style existed
 * (docs/authoring-calibration-log.md), so every one needs a pass against it.
 * This is the input to that pass: one record per item carrying everything
 * needed to rewrite the script without opening the database.
 *
 * Beyond the fields asked for, each record carries the misconception
 * DESCRIPTION alongside its id and the childHint the same wrong answer
 * already shows. A walk script is written against the reasoning a distractor
 * executes, and it has to sit beside that hint without repeating it — the id
 * alone tells a writer neither thing.
 *
 * `rewrittenWalkScript` is left empty on every record: this file is meant to
 * come back filled in.
 *
 * `--district=ENGLISH` (default) scopes it.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { deliver, freshnessStamp } from './lib/export-destination';
import { prisma } from '../packages/db/src/index';

const DISTRICT = (process.argv.find((arg) => arg.startsWith('--district='))?.split('=')[1] ??
  'ENGLISH') as 'VR' | 'NVR' | 'MATHS' | 'ENGLISH';
const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const TODAY = new Date().toISOString().slice(0, 10);

/** The style the rewrite is against, carried in the file so it travels. */
const HOUSE_STYLE = {
  source: 'docs/authoring-calibration-log.md — reviewer ruling, written review 2026-08-02',
  rules: [
    'Direct. No preamble; start where the work starts.',
    'Addresses the child. Second person — talking to them, not about them and not about the item.',
    'Three to four sentences.',
    'Scaffolds the logic TOWARD the answer: where to look, what to compare, what that tells you.',
    'Does NOT hand the answer over.',
    'Does NOT narrate the mistake. A script that recounts what a child got wrong teaches shame, not reading.',
  ],
  alsoApplies: [
    'Child-facing copy rules: no banned vocabulary, and no internal ids or slugs in the text.',
    'A quotation from the passage may be quoted rather than paraphrased — a paraphrase is our wording and is measured as such.',
  ],
};

async function main(): Promise<void> {
  const items = await prisma.item.findMany({
    where: { questionType: { district: DISTRICT } },
    include: { questionType: true, options: { include: { misconception: true } } },
    orderBy: { id: 'asc' },
  });

  const records = items.map((item) => {
    const stem = item.stem as Record<string, unknown>;
    const explanation = (item.explanation ?? {}) as Record<string, unknown>;
    const walkScript = (explanation.walkScript ?? explanation.walk ?? null) as string | null;

    return {
      itemId: item.id,
      questionType: item.questionType.name,
      questionTypeId: item.questionTypeId,
      tier: item.difficultyTier,
      // A comprehension walk script has to send the child to a place in the
      // passage, so the reference travels with it.
      passageRef: (stem.passageRef as string) ?? null,
      lineRefs: (stem.lineRefs as number[]) ?? [],
      stem: (stem.prompt as string) ?? '',
      options: item.options.map((option) => {
        const content = option.content as Record<string, unknown>;
        return {
          label: (content.label as string) ?? null,
          text: (content.value as string) ?? '',
          isKey: option.isCorrect,
          misconceptionId: option.misconceptionId,
          // The reasoning the distractor executes — what the script teaches against.
          misconception: option.misconception?.description ?? null,
          // Already shown to a child who picks this; the script sits beside it.
          childHint: option.misconception?.childHint ?? null,
        };
      }),
      currentWalkScript: walkScript,
      currentHintCore: (explanation.hintCore as string) ?? null,
      lowConfidence: Boolean(explanation.lowConfidence),
      rewrittenWalkScript: '',
    };
  });

  const withScript = records.filter((record) => record.currentWalkScript).length;

  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, `walk-scripts-${DISTRICT.toLowerCase()}-${TODAY}.json`);
  writeFileSync(
    path,
    JSON.stringify(
      {
        kind: 'walk-script-rewrite-input',
        ...freshnessStamp(records, new Date().toISOString()),
        district: DISTRICT,
        generated: TODAY,
        note: 'These scripts predate the house style and need a pass against it before any item goes LIVE. Fill in rewrittenWalkScript; leave everything else as it is.',
        houseStyle: HOUSE_STYLE,
        itemCount: records.length,
        withExistingScript: withScript,
        items: records,
      },
      null,
      2,
    ),
  );

  console.log(`${records.length} item(s) → ${path}`);
  deliver(path);
  console.log(`  carrying an existing walk script: ${withScript}`);
  console.log(`  flagged low confidence: ${records.filter((r) => r.lowConfidence).length}`);
  const byType = records.reduce<Record<string, number>>((acc, record) => {
    acc[record.questionTypeId] = (acc[record.questionTypeId] ?? 0) + 1;
    return acc;
  }, {});
  for (const [type, count] of Object.entries(byType)) console.log(`  ${type.padEnd(24)} ${count}`);
  await prisma.$disconnect();
}

void main();
