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
