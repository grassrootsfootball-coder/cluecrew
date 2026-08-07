/**
 * EXECUTOR COVERAGE over the approved maths misconception library —
 * `pnpm export:maths-executor-coverage`.
 *
 * For the template sitting (annie, 2026-08-07): a family whose distractors rest on
 * entries WITHOUT an executor is authored, not derived — a weaker guarantee than one
 * the derivability gate verifies on the item's own numbers. This reports, per ACTIVE
 * entry, whether it is conceptual (no executor expected), derivable-with-executor
 * (gate-verified), or derivable-WITHOUT-executor (authored until one is built), and
 * flags the without set. Hash-named, stamped and delivered like every other export.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { CONCEPTUAL_ENTRIES, MISCONCEPTION_EXECUTORS, mathsEntryNumber } from '@cluecrew/core';
import { deliver, freshnessStamp, stampedName } from './lib/export-destination';
import { prisma } from '../packages/db/src/index';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'maths-executor-coverage';

// A distractor is gate-verified two ways: a NUMERIC executor recomputes a topic id on
// the operands (MISCONCEPTION_EXECUTORS), OR a PROCESS-axis id is checked against
// operands.firstStepResults (the process branch in check-item). Both are "derived";
// only derivable-without-executor is authored-and-trusted.
type Coverage = 'conceptual' | 'derivable-with-executor' | 'process-gate-verified' | 'derivable-without-executor';

async function main(): Promise<void> {
  const rows = await prisma.misconception.findMany({
    where: { district: 'MATHS', status: 'ACTIVE' },
    select: { id: true, category: true, description: true, sourcePattern: true, axis: true },
  });
  const execKeys = new Set(Object.keys(MISCONCEPTION_EXECUTORS).map(Number));
  const entryNum = (sp: string | null, id: string): number => {
    const m = /#(\d+)/.exec(sp ?? '');
    return m ? Number(m[1]) : (mathsEntryNumber(id) ?? 0);
  };

  const entries = rows
    .map((m) => {
      const entry = entryNum(m.sourcePattern, m.id);
      const isProcess = m.axis === 'PROCESS';
      const conceptual = CONCEPTUAL_ENTRIES.has(entry);
      const hasExecutor = execKeys.has(entry);
      const coverage: Coverage = conceptual
        ? 'conceptual'
        : hasExecutor
          ? 'derivable-with-executor'
          : isProcess
            ? 'process-gate-verified'
            : 'derivable-without-executor';
      return {
        // PROC-01 carries no numeric slot; label it by id, not entry 0.
        entry: entry || null,
        id: m.id,
        category: m.category,
        axis: isProcess ? 'PROCESS' : 'TOPIC',
        coverage,
        hasExecutor,
        description: m.description,
      };
    })
    .sort((a, b) => (a.entry ?? 999) - (b.entry ?? 999));

  const count = (c: Coverage): number => entries.filter((e) => e.coverage === c).length;
  const without = entries.filter((e) => e.coverage === 'derivable-without-executor');
  const summary = {
    active: entries.length,
    conceptual: count('conceptual'),
    derivableWithExecutor: count('derivable-with-executor'),
    processGateVerified: count('process-gate-verified'),
    derivableWithoutExecutor: without.length,
    gateVerifiedTotal: count('derivable-with-executor') + count('process-gate-verified'),
    executorEntries: [...execKeys].sort((a, b) => a - b),
    note: 'A derivable-without-executor entry is authored, not gate-verified: its distractors are trusted to the author, not recomputed on the item\'s numbers. A family whose distractors rest only on these carries the weaker guarantee. process-gate-verified = a PROCESS-axis id checked against firstStepResults, no numeric executor needed.',
  };

  const stamp = freshnessStamp(entries, new Date().toISOString());
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, stampedName(FAMILY, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify({ kind: FAMILY, ...stamp, summary, entries }, null, 2));
  console.log(`Executor coverage: ${summary.active} ACTIVE — ${summary.conceptual} conceptual, ${summary.derivableWithExecutor} numeric-executor, ${summary.processGateVerified} process-gate-verified, ${summary.derivableWithoutExecutor} derivable WITHOUT executor.`);
  console.log(`  flagged (derivable, no executor, ${without.length}): ${without.map((e) => `#${e.entry}`).join(', ')}`);
  deliver(path, FAMILY);
  await prisma.$disconnect();
}

void main();
