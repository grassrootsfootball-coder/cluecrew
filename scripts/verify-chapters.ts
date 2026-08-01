/**
 * Chapter publishing validation (STORY BIBLE v1.2 §9 + the three scoped
 * tasks, 2026-08-01): for every chapter past draft —
 *   - clueTap.itemId must reference a LIVE item (the story never bluffs:
 *     Real-Puzzle Law);
 *   - every seededWordId must exist in the Word Vault (Law 5: tappable
 *     words resolve to real entries);
 *   - Law 4 is re-checked here as belt-and-braces (schema already refuses
 *     a released chapter without audio).
 *
 * Run: pnpm verify:chapters  (CI, after seed).
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chapterFileSchema } from '@cluecrew/core';
import { prisma } from '../packages/db/src/index';

async function main(): Promise<void> {
  const dir = resolve(import.meta.dirname, '../content/chapters');
  if (!existsSync(dir)) {
    console.log('Chapter verification: no /content/chapters yet — nothing to verify.');
    await prisma.$disconnect();
    return;
  }
  const failures: string[] = [];
  let checked = 0;
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.json')) continue;
    const parsed = chapterFileSchema.parse(JSON.parse(readFileSync(join(dir, file), 'utf8')));
    const chapter = parsed.chapter;
    checked += 1;
    if (chapter.status === 'draft') continue;

    for (const wordId of chapter.seededWordIds) {
      const word = await prisma.word.findFirst({
        where: { OR: [{ id: wordId }, { headword: wordId }] },
      });
      if (!word) failures.push(`${chapter.id}: seeded word "${wordId}" not in the Vault`);
    }
    if (chapter.clueTap) {
      const item = await prisma.item.findUnique({ where: { id: chapter.clueTap.itemId } });
      if (!item) failures.push(`${chapter.id}: clueTap item ${chapter.clueTap.itemId} does not exist`);
      else if (item.status !== 'LIVE')
        failures.push(`${chapter.id}: clueTap item ${chapter.clueTap.itemId} is ${item.status}, not LIVE`);
    }
    if (chapter.status === 'released' && !chapter.audioRef) {
      failures.push(`${chapter.id}: released without audio (Law 4)`);
    }
  }
  if (failures.length > 0) {
    console.error(`Chapter verification FAILED (${failures.length}):`);
    for (const failure of failures) console.error(`  ${failure}`);
    process.exit(1);
  }
  console.log(`Chapter verification passed (${checked} chapter(s)).`);
  await prisma.$disconnect();
}

void main();
