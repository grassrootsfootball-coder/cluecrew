import { createHash, randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@cluecrew/db';

/**
 * Dev/staging-only test helper: mints a fresh invite acceptance link so the
 * e2e suite can complete the invite → password → 2FA journey without
 * reading email. Hard-disabled in production.
 */
export async function GET(request: Request) {
  if (process.env.APP_ENV === 'production') {
    return NextResponse.json({ error: 'not_available' }, { status: 404 });
  }
  const email = new URL(request.url).searchParams.get('email')?.toLowerCase();
  if (!email) return NextResponse.json({ error: 'email_required' }, { status: 400 });

  const invite = await prisma.staffInvite.findUnique({ where: { email } });
  if (!invite) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const rawToken = randomBytes(32).toString('base64url');
  await prisma.staffInvite.update({
    where: { email },
    data: { tokenHash: createHash('sha256').update(rawToken).digest('hex') },
  });
  const origin = new URL(request.url).origin;
  return NextResponse.json({ url: `${origin}/staff-invite/${rawToken}` });
}
