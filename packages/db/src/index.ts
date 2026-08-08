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

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const baseClient = globalForPrisma.prisma ?? new PrismaClient();

export const prisma = baseClient.$extends({
  query: {
    misconception: {
      create({ args, query }) { gateChildHint(args.data, 'create'); return query(args); },
      update({ args, query }) { gateChildHint({ ...(args.data as object), id: (args.where as { id?: string }).id }, 'update'); return query(args); },
      upsert({ args, query }) {
        gateChildHint(args.create, 'create');
        gateChildHint({ ...(args.update as object), id: (args.where as { id?: string }).id }, 'update');
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
