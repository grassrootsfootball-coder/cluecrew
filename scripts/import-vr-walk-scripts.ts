/**
 * VR walk-script import — `pnpm import:vr-walk-scripts <batch.json>`
 *
 * The batch is nested: cases[] → items[] with a `walkScript` each. Every
 * script is screened by the child-facing gates on the way in (hint role: no
 * banned vocabulary, no internal ids, reading age ≤9). A failure is REPORTED
 * and the script is NOT written — nothing here can publish, and a failing
 * script is worse than none. A script already written by a human
 * (`walkScriptBy`) is never overwritten.
 *
 * `--dry-run` reports the verdict and writes nothing.
 */
import { readFileSync } from 'node:fs';
import { checkChildFacingText, isBlocking, lettersNamedNotOnCard, wordOptionsNamedNotOnCard, type ContentFailure } from '@cluecrew/core';
import { prisma } from '../packages/db/src/index';

const DRY = process.argv.includes('--dry-run');

interface Batch {
  batchId: string;
  totalScripts?: number;
  cases: Array<{ caseId: string; questionTypeId: string; items: Array<{ itemId: string; walkScript: string }> }>;
}

async function main(): Promise<void> {
  const path = process.argv.find((arg) => arg.endsWith('.json'));
  if (!path) { console.error('usage: … <batch.json> [--dry-run]'); process.exit(1); }
  const batch = JSON.parse(readFileSync(path, 'utf8')) as Batch;
  const flat = batch.cases.flatMap((c) => c.items.map((it) => ({ ...it, questionTypeId: c.questionTypeId })));
  console.log(`${batch.batchId}: ${flat.length} script(s) across ${batch.cases.length} case(s)`);

  let written = 0;
  const missing: string[] = [];
  const protectedScripts: string[] = [];
  const failing: Array<{ id: string; faults: ContentFailure[] }> = [];
  const warnings: ContentFailure[] = [];

  for (const entry of flat) {
    const item = await prisma.item.findUnique({ where: { id: entry.itemId }, include: { options: true } });
    if (!item) { missing.push(entry.itemId); continue; }
    const explanation = (item.explanation ?? {}) as Record<string, unknown>;
    if (typeof explanation.walkScriptBy === 'string') { protectedScripts.push(entry.itemId); continue; }

    // An item's own option text is stimulus, not the script's vocabulary
    // (David's ruling, 2026-08-02): a script may name a 10-letter key without
    // failing the long-word ceiling. Bounded to this item's option words.
    const optionWords = item.options.flatMap((o) => {
      const v = (o.content as { value?: unknown }).value;
      return (Array.isArray(v) ? v : [v]).flatMap((x) => String(x ?? '').split(/\s+/)).filter(Boolean);
    });
    const faults = checkChildFacingText({ role: 'hint', label: `item:${entry.itemId} walkScript`, text: entry.walkScript, testedTokens: optionWords });
    const blocking = faults.filter(isBlocking);
    warnings.push(...faults.filter((f) => !isBlocking(f)));
    // Refuse a script that names a letter-option not on the card — it was
    // written against a different version of the item (David, 2026-08-02).
    const optionValues = item.options.map((o) => String((o.content as { value?: unknown }).value ?? ''));
    const orphanLetters = [
      ...lettersNamedNotOnCard(entry.walkScript, optionValues, JSON.stringify(item.stem)),
      ...wordOptionsNamedNotOnCard(entry.walkScript, optionValues, JSON.stringify(item.stem)),
    ];
    if (orphanLetters.length > 0) {
      blocking.push({ where: `item:${entry.itemId} walkScript`, rule: 'internal-id-leak', detail: `names option(s) not on the card: ${orphanLetters.join(', ')} — script is stale against the current item` });
    }
    if (blocking.length > 0) { failing.push({ id: entry.itemId, faults: blocking }); continue; }

    if (!DRY) {
      await prisma.item.update({
        where: { id: entry.itemId },
        data: { explanation: { ...explanation, walkScript: entry.walkScript, walkScriptStatus: 'DRAFT', walkScriptBatch: batch.batchId } },
      });
    }
    written += 1;
  }

  if (missing.length) console.log(`\nNo such item (${missing.length}): ${missing.slice(0, 6).join(', ')}${missing.length > 6 ? ' …' : ''}`);
  if (protectedScripts.length) console.log(`Protected (human-written), not overwritten: ${protectedScripts.length}`);
  if (failing.length) {
    const byRule = failing.flatMap((f) => f.faults).reduce<Record<string, number>>((a, f) => { a[f.rule] = (a[f.rule] ?? 0) + 1; return a; }, {});
    console.log(`\nGATE FAILURES — ${failing.length} script(s) NOT written (` + Object.entries(byRule).map(([r, n]) => `${r}: ${n}`).join(', ') + '):');
    for (const f of failing) console.log(`  ✗ ${f.id}: ${f.faults.map((x) => x.detail).join(' | ')}`);
  }
  if (warnings.length) {
    console.log(`\nUK spelling to check by hand (not blocking): ${warnings.length}`);
    for (const w of warnings.slice(0, 8)) console.log(`  · ${w.where}: ${w.detail}`);
  }
  console.log(`\n${DRY ? '--dry-run: nothing written. ' : ''}scripts ${DRY ? 'would land' : 'landed'} as DRAFT: ${written}/${flat.length}`);
  await prisma.$disconnect();
}

void main();
