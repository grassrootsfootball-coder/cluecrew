import { createHash, randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@cluecrew/db';

/**
 * Dev/staging-only test helper: mints a fresh verification link for an
 * account so the e2e suite can complete the signup journey without reading
 * email. Hard-disabled in production.
 */
export async function GET(request: Request) {
  if (process.env.APP_ENV === 'production') {
    return NextResponse.json({ error: 'not_available' }, { status: 404 });
  }
  const email = new URL(request.url).searchParams.get('email')?.toLowerCase();
  if (!email) return NextResponse.json({ error: 'email_required' }, { status: 400 });

  const parent = await prisma.parentAccount.findUnique({ where: { email } });
  if (!parent) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const rawToken = randomBytes(32).toString('base64url');
  await prisma.verificationToken.create({
    data: {
      parentId: parent.id,
      tokenHash: createHash('sha256').update(rawToken).digest('hex'),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });
  const origin = new URL(request.url).origin;
  return NextResponse.json({ url: `${origin}/api/auth/verify?token=${rawToken}` });
}
