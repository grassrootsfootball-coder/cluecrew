/**
 * NOTHING ENTERS THE OUTBOUND FOLDER EXCEPT THROUGH THE DOOR (David, 2026-08-20 — R343).
 *
 * `deliver()` copies, hashes the staged BYTES, writes a `.sha256` sidecar and counts the queue.
 * A `cp` does the copy and none of the rest — **and the result is indistinguishable from a
 * delivery.** Five artefacts went that way in two days; the only tell was a missing sidecar, and
 * nothing read sidecars. **This closes the class rather than the five instances.**
 *
 * It is the freshness check's shape, one step earlier: **a directory the other side READS needs a
 * guard on what ENTERS it, not only on what changes inside it.** Every guard here watched content
 * moving between stores; none watched the folder the movement passes through.
 *
 * FOUR FINDINGS, and only two of them fail:
 *
 *   BYPASS               staged after the door started writing sidecars, and has none. A `cp`.
 *   OVERWRITTEN          sidecar present, bytes no longer match it. A `cp` ONTO a real delivery —
 *                        the worst case, because the sidecar still looks like proof and the other
 *                        store would compare against a digest for content nobody holds.
 *   PRE-MECHANISM        staged before sidecars existed. Legitimately has none. Counted and named
 *                        by DATE every run so a dated backlog cannot decay into a green tick (R61).
 *   ORPHAN SIDECAR       a digest whose file is gone. Reported; usually a supersede that removed
 *                        the file and left its receipt.
 *
 * **WHAT IT CANNOT SCREEN, stated because a guard that hides its bound is worse than none** (R60,
 * R94): a `cp` accompanied by a hand-written matching sidecar passes. That is not an accidental
 * bypass, it is a forgery, and no check on this side can tell it from a delivery. The bound is the
 * honest one — this catches the mechanism being SKIPPED, not the mechanism being FAKED.
 */
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { OUTBOUND_DIR } from './lib/export-destination';
import { declareMayBeEmpty, requirePopulation } from './lib/population';

/**
 * The instant `deliver()` began writing sidecars — commit `7dffe51`, 2026-08-19 23:59:07 +0100,
 * found with `git log -S'writeFileSync(\`${target}.sha256\`'`. **Derived, not chosen**: a
 * hand-picked date would be a guess about when the backlog stops, and this is the fact itself.
 *
 * Carried WITH ITS OFFSET so the comparison against a filesystem mtime is between two absolute
 * instants (R80 — is the thing I am comparing to keeping the same clock as the thing I measure?).
 * The session runs BST; a bare local date here would misfile every artefact staged in the last
 * hour of 19 August.
 */
const SIDECARS_SINCE = new Date('2026-08-19T23:59:07+01:00');

interface Finding {
  name: string;
  staged: Date;
}

function main() {
  let entries: string[];
  // R61/R1056: the folder ABSENT is declared legitimate and printed as such; any other read failure
  // still aborts.
  if (!existsSync(OUTBOUND_DIR)) {
    declareMayBeEmpty('check:outbound-sidecars', `staged files at ${OUTBOUND_DIR}`, 0,
      "the outbound folder is Cowork's staging door on David's machine, outside the repository; Cowork is retired (R1034) and a CI checkout has no such folder (R1056). Where the folder exists, every staged artefact is still checked.");
    return;
  }
  try {
    entries = readdirSync(OUTBOUND_DIR);
  } catch {
    console.error(`check:outbound-sidecars ABORTED — cannot read ${OUTBOUND_DIR}.`);
    process.exit(1);
  }

  const files = entries.filter((n) => !n.endsWith('.sha256'));
  const sidecars = new Set(entries.filter((n) => n.endsWith('.sha256')));

  const bypass: Finding[] = [];
  const overwritten: Finding[] = [];
  const preMechanism: Finding[] = [];

  for (const name of files) {
    const path = join(OUTBOUND_DIR, name);
    let staged: Date;
    try {
      staged = statSync(path).mtime;
    } catch {
      continue;
    }
    if (!sidecars.has(`${name}.sha256`)) {
      (staged >= SIDECARS_SINCE ? bypass : preMechanism).push({ name, staged });
      continue;
    }
    const recorded = readFileSync(join(OUTBOUND_DIR, `${name}.sha256`), 'utf8').trim().split(/\s+/)[0];
    const actual = createHash('sha256').update(readFileSync(path)).digest('hex');
    if (recorded !== actual) overwritten.push({ name, staged });
  }

  const orphans = [...sidecars].filter((s) => !files.includes(s.replace(/\.sha256$/, '')));

  requirePopulation('check:outbound-sidecars', {
    'staged file(s)': files.length,
    'sidecar(s)': sidecars.size,
  });

  const day = (d: Date) => d.toISOString().slice(0, 10);

  if (preMechanism.length > 0) {
    const byDay = new Map<string, number>();
    for (const f of preMechanism) byDay.set(day(f.staged), (byDay.get(day(f.staged)) ?? 0) + 1);
    console.log(
      `\nPRE-MECHANISM (no sidecar, legitimately): ${preMechanism.length}\n` +
        `  Staged before ${SIDECARS_SINCE.toISOString()}, when deliver() began writing sidecars.\n` +
        '  These cannot be verified on arrival in either direction. That is a DATED BACKLOG, not a\n' +
        '  pass — re-staging any of them through deliver() gives it a digest.\n' +
        `  ${[...byDay].sort().map(([d, n]) => `${d}: ${n}`).join(' · ')}`,
    );
  }
  if (orphans.length > 0) {
    console.log(`\nORPHAN SIDECAR (digest whose file is gone): ${orphans.length}`);
    for (const o of orphans) console.log(`  ${o}`);
  }

  if (bypass.length === 0 && overwritten.length === 0) {
    console.log(
      `\ncheck:outbound-sidecars: 0 bypassed the door. ${files.length - preMechanism.length} of ` +
        `${files.length} staged file(s) carry a matching digest.`,
    );
    return;
  }

  if (bypass.length > 0) {
    console.error(`\nBYPASSED THE DOOR — copied in, never staged: ${bypass.length}`);
    for (const f of bypass) console.error(`  ${f.name}  (appeared ${day(f.staged)})`);
  }
  if (overwritten.length > 0) {
    console.error(`\nOVERWRITTEN AFTER STAGING — sidecar no longer describes the file: ${overwritten.length}`);
    for (const f of overwritten) console.error(`  ${f.name}  (changed ${day(f.staged)})`);
    console.error(
      '  This is the worst of the four: the sidecar still LOOKS like proof, so the other store\n' +
        '  would compare its bytes against a digest for content nobody holds any more.',
    );
  }
  console.error(
    '\n  Re-stage each through deliver() — it writes the digest the other store quotes back.\n' +
      '  A file in this folder with no digest cannot be confirmed as arrived in either direction,\n' +
      '  which is the whole of what STAGED means (R255).',
  );
  process.exit(1);
}

main();
