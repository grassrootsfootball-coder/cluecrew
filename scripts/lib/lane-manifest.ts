/**
 * THE LANE PLACES BY ORDINAL, AND STATES THE BASIS OF THAT ORDINAL (13 September).
 *
 * **WHAT ORDERED THIS LANE BEFORE: A CLOCK, AND A DISCONTINUOUS ONE.** Seventy artefacts, none
 * carrying an ordinal, no manifest, no index. The only sequence available was filesystem mtime —
 * and this session's clock moved 2026-09-05 → 2026-09-13 between two consecutive turns with no turn
 * between them. `content/exports` is gitignored (`.gitignore:33`), so git holds no record of an
 * emission and offers no order over the lane either — checked, not assumed. **The lane had no ordering basis it could state.**
 *
 * **THE HONEST SHAPE, AND IT IS NOT PARITY WITH THEIRS.** The authoring store's manifest is frozen
 * from a VERIFIED-MONOTONIC order. This one cannot make that claim about its first seventy, because
 * the only order available to seed them is the clock this entry exists to stop trusting. So the
 * manifest says so per entry: **`SEEDED-FROM-MTIME-NOT-VERIFIED` for the backfill,
 * `ASSIGNED-AT-EMISSION` for everything after the freeze.** A basis that is weak for part of a
 * population is stated per row, never averaged into a claim about the whole (R595).
 *
 * **APPEND-ONLY, NEVER RE-DERIVED.** An ordinal assigned at emission is a fact; an ordinal
 * recomputed later is a reading of whatever the directory looks like now — which is the fault this
 * closes, one turn removed.
 */
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';

const MANIFEST = pjoin(__dirname, '..', '..', 'content', 'lane-manifest.jsonl');

export type OrdinalBasis = 'SEEDED-FROM-MTIME-NOT-VERIFIED' | 'ASSIGNED-AT-EMISSION';
export interface LaneEntry { ordinal: number; name: string; sha256: string; basis: OrdinalBasis; note?: string }

export function readManifest(): LaneEntry[] {
  if (!existsSync(MANIFEST)) return [];
  return readFileSync(MANIFEST, 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l) as LaneEntry);
}

/** The next ordinal is one past the highest RECORDED — never a count of files on disk. */
export function nextOrdinal(): number {
  const m = readManifest();
  return m.length === 0 ? 1 : Math.max(...m.map((e) => e.ordinal)) + 1;
}

export function appendToManifest(entry: Omit<LaneEntry, 'ordinal'> & { ordinal?: number }): LaneEntry {
  const e: LaneEntry = { ordinal: entry.ordinal ?? nextOrdinal(), name: entry.name, sha256: entry.sha256, basis: entry.basis, ...(entry.note ? { note: entry.note } : {}) };
  appendFileSync(MANIFEST, `${JSON.stringify(e)}\n`);
  return e;
}

/** Monotonic, gapless, and no name recorded twice under two ordinals. */
export function verifyManifest(): { entries: number; monotonic: boolean; gaps: number[]; duplicates: string[]; byBasis: Record<string, number> } {
  const m = readManifest();
  const gaps: number[] = [];
  let monotonic = true;
  for (let i = 0; i < m.length; i += 1) {
    if (i > 0 && m[i]!.ordinal <= m[i - 1]!.ordinal) monotonic = false;
    if (m[i]!.ordinal !== i + 1) gaps.push(i + 1);
  }
  const seen = new Map<string, number>();
  const duplicates: string[] = [];
  for (const e of m) { if (seen.has(e.name) && seen.get(e.name) !== e.ordinal) duplicates.push(e.name); seen.set(e.name, e.ordinal); }
  const byBasis = m.reduce<Record<string, number>>((a, e) => { a[e.basis] = (a[e.basis] ?? 0) + 1; return a; }, {});
  return { entries: m.length, monotonic, gaps, duplicates, byBasis };
}
