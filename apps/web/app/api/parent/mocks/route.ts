import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@cluecrew/db';
import { currentParent } from '@/lib/auth';
import { parentMockReport, scheduleMock, schedulingState } from '@/lib/crew/mocks';

/** The child must be this parent's own (gate #4 isolation discipline). */
async function ownChild(parentId: string, childId: string): Promise<boolean> {
  const child = await prisma.childProfile.findUnique({ where: { id: childId } });
  return child?.parentId === parentId && !child.deletedAt;
}

export async function GET(request: Request) {
  const parent = await currentParent();
  if (!parent) return NextResponse.json({ error: 'parent_session_required' }, { status: 401 });
  const childId = new URL(request.url).searchParams.get('childId');
  if (!childId || !(await ownChild(parent.id, childId))) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  return NextResponse.json({
    blueprints: await schedulingState(childId),
    ...(await parentMockReport(childId)),
  });
}

export async function POST(request: Request) {
  const parent = await currentParent();
  if (!parent) return NextResponse.json({ error: 'parent_session_required' }, { status: 401 });
  const parsed = z
    .object({ childId: z.string().min(1), blueprintId: z.string().min(1) })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  if (!(await ownChild(parent.id, parsed.data.childId))) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  const result = await scheduleMock(parsed.data.childId, parsed.data.blueprintId);
  return NextResponse.json(result, { status: result.ok ? 201 : 409 });
}
