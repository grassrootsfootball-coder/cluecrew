import { PrismaClient } from '@prisma/client';
import { assertEvent, type AnalyticsEvent } from '@cluecrew/core';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export * from '@prisma/client';

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
