/**
 * ONE-TIME MIGRATION — `content/pilot-review/` becomes canonical. Run once; not part of the
 * ongoing pipeline (`scripts/lib/pilot-review.ts` is that). David's ruling, 2026-08-11.
 *
 * The files this seeds from already exist at `content/pilot-review/` (copied there ahead of this
 * script so their content could be hash-verified against the last confirmed state before anything
 * about them became "canonical"). This script's only job is to WRITE THE LOG ENTRY that makes the
 * migration itself an auditable act rather than a silent one, then lock the files — the same
 * discipline the ruling being corrected did not get.
 */
import { chmodSync, appendFileSync, existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PILOT_REVIEW_DIR } from './lib/pilot-review';
import { createHash } from 'node:crypto';

const FILES = ['ENG-004-anne-green-gables.json', 'ENG-004-CLUSTER.md', 'ENG-004-PILOT-NOTES.md'];
const LOG_PATH = join(PILOT_REVIEW_DIR, 'RULING-LOG.jsonl');

function sha256(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex').slice(0, 16);
}

function main(): void {
  if (!existsSync(LOG_PATH)) writeFileSync(LOG_PATH, '');

  const hashes: Record<string, string> = {};
  for (const f of FILES) {
    const path = join(PILOT_REVIEW_DIR, f);
    if (!existsSync(path)) throw new Error(`Migration expects ${f} already copied into ${PILOT_REVIEW_DIR}`);
    hashes[f] = sha256(path);
  }

  const entry = {
    at: new Date().toISOString(),
    file: FILES.join(', '),
    rulingBy: 'David (migration, not a content ruling)',
    recordedBy: 'human:david@cluecrew.test',
    description:
      'BOOTSTRAP MIGRATION: content/pilot-review/ becomes the canonical, git-tracked, ' +
      'permission-locked home for pilot content. Prior location was two loose copies under ' +
      '~/Downloads/11+ with no history, no gate, no log — the condition that let a hand-edit reach ' +
      'the right content with no actor attached. ENG-004-anne-green-gables.json is seeded from the ' +
      'state verified (hash 749a8a6a13286fce, confirmed by three independent reads) to already ' +
      'reflect R46\'s rulings. Nothing about the content changes here; only its location and its ' +
      'write path do.',
    itemsTouched: [],
    gateVerdict: 'n/a',
    emergencyOverride: false,
    hashesAtMigration: hashes,
  };
  chmodSync(LOG_PATH, 0o644);
  appendFileSync(LOG_PATH, JSON.stringify(entry) + '\n');
  chmodSync(LOG_PATH, 0o444);

  for (const f of FILES) chmodSync(join(PILOT_REVIEW_DIR, f), 0o444);

  console.log('Migration recorded. Locked files:');
  for (const f of FILES) {
    const path = join(PILOT_REVIEW_DIR, f);
    const mode = (statSync(path).mode & 0o777).toString(8);
    console.log(`  ${mode}  ${f}  sha256:${hashes[f]}`);
  }
}

main();
