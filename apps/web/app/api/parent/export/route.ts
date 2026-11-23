import { NextResponse } from 'next/server';
import { prisma } from '@cluecrew/db';
import { currentParent } from '@/lib/auth';

/**
 * Full family data export (§5, UK GDPR right of access).
 * Endpoint ships in Phase 1; the Parent HQ button arrives in Phase 2.
 */
export async function GET() {
  const parent = await currentParent();
  if (!parent) return NextResponse.json({ error: 'parent_session_required' }, { status: 401 });

  const family = await prisma.parentAccount.findUnique({
    where: { id: parent.id },
    select: {
      email: true,
      displayName: true,
      regionCode: true,
      targetSchools: true,
      createdAt: true,
      consentLog: { select: { kind: true, version: true, createdAt: true }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] },
      subscription: {
        select: { tier: true, status: true, commitmentEndsAt: true, createdAt: true },
      },
      children: {
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          crewName: true,
          yearGroupAtCapture: true,
          capturedAcademicYear: true,
          examYear: true,
          settings: true,
          rank: true,
          createdAt: true,
          caseFiles: { select: { caseId: true, masteryLevel: true, solvedAt: true }, orderBy: { id: 'asc' } },
          wordVault: { select: { wordId: true, collectedAt: true, masteryLevel: true }, orderBy: [{ collectedAt: 'asc' }, { id: 'asc' }] },
          attempts: {
            orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
            select: { itemId: true, correct: true, latencyMs: true, context: true, createdAt: true },
          },
          sessions: { select: { startedAt: true, endedAt: true, secondsActive: true }, orderBy: [{ startedAt: 'asc' }, { id: 'asc' }] },
          reviewSchedules: {
            orderBy: [{ dueAt: 'asc' }, { id: 'asc' }],
            select: { unitKind: true, unitId: true, dueAt: true, intervalDays: true, lapses: true },
          },
        },
      },
    },
  });

  const childIds = family?.children.map((child) => child.id) ?? [];
  const events = await prisma.event.findMany({
    where: { OR: [{ parentId: parent.id }, { childId: { in: childIds } }] },
    select: { name: true, childId: true, props: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  return new NextResponse(JSON.stringify({ exportedAt: new Date(), family, events }, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="cluecrew-family-export.json"',
    },
  });
}
