/**
 * WHAT IS IN THE DROP RIGHT NOW — `pnpm export:drop-manifest`
 *
 * The tenth delivery failure forced the question of whether the last hop can be OBSERVED, and it
 * cannot (see `docs/authoring-calibration-log.md`, R28). `deliver()` proves the write; nothing
 * proves the pickup, because there is no consumer on this side of the gap to leave a trace.
 *
 * So this inverts the check. Instead of trying to observe a push we cannot see, it publishes a
 * manifest the READER can verify against: every file currently in the drop, with its byte size and
 * the SHA-256 of its actual bytes. The reviewer answers "do I have the current queue?" by comparing
 * one hash, rather than by remembering a filename someone told her three messages ago.
 *
 * That does not fix the hop — it makes the hop's failure DETECTABLE from the far side, which is the
 * same move as the freshness stamp: a guard that cannot see the fault directly can still make the
 * fault answerable. The manifest is itself subject to the hop, and that is the point: if she has
 * the manifest, she can check everything; if she has not, the handover is broken and we know at
 * once instead of on the tenth attempt.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { OUTBOUND_DIR, artefactStamp, deliver, stampHeader, stampedName } from './lib/export-destination';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'drop-manifest';

interface Entry {
  file: string;
  bytes: number;
  sha256: string;
  modified: string;
}

function listDrop(): Entry[] {
  return readdirSync(OUTBOUND_DIR)
    .filter((f) => !f.startsWith('.') && !f.startsWith(`${FAMILY}-`))
    .sort()
    .map((file) => {
      const path = join(OUTBOUND_DIR, file);
      const st = statSync(path);
      return {
        file,
        bytes: st.size,
        sha256: createHash('sha256').update(readFileSync(path)).digest('hex').slice(0, 16),
        modified: st.mtime.toISOString().slice(0, 16).replace('T', ' '),
      };
    });
}

function main(): void {
  const entries = listDrop();
  const generatedAt = new Date().toISOString();
  const stamp = artefactStamp(entries, generatedAt, 'status', 'every file currently in the outbound drop, with its byte size and content hash');

  const rows = entries.map((e) => `| \`${e.file}\` | ${e.bytes.toLocaleString('en-GB')} | \`${e.sha256}\` | ${e.modified} |`).join('\n');
  const md =
    `# What is in the drop\n\n${stampHeader(stamp, 'md')}\n\n` +
    `${entries.length} files. **This is a checklist for the receiving end.** The sending end can prove a\n` +
    `file was written; it cannot prove one was collected, because nothing on the far side of the\n` +
    `handover leaves a trace this repo can read. So verify from your side: if a file you hold is not\n` +
    `listed here, it has been superseded; if a file listed here is one you do not hold, it has not\n` +
    `reached you and the handover — not the export — is what failed.\n\n` +
    `\`shasum -a 256 <file> | cut -c1-16\` reproduces the hash column.\n\n` +
    `| file | bytes | sha256 (first 16) | modified (UTC) |\n|---|---:|---|---|\n${rows}\n`;

  mkdirSync(OUT_DIR, { recursive: true });
  const base = stampedName(FAMILY, stamp.sourceHash, '').replace(/\.$/, '');
  const mdPath = join(OUT_DIR, `${base}.md`);
  const jsonPath = join(OUT_DIR, `${base}.json`);
  writeFileSync(mdPath, md);
  writeFileSync(jsonPath, JSON.stringify({ kind: FAMILY, ...stamp, count: entries.length, entries }, null, 2));
  for (const p of [mdPath, jsonPath]) deliver(p, FAMILY);
  console.log(`${entries.length} files in the drop`);
}

main();
