import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isMode } from '@cluecrew/core';
import { requireChildScope } from '@/lib/child-token';
import { modeAction } from '@/lib/crew/orchestrator';

export async function POST(request: Request, { params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  const scope = await requireChildScope(childId);
  if (!scope.ok) return NextResponse.json({ error: scope.error }, { status: scope.status });

  const parsed = z
    .object({
      mode: z.string().refine(isMode),
      action: z.enum(['open', 'complete', 'decline']),
      secondsElapsed: z.number().min(0).max(900).optional(),
    })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_request' }, { status: 400 });

  try {
    return NextResponse.json(await modeAction(childId, parsed.data as never));
  } catch (error) {
    // A replayed complete/decline, or a write that lost a version race. 409 is
    // what the answer route already returns for the same situations, and what
    // the runner recovers from by reloading the real activity.
    return NextResponse.json({ error: (error as Error).message }, { status: 409 });
  }
}
