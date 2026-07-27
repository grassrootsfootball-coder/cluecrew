import { NextResponse } from 'next/server';
import { z } from 'zod';
import { logEvent, prisma } from '@cluecrew/db';
import { requireChildScope } from '@/lib/child-token';

/**
 * Child practice data. Requires a child-mode token scoped to exactly this
 * child — a parent session alone is not accepted here, and a token for a
 * different child gets 403 (gate checklist #4).
 */
export async function GET(_request: Request, { params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  const scope = await requireChildScope(childId);
  if (!scope.ok) return NextResponse.json({ error: scope.error }, { status: scope.status });

  const attempts = await prisma.attempt.findMany({
    where: { childId },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: { id: true, itemId: true, correct: true, latencyMs: true, context: true, createdAt: true },
  });
  return NextResponse.json({ attempts });
}

const attemptSchema = z.object({
  itemId: z.string().min(1),
  chosenOptionId: z.string().min(1).optional(),
  correct: z.boolean(),
  latencyMs: z.number().int().min(0).max(10 * 60 * 1000),
  context: z.enum(['case_practice', 'warmup_review', 'boss_case', 'word_vault']),
});

export async function POST(request: Request, { params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  const scope = await requireChildScope(childId);
  if (!scope.ok) return NextResponse.json({ error: scope.error }, { status: scope.status });

  const body = await request.json().catch(() => null);
  const parsed = attemptSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_request' }, { status: 400 });

  // Reuse the child's open session or start one (full session lifecycle is Phase 3).
  const openSession =
    (await prisma.session.findFirst({
      where: { childId, endedAt: null },
      orderBy: { startedAt: 'desc' },
    })) ?? (await prisma.session.create({ data: { childId } }));

  const attempt = await prisma.attempt.create({
    data: { ...parsed.data, childId, sessionId: openSession.id },
  });

  await logEvent({
    name: 'attempt_submitted',
    childId,
    props: {
      itemId: parsed.data.itemId,
      correct: parsed.data.correct,
      latencyMs: parsed.data.latencyMs,
      context: parsed.data.context,
    },
  });

  return NextResponse.json({ ok: true, attemptId: attempt.id }, { status: 201 });
}
