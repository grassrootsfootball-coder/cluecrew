import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireChildScope } from '@/lib/child-token';
import { submitFluency } from '@/lib/crew/orchestrator';

/** The warm-up fluency round's one completion call (§6, ruling 2026-08-01). */
export async function POST(request: Request, { params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  const scope = await requireChildScope(childId);
  if (!scope.ok) return NextResponse.json({ error: scope.error }, { status: scope.status });

  const parsed = z
    .object({
      correctCount: z.number().int().min(0).max(20),
      questionCount: z.number().int().min(1).max(20),
      secondsElapsed: z.number().min(0).max(900),
    })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_request' }, { status: 400 });

  try {
    return NextResponse.json(await submitFluency(childId, parsed.data));
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 409 });
  }
}
