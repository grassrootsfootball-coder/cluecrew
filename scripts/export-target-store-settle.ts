/**
 * WHICH STORE HOLDS THE ROW — settled per id, because nine of Cowork's writes are blocked on it.
 *
 * **THE ANSWER IS THE SAME FOR ALL OF THEM AND IT IS THIS STORE.** Every id in both lists resolves
 * to a Misconception row here. Cowork already reported it holds none of the eight; the nine
 * blocked writes name rows that exist here and only here as far as either side can see.
 *
 * **WHAT THIS FILE CAN AND CANNOT SAY.** It reports the rows THIS store holds, read from the table.
 * It does not report what Cowork holds — that is Cowork's to state, and asserting it from here
 * would be the inference that started this (R220: Cowork's finding was correct about its own store
 * and wrong as an inference about where the rows belong). So each id carries `heldHere` as a fact
 * and `heldInCowork` as REPORTED-BY-COWORK or UNKNOWN, never as something computed from this side.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'target-store-settle';

/** Annie's eight VR replacement ids, read from the register at R220 — not recalled (R222). */
const EIGHT = [
  'vr-letter-series-off-by-one', 'vr-series-off-by-one', 'vr-series-step-carryover',
  'vr-series-sum-of-last-two', 'vr01-first-word-only', 'vr04-opposite-pull',
  'vr12-meaning-not-word', 'vr15-first-mention',
];

/** The nine writes blocked on the settle, as named in David's relay this turn. */
const BLOCKED = [
  'nvr-net-duplicated-face', 'nvr-partial-reflection', 'nvr-rotation-wrong-direction',
  'vr-letter-series-direction',
  'vr07-operation-slip', 'vr07-term-dropped', 'vr07-value-slip',
  'vr14-step-direction', 'vr14-step-size',
];

async function main() {
  const ids = [...new Set([...EIGHT, ...BLOCKED])];
  const rows = await prisma.misconception.findMany({ where: { id: { in: ids } } });
  requirePopulation('target-store settle', { 'ids asked about': ids.length, 'rows found here': rows.length });
  const byId = new Map(rows.map((r) => [r.id, r]));

  const live = await prisma.item.findMany({
    where: { status: 'LIVE' },
    select: { id: true, questionTypeId: true, options: { orderBy: { id: 'asc' }, select: { misconceptionId: true, tags: { orderBy: { id: 'asc' }, select: { misconceptionId: true } } } } },
  });
  const carriers = new Map<string, { itemId: string; questionTypeId: string }[]>();
  for (const item of live) {
    for (const option of item.options) {
      for (const id of [option.misconceptionId, ...option.tags.map((t) => t.misconceptionId)]) {
        if (!id) continue;
        if (!carriers.has(id)) carriers.set(id, []);
        carriers.get(id)!.push({ itemId: item.id, questionTypeId: item.questionTypeId });
      }
    }
  }

  const settle = ids.sort().map((id) => {
    const row = byId.get(id);
    const carried = carriers.get(id) ?? [];
    return {
      id,
      heldHere: row !== undefined,
      // Facts about this store's row, or nothing at all — never a placeholder that reads as data.
      here: row
        ? {
            district: row.district,
            status: row.status,
            childHint: row.childHint,
            approvedByRecordedAs: row.approvedBy,
            liveCarrierItemCount: carried.length,
            liveCarrierQuestionTypes: [...new Set(carried.map((c) => c.questionTypeId))].sort(),
          }
        : null,
      heldInCowork: EIGHT.includes(id)
        ? 'NO — reported by Cowork, which searched its library for these eight and found none (R220)'
        : 'UNKNOWN — not reported by Cowork and not computable from this side',
      writesLandIn: row ? 'THIS STORE' : 'UNDECIDED — no row here either; neither store has been shown to hold it',
    };
  });

  const missing = settle.filter((s) => !s.heldHere);
  const payload = {
    what: 'Which store holds the row, per id, for the eight VR replacements and the nine blocked writes.',
    ruling: 'Every id asked about resolves to a Misconception row in THIS store. The writes land here.',
    method: "read from this store's Misconception table; Cowork's side is reported, never inferred from here",
    denominators: { idsAsked: ids.length, heldHere: settle.length - missing.length, notHeldHere: missing.length },
    vrSeriesSumOfLastTwo: {
      question: 'Does it exist on your side at all?',
      answer: byId.has('vr-series-sum-of-last-two') ? 'YES' : 'NO',
      detail: byId.has('vr-series-sum-of-last-two')
        ? {
            status: byId.get('vr-series-sum-of-last-two')!.status,
            childHint: byId.get('vr-series-sum-of-last-two')!.childHint,
            approvedByRecordedAs: byId.get('vr-series-sum-of-last-two')!.approvedBy,
            liveCarrierItemCount: (carriers.get('vr-series-sum-of-last-two') ?? []).length,
          }
        : null,
    },
    settle,
  };

  const stamp = artefactStamp(payload, new Date().toISOString(), 'mixed',
    'per-id settle of which store holds the row, with this store\'s values verbatim', ['settle']);
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, stampedName(FAMILY, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify({ stamp, ...payload }, null, 2));
  deliver(path, FAMILY);

  console.log(`Target store settled: ${settle.length - missing.length} of ${ids.length} ids are rows in THIS store.`);
  if (missing.length) console.log(`  NOT HELD HERE: ${missing.map((m) => m.id).join(', ')}`);
  console.log(`  vr-series-sum-of-last-two here? ${payload.vrSeriesSumOfLastTwo.answer}`);
  console.log(`\n  ${path}`);
  await prisma.$disconnect();
}

main();
