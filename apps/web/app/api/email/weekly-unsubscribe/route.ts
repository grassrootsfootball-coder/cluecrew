import { NextResponse } from 'next/server';
import { prisma } from '@cluecrew/db';
import { weeklyUnsubscribeToken } from '@/lib/parent/weekly-email';

/** One-tap weekly-email unsubscribe (§4). Signed link, no login required. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const parentId = url.searchParams.get('p');
  const token = url.searchParams.get('t');
  if (!parentId || !token || token !== weeklyUnsubscribeToken(parentId)) {
    return NextResponse.json({ error: 'invalid_link' }, { status: 400 });
  }
  await prisma.parentAccount.update({ where: { id: parentId }, data: { weeklyOptOut: true } });
  return NextResponse.redirect(new URL('/unsubscribed', request.url));
}
