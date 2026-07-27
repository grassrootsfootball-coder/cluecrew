import { NextResponse } from 'next/server';
import { prisma } from '@cluecrew/db';
import { currentParent } from '@/lib/auth';

export async function GET() {
  const parent = await currentParent();
  if (!parent) return NextResponse.json({ error: 'parent_session_required' }, { status: 401 });

  const children = await prisma.childProfile.findMany({
    where: { parentId: parent.id, deletedAt: null },
    select: { id: true, crewName: true, yearGroup: true, examYear: true, rank: true },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json({ children });
}
