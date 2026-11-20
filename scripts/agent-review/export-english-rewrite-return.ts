/**
 * THE RETURN LEG FOR R1023: every field an agent rewrote on a held English row, carried back to the
 * authoring store (Cowork) as a FIELD-LEVEL CHANGESET — never a replacement file ("export a MERGE,
 * never a wholesale replace"; R88).
 *
 * Each change carries the value BEFORE as well as after. Cowork's own copy could not be diffed from this
 * machine before the rewrite (R1023, precondition named), so the before value is how Cowork tells, at
 * merge time, whether its copy still holds what this side replaced: a change whose before value Cowork
 * does not hold is a CONFLICT to resolve by hand, never to apply.
 *
 * Built from the per-group `changeset.json` files that `land-proposals --apply` writes at the moment of
 * landing (the only point at which the before value is still in hand). `land-proposals` calls this as
 * its final step, so the return follows the write automatically.
 *
 *   tsx scripts/agent-review/export-english-rewrite-return.ts
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { deliver, freshnessStamp, stampedName } from '../lib/export-destination';

const REPO = pjoin(__dirname, '..', '..');
const DIR = pjoin(REPO, 'content', 'agent-review', 'english-rewrite');
const FAMILY = 'english-rewrite-return';

export interface FieldChange { field: string; before: unknown; after: unknown }
export interface RowChange { itemId: string; passageRef: string | null; hold: { reason: string; faultField: string }; reviewerNote: string; landedAt: string; changes: FieldChange[] }

export function exportEnglishRewriteReturn(): string | null {
  if (!existsSync(DIR)) return null;
  const rows: RowChange[] = [];
  // EVERY door under english-rewrite/ that has landed anything: round 1 `<G>/`, later rounds `r<N>/<G>/`,
  // and doors of LIVE rows such as `stock/`. Found by walking for changeset.json, never by a list of
  // folder shapes — a shape list silently missed `stock/` when it was added (R57/R61).
  const doors: string[] = [];
  const walk = (rel: string) => { for (const e of readdirSync(pjoin(DIR, rel), { withFileTypes: true })) if (e.isDirectory()) { const r = rel ? pjoin(rel, e.name) : e.name; if (existsSync(pjoin(DIR, r, 'changeset.json'))) doors.push(r); walk(r); } };
  walk('');
  doors.sort();
  for (const g of doors) {
    const f = pjoin(DIR, g, 'changeset.json');
    if (!existsSync(f)) continue;
    rows.push(...(JSON.parse(readFileSync(f, 'utf8')) as { rows: RowChange[] }).rows);
  }
  if (rows.length === 0) {
    console.log(`  ${FAMILY}: NOTHING TO RETURN — no group has landed a rewrite yet; no file delivered (an empty return must not supersede a real one).`);
    return null;
  }
  // A LIVE row can land in more than one door (a rewrite, then a stock-sentence redraft). Each landing is
  // its own entry, so the return lists changes in the order they happened rather than merging them.
  rows.sort((a, b) => a.itemId.localeCompare(b.itemId) || a.landedAt.localeCompare(b.landedAt));
  const generatedAt = new Date().toISOString();
  const stamp = freshnessStamp(rows, generatedAt);
  const fieldCount = rows.reduce((n, r) => n + r.changes.length, 0);
  const out = {
    kind: 'english-rewrite-return',
    ruling: 'R1023 (David, 2026-11-20): agents may rewrite the English rows R1022 held for the authoring store.',
    forCowork: 'MERGE FIELD BY FIELD. For each change, apply `after` ONLY if your copy of that field still equals `before`. If it does not, both sides have moved: that change is a conflict to resolve by hand, never to apply. Fields not listed were not touched.',
    authorship: 'Every `after` value was written by a drafting AGENT and attested by the machine reviewer rev-agent-01. No person wrote or read it. Do not attribute it to Annie or to Cowork.',
    stampedOver: 'rows',
    ...stamp,
    rowCount: rows.length,
    fieldChangeCount: fieldCount,
    rows,
  };
  const outDir = pjoin(REPO, 'content', 'exports');
  mkdirSync(outDir, { recursive: true });
  const path = pjoin(outDir, stampedName(FAMILY, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify(out, null, 1));
  const delivered = deliver(path, FAMILY);
  console.log(`  ${FAMILY}: ${rows.length} rows, ${fieldCount} field changes → ${delivered}`);
  return delivered;
}

if (process.argv[1]?.endsWith('export-english-rewrite-return.ts')) exportEnglishRewriteReturn();
