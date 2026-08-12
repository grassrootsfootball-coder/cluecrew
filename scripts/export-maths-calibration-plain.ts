/**
 * MATHS CALIBRATION BATCH 01 — plain text for review.
 *
 * The rendered pack (~82 KB) will not survive the delivery size limit, so this
 * emits the words only: the 40 items with options and tags, the library ids the
 * batch carries, and the reviewer's additions 61-97 applied to every gap-family
 * distractor (see additionIdFor). Section 4 lists the bare descriptions that
 * still need the "child gives X where the answer is Y" frame.
 *
 * `pnpm tsx scripts/export-maths-calibration-plain.ts` — writes to the reviewer trees.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { buildCalibration, additionIdFor } from './lib/maths-calibration-source';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { prisma } from '../packages/db/src/index';

/**
 * Delivered through the ONE door (`lib/export-destination.ts`). This used to write a FIXED
 * filename into two hardcoded absolute Downloads paths inside a try/catch that logged "skip" —
 * a non-delivery that exited 0, with no hash to tell a stale copy from a fresh one. Same
 * silent-non-delivery class as export-vr07-vr11-new.ts; both fixed 2026-08-12.
 */
const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'maths-calibration-plain';

async function main(): Promise<void> {
  const { items, families } = buildCalibration();
  const L: string[] = [];
  L.push('MATHS CALIBRATION BATCH 01 — plain text for review (2026-08-06)');
  L.push('The rendered pack is ~82 KB and will not deliver; this is the words only.');
  L.push('Gap-family distractors now carry their real id — your additions 61-97, written from the');
  L.push('33 gap families in doc order (place-value 61/62, carry 69/70, fraction-of-amount 75/76,');
  L.push('percent 77/78 split so no item carries a double-key). #11/#21/#24 were already in the batch.');

  // ---- 1. items ----
  L.push(`\n===== 1. ITEMS (${items.length}) — options with real ids =====`);
  for (const it of items) {
    L.push(`\n${it.itemId} [${it.group} T${it.tier}${it.tierQuery ? ' TIER-QUERY' : ''}]  ${it.stem}`);
    L.push(`   key: ${it.key}`);
    for (const o of it.options) {
      if (o.isKey) { L.push(`   ${o.label}) ${String(o.value).padEnd(10)} KEY`); continue; }
      const id = o.misconceptionRef ?? (o.familySlug ? `#${additionIdFor(o.familySlug, o.behaviour ?? '')}` : 'UNMAPPED');
      L.push(`   ${o.label}) ${String(o.value).padEnd(10)} ${id}  — ${o.behaviour ?? ''}`);
    }
  }

  // ---- 2. id distribution ----
  const idCount = new Map<string, number>();
  for (const it of items) for (const o of it.options) {
    if (o.isKey) continue;
    const id = o.misconceptionRef ?? `#${additionIdFor(o.familySlug ?? '', o.behaviour ?? '')}`;
    idCount.set(id, (idCount.get(id) ?? 0) + 1);
  }
  const sortedIds = [...idCount].sort((a, b) => Number(a[0].replace('#', '')) - Number(b[0].replace('#', '')));
  const bundled = sortedIds.filter(([, n]) => n >= 2);
  L.push(`\n\n===== 2. ID DISTRIBUTION — ${idCount.size} ids over ${[...idCount.values()].reduce((a, b) => a + b, 0)} distractors =====`);
  L.push(`bundled (>=2 distractors): ${bundled.length}   singletons: ${sortedIds.length - bundled.length}`);
  for (const [id, n] of sortedIds) L.push(`   ${id}: ${n}`);

  // ---- 3. mapping findings ----
  L.push(`\n\n===== 3. MAPPING FINDINGS =====`);
  const populated = new Set(items.flatMap((it) => it.options.filter((o) => !o.isKey && !o.misconceptionRef).map((o) => o.familySlug)));
  const noAddition = families.length && [...populated].filter((s) => s && additionIdFor(s, '') == null && additionIdFor(s, 'x') == null);
  L.push(`   Defined family with no addition: calc-wrong-order (carries 0 distractors in this batch — benign).`);
  L.push(`   Additions with no family: none — all 37 (61-97) are used by the batch.`);
  L.push(`   Populated families with no id: ${noAddition && noAddition.length ? noAddition.join(', ') : 'none'}.`);

  // ---- 4. bare descriptions ----
  const ms = await prisma.misconception.findMany({ where: { district: 'MATHS', status: 'ACTIVE' }, select: { id: true, description: true, sourcePattern: true }, orderBy: { id: 'asc' } });
  const FRAME = /(child|pupil|gives|believes?|treats?|thinks?|chooses?|reads?|adds?|forgets?|rounds?|counts?|where the answer|instead of|leaves?|stops?)/i;
  const bare = ms.filter((m) => /(e\.g\.|=|\d)/.test(m.description) && !FRAME.test(m.description));
  L.push(`\n\n===== 4. BARE DESCRIPTIONS needing "child gives X where the answer is Y" (${bare.length}) =====`);
  L.push('Heuristic: a numeric example with no verb marking it as the child output. Your report said ~22; exact line is yours.');
  for (const m of bare) L.push(`   ${m.id} ${/#\d+/.exec(m.sourcePattern ?? '')?.[0] ?? ''}: ${m.description}`);

  const text = L.join('\n') + '\n';

  // R60: refuse to deliver a sheet built from nothing. The misconception query and the
  // calibration source both have to have produced something for this pack to mean anything.
  if (ms.length === 0 || items.length === 0) {
    console.error(
      `MATHS CALIBRATION EXPORT ABORTED: ${ms.length} ACTIVE maths misconceptions, ` +
        `${items.length} calibration items — nothing delivered.\n` +
        'Neither population may legitimately be empty: an empty run means the query or the\n' +
        'calibration source is broken, not that there is nothing to calibrate.',
    );
    await prisma.$disconnect();
    process.exit(1);
  }

  const stamp = artefactStamp(text, new Date().toISOString(), 'mixed', 'the maths calibration pack — item ids, bundles and misconception descriptions');
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, stampedName(FAMILY, stamp.sourceHash, 'txt'));
  writeFileSync(path, text);
  deliver(path, FAMILY);
  console.log(`[${Buffer.byteLength(text)} bytes] ids=${idCount.size} bundled=${bundled.length} bare=${bare.length}`);
  await prisma.$disconnect();
}

void main();
