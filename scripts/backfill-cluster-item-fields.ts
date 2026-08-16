/**
 * RESTORE THE THREE FIELDS THE OLD CLUSTER IMPORTER DROPPED — `pnpm backfill:cluster-fields [--write]`
 *
 * The importer that landed ENG-005..012 named six fields and wrote five, so `passageRef`,
 * `lineRefs` and `orderAnchor` were read out of the source and written nowhere. All 86 items it
 * landed are missing all three. The door is fixed (`cowork-item-keys.ts` refuses an unrecognised
 * key); this repairs what it already let through.
 *
 * NOT A CORRECTION OF COWORK'S CONTENT. Every value here comes from the source file unchanged —
 * the fault was carriage, not authoring, so nothing is recomputed or inferred on this side.
 *
 * IT REFUSES RATHER THAN OVERWRITES. If the database already holds one of these fields and
 * disagrees with the file, both sides have moved and the merge is a ruling, not a backfill
 * (CLAUDE.md: the gate-forced side exports first). Measured before writing: 0 disagreements.
 *
 * THE HASH IS NAMED, NOT ASSUMED (David's standing rule, 2026-08-13). Every comparison states the
 * hash of the artefact it ran against, so a later run against a different delivery is visible as a
 * different hash rather than as a silent re-read.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { unknownCoworkKeys } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';

const DIR = '/Users/davidb/Downloads/11+/from-cluecrew';
const CLUSTERS = ['005', '006', '007', '008', '009', '010', '011', '012'];
const CARRIED = ['passageRef', 'lineRefs', 'orderAnchor'] as const;
const DAVID = 'human:david@cluecrew.test';

async function main(): Promise<void> {
  const write = process.argv.includes('--write');

  const drafts: Array<Record<string, unknown>> = [];
  for (const c of CLUSTERS) {
    const raw = readFileSync(`${DIR}/eng${c}-draft.json`, 'utf8');
    console.log(`  eng${c}-draft.json  sha256 ${createHash('sha256').update(raw).digest('hex').slice(0, 16)}`);
    drafts.push(...(JSON.parse(raw).items as Array<Record<string, unknown>>));
  }

  // Same refusal as the import door. A source carrying a key nobody has decided about is not a
  // source this script may read three fields out of and call the rest someone else's problem.
  const unknown = drafts.flatMap((d) => unknownCoworkKeys(d));
  if (unknown.length > 0) {
    console.error(`\nREFUSED — ${unknown.length} unrecognised key(s) in the source; see cowork-item-keys.ts.`);
    for (const u of [...new Set(unknown.map((u2) => `${u2.level}.${u2.key}`))]) console.error(`  x ${u}`);
    await prisma.$disconnect();
    process.exit(1);
  }

  const rows = await prisma.item.findMany({
    where: { id: { in: drafts.map((d) => String(d.itemId)) } },
    select: { id: true, stem: true, status: true },
  });
  const byId = new Map(rows.map((r) => [r.id, r]));

  const updates: Array<{ id: string; stem: Record<string, unknown>; added: string[] }> = [];
  const disagreeing: string[] = [];
  const absentFromDb: string[] = [];
  let alreadyComplete = 0;

  for (const d of drafts) {
    const id = String(d.itemId);
    const row = byId.get(id);
    if (!row) { absentFromDb.push(id); continue; }
    const stem = { ...((row.stem ?? {}) as Record<string, unknown>) };
    const added: string[] = [];
    for (const k of CARRIED) {
      const src = d[k];
      if (src === undefined || src === null) continue;
      if (stem[k] === undefined) { stem[k] = src; added.push(k); }
      else if (JSON.stringify(stem[k]) !== JSON.stringify(src)) {
        disagreeing.push(`${id}.${k}: db=${JSON.stringify(stem[k])} file=${JSON.stringify(src)}`);
      }
    }
    if (added.length) updates.push({ id, stem, added });
    else alreadyComplete += 1;
  }

  console.log(
    `\n${drafts.length} drafted · ${rows.length} present in the database · ` +
      `${updates.length} to repair · ${alreadyComplete} already complete · ${absentFromDb.length} not imported`,
  );
  const perField = CARRIED.map((k) => `${k}=${updates.filter((u) => u.added.includes(k)).length}`).join(' ');
  console.log(`  fields to restore: ${perField}`);

  if (disagreeing.length > 0) {
    console.error(`\nREFUSED — ${disagreeing.length} field(s) present on BOTH sides and disagreeing:`);
    for (const m of disagreeing) console.error(`  x ${m}`);
    console.error('Both sides have moved. That is a merge ruling, not a backfill. Nothing written.');
    await prisma.$disconnect();
    process.exit(1);
  }

  if (updates.length === 0) {
    console.log('\nNothing to repair. This is a real pass: 86 rows were read and all carry the three fields.');
    await prisma.$disconnect();
    return;
  }
  if (!write) {
    console.log('\nDry run. Re-run with --write to apply.');
    await prisma.$disconnect();
    return;
  }

  // ONE TRANSACTION, then the attribution. A half-applied repair is the fault being repaired.
  await prisma.$transaction(
    updates.map((u) => prisma.item.update({ where: { id: u.id }, data: { stem: u.stem as object } })),
  );
  for (const u of updates) {
    await prisma.attributionEvent.create({
      data: {
        recordType: 'item', recordId: u.id, action: 'AMENDED',
        // No reviewerId: an operational repair of a carriage fault, not a reviewer ruling.
        actor: DAVID, recordedBy: DAVID, field: u.added.map((a) => `stem.${a}`).join(', '),
        method: 'Cowork source re-read, 2026-08-16',
        note:
          `Restored ${u.added.join(', ')} from the Cowork draft file unchanged. The original import ` +
          'door enumerated its own field list and dropped these three; no value here was recomputed ' +
          'or inferred, and no child-facing text changed.',
      },
    });
  }

  // VERIFY BY RE-READING THE ROWS ACTED ON, never by counting what is left.
  const after = await prisma.item.findMany({
    where: { id: { in: updates.map((u) => u.id) } }, select: { id: true, stem: true },
  });
  const srcById = new Map(drafts.map((d) => [String(d.itemId), d]));
  const complete = after.filter((r) => {
    const s = (r.stem ?? {}) as Record<string, unknown>;
    const src = srcById.get(r.id)!;
    return CARRIED.every((k) => src[k] === undefined || src[k] === null
      || JSON.stringify(s[k]) === JSON.stringify(src[k]));
  });
  console.log(`\nVERIFIED by re-reading all ${after.length} repaired rows:`);
  console.log(`  matching the source on all three fields: ${complete.length} of ${after.length}`);
  await prisma.$disconnect();
}

void main();
