/**
 * Chapter loading + unlock evaluation (STORY BIBLE v1.2 §9, feature-flagged).
 * Chapters are content files; triggers are evaluated against the child's
 * crew state — rank and cases cracked gate on PROGRESS and SITTING, never on
 * any score (Law 2 / §6). Board-triggered chapters surface through the mock
 * flow, not the shelf.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { chapterFileSchema, type ChapterFile } from '@cluecrew/core';

export type Chapter = ChapterFile['chapter'];

const CHAPTERS_DIR = resolve(process.cwd(), '../../content/chapters');

let cache: Chapter[] | null = null;

export function loadChapters(): Chapter[] {
  if (cache && process.env.NODE_ENV === 'production') return cache;
  if (!existsSync(CHAPTERS_DIR)) return [];
  cache = readdirSync(CHAPTERS_DIR)
    .filter((name) => name.endsWith('.json'))
    .map((name) =>
      chapterFileSchema.parse(JSON.parse(readFileSync(resolve(CHAPTERS_DIR, name), 'utf8'))).chapter,
    )
    .sort((a, b) => a.id.localeCompare(b.id));
  return cache;
}

export function chapterById(id: string): Chapter | null {
  return loadChapters().find((chapter) => chapter.id === id) ?? null;
}

/** Production serves released chapters only; dev/staging also show review. */
export function readable(chapter: Chapter): boolean {
  if (chapter.status === 'released') return true;
  return process.env.APP_ENV !== 'production' && chapter.status === 'review';
}

export interface UnlockInputs {
  rank: string;
  casesCracked: number;
  seasonsComplete: string[];
}

const RANK_ORDER = ['TRAINEE', 'JUNIOR_DETECTIVE', 'DETECTIVE', 'SENIOR_DETECTIVE', 'CHIEF_INSPECTOR'];

export function unlocked(chapter: Chapter, inputs: UnlockInputs): boolean {
  const trigger = chapter.trigger;
  if (trigger.kind === 'rank') {
    return RANK_ORDER.indexOf(inputs.rank) >= RANK_ORDER.indexOf(trigger.rank);
  }
  if (trigger.kind === 'cases_cracked') return inputs.casesCracked >= trigger.count;
  if (trigger.kind === 'season_complete') return inputs.seasonsComplete.includes(trigger.season);
  // Board beats render inside the mock flow, never from the shelf.
  return false;
}
