import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { renderReviewerReturn, reviewerReturnBasename, type ReviewerReturnInput } from '@cluecrew/core';

/**
 * WRITES THE RETURN DOCUMENT AND HASHES THE BYTES IT WROTE.
 *
 * The renderer is pure and lives in core; this is the half that touches the disk, so it is the half
 * that must not cheat. **The hash is taken over the exact string handed to `writeFileSync`** — not
 * over a second render, not over the input, not over a re-read. R88's fault was a stamp computed
 * from a different projection than the one delivered, which put two materially different files under
 * one name; the same fault here would put a reviewer's name on a document she never saw.
 *
 * The directory is git-tracked. That is deliberate and is most of the value: a ruling that lands in
 * a commit has a diff, a date and an author, which is exactly what the six approvals we spent two
 * days failing to evidence did not have.
 */
const RETURNS_DIR = resolve(process.cwd(), '../../content/reviewer-returns');

export interface WrittenReturn { file: string; sha256: string; bytes: number }

export function writeReviewerReturn(input: ReviewerReturnInput): WrittenReturn {
  const body = renderReviewerReturn(input);
  const sha256 = createHash('sha256').update(body, 'utf8').digest('hex');
  const file = `${reviewerReturnBasename(input.scope, input.at)}-${sha256.slice(0, 16)}.md`;
  mkdirSync(RETURNS_DIR, { recursive: true });
  writeFileSync(join(RETURNS_DIR, file), body, 'utf8');
  return { file, sha256, bytes: Buffer.byteLength(body, 'utf8') };
}
