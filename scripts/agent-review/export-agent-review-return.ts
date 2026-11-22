/**
 * THE RETURN LEG FOR COWORK-AUTHORED ROWS OUTSIDE ENGLISH (R1033).
 *
 * "Cowork authors, the DB holds": a change to an item Cowork authored goes back as a field-level
 * changeset. The English rewrite doors have done this since R1023. Doors under other names did not,
 * because the lander chose to return by DOOR NAME, so four Cowork-authored vr-06 rows landed with no
 * return at all. The lander now decides by AUTHORSHIP, and this exports every changeset it writes
 * outside `english-rewrite/` (which keeps its own family).
 *
 *   tsx scripts/agent-review/export-agent-review-return.ts
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join as pjoin, relative } from 'node:path';
import { deliver, freshnessStamp, stampedName } from '../lib/export-destination';
import type { RowChange } from './export-english-rewrite-return';

const REPO = pjoin(__dirname, '..', '..');
const DIR = pjoin(REPO, 'content', 'agent-review');
const FAMILY = 'agent-review-return';

export function exportAgentReviewReturn(): string | null {
  // Found by WALKING for changeset.json, never by a list of door names (R57/R61).
  const doors: string[] = [];
  const walk = (abs: string) => {
    for (const e of readdirSync(abs, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      const sub = pjoin(abs, e.name);
      const rel = relative(DIR, sub);
      if (rel === 'english-rewrite' || rel.startsWith(`english-rewrite/`)) continue;
      if (existsSync(pjoin(sub, 'changeset.json'))) doors.push(rel);
      walk(sub);
    }
  };
  walk(DIR);
  doors.sort();
  const rows: Array<RowChange & { door: string }> = [];
  for (const d of doors) {
    const cs = JSON.parse(readFileSync(pjoin(DIR, d, 'changeset.json'), 'utf8')) as { rows?: RowChange[] };
    if (!Array.isArray(cs.rows)) throw new Error(`${d}/changeset.json has no rows array (R173: refuse a shape, never read it as empty)`);
    rows.push(...cs.rows.map((r) => ({ ...r, door: d })));
  }
  if (rows.length === 0) {
    console.log(`  ${FAMILY}: NOTHING TO RETURN — no door outside english-rewrite has a changeset; no file delivered (an empty return must not supersede a real one).`);
    return null;
  }
  rows.sort((a, b) => a.itemId.localeCompare(b.itemId) || a.landedAt.localeCompare(b.landedAt));
  const generatedAt = new Date().toISOString();
  const stamp = freshnessStamp(rows, generatedAt);
  const fieldCount = rows.reduce((n, r) => n + r.changes.length, 0);
  const out = {
    kind: FAMILY,
    ruling: 'R1033 (2026-11-22): every change to a Cowork-authored row returns, whatever the door is called.',
    forCowork: 'MERGE FIELD BY FIELD. For each change, apply `after` ONLY if your copy of that field still equals `before`. If it does not, both sides have moved: that change is a conflict to resolve by hand, never to apply. Fields not listed were not touched.',
    authorship: 'Every `after` value was written by a drafting AGENT and attested by the machine reviewer rev-agent-01. No person wrote or read it. Do not attribute it to Annie or to Cowork.',
    stampedOver: 'rows',
    ...stamp,
    doors,
    rowCount: rows.length,
    fieldChangeCount: fieldCount,
    rows,
  };
  const outDir = pjoin(REPO, 'content', 'exports');
  mkdirSync(outDir, { recursive: true });
  const path = pjoin(outDir, stampedName(FAMILY, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify(out, null, 1));
  const delivered = deliver(path, FAMILY);
  console.log(`  ${FAMILY}: ${rows.length} rows from ${doors.length} door(s), ${fieldCount} field changes → ${delivered}`);
  return delivered;
}

if (require.main === module) exportAgentReviewReturn();
