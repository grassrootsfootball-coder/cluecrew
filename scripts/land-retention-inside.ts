/**
 * RETENTION LIVES INSIDE THE ARTEFACT BEING CHANGED (David's ruling, 2026-08-26 — R746).
 *
 * A retention STORE is a convenience beside the thing; the before-image belongs ON THE ROW, where
 * it travels with every copy, survives a directory clean, and cannot be separated from the value
 * it explains. `content/retention/` keeps its job for whole superseded FILES; a changed FIELD
 * keeps its predecessor in the record that changed.
 *
 * Backfills the 65 walk scripts amended under R739/R742 from their own landing artefacts, and
 * ASSERTS the live value still equals that artefact's `after` before stamping — a before-image
 * written against a row that has moved on would be a false record, which is worse than none.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isRetentionPath } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';

const APPLY = process.argv.includes('--apply');
const OUT = '/Users/davidb/Downloads/11+/from-cluecrew';
const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
const SOURCES = [
  { file: 'annie-161-landing-4ea1f1e72e5c3cbe.json', sha256: '4ea1f1e72e5c3cbef6f52c11101832e4be33eb6bfcdb19f2749610344bb9c166', rule: 'R739' },
  { file: 'mentions-vr12-landing-a8df3489d1d55d88.json', sha256: 'a8df3489d1d55d8870bb4c1a8fac21b2c66194373ed3017c64215265fa095d3e', rule: 'R742' },
];

async function run() {
  if (!isRetentionPath('explanation._walkScriptBefore')) throw new Error('REFUSED — the field name would not read as retention; the underscore rule must cover it');
  let stamped = 0; let already = 0;
  for (const src of SOURCES) {
    const bytes = readFileSync(join(OUT, src.file));
    if (sha256(bytes.toString('utf8')) !== src.sha256) throw new Error(`REFUSED — ${src.file} digest mismatch`);
    const artefact = JSON.parse(bytes.toString('utf8')) as { rows: Array<{ id: string; before: string; after: string; beforeSha256: string }> };
    for (const r of artefact.rows) {
      const row = await prisma.item.findUniqueOrThrow({ where: { id: r.id }, select: { explanation: true } });
      const e = row.explanation as Record<string, unknown>;
      if (String(e.walkScript ?? '') !== r.after) throw new Error(`REFUSED — ${r.id}: the live walkScript is not the artefact's 'after'; a before-image written now would be a false record`);
      if (e._walkScriptBefore) { already++; continue; }
      if (sha256(r.before) !== r.beforeSha256) throw new Error(`REFUSED — ${r.id}: the artefact's before-image does not match its own declared digest`);
      stamped++;
      if (!APPLY) continue;
      await prisma.item.update({
        where: { id: r.id },
        data: { explanation: { ...e, _walkScriptBefore: r.before, _walkScriptBeforeSha256: r.beforeSha256, _walkScriptBeforeRule: src.rule, _walkScriptBeforeStampedAt: '2026-08-26' } },
      });
    }
  }
  console.log(`${APPLY ? 'STAMPED' : 'WOULD STAMP'} ${stamped} before-images on the rows; already carrying one: ${already}`);
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
