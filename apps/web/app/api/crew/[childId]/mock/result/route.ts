import { NextResponse } from 'next/server';
import { requireChildScope } from '@/lib/child-token';
import { childResult } from '@/lib/crew/mocks';

/** Strengths and one focus, by name — never a number to the child (§4). */
export async function GET(request: Request, { params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  const scope = await requireChildScope(childId);
  if (!scope.ok) return NextResponse.json({ error: scope.error }, { status: scope.status });
  const sittingId = new URL(request.url).searchParams.get('sittingId');
  if (!sittingId) return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  const result = await childResult(childId, sittingId);
  if (!result) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json(result);
}
