/**
 * WHERE AN EXPORT ACTUALLY GOES (David's ruling, 2026-08-02).
 *
 * Three named exports in a row failed to reach authoring. The cause was not
 * the folder — it was that delivery was a SEPARATE, MANUAL step I took after
 * generating the file, and a manual step taken at the end of a long task is a
 * step that gets missed. Copying to Downloads was never part of any export
 * command; it was something I remembered to do, twice out of five times.
 *
 * So delivery is part of the export now. Every export writes its working copy
 * to /content/exports (the local record, gitignored) and then delivers to the
 * outbound folder Cowork has connected. A script that generates a file and
 * does not deliver it has not finished.
 *
 * The outbound folder is separate from the rest of the 11+ project on purpose:
 * what this repo SENDS is never mixed with what authoring sends back, so a
 * batch file and its review pack can never be confused for one another.
 */
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { basename, join } from 'node:path';

/** Confirmed with David, 2026-08-02: Cowork reads the ~/Downloads/11+/ tree. */
export const OUTBOUND_DIR = '/Users/davidb/Downloads/11+/from-cluecrew';

/**
 * The content hash goes IN the filename (David's ruling, 2026-08-02), so copies
 * self-identify and versions stop colliding on one date-stamped name. Same
 * content → same name (a re-run overwrites, no pileup); changed content → new
 * name, and the old one is superseded (see `deliver`).
 *
 *   vr-free-ten-c17a98c9d7c439cf.json
 */
export function stampedName(base: string, sourceHash: string, ext: string): string {
  return `${base}-${sourceHash}.${ext}`;
}

/**
 * Copies a generated file to the outbound folder — the ONLY delivery path.
 * (Manual copies to Downloads root are what let a stale file reach Cowork; they
 * are banned.) Throws rather than warns: a silent delivery failure is the whole
 * problem this exists to fix.
 *
 * `family` is the base name without the hash (e.g. "vr-free-ten"). When given,
 * every same-family outbound file whose CONTENT HASH differs from this file's —
 * an older hash, or a legacy date-stamped name with no hash — is removed, so
 * the folder holds exactly one current version and no superseded copy can be
 * read by mistake. Files sharing this file's hash (a pack's .html/.pdf/
 * -decisions.json siblings) are KEPT: they are the current set, not stale.
 */
export function deliver(sourcePath: string, family?: string): string {
  mkdirSync(OUTBOUND_DIR, { recursive: true });
  const name = basename(sourcePath);
  const target = join(OUTBOUND_DIR, name);
  if (family) {
    // The 16-hex content hash this delivery belongs to (absent for a legacy
    // date-named file, in which case nothing is kept as "same version").
    const hash = name.match(/-([0-9a-f]{16})(?:[.-]|$)/)?.[1];
    for (const existing of readdirSync(OUTBOUND_DIR)) {
      if (existing === name) continue;
      if (!existing.startsWith(`${family}-`)) continue;
      if (hash && existing.includes(hash)) continue; // a sibling of the current version
      rmSync(join(OUTBOUND_DIR, existing));
      console.log(`  superseded → removed stale ${existing}`);
    }
  }
  copyFileSync(sourcePath, target);
  console.log(`  delivered → ${target}`);
  return target;
}


/**
 * FRESHNESS STAMP (David's ruling, 2026-08-02 — four runs stalled on stale
 * exports). Every delivered export carries when it was built and a hash of the
 * exact source content it was built from, so a consumer can tell stale from
 * current: re-run the export and compare `sourceHash`. Same hash → the source
 * has not changed and the file is current; different → the file is stale.
 *
 * The hash is over the SOURCE rows, canonicalised (sorted keys), not over the
 * rendered file — so cosmetic changes to layout do not read as a content
 * change, and a real change to the items always does.
 *
 * `generatedAt` must be passed in (the workflow runtime forbids clock reads in
 * some contexts); pass `new Date().toISOString()` from the script entry point.
 */
export interface FreshnessStamp {
  generatedAt: string;
  sourceHash: string;
}

/**
 * WHAT THE ARTEFACT IS A SNAPSHOT OF (annie's ruling, 2026-08-08 — the tenth
 * delivery failure, and the finding underneath it).
 *
 * Her distinction, which the freshness stamp alone does not capture:
 *
 *   CONTENT ages VISIBLY. A passage export, a batch of items, a sample sheet —
 *   these stay true until the content itself changes, and a reader comparing
 *   them against the live thing can see the difference.
 *
 *   STATUS ages INVISIBLY. A queue of what is PROPOSED, a table of what is
 *   still to build, a list of hints that still need rewording — every one of
 *   these is stale the MOMENT the status changes, and nothing in the document
 *   says so. It goes on looking like a valid queue.
 *
 * The fourteen-entry proposed queue was dangerous rather than merely out of
 * date for exactly this reason: one entry had been ratified between export and
 * reading, and the file gave the reviewer no way to know. A content export
 * that loses a race is a stale copy; a status export that loses a race is a
 * WRONG INSTRUCTION about what to work on.
 *
 * So every export declares its kind here. `status` and `mixed` artefacts are
 * held to the stricter rule: they must carry the stamp IN the document a human
 * opens (see `stampHeader`), not only in a JSON sidecar, and they must have a
 * builder registered in `check-export-freshness` so staleness is DETECTABLE
 * rather than merely recorded.
 */
export type SnapshotOf = 'content' | 'status' | 'mixed';

export interface ArtefactStamp extends FreshnessStamp {
  /** What the reader is looking at a snapshot of. */
  snapshotOf: SnapshotOf;
  /** Plain-English name of the thing described, for the human-readable header. */
  describes: string;
}

/**
 * The stamp as a line a human reads, for .md and .html artefacts.
 *
 * The reviewer-status pair is why this exists: the stamp lived in the .json
 * sidecar while the reviewer read the .md, so the guard was on a file nobody
 * opened. A status artefact states its own staleness risk in its first lines
 * or the guard is decorative.
 */
export function stampHeader(stamp: ArtefactStamp, format: 'md' | 'html'): string {
  const when = stamp.generatedAt.slice(0, 16).replace('T', ' ');
  const warn =
    stamp.snapshotOf === 'content'
      ? 'Content snapshot — stays true until the content changes.'
      : `SNAPSHOT OF STATUS, ${when} UTC. Status may have moved since; this document cannot tell you that it has. Verify with \`pnpm check:export-freshness\` before working from it.`;
  const line = `Generated ${when} · describes ${stamp.describes} · source hash \`${stamp.sourceHash}\``;
  return format === 'md'
    ? `> ${warn}\n>\n> ${line}\n`
    : `<div class="stamp"><strong>${warn}</strong><br>${line}</div>`;
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort()
        .map((k) => [k, canonical((value as Record<string, unknown>)[k])]),
    );
  }
  return value;
}

export function freshnessStamp(source: unknown, generatedAt: string): FreshnessStamp {
  const hash = createHash('sha256').update(JSON.stringify(canonical(source))).digest('hex').slice(0, 16);
  return { generatedAt, sourceHash: hash };
}

/** A freshness stamp that also declares what it is a snapshot of (see `SnapshotOf`). */
export function artefactStamp(
  source: unknown,
  generatedAt: string,
  snapshotOf: SnapshotOf,
  describes: string,
): ArtefactStamp {
  return { ...freshnessStamp(source, generatedAt), snapshotOf, describes };
}
