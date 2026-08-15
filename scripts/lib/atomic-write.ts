/**
 * WRITE VIA A TEMP FILE AND A RENAME — never in place.
 *
 * `writeFileSync` TRUNCATES first and then writes. If the process dies between those two steps —
 * and the `head -50` BrokenPipe incident is exactly that, a downstream reader closing the pipe and
 * killing the writer mid-call — the file is left truncated. Authored item records are the worst
 * case: the truncation is silent, the file still parses if it happens to land on a boundary, and
 * the loss is content a reviewer approved.
 *
 * `rename(2)` within a filesystem is ATOMIC. A reader sees either the whole old file or the whole
 * new one, never a half-written one, and a process killed before the rename leaves the original
 * untouched. That removes the class rather than narrowing the window.
 *
 * THIS IS THE PREVENTION; THE DATED PER-ITEM NOTES ARE THE RESUME PATH (David, 2026-08-13). Both
 * stay. The notes tell you where an interrupted run got to; the rename means there is nothing to
 * repair when it stops.
 *
 * The temp file sits in the SAME DIRECTORY as the target on purpose: rename is only atomic within
 * a filesystem, and /tmp is frequently a different one. Permissions are applied to the temp file
 * BEFORE the rename, so the file is never briefly world-writable under its real name.
 */
import { chmodSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

let counter = 0;

export function atomicWriteFileSync(path: string, data: string, mode?: number): void {
  // Same directory: rename across filesystems is not atomic and may not even be permitted.
  const temp = join(dirname(path), `.${counter++}.tmp-atomic-write`);
  try {
    writeFileSync(temp, data);
    if (mode !== undefined) chmodSync(temp, mode);
    renameSync(temp, path);
  } catch (error) {
    // A failed write must not leave debris that a later glob mistakes for content.
    try { rmSync(temp, { force: true }); } catch { /* the original is intact either way */ }
    throw error;
  }
}
