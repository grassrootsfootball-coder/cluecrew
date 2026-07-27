import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { logEvent, prisma } from '@cluecrew/db';
import { clientKey, rateLimit } from '@/lib/rate-limit';

export async function GET(request: Request) {
  if (!rateLimit(clientKey(request, 'verify'), 20, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const token = new URL(request.url).searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'token_required' }, { status: 400 });

  const tokenHash = createHash('sha256').update(token).digest('hex');
  const record = await prisma.verificationToken.findUnique({ where: { tokenHash } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.json({ error: 'token_invalid_or_expired' }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.verificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.parentAccount.update({ where: { id: record.parentId }, data: { emailVerified: new Date() } }),
  ]);
  await logEvent({ name: 'email_verified', parentId: record.parentId, props: {} });

  return NextResponse.redirect(new URL('/onboarding', request.url));
}
