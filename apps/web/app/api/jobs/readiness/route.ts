import { NextResponse } from 'next/server';
import { prisma } from '@cluecrew/db';
import { snapshotReadiness } from '@/lib/crew/readiness-io';

/** Nightly readiness recompute (Addendum C §3): per child, per district. */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const children = await prisma.childProfile.findMany({
    where: { deletedAt: null },
    select: { id: true },
  });
  for (const child of children) {
    await snapshotReadiness(child.id);
  }
  return NextResponse.json({ ok: true, children: children.length });
}
