/**
 * R1/R2/R3 stem corrections — `pnpm import:stem-corrections <dir>`
 *
 * Takes the corrected stems out of the three ENG batch files and lands the
 * ones that are both new and sound. Options are NOT touched: the ask was for
 * stems, and the R3 segment remodelling already went in on 2026-08-02.
 *
 * THREE REFUSALS, in order of how much they matter:
 *
 *   1. A STEM A HUMAN WROTE IS NOT OVERWRITTEN BY A BATCH. The audit log
 *      carries `item.stem_rewritten_recorded` for every stem the reviewer or
 *      David has rewritten. An authoring batch regenerated from an earlier
 *      draft does not know those exist, and would silently undo them. This is
 *      the reason the audit log is queried here rather than a flag on the row:
 *      the row shows what the stem IS, only the log shows who decided it.
 *   2. A stem that fails the child-facing gates is reported, not written.
 *   3. A stem whose quotations do not resolve against the passage is reported,
 *      not written — the line-reference gate, applied before the fact instead
 *      of after it.
 *
 * `--dry-run` reports and writes nothing.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  checkChildFacingText,
  checkLineRefs,
  isBlocking,
  roleForItemStem,
  type CitablePassage,
} from '@cluecrew/core';
import { prisma } from '../packages/db/src/index';

const DRY = process.argv.includes('--dry-run');
const PASSAGE_DIR = resolve(import.meta.dirname, '../content/passages');

interface BatchItem {
  itemId: string;
  questionTypeId: string;
  stem: { text?: string; quotes?: Array<{ text: string; passageRef?: string; lineRefs?: number[] }>; [k: string]: unknown };
  passageRef?: string;
  lineRefs?: number[];
}

function loadPassages(): Map<string, CitablePassage> {
  const out = new Map<string, CitablePassage>();
  for (const entry of readdirSync(PASSAGE_DIR)) {
    if (!entry.endsWith('.json')) continue;
    const passage = JSON.parse(readFileSync(join(PASSAGE_DIR, entry), 'utf8')) as CitablePassage;
    out.set(passage.id, passage);
  }
  return out;
}

async function main(): Promise<void> {
  // argv[0] is the node binary and argv[1] this script; the directory is the
  // first argument after them.
  const dir = process.argv.slice(2).find((arg) => !arg.startsWith('--'));
  if (!dir) {
    console.error('usage: … <dir-of-ENG-batch-files> [--dry-run]');
    process.exit(1);
  }
  const passages = loadPassages();
  const files = readdirSync(dir).filter((name) => /^ENG-\d+.*\.json$/.test(name)).sort();
  const batches = files.map((name) => JSON.parse(readFileSync(join(dir, name), 'utf8')) as { batchId: string; items: BatchItem[] });
  console.log(`Batches: ${batches.map((b) => `${b.batchId} (${b.items.length})`).join(', ')}`);

  // Every stem a human has rewritten, from the audit log.
  const humanRewritten = new Set(
    (
      await prisma.adminAuditLog.findMany({
        where: { targetKind: 'Item', action: 'item.stem_rewritten_recorded' },
        select: { targetId: true },
      })
    ).map((row) => row.targetId),
  );
  console.log(`Stems a human has rewritten (protected): ${humanRewritten.size}`);

  const unchanged: string[] = [];
  const missing: string[] = [];
  const protectedStems: Array<{ id: string; current: string; proposed: string }> = [];
  const gateBlocked: Array<{ id: string; proposed: string; faults: string[] }> = [];
  const ready: Array<{ id: string; item: BatchItem; proposed: string }> = [];

  for (const batch of batches) {
    for (const entry of batch.items) {
      const item = await prisma.item.findUnique({ where: { id: entry.itemId }, include: { questionType: true } });
      if (!item) { missing.push(entry.itemId); continue; }
      const current = ((item.stem as Record<string, unknown>).prompt as string | undefined ?? '').trim();
      const proposed = (entry.stem.text ?? '').trim();
      if (!proposed || proposed === current) { unchanged.push(entry.itemId); continue; }

      if (humanRewritten.has(entry.itemId)) {
        protectedStems.push({ id: entry.itemId, current, proposed });
        continue;
      }

      const quotes = (entry.stem.quotes ?? []).map((quote) => quote.text).filter(Boolean);
      const faults = [
        ...checkChildFacingText({
          role: roleForItemStem(item.questionType.mechanic),
          label: `${entry.itemId} stem`,
          text: proposed,
          quotedSpans: quotes,
        })
          .filter(isBlocking)
          .map((fault) => fault.detail),
        ...(entry.passageRef
          ? checkLineRefs({
              label: `${entry.itemId} stem`,
              passageRef: entry.passageRef,
              passage: passages.get(entry.passageRef),
              lineRefs: entry.lineRefs,
              text: proposed,
              declaredQuotes: quotes,
            }).map((fault) => `${fault.rule}: ${fault.detail}`)
          : []),
      ];
      if (faults.length > 0) gateBlocked.push({ id: entry.itemId, proposed, faults });
      else ready.push({ id: entry.itemId, item: entry, proposed });
    }
  }

  console.log(`\nIdentical to what is already stored: ${unchanged.length}`);
  if (missing.length > 0) console.log(`No such item: ${missing.length} — ${missing.join(', ')}`);

  if (protectedStems.length > 0) {
    console.log(`\nPROTECTED — a human wrote the stored stem; the batch version is NOT applied (${protectedStems.length}):`);
    for (const entry of protectedStems) {
      console.log(`  ! ${entry.id}`);
      console.log(`      stored (human) : ${entry.current}`);
      console.log(`      batch proposed : ${entry.proposed}`);
    }
  }

  if (gateBlocked.length > 0) {
    console.log(`\nGATE FAILURES — not applied (${gateBlocked.length}):`);
    for (const entry of gateBlocked) {
      console.log(`  ✗ ${entry.id}: ${entry.proposed}`);
      for (const fault of entry.faults) console.log(`      ${fault}`);
    }
  }

  if (DRY) {
    console.log(`\n--dry-run: nothing written. ${ready.length} stem(s) would be applied.`);
    await prisma.$disconnect();
    return;
  }

  for (const entry of ready) {
    const item = await prisma.item.findUnique({ where: { id: entry.id } });
    const stem = (item!.stem ?? {}) as Record<string, unknown>;
    await prisma.item.update({
      where: { id: entry.id },
      data: {
        stem: {
          ...stem,
          prompt: entry.proposed,
          ...(entry.item.passageRef ? { passageRef: entry.item.passageRef } : {}),
          ...(entry.item.lineRefs?.length ? { lineRefs: entry.item.lineRefs } : {}),
          ...(entry.item.stem.quotes?.length ? { quotes: entry.item.stem.quotes } : {}),
        },
      },
    });
  }
  console.log(`\nStems applied: ${ready.length}`);
  await prisma.$disconnect();
}

void main();
