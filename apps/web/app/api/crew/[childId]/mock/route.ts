import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireChildScope } from '@/lib/child-token';
import {
  abandonSitting,
  answerMockItem,
  endSection,
  sittingView,
  startSection,
  startSitting,
} from '@/lib/crew/mocks';

export async function GET(_request: Request, { params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  const scope = await requireChildScope(childId);
  if (!scope.ok) return NextResponse.json({ error: scope.error }, { status: scope.status });
  return NextResponse.json(await sittingView(childId));
}

const actionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('start') }),
  z.object({ action: z.literal('start_section'), sectionIndex: z.number().int().min(0) }),
  z.object({ action: z.literal('end_section'), sectionIndex: z.number().int().min(0) }),
  z.object({ action: z.literal('answer'), itemId: z.string().min(1), optionId: z.string().min(1) }),
  z.object({ action: z.literal('abandon') }),
]);

export async function POST(request: Request, { params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  const scope = await requireChildScope(childId);
  if (!scope.ok) return NextResponse.json({ error: scope.error }, { status: scope.status });

  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_request' }, { status: 400 });

  try {
    const body = parsed.data;
    if (body.action === 'start') await startSitting(childId);
    else if (body.action === 'start_section') await startSection(childId, body.sectionIndex);
    else if (body.action === 'end_section') await endSection(childId, body.sectionIndex);
    else if (body.action === 'answer') await answerMockItem(childId, body.itemId, body.optionId);
    else await abandonSitting(childId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    // Replays, lost version races and late answers all land here — the same
    // 409 the practice routes return, recovered by re-reading the view.
    return NextResponse.json({ error: (error as Error).message }, { status: 409 });
  }
}
