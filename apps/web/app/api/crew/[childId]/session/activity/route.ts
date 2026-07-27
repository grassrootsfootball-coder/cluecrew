import { NextResponse } from 'next/server';
import { requireChildScope } from '@/lib/child-token';
import { getActivity } from '@/lib/crew/orchestrator';

export async function GET(_request: Request, { params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  const scope = await requireChildScope(childId);
  if (!scope.ok) return NextResponse.json({ error: scope.error }, { status: scope.status });
  return NextResponse.json(await getActivity(childId));
}
