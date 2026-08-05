/**
 * WS-REDRAFT walk-script import — `pnpm import:walk-scripts <batch.json>`
 *
 * The redraft batch answers the export this repo produced: one `newScript`
 * per item, written against the house style. It lands as DRAFT — which for a
 * walk script means `walkScriptStatus: 'DRAFT'` on the explanation, since a
 * script has no row of its own and the ITEM's status is a separate question.
 * Nothing here promotes anything.
 *
 * TWO THINGS IT REFUSES TO DO, both about not overwriting a person:
 *
 *   · A script carrying `walkScriptBy` was written by the reviewer. The batch
 *     excludes those three by design, but a future batch might not, so the
 *     refusal is in the code and not in the batch's good intentions.
 *   · A script that fails the child-facing gates is reported and NOT written.
 *     The previous script stays, because a failing replacement is worse than
 *     an old one that at least passed.
 *
 * `--dry-run` reports the gate verdict and writes nothing.
 */
import { readFileSync } from 'node:fs';
import { readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  checkChildFacingText,
  checkLineRefs,
  isBlocking,
  spansPresentIn,
  type CitablePassage,
  type ContentFailure,
} from '@cluecrew/core';
import { prisma } from '../packages/db/src/index';

const DRY = process.argv.includes('--dry-run');
const PASSAGE_DIR = resolve(import.meta.dirname, '../content/passages');

/**
 * The line-reference gate, applied BEFORE the write rather than after it.
 * A script whose citation does not resolve is the exact fault that survived
 * three authoring rounds; catching it at the door means round four cannot
 * reintroduce it.
 */
function loadPassages(): Map<string, CitablePassage> {
  const out = new Map<string, CitablePassage>();
  for (const entry of readdirSync(PASSAGE_DIR)) {
    if (!entry.endsWith('.json')) continue;
    const passage = JSON.parse(readFileSync(join(PASSAGE_DIR, entry), 'utf8')) as CitablePassage;
    out.set(passage.id, passage);
  }
  return out;
}

interface Batch {
  batchId: string;
  generated?: string;
  itemCount?: number;
  rulingsApplied?: string[];
  /** WS-REDRAFT-2 wrote `newScript`; WS-REDRAFT-3 compressed them into
   *  `shortScript` beside the long one it was cut from. Both are accepted so
   *  a batch is not renamed on the way in. */
  items: Array<{ itemId: string; oldScript?: string; longScript?: string; newScript?: string; shortScript?: string; notes?: string }>;
}

