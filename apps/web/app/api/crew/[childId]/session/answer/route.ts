import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireChildScope } from '@/lib/child-token';
import { submitAnswer } from '@/lib/crew/orchestrator';

export async function POST(request: Request, { params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  const scope = await requireChildScope(childId);
  if (!scope.ok) return NextResponse.json({ error: scope.error }, { status: scope.status });

  const parsed = z
    .object({ optionId: z.string().optional(), secondsElapsed: z.number().min(0).max(900) })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_request' }, { status: 400 });

  try {
    return NextResponse.json(await submitAnswer(childId, parsed.data));
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 409 });
  }
}
