import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@cluecrew/db';

/**
 * Double opt-in confirmation (DEMAND-TEST-PACK §3). Only a confirmed address
 * is a real signup, and only a confirmed address is pushed to the email
 * provider's audience. An invalid or reused token lands quietly on the page —
 * nothing here can be used to probe who signed up.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  if (!token) return NextResponse.redirect(new URL('/founding', url.origin));

  const tokenHash = createHash('sha256').update(token).digest('hex');
  const signup = await prisma.waitlistSignup.findUnique({ where: { tokenHash } });
  if (!signup) return NextResponse.redirect(new URL('/founding', url.origin));

  if (!signup.confirmedAt) {
    await prisma.waitlistSignup.update({
      where: { id: signup.id },
      data: { confirmedAt: new Date() },
    });
    await addToAudience(signup.email);
  }

  return NextResponse.redirect(new URL('/founding/confirmed', url.origin));
}

/**
 * The provider's audience feature (§3): Resend Audiences, only after the
 * double opt-in, and never fatal — the DB row is the source of truth and the
 * audience can be reconciled from it.
 */
async function addToAudience(email: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!apiKey || !audienceId) {
    console.log(`[waitlist:dev] confirmed ${email} (no RESEND_AUDIENCE_ID — audience push skipped)`);
    return;
  }
  const response = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, unsubscribed: false }),
  });
  if (!response.ok) {
    console.error(`Audience add did not succeed (${response.status}): ${await response.text()}`);
  }
}