async function main(): Promise<void> {
  const path = process.argv.find((arg) => arg.endsWith('.json'));
  if (!path) {
    console.error('usage: … <batch.json> [--dry-run]');
    process.exit(1);
  }
  const batch = JSON.parse(readFileSync(path, 'utf8')) as Batch;
  const passages = loadPassages();
  console.log(`${batch.batchId} — ${batch.items.length} script(s), generated ${batch.generated ?? 'undated'}`);
  for (const ruling of batch.rulingsApplied ?? []) console.log(`  ruling applied: ${ruling}`);

  const checks = await Promise.all(
    batch.items.map(async (rawEntry) => {
      const entry = { ...rawEntry, newScript: rawEntry.shortScript ?? rawEntry.newScript ?? '' };
      const item = await prisma.item.findUnique({ where: { id: entry.itemId }, include: { options: true } });
      const explanation = (item?.explanation ?? {}) as Record<string, unknown>;
      const stem = (item?.stem ?? {}) as Record<string, unknown>;
      const quotedSpans = Array.isArray(stem.quotes)
        ? (stem.quotes as Array<{ text?: string }>).map((quote) => quote.text ?? '').filter(Boolean)
        : [];
      // An item's own option text is stimulus, not the script's vocabulary
      // (David's ruling, 2026-08-02) — exempt option words from the long-word
      // ceiling, alongside any declared tested tokens.
      const optionWords = (item?.options ?? []).flatMap((o) => {
        const v = (o.content as { value?: unknown }).value;
        return (Array.isArray(v) ? v : [v]).flatMap((x) => String(x ?? '').split(/\s+/)).filter(Boolean);
      });
      const faults: ContentFailure[] = item
        ? checkChildFacingText({
            role: 'hint',
            label: `item:${entry.itemId} explanation.walkScript`,
            text: entry.newScript,
            quotedSpans: spansPresentIn(entry.newScript, quotedSpans),
            testedTokens: [
              ...(Array.isArray(stem.testedTokens) ? (stem.testedTokens as string[]) : []),
              ...optionWords,
            ],
          })
        : [];
      const passageRef = stem.passageRef as string | undefined;
      const lineFaults = passageRef
        ? checkLineRefs({
            label: `item:${entry.itemId} explanation.walkScript`,
            passageRef,
            passage: passages.get(passageRef),
            text: entry.newScript,
          })
        : [];
      return {
        entry,
        item,
        explanation,
        lineFaults,
        // A script somebody signed is not ours to replace.
        reviewerWritten: typeof explanation.walkScriptBy === 'string',
        blocking: faults.filter(isBlocking),
        warnings: faults.filter((fault) => !isBlocking(fault)),
      };
    }),
  );

  const missing = checks.filter((check) => !check.item);
  const protectedScripts = checks.filter((check) => check.item && check.reviewerWritten);
  const failing = checks.filter(
    (check) => check.item && !check.reviewerWritten && (check.blocking.length > 0 || check.lineFaults.length > 0),
  );
  const ready = checks.filter(
    (check) => check.item && !check.reviewerWritten && check.blocking.length === 0 && check.lineFaults.length === 0,
  );
  const warnings = checks.flatMap((check) => check.warnings);

  for (const check of missing) console.log(`  ! ${check.entry.itemId}: no such item`);
  for (const check of protectedScripts) {
    console.log(`  ! ${check.entry.itemId}: written by ${String(check.explanation.walkScriptBy)} — NOT overwritten`);
  }

  if (failing.length > 0) {
    const byRule = failing
      .flatMap((check) => [...check.blocking, ...check.lineFaults])
      .reduce<Record<string, number>>((acc, fault) => {
        acc[fault.rule] = (acc[fault.rule] ?? 0) + 1;
        return acc;
      }, {});
    console.log(
      `\nGATE FAILURES — ${failing.length} script(s) NOT written (` +
        Object.entries(byRule).map(([rule, count]) => `${rule}: ${count}`).join(', ') +
        '):',
    );
    for (const check of failing) {
      for (const fault of check.blocking) console.log(`  ✗ ${check.entry.itemId}: ${fault.detail}`);
      for (const fault of check.lineFaults) console.log(`  ✗ ${check.entry.itemId}: [${fault.rule}] ${fault.detail}`);
    }
  }

  if (warnings.length > 0) {
    console.log(`\nUK spelling to check by hand (not blocking): ${warnings.length}`);
    for (const fault of warnings) console.log(`  · ${fault.where}: ${fault.detail}`);
  }

  if (DRY) {
    console.log(`\n--dry-run: nothing written. ${ready.length} script(s) would land as DRAFT.`);
    await prisma.$disconnect();
    return;
  }

  for (const check of ready) {
    await prisma.item.update({
      where: { id: check.entry.itemId },
      data: {
        explanation: {
          ...check.explanation,
          walkScript: check.entry.newScript,
          walkScriptStatus: 'DRAFT',
          walkScriptBatch: batch.batchId,
          // Kept on the row, not only in the audit log: the reviewer reads
          // these side by side at the sitting and should not need a query.
          walkScriptPrevious: (check.explanation.walkScript as string) ?? null,
        },
      },
    });
  }

  console.log(`\nWalk scripts landed as DRAFT: ${ready.length}/${batch.items.length}`);
  console.log(`  held back on the gates : ${failing.length}`);
  console.log(`  protected (reviewer's) : ${protectedScripts.length}`);
  console.log(`  no such item           : ${missing.length}`);
  await prisma.$disconnect();
}

void main();
