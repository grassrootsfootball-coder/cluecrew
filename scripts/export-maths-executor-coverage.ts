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
      const klass: 'derivable' | 'conceptual' = CONCEPTUAL_ENTRIES.has(entry) ? 'conceptual' : 'derivable';
      const numeric = execKeys.has(entry);
      // Only PROC-01 has an implemented process check (firstStepResults). The four
      // reclassified topic ids (#71/#72/#99/#100) are derivable-classed but have NO
      // executor of their own — a distractor tagged with one ships AUTHORED, which is
      // exactly the derivable-vs-implemented gap this manifest exposes.
      const procImplemented = /proc-01/.test(m.id);
      const mechanism: 'numeric' | 'process-firstStepResults' | 'none' = numeric ? 'numeric' : procImplemented ? 'process-firstStepResults' : 'none';
      const executorPresent: 'yes' | 'no' = mechanism === 'none' ? 'no' : 'yes';
      return {
        entry: entry || null, // PROC-01 carries no numeric slot; label it by id.
        id: m.id,
        class: klass,
        executorPresent,
        mechanism,
        category: m.category,
        axis: m.axis === 'PROCESS' ? 'PROCESS' : 'TOPIC',
        description: m.description,
      };
    })
    .sort((a, b) => (a.entry ?? 999) - (b.entry ?? 999));

  const derivable = entries.filter((e) => e.class === 'derivable');
  const implemented = derivable.filter((e) => e.executorPresent === 'yes');
  const unimplemented = derivable.filter((e) => e.executorPresent === 'no');
  const summary = {
    active: entries.length,
    conceptual: entries.length - derivable.length,
    derivable: derivable.length,
    derivableExecutorImplemented: implemented.length,
    derivableExecutorMissing: unimplemented.length,
    note: 'class is the library class field (derivable vs conceptual). executorPresent = an executor is IMPLEMENTED that recomputes the distractor: numeric (MISCONCEPTION_EXECUTORS) or PROC-01\'s firstStepResults check. A derivable entry with executorPresent=no ships AUTHORED distractors that look derived — the gap Cowork must see per family.',
    numericExecutorEntries: [...execKeys].sort((a, b) => a - b),
    derivableMissingExecutor: unimplemented.map((e) => e.entry ?? e.id),
  };

  const stamp = freshnessStamp(entries, new Date().toISOString());
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, stampedName(FAMILY, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify({ kind: FAMILY, ...stamp, summary, entries }, null, 2));
  console.log(`Executor manifest: ${summary.active} ACTIVE — ${summary.derivable} derivable, ${summary.conceptual} conceptual.`);
  console.log(`  derivable with an IMPLEMENTED executor: ${summary.derivableExecutorImplemented}; derivable WITHOUT (ships authored): ${summary.derivableExecutorMissing}.`);
  console.log(`  missing (${unimplemented.length}): ${summary.derivableMissingExecutor.map((e) => `#${e}`).join(', ')}`);
  deliver(path, FAMILY);
  await prisma.$disconnect();
}

void main();
