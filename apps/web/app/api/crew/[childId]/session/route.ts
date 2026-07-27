import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireChildScope } from '@/lib/child-token';
import { endDailyLoop, startDailyLoop } from '@/lib/crew/orchestrator';

/** Start (or restart) today's Daily Loop. */
export async function POST(request: Request, { params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  const scope = await requireChildScope(childId);
  if (!scope.ok) return NextResponse.json({ error: scope.error }, { status: scope.status });

  const body = await request.json().catch(() => ({}));
  const parsed = z.object({ caseId: z.string().optional() }).safeParse(body ?? {});
  const result = await startDailyLoop(childId, parsed.success ? parsed.data.caseId : undefined);
  return NextResponse.json(result);
}

/** End the session — allowed at ANY moment; stopping punishes nothing (D2). */
export async function DELETE(_request: Request, { params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  const scope = await requireChildScope(childId);
  if (!scope.ok) return NextResponse.json({ error: scope.error }, { status: scope.status });
  return NextResponse.json(await endDailyLoop(childId));
}
