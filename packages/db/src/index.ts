import { PrismaClient } from '@prisma/client';
import { assertEvent, checkChildFacingText, isBlocking, type AnalyticsEvent } from '@cluecrew/core';

/**
 * THE IMPORT PATH RUNS THE SAME CHECK AS THE GENERATOR PATH (annie's ruling, 2026-08-08).
 *
 * `en-comma-not-a-comma-site` reached ACTIVE carrying a banned word because it was AUTHORED IN PROSE
 * AND IMPORTED BY SCRIPT, and the import path gated nothing — while the generator path has always
 * gated at production (`assembleSpagItem` → `checkItemChildFacing`, so nothing can be generated that
 * fails). Seven of eight tag-import scripts wrote straight to the database.
 *
 * Her ruling was that the fix is the PATH, not a sweep — a sweep finds today's breaches, a shared
 * check stops tomorrow's. So the guard sits on the CLIENT, where no script can route around it:
 * every write of a `childHint`, by any path, present or future, runs the one child-facing gate.
 * A blocking failure throws rather than writing, because a hint is serving content the moment its
 * misconception is ACTIVE.
 */
function gateChildHint(data: unknown, op: string): void {
  const row = data as { id?: string; childHint?: unknown; testedTokens?: unknown } | null | undefined;
  const hint = row?.childHint;
  if (typeof hint !== 'string' || !hint.trim()) return;
  const failures = checkChildFacingText({
    role: 'hint',
    label: `misconception:${row?.id ?? '(unknown)'}`,
    text: hint,
    testedTokens: Array.isArray(row?.testedTokens) ? (row?.testedTokens as string[]) : [],
  }).filter(isBlocking);
  if (failures.length) {
    throw new Error(
      `Refusing to ${op} misconception ${row?.id ?? ''}: its childHint fails the child-facing gate — ` +
        failures.map((f) => f.detail).join('; '),
    );
  }
}

/**
 * EXPORT-ON-CHANGE (R66 follow-on, 2026-08-13). The disk copy is a DERIVATIVE, not a fifth opinion.
 *
 * Four misconception-library snapshots were in play at once — the platform's, Cowork's staging
 * copy, an 81-entry file on David's disk, and a 44-entry English staging file — and the 81-entry
 * one was silently consulted for a whole verification round. Its verdicts were real and scoped to
 * a library predating the ruling under test.
 *
 * The complete fix is the gates reading the platform directly; they cannot, being pure-Python file
 * readers with no route to this database. This is the available half: any write to Misconception
 * marks the exported copies stale, so a copy can be old but never SILENTLY old. Same write-path
 * shape as R62 — the property lives where the write happens, not in a habit of remembering.
 *
 * Deliberately a FLAG, not an inline re-export. Re-exporting inside a query extension would run a
 * second query inside every write, and a failed export would then fail the write that triggered
 * it — a library edit rolled back because a file could not be written is a worse fault than a
 * stale file. `pnpm export:gate-library` and `pnpm export:comprehension-library` are the doors;
 * this makes their absence visible.
 */
let misconceptionWritesSinceExport = 0;

export function noteMisconceptionWrite(): void {
  misconceptionWritesSinceExport += 1;
}

/** Non-zero means an exported library copy is stale. Read by `check:gate-library-fresh`. */
export function misconceptionWritesPending(): number {
  return misconceptionWritesSinceExport;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const baseClient = globalForPrisma.prisma ?? new PrismaClient();

export const prisma = baseClient.$extends({
  query: {
    misconception: {
      create({ args, query }) { gateChildHint(args.data, 'create'); noteMisconceptionWrite(); return query(args); },
      update({ args, query }) { gateChildHint({ ...(args.data as object), id: (args.where as { id?: string }).id }, 'update'); noteMisconceptionWrite(); return query(args); },
      upsert({ args, query }) {
        gateChildHint(args.create, 'create');
        gateChildHint({ ...(args.update as object), id: (args.where as { id?: string }).id }, 'update');
        noteMisconceptionWrite();
        return query(args);
      },
    },
  },
}) as unknown as PrismaClient;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export * from '@prisma/client';
export * from './review-recording';

/**
 * The one canonical way to record an analytics event (§6).
 * Validates against the event vocabulary in @cluecrew/core; anything else throws.
 */
export async function logEvent(event: AnalyticsEvent): Promise<void> {
  const checked = assertEvent(event);
  await prisma.event.create({
    data: {
      name: checked.name,
      childId: checked.childId ?? null,
      parentId: checked.parentId ?? null,
      props: checked.props,
    },
  });
}
