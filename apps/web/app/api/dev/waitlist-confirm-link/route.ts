import { createHash, randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@cluecrew/db';

/**
 * Dev/staging-only test helper: mints a fresh confirmation link for a
 * waitlist signup so the e2e suite can complete the double opt-in without
 * reading email. Hard-disabled in production.
 */
export async function GET(request: Request) {
  if (process.env.APP_ENV === 'production') {
    return NextResponse.json({ error: 'not_available' }, { status: 404 });
  }
  const email = new URL(request.url).searchParams.get('email')?.toLowerCase();
  if (!email) return NextResponse.json({ error: 'email_required' }, { status: 400 });

  const signup = await prisma.waitlistSignup.findUnique({ where: { email } });
  if (!signup) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const rawToken = randomBytes(32).toString('base64url');
  await prisma.waitlistSignup.update({
    where: { id: signup.id },
    data: { tokenHash: createHash('sha256').update(rawToken).digest('hex') },
  });
  const origin = new URL(request.url).origin;
  return NextResponse.json({ url: `${origin}/api/waitlist/confirm?token=${rawToken}` });
}
