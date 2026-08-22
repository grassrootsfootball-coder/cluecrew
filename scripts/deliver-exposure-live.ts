/**
 * THE 28-LIVE EXPOSURE LIST, FOR CROSSING (David, 2026-08-22 — R616's population as an artefact).
 *
 * **Item id, LIVE status, each tagged distractor, entry name per tag. NO HINT TEXTS** — those are
 * the other store's to join, and carrying them here would put two copies of library text in motion
 * when one store owns it (the DB authors library text; this file is for Cowork/Annie to join
 * against their own view).
 *
 * The population is R616's: an item whose `hintCore` exists but does not serve (chooseHint →
 * library), carrying at least one distractor tagged with one of the 15 entries whose hint asserts
 * something about the item. **Derived at emit time from the same resolver the serving path calls**
 * — never from a saved list, so a hint moving into service drops its item from this file on the
 * next run.
 */
import { writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chooseHint } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { requirePopulation } from './lib/population';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const FAMILY = 'exposure-live-asserting-entries';
/**
 * The 15 entries asserting something about the item, from the assertion-first reading (R607).
 * Read from the staged carrier artefact rather than re-deriving, so this file and that one cannot
 * disagree about the population's definition.
 */
const CARRIER_FILE = join(REPO, 'content/exports/library-hints-with-carriers-1559323e937b2a07.json');

async function main() {
  const carrierDoc = JSON.parse(readFileSync(CARRIER_FILE, 'utf8')) as {
    rows: Array<{ entryId: string; theAssertingClauses: Array<{ clause: string; aboutThisItem: boolean }> }>;
  };
  if (!Array.isArray(carrierDoc.rows)) throw new Error('exposure-live: carrier artefact has no rows — refusing the shape (R173).');
  const ABOUT = new Set(carrierDoc.rows.filter((r) => r.theAssertingClauses.some((c) => c.aboutThisItem)).map((r) => r.entryId));

  const items = await prisma.item.findMany({ where: { status: 'LIVE' }, include: { options: true } });
  const rows = items
    .filter((i) => {
      const h = (i.explanation as { hintCore?: unknown } | null)?.hintCore;
      return typeof h === 'string' && h.trim() !== '' && chooseHint(i.explanation as never).serves === 'library';
    })
    .map((i) => ({
      itemId: i.id,
      status: i.status,
      taggedDistractors: i.options
        .filter((o) => !o.isCorrect && ABOUT.has((o as { misconceptionId?: string | null }).misconceptionId ?? ''))
        .map((o) => ({
          value: String(((o.content ?? {}) as { value?: unknown }).value ?? ''),
          entry: (o as { misconceptionId?: string | null }).misconceptionId as string,
        })),
    }))
    .filter((r) => r.taggedDistractors.length > 0)
    .sort((a, b) => a.itemId.localeCompare(b.itemId));

  requirePopulation('deliver:exposure-live', {
    'LIVE item(s)': items.length,
    'asserting entr(ies) joined against': ABOUT.size,
    'exposed LIVE item(s)': rows.length,
  });

  const payload = {
    what: 'Every LIVE item whose authored hintCore does NOT serve, carrying a distractor tagged with an entry whose library hint asserts something about the item. A child missing on such an option receives the asserting library hint while an authored item hint sits unserved.',
    noHintTexts: 'Deliberate. Hint texts are the library store\'s to join — two copies in motion is the drift fault. Join by entry name.',
    upperBound: 'This is the EXPOSED population. Which of these were approved-as-written by Annie is not machine-readable and is not claimed.',
    derivation: 'Computed at emit time from the same resolver the serving path calls (chooseHint), so an item whose hint moves into service drops out on the next run.',
    denominators: { liveItems: items.length, exposedLiveItems: rows.length, assertingEntries: [...ABOUT].sort() },
    rows,
  };
  const stamp = artefactStamp(payload, new Date().toISOString(), 'content',
    'LIVE items exposed to asserting library hints while carrying an unserved item hint',
    ['what', 'noHintTexts', 'upperBound', 'derivation', 'denominators', 'rows']);
  const path = join(REPO, 'content/exports', stampedName(FAMILY, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify({ stamp, ...payload }, null, 2));
  deliver(path, FAMILY);
  console.log(`\n${rows.length} exposed LIVE item(s). STAGED, not crossed — only the receiver can report arrival (R255).`);
  await prisma.$disconnect();
}

void main();
